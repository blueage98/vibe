from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.database import Base, engine
from api.routers import ocr, receipts

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Receipt Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(receipts.router)
app.include_router(ocr.router)
