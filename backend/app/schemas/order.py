from pydantic import BaseModel, Field
from typing import List, Optional

class OrderItem(BaseModel):
    item_id: str = Field(..., description="The unique ID of the food item")
    name: str
    quantity: int = Field(default=1, gt=0, description="Must order at least 1")
    modifications: Optional[str] = None # e.g., "Extra Chutney"

class OrderCreate(BaseModel):
    token_id: str = Field(..., description="The Ghost Token from the scan")
    items: List[OrderItem]
    total_amount: float
    payment_method: str = Field(default="UPI")

class OrderResponse(BaseModel):
    order_id: str
    status: str
    queue_position: int
    estimated_time_mins: int