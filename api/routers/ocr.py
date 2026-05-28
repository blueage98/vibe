import base64
import json
from datetime import date
from decimal import Decimal

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from api.config import settings

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/bmp",
    "image/tiff",
    "image/heic",
    "application/pdf",
}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10MB

CATEGORY_ENUM = ["식비", "교통", "쇼핑", "의료", "문화", "통신", "기타"]

_RECEIPT_SCHEMA = {
    "type": "object",
    "properties": {
        "store_name": {
            "type": "string",
            "description": "영수증 발행 가맹점/상호 이름",
        },
        "total_amount": {
            "type": "number",
            "description": "총 결제 금액 (원, 숫자만, 부가세 포함 합계)",
        },
        "purchased_at": {
            "type": "string",
            "description": "구매 일자, YYYY-MM-DD 형식",
        },
        "category": {
            "type": "string",
            "description": (
                "지출 카테고리. 영수증 품목 내용을 보고 다음 중 하나로 분류: "
                + ", ".join(CATEGORY_ENUM)
            ),
        },
    },
    "required": ["store_name", "total_amount", "purchased_at"],
}


class ReceiptExtraction(BaseModel):
    store_name: str | None = None
    amount: Decimal | None = None
    purchased_at: date | None = None
    category: str | None = None


@router.post("", response_model=ReceiptExtraction)
async def recognize_receipt(file: UploadFile = File(...)) -> ReceiptExtraction:
    if not settings.UPSTAGE_API_KEY:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="UPSTAGE_API_KEY 가 설정되지 않았습니다. .env 또는 Vercel 환경변수에 추가하세요.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"지원하지 않는 파일 형식: {file.content_type}",
        )

    payload = await file.read()
    if len(payload) > MAX_FILE_BYTES:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"파일이 너무 큽니다 (최대 {MAX_FILE_BYTES // (1024 * 1024)}MB).",
        )

    b64 = base64.b64encode(payload).decode()
    data_url = f"data:{file.content_type};base64,{b64}"

    body = {
        "model": "information-extract",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "receipt_schema", "schema": _RECEIPT_SCHEMA},
        },
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                settings.UPSTAGE_IE_URL,
                headers={"Authorization": f"Bearer {settings.UPSTAGE_API_KEY}"},
                json=body,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstage IE 호출 실패: {exc}",
        ) from exc

    if response.status_code >= 400:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstage IE 오류 ({response.status_code}): {response.text[:300]}",
        )

    data = response.json()
    try:
        content = data["choices"][0]["message"]["content"]
        extracted = json.loads(content)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstage IE 응답 파싱 실패: {exc}",
        ) from exc

    category = extracted.get("category")
    if category and category not in CATEGORY_ENUM:
        category = "기타"

    return ReceiptExtraction(
        store_name=extracted.get("store_name"),
        amount=extracted.get("total_amount"),
        purchased_at=extracted.get("purchased_at"),
        category=category,
    )
