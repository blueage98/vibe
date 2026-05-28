import { useEffect, useState } from "react";
import { apiClient } from "./api/client.js";
import ReceiptOcrUpload from "./components/ReceiptOcrUpload.jsx";
import ReceiptForm from "./components/ReceiptForm.jsx";

export default function App() {
  const [health, setHealth] = useState({ state: "loading", data: null, error: null });
  const [prefill, setPrefill] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    apiClient
      .get("/health")
      .then((res) => setHealth({ state: "ok", data: res.data, error: null }))
      .catch((err) =>
        setHealth({ state: "error", data: null, error: err?.message ?? "unknown error" })
      );
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <h1 className="text-2xl font-bold">영수증 지출관리</h1>
          <p className="text-sm text-slate-500">FastAPI + React 스캐폴딩 완료</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">백엔드 연결 상태</h2>
          <div className="mt-3 text-sm">
            {health.state === "loading" && <span className="text-slate-500">확인 중...</span>}
            {health.state === "ok" && (
              <span className="inline-flex items-center gap-2 rounded bg-emerald-100 px-2 py-1 font-mono text-emerald-700">
                /api/health → {JSON.stringify(health.data)}
              </span>
            )}
            {health.state === "error" && (
              <span className="inline-flex items-center gap-2 rounded bg-rose-100 px-2 py-1 font-mono text-rose-700">
                연결 실패: {health.error}
              </span>
            )}
          </div>
        </section>

        <ReceiptOcrUpload onExtracted={setPrefill} />

        <ReceiptForm
          prefill={prefill}
          onSaved={(saved) => {
            setLastSaved(saved);
            setPrefill(null);
          }}
        />

        {lastSaved && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            방금 저장됨: <strong>{lastSaved.store_name}</strong> ·{" "}
            {Number(lastSaved.amount).toLocaleString("ko-KR")} 원 ·{" "}
            {lastSaved.purchased_at} · {lastSaved.category}
          </section>
        )}

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">다음에 할 일</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>영수증 목록 + 카테고리/기간 필터링</li>
            <li>월간 합계/통계 화면</li>
            <li>Vercel에 배포 (Postgres + UPSTAGE_API_KEY 환경변수 설정)</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
