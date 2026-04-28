import os
import razorpay
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
from app.db import get_db
import uuid
from app.schemas.order import CreateRzpOrderRequest 
from app.schemas.order import CreateRzpOrderResponse , FinalOrderResponse , VerifyPaymentRequest

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
        # NOTE: Implement Ghost Token validation here 
        # (check if it's valid and active in Redis/DB)

        # NOTE: Optionally validate menu item stock here 

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

@router.post("/verify", response_model=FinalOrderResponse)
async def verify_payment_endpoint(
    request: VerifyPaymentRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    CRITICAL SECURITY ENDPOINT.
    Receives successful SDK payload and verifies the digital signature 
    using the RAZORPAY_KEY_SECRET to prevent fraud.
    """
    try:
        # Construct parameters for signature validation
        params_dict = {
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        }

        # Throws razorpay.errors.SignatureVerificationError if invalid
        rzp_client.utility.verify_payment_signature(params_dict)
        
        # --- IF VALIDATION SUCCEEDS ---
        # 1. Payment is authentic.
        # 2. Proceed to create the actual order in your Supabase DB.
        
        # NOTE: IMPLEMENT DB SAVE LOGIC HERE
        # - Map request.items to your orders table
        # - Set order_status = 'PAID' or 'KITCHEN_QUEUE'
        # - Use the razorpay_payment_id as your external transaction reference
        
        # Simulating saving and generating token number
        final_order_id = f"zing_{uuid.uuid4().hex[:6]}"
        simulated_token_number = 105 

        # NOTE: At this point, you trigger your KDS Kitcher Display screen!
        
        return {
            "status": "success",
            "order_id": final_order_id,
            "daily_token_number": simulated_token_number
        }

    except razorpay.errors.SignatureVerificationError as e:
        print(f"🚨 FRAUD ATTEMPT DETECTED or Signature Error: {str(e)}")
        # This occurs if someone tried to edit the total in RN or spoof success.
        raise HTTPException(status_code=400, detail="Payment signature verification failed. Fraud suspected.")
        
    except Exception as e:
        print(f"🛑 RZP Verification Crash: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment verification error occurred internally.")