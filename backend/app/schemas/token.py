from pydantic import BaseModel

class ScanResponse(BaseModel):
    status: str
    message: str
    tokenId: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "Beacon detected. Temporary token assigned.",
                "tokenId": "A1B2C3"
            }
        }