from fastapi import APIRouter, HTTPException, Header
from app.services.token import refresh_ghost_token

router = APIRouter(prefix="/api/heartbeat", tags=["Proximity Session"])

@router.post("/")
async def session_heartbeat(x_token_id: str = Header(...)):
    # Ask Redis to reset the 10-minute timer
    is_alive = await refresh_ghost_token(x_token_id)
    
    if not is_alive:
        raise HTTPException(status_code=401, detail="Session expired. Please scan the beacon again.")
    
    # We send the expiry back AGAIN so the frontend can reset its local clock!
    return {
        "status": "alive", 
        "message": "Timer reset.",
        "expires_in_seconds": 600  
    }