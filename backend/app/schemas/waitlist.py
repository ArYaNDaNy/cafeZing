from pydantic import BaseModel

class QueueStatusUpdate(BaseModel):
    order_id: str
    daily_token_number: int 
    status: str  # e.g., "RECEIVED", "PREPARING", "READY"
    queue_position: int
    est_wait_time_mins: int

    class Config:
        json_schema_extra = {
            "example": {
                "order_id": "ORD-F9A2",
                "daily_token_number": 42,
                "status": "PREPARING",
                "queue_position": 2,
                "est_wait_time_mins": 5
            }
        }