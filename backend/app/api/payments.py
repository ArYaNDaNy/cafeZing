import os
import razorpay
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
from app.models.menu import DBOrder, DBMenuItem 
from sqlalchemy import func, select
from app.db import get_db
import uuid
from app.schemas.order import CreateRzpOrderRequest 
from app.schemas.order import CreateRzpOrderResponse , OrderResponse , VerifyPaymentRequest

# Load API keys from .env
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/create-order", response_model=CreateRzpOrderResponse)
async def create_rzp_order_endpoint(request: CreateRzpOrderRequest):
    """
    Called by RN before opening Razorpay SDK.
    Asks Razorpay for a standard Order ID.
    """
    try:
        # Ghost Token validation  
        # if not request.ghost_token or len(request.ghost_token) < 5:
        #    raise HTTPException(status_code=403, detail="Invalid Ghost Token. You must be in the canteen.")

        # NOTE: Optionally validate menu item stock here
        # 1. Fetch real prices from DB to prevent price-hacking
        # requested_ids = [item.item_id for item in request.items]
        # stmt = select(DBMenuItem).where(DBMenuItem.item_id.in_(requested_ids))
        # result = await db.execute(stmt)
        # db_items = result.scalars().all()

        # # 2. Calculate the "Honest" Total
        # price_map = {item.item_id: item.price for item in db_items}
        # server_calculated_total = 0
        # for item in request.items:
        #     price = price_map.get(int(item.item_id)) # Ensure IDs match types
        #     if price:
        #         server_calculated_total += (price * item.quantity) 

        # Convert Rupees to Paise for Razorpay
        amount_paise = int(request.amount * 100)
        
        # Unique receipt ID for internal tracking
        receipt_id = f"receipt_{uuid.uuid4().hex[:10]}"

        # Options for Razorpay Order creation
        data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt_id,
            "payment_capture": 1 # Auto-capture payment instantly
        }

        # Call Razorpay API (Synchronous call, fine here)
        rzp_order = rzp_client.order.create(data=data)
        
        # razorpay_order_id (e.g., order_Jm8K6fN2lP1QxR) is returned

        return {
            "razorpay_order_id": rzp_order['id'],
            "amount_paise": amount_paise,
            "internal_temp_order_id": receipt_id
        }

    except Exception as e:
        print(f"🛑 RZP Order Creation Failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate payment gateway order.")

@router.post("/verify", response_model=OrderResponse)
async def verify_payment_endpoint(
    request: VerifyPaymentRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    CRITICAL SECURITY ENDPOINT.
    Verifies Razorpay Signature -> Creates Order in DB -> Calculates Queue -> Returns KDS Token.
    """
    try:
        # 1. VERIFY PAYMENT SIGNATURE
        params_dict = {
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        }

        # Throws razorpay.errors.SignatureVerificationError if invalid
        rzp_client.utility.verify_payment_signature(params_dict)
        
        # --- IF WE REACH HERE, PAYMENT IS 100% REAL AND SUCCESSFUL ---
        
        # 2. FETCH MENU ITEM DETAILS FROM DB (Names, Images)
        requested_ids = [item.item_id for item in request.items]
        stmt = select(DBMenuItem).where(DBMenuItem.item_id.in_(requested_ids))
        result = await db.execute(stmt)
        db_items = result.scalars().all()

        # 3. GENERATE THE DAILY TOKEN NUMBER
        from datetime import datetime
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        token_stmt = select(func.count(DBOrder.id)).where(DBOrder.created_at >= today_start)
        token_result = await db.execute(token_stmt)
        daily_token = (token_result.scalar() or 0) + 1

        # 4. FORMAT ITEMS FOR THE DATABASE
        items_with_details = []
        for item in request.items:
            menu_item = next((i for i in db_items if str(i.item_id) == str(item.item_id)), None)
            items_with_details.append({
                "item_id": item.item_id,
                "quantity": item.quantity,
                "name": menu_item.name if menu_item else "Unknown Item",
                "image_url": menu_item.image_url if menu_item else "https://picsum.photos/seed/food/200/200",
                "price": menu_item.price if menu_item else 0,
                "modifications": getattr(item, 'modifications', "")
            })

        # 5. CREATE AND SAVE THE FINAL ORDER IN SUPABASE/POSTGRES
        new_order_id = f"ORD-{str(uuid.uuid4())[:6].upper()}"
        
        db_order = DBOrder(
            order_id=new_order_id,
            ghost_token=request.ghost_token,
            daily_token_number=daily_token,
            status="RECEIVED", 
            total_amount=request.cart_total,
            items=items_with_details
        )
        
        db.add(db_order)
        await db.commit() 
        await db.refresh(db_order)

        # 6. CALCULATE QUEUE POSITION AND ESTIMATED TIME
        queue_stmt = select(func.count(DBOrder.id)).where(
            DBOrder.status.in_(["RECEIVED", "PREPARING"]),
            DBOrder.daily_token_number < daily_token,
            DBOrder.created_at >= today_start
        )
        queue_result = await db.execute(queue_stmt)
        queue_pos = queue_result.scalar() or 0

        # 7. RETURN FULL SUCCESS PAYLOAD TO REACT NATIVE
        return OrderResponse(
            order_id=db_order.order_id,
            daily_token_number=db_order.daily_token_number,
            status=db_order.status,
            queue_position=queue_pos,
            estimated_time_mins=(queue_pos + 1) * 5,
            total_amount=db_order.total_amount,
            is_reorder=False # Default for first order
        )

    except razorpay.errors.SignatureVerificationError as e:
        print(f"🚨 FRAUD ATTEMPT DETECTED or Signature Error: {str(e)}")
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")
        
    except Exception as e:
        print(f"🛑 RZP Verification Crash: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment verification error occurred internally.")