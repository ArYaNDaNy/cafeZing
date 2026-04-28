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
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import update
from pydantic import BaseModel

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

    items_with_details = []
    for item in order.items:
        # Find the matching menu item from the database query we did earlier in the function
        menu_item = next((i for i in db_items if i.item_id == item.item_id), None)
        
        items_with_details.append({
            "item_id": item.item_id,
            "quantity": item.quantity,
            "name": menu_item.name if menu_item else "Unknown Item",
            "image_url": menu_item.image_url if menu_item else "https://picsum.photos/seed/food/200/200",
            "price": menu_item.price if menu_item else 0,
            "modifications": getattr(item, 'modifications', "")
        })
    
    db_order = DBOrder(
        order_id=new_order_id,
        ghost_token=order.ghost_token,
        daily_token_number=daily_token,
        status="RECEIVED",
        total_amount=calculated_total,
        items=items_with_details
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


@router.get("/api/orders/{order_id}")
async def get_order_details(order_id: str, db: AsyncSession = Depends(get_db)):

    stmt = select(DBOrder).where(DBOrder.order_id == order_id)
    result = await db.execute(stmt)
    db_order = result.scalar_one_or_none()
    
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    queue_stmt = select(func.count(DBOrder.id)).where(
        DBOrder.status.in_(["RECEIVED", "PREPARING"]),
        DBOrder.created_at >= today_start,
        DBOrder.created_at < db_order.created_at
    )
    queue_result = await db.execute(queue_stmt)
    queue_pos = queue_result.scalar() or 0
        
    return {
        "order_id": db_order.order_id,
        "status": db_order.status,
        "total_amount": db_order.total_amount,
        "items": db_order.items,
        "queue_position": queue_pos
    }

@router.get("/api/orders/kitchen/active")
async def get_active_orders(db: AsyncSession = Depends(get_db)):
    # Fetch all orders that are NOT completed, sorted by oldest first
    stmt = (
        select(DBOrder)
        .where(DBOrder.status.in_(["RECEIVED", "PREPARING", "READY"]))
        .order_by(DBOrder.created_at.asc())
    )
    result = await db.execute(stmt)
    active_orders = result.scalars().all()
    
    # Format them for your React Native KDS
    return [
        {
            "id": order.order_id,
            "daily_token": order.daily_token_number,
            "time": order.created_at.strftime("%I:%M %p"), # e.g. "10:42 AM"
            "status": order.status,
            "items": order.items
        }
        for order in active_orders
    ]


# ==========================================
# REAL-TIME LIVE QUEUE (WEBSOCKETS)
# ==========================================

# This dictionary acts as the server's memory. 
# It links a specific Order ID to the user's phone connection.
active_connections: dict[str, WebSocket] = {}

# Note: Matching your path style from the place_order route
@router.websocket("/api/orders/ws/{order_id}")
async def waitlist_websocket(websocket: WebSocket, order_id: str):
    await websocket.accept()
    # When the phone connects, save it to our dictionary
    active_connections[order_id] = websocket
    
    try:
        while True:
            # This loop keeps the line open infinitely.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        # If the user closes the app or their Wi-Fi drops, remove them cleanly.
        if order_id in active_connections:
            del active_connections[order_id]


# ==========================================
# KITCHEN ADMIN ROUTE (Update Status)
# ==========================================

class OrderStatusUpdate(BaseModel):
    status: str # e.g., "PREPARING", "READY"

@router.post("/api/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status_data: OrderStatusUpdate, 
    db: AsyncSession = Depends(get_db)
):
    # 1. Update the database permanently
    stmt = (
        update(DBOrder)
        .where(DBOrder.order_id == order_id)
        .values(status=status_data.status)
    )
    await db.execute(stmt)
    await db.commit()

    # 2. The Magic: Instantly notify the specific phone if it is currently connected
    if order_id in active_connections:
        await active_connections[order_id].send_json({
            "status": status_data.status,
            "message": f"Order is now {status_data.status}"
        })

    if status_data.status in ["COMPLETED", "READY"]:
        for connected_order_id, ws in list(active_connections.items()):
            if connected_order_id != order_id: # Don't send this to the person who just finished
                try:
                    await ws.send_json({"type": "QUEUE_UPDATE"})
                except Exception:
                    pass # Safely ignore if a phone disconnected

    return {"message": f"Order {order_id} updated to {status_data.status} and customer notified!"}