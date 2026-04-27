from pydantic import BaseModel, Field
from typing import List, Optional

# ==========================================
# PHASE 1: SCANNING SCHEMAS
# (Used by @router.post("/scan"))
# ==========================================

class OCRRequest(BaseModel):
    images_base64: List[str] = Field(..., description="Array of Base64 strings from the uploaded menu pages")

class ExtractedMenuItem(BaseModel):
    name: str
    price: float
    # We keep this here so the React Native UI can display the AI suggestion!
    ai_recommended_price: float = Field(..., description="AI's smart suggestion based on Mumbai college rates")
    category: str
    confidence_score: float
   # --- THE FIX: Make this Optional so FastAPI doesn't panic if Groq misses it! ---
    description: Optional[str] = Field(None, description="Write a short, appetizing 1-sentence description.")
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
                        "ai_recommended_price": 60.0,
                        "category": "Breakfast",
                        "confidence_score": 0.98,
                        "image_url": None
                    }
                ]
            }
        }


# ==========================================
# PHASE 2: APPROVAL SCHEMAS
# (Used by @router.post("/approve/batch"))
# ==========================================

class ApprovedMenuItem(BaseModel):
    name: str
    price: float = Field(..., description="The original scanned price (Mapped to old_price in DB)")
    final_price: float = Field(..., description="The chosen price by Admin (Mapped to price in DB)")
    category: str
    confidence_score: float = Field(0.95)
    image_url: Optional[str] = None
    description: Optional[str] = None
    # Notice: ai_recommended_price is completely gone here!