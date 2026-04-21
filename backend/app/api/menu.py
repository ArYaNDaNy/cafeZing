# app/api/menu.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db import get_db
import traceback

from app.models.menu import DBMenuItem
from app.schemas.menu import MenuItem 
from app.schemas.admin import OCRRequest, OCRResponse 
from app.services import ocr_service


router = APIRouter(prefix="/api/menu", tags=["Menu"])

@router.get("/", response_model=List[MenuItem])
async def get_canteen_menu(db: AsyncSession = Depends(get_db)):
    """
    Fetch all active menu items from the Supabase database.
    """
    result = await db.execute(select(DBMenuItem))
    items = result.scalars().all()

    return items

@router.post("/scan", response_model=OCRResponse)
async def scan_menu_endpoint(request: OCRRequest, db: AsyncSession = Depends(get_db)):
    """
    Accepts a base64 image, runs PaddleOCR + Ollama, and saves new items.
    """
    try:
        # We await the service since we are now operating in an async architecture
        items =  ocr_service.extract_and_save_menu(request.image_base64)
        
        return {
            "total_items_found": len(items),
            "items": items
        }
        
    except Exception as e:

        print(f"🔥 CRASH DETECTED: {str(e)}")
        traceback.print_exc()
        # With AsyncSession, rollback must be awaited
        await db.rollback() 
        raise HTTPException(status_code=500, detail=f"OCR or AI processing failed: {str(e)}")