"""
Minimal test app to debug the issue
"""

from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "ok"}

@app.get("/test")
async def test():
    return {"message": "test"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
