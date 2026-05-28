import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

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


# === [임시] Vercel 배포 진단용 — 원인 파악 후 제거 예정 =====================
@app.get("/api/_debug")
def debug_info():
    """https://<deploy>/api/_debug 로 호출. 환경/라우트/cwd/Vercel 변수 확인."""
    try:
        files_at_cwd = sorted(os.listdir("."))[:50]
    except OSError as exc:
        files_at_cwd = [f"(listdir error: {exc})"]

    return {
        "cwd": os.getcwd(),
        "files_at_cwd": files_at_cwd,
        "env_keys_set": {
            "DATABASE_URL": bool(os.environ.get("DATABASE_URL")),
            "POSTGRES_URL": bool(os.environ.get("POSTGRES_URL")),
            "UPSTAGE_API_KEY": bool(os.environ.get("UPSTAGE_API_KEY")),
            "VERCEL": bool(os.environ.get("VERCEL")),
            "VERCEL_ENV": os.environ.get("VERCEL_ENV"),
            "VERCEL_REGION": os.environ.get("VERCEL_REGION"),
            "PYTHON_VERSION": os.environ.get("AWS_LAMBDA_RUNTIME_API") and "lambda" or os.environ.get("PYTHON_VERSION"),
        },
        "registered_routes": [
            {"path": r.path, "methods": sorted(list(getattr(r, "methods", []) or []))}
            for r in app.routes
        ],
    }


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """404 일 때 어떤 path 가 함수에 도달했고 어떤 라우트가 등록돼 있는지 응답에 동봉."""
    if exc.status_code == 404:
        return JSONResponse(
            status_code=404,
            content={
                "detail": exc.detail,
                "debug": {
                    "received_path": request.url.path,
                    "full_url": str(request.url),
                    "method": request.method,
                    "vercel_headers": {
                        "x-vercel-id": request.headers.get("x-vercel-id"),
                        "x-vercel-deployment-url": request.headers.get("x-vercel-deployment-url"),
                        "x-forwarded-host": request.headers.get("x-forwarded-host"),
                        "x-forwarded-proto": request.headers.get("x-forwarded-proto"),
                    },
                    "available_paths": [r.path for r in app.routes],
                },
            },
        )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
# === [임시] 진단 코드 끝 ===================================================


app.include_router(receipts.router)
app.include_router(ocr.router)
