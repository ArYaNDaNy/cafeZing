from pydantic import BaseModel
from typing import Optional

class MenuItem(BaseModel):
    item_id: str
    name: str
    price: float
    old_price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_fast_selling: bool = False
    category: str

    class Config:
        json_schema_extra = {
            "example": {
                "item_id": "item_001",
                "name": "Classic Vada Pav",
                "price": 25.0,
                "description": "Spicy potato fritter in a soft bun.",
                "image_url": "https://picsum.photos/seed/vadapav/400/300",
                "is_fast_selling": True,
                "category": "Snacks"
            }
        }