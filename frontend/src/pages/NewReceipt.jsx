import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReceiptOcrUpload from "../components/ReceiptOcrUpload.jsx";
import ReceiptForm from "../components/ReceiptForm.jsx";

export default function NewReceipt() {
  const [prefill, setPrefill] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">신규 영수증 등록</h2>
        <Link to="/" className="text-sm text-slate-600 hover:text-emerald-700">
          ← 대시보드로
        </Link>
      </div>

      <ReceiptOcrUpload onExtracted={setPrefill} />

      <ReceiptForm
        prefill={prefill}
        onSaved={(saved) => {
          navigate(`/receipts/${saved.id}`);
        }}
      />
    </div>
  );
}
