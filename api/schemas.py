from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ReceiptBase(BaseModel):
    store_name: str = Field(..., max_length=100)
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    category: str = Field(default="기타", max_length=50)
    purchased_at: date
    memo: str | None = Field(default=None, max_length=500)


class ReceiptCreate(ReceiptBase):
    pass


class ReceiptUpdate(BaseModel):
    store_name: str | None = Field(default=None, max_length=100)
    amount: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    category: str | None = Field(default=None, max_length=50)
    purchased_at: date | None = None
    memo: str | None = Field(default=None, max_length=500)


class ReceiptRead(ReceiptBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
