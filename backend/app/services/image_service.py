import os
import httpx
from typing import Optional

UNSPLASH_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

async def get_food_image(query: str) -> Optional[str]:
    """
    Searches Unsplash for a high-quality food image based on the item name.
    """
    if not UNSPLASH_KEY:
        return None

    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": f"{query} food", # Add 'food' to keep results relevant
        "client_id": UNSPLASH_KEY,
        "per_page": 1,
        "orientation": "squarish"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                if data["results"]:
                    # Return the small/regular sized version for mobile performance
                    return data["results"][0]["urls"]["small"]
        except Exception as e:
            print(f"📸 Unsplash Error: {e}")
    
    return None