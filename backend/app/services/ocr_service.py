import base64
import json
import numpy as np
import cv2
import ollama
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_and_save_menu(image_base64: str):
    # 1. CLEAN THE BASE64 STRING
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]

    # 2. DECODE THE IMAGE
    img_bytes = base64.b64decode(image_base64)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img_cv2 = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # 3. COLOR CHANNEL FIX (BGR -> RGB)
    # Tesseract expects standard RGB, OpenCV uses backwards BGR
    img_rgb = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2RGB)

    # 4. EXTRACT TEXT DIRECTLY (One line of code!)
    raw_text = pytesseract.image_to_string(img_rgb)

    print("\n" + "="*50)
    print("🔍 RAW TEXT SCANNED BY TESSERACT")
    print("="*50)
    print(raw_text if raw_text.strip() else "[No text detected!]")
    print("="*50 + "\n")

    # 5. STRICT, CONTEXT-AWARE LLM PROMPT
    # 5. STRICT, CONTEXT-AWARE LLM PROMPT (WITH FEW-SHOT EXAMPLES)
    prompt = f"""
    You are a data structuring AI. I have extracted the following raw text from a restaurant menu using OCR. 
    Your job is to read this messy text, figure out the food items and their prices, and return a clean JSON list.
    
    Here is the raw menu text:
    ---
    {raw_text}
    ---
    
    RULES:
    1. CATEGORY RULE: Suggest a logical 'category'.
    2. CURRENCY RULE: All prices are in Indian Rupees (INR). 
    3. DISCOUNT RULE: Calculate 'ai_recommended_price' by applying a 5% to 10% discount to the full price, rounded to the nearest 5.
    4. PORTION RULE: If there are "Half" and "Full" portions, ALWAYS select the "Full" (higher) price for the 'price' field.
    5. JSON KEY RULE: Use EXACTLY "name", "price", "ai_recommended_price", and "category".
    6. COMPLETENESS RULE (CRITICAL): You MUST extract EVERY SINGLE food item from the menu text. Do not stop early. Do not skip any lines. There are approximately 25 items in this text, and your JSON array MUST contain all of them.
    
    EXAMPLE EXACT OUTPUT FORMAT:
    {{
        "items": [
            {{
                "name": "Veg Manchurian Rice", 
                "price": 240.0, 
                "ai_recommended_price": 230.0, 
                "category": "Rice With Gravy"
            }}
        ]
    }}
    
    Return the result STRICTLY as a JSON object matching the exact structure above.
    """
    
    response = ollama.chat(
        model='phi3', 
        messages=[{
            'role': 'user',
            'content': prompt
        }],
        format='json'
    )

    response_text = response['message']['content'].strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:-3] 
        
    # 6. DEFENSIVE JSON PARSING
    try:
        ai_data = json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"🔥 LLM generated invalid JSON: {e}")
        print("Returning empty list to prevent server crash.")
        return [] 

    raw_items = ai_data.get("items", [])
    
    # 7. DEFENSIVE DATA FILTERING
    # 7. DEFENSIVE DATA FILTERING
    # 7. DEFENSIVE DATA FILTERING & INJECTION
    # 7. DEFENSIVE DATA FILTERING & INJECTION
    clean_items = []
    for item in raw_items:
        # --- NEW SHIELD: Ensure it's a dictionary before doing anything! ---
        if not isinstance(item, dict):
            print(f"🗑️ Dropped bizarre AI hallucination (not a dict): {item}")
            continue
            
        has_name = "name" in item and isinstance(item["name"], str)
        has_price = item.get("price") is not None
        has_discount = item.get("ai_recommended_price") is not None
        has_category = "category" in item
        
        if has_name and has_price and has_discount and has_category:
            item["confidence_score"] = 0.95 
            clean_items.append(item)
        else:
            print(f"🗑️ Dropped malformed AI item: {item}")
    
    # ==========================================
    # --- ADD THIS: PRINT THE FINAL SUCCESSFUL JSON ---
    # ==========================================
    print("\n" + "="*50)
    print("✅ FINAL CLEANED JSON (SENT TO FRONTEND)")
    print("="*50)
    print(json.dumps(clean_items, indent=4))
    print("="*50 + "\n")
    # ==========================================
    return clean_items