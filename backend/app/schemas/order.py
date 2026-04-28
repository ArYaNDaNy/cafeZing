from pydantic import BaseModel, Field
from typing import List, Optional

class OrderItem(BaseModel):
    item_id: str
    quantity: int
    modifications: Optional[str] = None

class CreateRzpOrderRequest(BaseModel):
    amount: float # Total Rupees
    ghost_token: str
    items: List[OrderItem] # To validate stock before accepting money

class CreateRzpOrderResponse(BaseModel):
    razorpay_order_id: str
    amount_paise: int
    internal_temp_order_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    ghost_token: str
    cart_total: float
    items: List[OrderItem] # Items to finally save to DB

class FinalOrderResponse(BaseModel):
    status: str
    order_id: str
    daily_token_number: int

class OrderCreate(BaseModel):
    ghost_token: str = Field(..., description="The Ghost Token from the BLE scan")
    items: List[OrderItem]
    payment_method: str = Field(default="UPI")
    parent_order_id: Optional[str] = Field(None, description="For the dessert reorder facility")

class OrderResponse(BaseModel):
    order_id: str
    daily_token_number: int = Field(..., description="The human-readable number, e.g., 42") # <-- NEW
    status: str
    queue_position: int
    estimated_time_mins: int
    total_amount: float = Field(..., description="Server-calculated total (Safe from hacking)")
    is_reorder: bool = Field(default=False, description="Tells the UI to show 'Add-on Order' badge")