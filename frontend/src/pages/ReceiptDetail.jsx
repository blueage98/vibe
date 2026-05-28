import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api/client.js";

const CATEGORY_COLORS = {
  식비: "bg-amber-100 text-amber-800",
  교통: "bg-sky-100 text-sky-800",
  쇼핑: "bg-pink-100 text-pink-800",
  의료: "bg-emerald-100 text-emerald-800",
  문화: "bg-violet-100 text-violet-800",
  통신: "bg-blue-100 text-blue-800",
  기타: "bg-slate-100 text-slate-700",
};

const won = (value) => `${Number(value).toLocaleString("ko-KR")} 원`;
const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR");
};

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setStatus("loading");
    apiClient
      .get(`/receipts/${id}`)
      .then((res) => {
        setReceipt(res.data);
        setStatus("ok");
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail ?? err?.message ?? "알 수 없는 오류";
        setError(typeof detail === "string" ? detail : JSON.stringify(detail));
        setStatus("error");
      });
  }, [id]);

  const onDelete = async () => {
    if (!window.confirm("이 영수증을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/receipts/${id}`);
      navigate("/", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "알 수 없는 오류";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      setDeleting(false);
    }
  };

  if (status === "loading") {
    return <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">불러오는 중...</div>;
  }
  if (status === "error") {
    return (
      <div className="space-y-4">
        <Link to="/" className="text-sm text-slate-600 hover:text-emerald-700">
          ← 대시보드로
        </Link>
        <div className="rounded-lg border bg-rose-50 p-5 text-sm text-rose-700">
          영수증을 불러오지 못했습니다: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-600 hover:text-emerald-700">
          ← 대시보드로
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "🗑 삭제"}
        </button>
      </div>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{receipt.store_name}</h2>
          <span
            className={`rounded px-2 py-1 text-xs font-medium ${
              CATEGORY_COLORS[receipt.category] || CATEGORY_COLORS.기타
            }`}
          >
            {receipt.category}
          </span>
        </div>

        <div className="mt-6 text-4xl font-bold text-emerald-700 tabular-nums">
          {won(receipt.amount)}
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-slate-500">구매일자</dt>
          <dd className="col-span-2 font-medium text-slate-800">{receipt.purchased_at}</dd>

          <dt className="text-slate-500">카테고리</dt>
          <dd className="col-span-2 font-medium text-slate-800">{receipt.category}</dd>

          <dt className="text-slate-500">메모</dt>
          <dd className="col-span-2 whitespace-pre-wrap text-slate-800">
            {receipt.memo || <span className="text-slate-400">—</span>}
          </dd>

          <dt className="text-slate-500">등록일시</dt>
          <dd className="col-span-2 text-slate-600">{formatDateTime(receipt.created_at)}</dd>

          <dt className="text-slate-500">영수증 ID</dt>
          <dd className="col-span-2 font-mono text-slate-500">#{receipt.id}</dd>
        </dl>
      </section>
    </div>
  );
}
