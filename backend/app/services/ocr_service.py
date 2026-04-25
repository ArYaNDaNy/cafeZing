import os
import json
import base64
import pytesseract
from PIL import Image
from io import BytesIO
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_and_save_menu(image_base64: str):
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_bytes))
    
    print("\n🔍 Running local Tesseract OCR...")
    raw_text = pytesseract.image_to_string(image).strip()
    
    # DEBUG: Let's see what Tesseract actually read
    print(f"--- RAW TEXT FROM TESSERACT ---\n{raw_text}\n-------------------------------")
    
    if not raw_text:
        print("🔥 Tesseract could not find any text in this image!")
        return []

   # ... (keep your PyTesseract image decoding the exact same) ...
    
    prompt = f"""
    You are a strict data structuring API. Convert this messy OCR text into a JSON object containing a single key called "items" which holds a JSON array.
    
    RAW TEXT:
    {raw_text}
    
    CRITICAL RULES:
    1. Keys must be EXACTLY: "name", "price", "ai_recommended_price", "category".
    2. NEVER output null. If a value is missing, use 0.0.
    3. IGNORE category headers (like "Rice With Gravy Half Full"). Only extract actual food items that have a numeric price.
    4. If there are two prices (Half and Full), ONLY use the Full (higher) price for the 'price' field.
    5. YOU MUST calculate 'ai_recommended_price' for EVERY item by applying a 10% discount to the price. Do not leave any blank.
    """
    
    print("🚀 Sending text to Groq for strict JSON structuring...")
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.1,
            response_format={"type": "json_object"} 
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        parsed_data = json.loads(response_text)
        
        raw_items = parsed_data.get("items", [])
        clean_items = []
        
        # --- THE PYTHON CLEANING LAYER ---
        for item in raw_items:
            # Fallback to 0.0 if the AI still hallucinates a null
            price = item.get("price") or 0.0
            rec_price = item.get("ai_recommended_price") or 0.0
            
            # Only keep items that actually have a valid price
            if float(price) > 0:
                item["price"] = float(price)
                item["ai_recommended_price"] = float(rec_price)
                item["confidence_score"] = 0.95
                clean_items.append(item)
                
        print(f"✅ Successfully structured and cleaned {len(clean_items)} items!")
        return clean_items
        
    except Exception as e:
        print(f"🔥 Error during Groq parsing: {e}")
        return []