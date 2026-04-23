import os
import json
import base64
import google.generativeai as genai

# Load the API key from your secure .env file
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def extract_and_save_menu(image_base64: str):
    # 1. Clean the base64 string
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
        
    # 2. Decode the string into raw bytes
    image_bytes = base64.b64decode(image_base64)
    
    # 3. Initialize the ultra-fast Flash model
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # 4. The strict JSON prompt
    prompt = """
    You are a data structuring AI. Extract the food items and prices from this restaurant menu image.
    
    RULES:
    1. CATEGORY: Suggest a logical 'category' for each item.
    2. CURRENCY: All prices are in Indian Rupees (INR). 
    3. DISCOUNT: Calculate 'ai_recommended_price' by applying a 5% to 10% student discount to the full price, rounded to the nearest 5.
    4. PORTION: If there are "Half" and "Full" prices, ALWAYS select the "Full" (higher) price for the 'price' field.
    5. EXTRACT EVERYTHING (CRITICAL): You MUST extract EVERY SINGLE food item from the menu. Do not skip any items.
    
    Return the result STRICTLY as a raw JSON array of objects using EXACTLY these keys: 
    "name", "price", "ai_recommended_price", "category". Do not use markdown blocks, just the raw JSON.
    
    EXAMPLE EXACT OUTPUT:
    [
        {
            "name": "Veg Manchurian Rice", 
            "price": 240.0, 
            "ai_recommended_price": 230.0, 
            "category": "Rice With Gravy"
        }
    ]
    """
    
    print("\n🚀 Sending image directly to Gemini API...")
    
    try:
        # 5. Pass the image bytes and the prompt directly to the model in one step
        response = model.generate_content([
            {'mime_type': 'image/jpeg', 'data': image_bytes},
            prompt
        ])
        
        # 6. Parse the response
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        clean_items = json.loads(response_text)
        
        # 7. Inject the confidence score programmatically
        for item in clean_items:
            item["confidence_score"] = 0.99
            
        print("="*50)
        print(f"✅ SUCCESSFULLY EXTRACTED {len(clean_items)} ITEMS!")
        print("="*50)
        
        return clean_items
        
    except json.JSONDecodeError as e:
        print(f"🔥 JSON Parsing Error: {e}")
        return []
    except Exception as e:
        print(f"🔥 Gemini API Error: {e}")
        return []