from pydantic import BaseModel

class QueueStatusUpdate(BaseModel):
    token_id: str
    order_id: str
    status: str  # e.g., "RECEIVED", "COOKING", "READY"
    queue_position: int
    est_wait_time_mins: int

    class Config:
        json_schema_extra = {
            "example": {
                "token_id": "A1B2C3",
                "order_id": "ORD-F9A2",
                "status": "COOKING",
                "queue_position": 2,
                "est_wait_time_mins": 5
            }
        }