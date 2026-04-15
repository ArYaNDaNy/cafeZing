# app/api/menu.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db import get_db
from app.models.menu import DBMenuItem
from app.schemas.menu import MenuItem

router = APIRouter(prefix="/api/menu", tags=["Menu"])

@router.get("/", response_model=List[MenuItem])
async def get_canteen_menu(db: AsyncSession = Depends(get_db)):
    """
    Fetch all active menu items from the Supabase database.
    """
    result = await db.execute(select(DBMenuItem))
    items = result.scalars().all()

    return items