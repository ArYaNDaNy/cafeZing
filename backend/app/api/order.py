from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.schemas.order import OrderCreate, OrderResponse
from app.db import get_db
from app.models.menu import DBOrder, DBMenuItem 
import uuid
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.post("/api/orders/place", response_model=OrderResponse)
async def place_order(order: OrderCreate, db: AsyncSession = Depends(get_db)):

    requested_ids = [item.item_id for item in order.items]
    
    stmt = select(DBMenuItem).where(DBMenuItem.item_id.in_(requested_ids))
    result = await db.execute(stmt)
    db_items = result.scalars().all()
    
    price_map = {item.item_id: item.price for item in db_items}

    calculated_total = 0.0
    for item in order.items:
        price = price_map.get(item.item_id)
        if price is None:
            raise HTTPException(status_code=400, detail=f"Item {item.item_id} not found")
        calculated_total += (price * item.quantity)

    # 2. GENERATE DAILY TOKEN
    # from sqlalchemy import func
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    token_stmt = select(func.count(DBOrder.id)).where(DBOrder.created_at >= today_start)
    token_result = await db.execute(token_stmt)
    daily_token = (token_result.scalar() or 0) + 1

    # 3. CREATE ORDER
    new_order_id = f"ORD-{str(uuid.uuid4())[:6].upper()}"
    
    db_order = DBOrder(
        order_id=new_order_id,
        ghost_token=order.ghost_token,
        daily_token_number=daily_token,
        status="RECEIVED",
        total_amount=calculated_total,
        items=[item.model_dump() for item in order.items]
    )
    
    db.add(db_order)
    await db.commit() 
    await db.refresh(db_order)

    # 4. QUEUE POSITION
    queue_stmt = select(func.count(DBOrder.id)).where(
        DBOrder.status.in_(["RECEIVED", "PREPARING"]),
        DBOrder.daily_token_number < daily_token,
        DBOrder.created_at >= today_start
    )
    queue_result = await db.execute(queue_stmt)
    queue_pos = queue_result.scalar() or 0

    return OrderResponse(
        order_id=db_order.order_id,
        daily_token_number=db_order.daily_token_number,
        status=db_order.status,
        queue_position=queue_pos,
        estimated_time_mins=(queue_pos + 1) * 5,
        total_amount=db_order.total_amount,
        is_reorder=order.parent_order_id is not None
    )