import secrets
import string
from app.db import redis_client

TOKEN_LENGTH = 6
TTL_SECONDS = 600

def generate_random_id() -> str:
    """Generate a 6 character alphanumeric uppercase string"""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(TOKEN_LENGTH))

async def create_ghost_token() -> str:
    """Create a new token in redis and return the id"""
    token_id = generate_random_id()
    redis_key = f"ghost_token:{token_id}"

    await redis_client.set(redis_key,"browsing",ex=TTL_SECONDS)

    return token_id

async def refresh_ghost_token(token_id:str) -> bool:
    """Reset the redis time back to 10mins"""
    redis_key = f"ghost_token:{token_id}"

    result = await redis_client.expire(redis_key,TTL_SECONDS)
    return bool(result)