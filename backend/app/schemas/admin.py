from pydantic import BaseModel
from typing import List

class ExtractedMenuItem(BaseModel):
    name: str
    price: float
    category: str
    confidence_score: float

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