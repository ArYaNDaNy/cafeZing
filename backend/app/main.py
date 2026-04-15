from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Canteen Live API", version="1.0.0")

# Set up CORS so your React Native frontend can talk to it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A simple health check route
@app.get("/")
async def root():
    return {"message": "Canteen Live Backend is running on FastAPI ⚡️"}