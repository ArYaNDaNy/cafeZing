from pydantic import BaseModel, Field
from typing import List, Optional

class OrderItem(BaseModel):
    item_id: str = Field(..., description="The unique ID of the food item")
    quantity: int = Field(default=1, gt=0, description="Must order at least 1")
    modifications: Optional[str] = None # e.g., "Extra Chutney"

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