import { useState } from "react";
import { apiClient } from "../api/client.js";

export default function ReceiptOcrUpload({ onExtracted }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);
    setStatus("idle");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(selected && selected.type.startsWith("image/") ? URL.createObjectURL(selected) : null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;
    setStatus("loading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post("/ocr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setStatus("ok");
      onExtracted?.(res.data);
    } catch (err) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "알 수 없는 오류";
      setError(detail);
      setStatus("error");
    }
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined) return "—";
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toLocaleString("ko-KR")} 원` : String(value);
  };

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">영수증 이미지 분석</h2>
      <p className="mt-1 text-sm text-slate-500">
        영수증 이미지를 업로드하면 Upstage Information Extraction이 가맹점·금액·날짜·카테고리를 추출합니다.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={onFileChange}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-white hover:file:bg-slate-700"
        />

        {previewUrl && (
          <img
            src={previewUrl}
            alt="영수증 미리보기"
            className="max-h-64 rounded border border-slate-200 object-contain"
          />
        )}

        <button
          type="submit"
          disabled={!file || status === "loading"}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status === "loading" ? "인식 중..." : "영수증 분석"}
        </button>
      </form>

      {status === "error" && (
        <p className="mt-4 rounded bg-rose-50 p-3 text-sm text-rose-700">오류: {String(error)}</p>
      )}

      {status === "ok" && result && (
        <div className="mt-4 rounded bg-emerald-50 p-3 text-sm">
          <div className="font-semibold text-emerald-800">자동 추출 결과</div>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-emerald-900">
            <dt className="text-emerald-700">가맹점</dt>
            <dd className="col-span-2">{result.store_name ?? "—"}</dd>
            <dt className="text-emerald-700">금액</dt>
            <dd className="col-span-2">{formatAmount(result.amount)}</dd>
            <dt className="text-emerald-700">날짜</dt>
            <dd className="col-span-2">{result.purchased_at ?? "—"}</dd>
            <dt className="text-emerald-700">카테고리</dt>
            <dd className="col-span-2">{result.category ?? "—"}</dd>
          </dl>
        </div>
      )}
    </section>
  );
}
