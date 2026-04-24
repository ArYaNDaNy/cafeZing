from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import scan,heartbeat,menu,order

app = FastAPI(title="Canteen Live API", version="1.0.0")

# Set up CORS so your React Native frontend can talk to it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(heartbeat.router)
app.include_router(menu.router)
app.include_router(order.router)


@app.get("/")
async def root():
    return {"message": "Canteen Live Backend onlineee"}