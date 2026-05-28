import { useEffect, useState } from "react";
import { apiClient } from "../api/client.js";

const CATEGORIES = ["식비", "교통", "쇼핑", "의료", "문화", "통신", "기타"];

const emptyForm = () => ({
  store_name: "",
  amount: "",
  purchased_at: "",
  category: "기타",
  memo: "",
});

const normalizePrefill = (prefill) => {
  if (!prefill) return emptyForm();
  return {
    store_name: prefill.store_name ?? "",
    amount: prefill.amount != null ? String(prefill.amount) : "",
    purchased_at: prefill.purchased_at ?? "",
    category: CATEGORIES.includes(prefill.category) ? prefill.category : "기타",
    memo: "",
  };
};

export default function ReceiptForm({ prefill, onSaved }) {
  const [form, setForm] = useState(() => normalizePrefill(prefill));
  const [status, setStatus] = useState("idle"); // idle | saving | ok | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (prefill) {
      setForm(normalizePrefill(prefill));
      setStatus("idle");
      setError(null);
    }
  }, [prefill]);

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const payload = {
        store_name: form.store_name.trim(),
        amount: form.amount,
        purchased_at: form.purchased_at,
        category: form.category || "기타",
        memo: form.memo.trim() || null,
      };
      const res = await apiClient.post("/receipts", payload);
      setStatus("ok");
      setForm(emptyForm());
      onSaved?.(res.data);
    } catch (err) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "알 수 없는 오류";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      setStatus("error");
    }
  };

  const isPrefilled = Boolean(
    prefill && (prefill.store_name || prefill.amount || prefill.purchased_at),
  );

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">영수증 등록</h2>
      <p className="mt-1 text-sm text-slate-500">
        {isPrefilled
          ? "추출된 결과가 자동으로 채워졌습니다. 확인 후 저장하세요."
          : "위에서 영수증 이미지를 분석하거나 직접 입력하세요."}
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-700">가맹점</span>
          <input
            type="text"
            required
            maxLength={100}
            value={form.store_name}
            onChange={onChange("store_name")}
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">금액 (원)</span>
          <input
            type="number"
            required
            min="0"
            step="1"
            value={form.amount}
            onChange={onChange("amount")}
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">날짜</span>
          <input
            type="date"
            required
            value={form.purchased_at}
            onChange={onChange("purchased_at")}
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">카테고리</span>
          <select
            value={form.category}
            onChange={onChange("category")}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="text-slate-700">메모 (선택)</span>
          <textarea
            rows={2}
            maxLength={500}
            value={form.memo}
            onChange={onChange("memo")}
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {status === "saving" ? "저장 중..." : "저장"}
          </button>

          {status === "ok" && (
            <span className="text-sm text-emerald-700">✅ 저장되었습니다.</span>
          )}
          {status === "error" && (
            <span className="text-sm text-rose-700">오류: {error}</span>
          )}
        </div>
      </form>
    </section>
  );
}
