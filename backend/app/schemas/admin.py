from pydantic import BaseModel, Field
from typing import List, Optional

class ExtractedMenuItem(BaseModel):
    name: str
    price: float
    ai_recommended_price: float = Field(..., description="AI's smart suggestion based on Mumbai college rates")
    category: str
    confidence_score: float
    image_url: Optional[str] = Field(None, description="Fetched automatically from Unsplash API")

class OCRResponse(BaseModel):
    total_items_found: int
    items: List[ExtractedMenuItem]

    class Config:
        json_schema_extra = {
            "example": {
                "total_items_found": 1,
                "items": [
                    {
                        "name": "Masala Dosa",
                        "price": 65.0,
                        "category": "Breakfast",
                        "confidence_score": 0.98
                    }
                ]
            }
        }