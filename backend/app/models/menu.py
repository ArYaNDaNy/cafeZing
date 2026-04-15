# app/models/menu.py
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.db import Base

class DBMenuItem(Base):
    __tablename__ = "menu_items"

    item_id: Mapped[str] = mapped_column(primary_key=True, index=True)
    name: Mapped[str]
    price: Mapped[float]
    old_price: Mapped[Optional[float]]
    description: Mapped[str]
    image_url: Mapped[str]
    is_fast_selling: Mapped[bool] = mapped_column(default=False)
    category: Mapped[str]