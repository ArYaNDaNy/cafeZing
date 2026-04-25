from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from typing import List
from app.db import get_db
import traceback
import uuid  # <--- CRITICAL FIX: Added this built-in Python library!

from app.models.menu import DBMenuItem
from app.schemas.menu import MenuItem 
from app.schemas.admin import OCRRequest, OCRResponse, ApprovedMenuItem
from app.models.menu import DBMenuItem as MenuItemsTable  # To avoid naming conflict with Pydantic schema
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

# --- 2. THE BATCH ENDPOINT ---
@router.post("/scan", response_model=OCRResponse)
async def scan_menu_endpoint(request: OCRRequest, db: AsyncSession = Depends(get_db)):
    """
    Accepts an array of base64 images, runs PyTesseract + Groq sequentially, 
    and returns all extracted items to the frontend staging area.
    """
    try:
        all_extracted_items = []
        
        # Loop through each uploaded page sequentially
        for idx, base64_image in enumerate(request.images_base64):
            print(f"🔄 Processing page {idx + 1} of {len(request.images_base64)}...")
            
            # PRO TIP: Since PyTesseract and the Groq SDK are synchronous (blocking),
            # we use run_in_threadpool so they don't freeze the async FastAPI event loop!
            items_from_page = await run_in_threadpool(
                ocr_service.extract_and_save_menu, 
                base64_image
            )
            
            all_extracted_items.extend(items_from_page)
            
        return {
            "total_items_found": len(all_extracted_items),
            "items": all_extracted_items
        }
        
    except Exception as e:
        print(f"🔥 CRASH DETECTED: {str(e)}")
        traceback.print_exc()
        
        # Safe rollback just in case any DB operations occurred before the crash
        await db.rollback() 
        
        raise HTTPException(status_code=500, detail=f"Batch AI processing failed: {str(e)}")
    
@router.post("/approve/batch")
async def batch_approve_items(items: List[ApprovedMenuItem], db: AsyncSession = Depends(get_db)):
    try:
        # Loop through the incoming items and map them to your SQLAlchemy Model
        for item in items:
            new_db_item = MenuItemsTable(
                item_id=str(uuid.uuid4()),      # Generate the varchar ID
                name=item.name,
                price=item.final_price,         # The chosen price becomes the active price
                old_price=item.price,           # The original scanned price gets crossed out!
                description=item.description,
                image_url=item.image_url,
                is_fast_selling=False,
                category=item.category,
                confidence_score=item.confidence_score,
                is_available=True
                # ai_recommended_price is completely ignored!
            )
            db.add(new_db_item)
            
        await db.commit() # Push the entire batch to PostgreSQL!
        return {"status": "success", "inserted": len(items)}
        
    except Exception as e:
        await db.rollback()
        print("🛑 DATABASE REJECTION REASON:", str(e))
        raise HTTPException(status_code=500, detail=str(e))