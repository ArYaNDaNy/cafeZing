# app/models/menu.py
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.db import Base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import func
from datetime import datetime

class DBMenuItem(Base):
    __tablename__ = "menu_items"

    item_id: Mapped[str] = mapped_column(primary_key=True, index=True)
    name: Mapped[str]
    price: Mapped[float]
    old_price: Mapped[Optional[float]]
    
    # CRITICAL: Ensure these are Optional to match the OCR staging workflow
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(nullable=True)
    
    is_fast_selling: Mapped[bool] = mapped_column(default=False)
    category: Mapped[str]
    
    # Synchronized with Screenshot 2026-04-23 at 20.30.59.png
    confidence_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    is_available: Mapped[bool] = mapped_column(default=True)

class DBOrder(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    order_id: Mapped[str] = mapped_column(unique=True, index=True) 
    ghost_token: Mapped[str] = mapped_column(index=True)
    daily_token_number: Mapped[int] = mapped_column()

    status: Mapped[str] = mapped_column(default="RECEIVED") 
    total_amount: Mapped[float] = mapped_column()

    items: Mapped[list] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(default=func.now())