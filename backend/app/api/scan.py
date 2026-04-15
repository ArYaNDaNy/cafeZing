from fastapi import APIRouter, HTTPException
from app.services.token import create_ghost_token
from app.schemas.token import ScanRequest, ScanResponse 

router = APIRouter(prefix="/api/scan", tags=["Proximity Session"])

@router.post("/", response_model=ScanResponse)
async def handle_beacon_scan(request: ScanRequest):
    """
    Endpoint called when the phone detects the canteen's Bluetooth beacon.
    It generates a temporary 6-character Ghost Token.
    """
    try:
        # generate a random ID and save to Redis
        token_id = await create_ghost_token()
        
        # send the token and the (10 min) TTL to the phone
        return ScanResponse(
            status="success",
            message="Welcome to CafeZing! You are now in the ghost queue.",
            tokenId=token_id,
            expires_in_seconds=600
        )
    except Exception as e:
        # Log the error for debugging (optional)
        print(f"Scan Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="System was unable to generate a session token. Check Redis connection."
        )