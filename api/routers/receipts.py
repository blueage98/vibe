from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Receipt
from api.schemas import ReceiptCreate, ReceiptRead, ReceiptUpdate

router = APIRouter(prefix="/api/receipts", tags=["receipts"])


@router.get("", response_model=list[ReceiptRead])
def list_receipts(db: Session = Depends(get_db)):
    return db.execute(select(Receipt).order_by(Receipt.purchased_at.desc(), Receipt.id.desc())).scalars().all()


@router.get("/{receipt_id}", response_model=ReceiptRead)
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.get(Receipt, receipt_id)
    if receipt is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Receipt not found")
    return receipt


@router.post("", response_model=ReceiptRead, status_code=status.HTTP_201_CREATED)
def create_receipt(payload: ReceiptCreate, db: Session = Depends(get_db)):
    receipt = Receipt(**payload.model_dump())
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.put("/{receipt_id}", response_model=ReceiptRead)
def update_receipt(receipt_id: int, payload: ReceiptUpdate, db: Session = Depends(get_db)):
    receipt = db.get(Receipt, receipt_id)
    if receipt is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Receipt not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(receipt, field, value)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.get(Receipt, receipt_id)
    if receipt is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Receipt not found")
    db.delete(receipt)
    db.commit()
    return None
