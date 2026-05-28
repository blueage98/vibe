import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { apiClient } from "./api/client.js";
import Dashboard from "./pages/Dashboard.jsx";
import NewReceipt from "./pages/NewReceipt.jsx";
import ReceiptDetail from "./pages/ReceiptDetail.jsx";

export default function App() {
  const [health, setHealth] = useState({ state: "loading", data: null, error: null });

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-2xl font-bold hover:text-emerald-700">
            영수증 지출관리
          </Link>
          <div className="text-xs">
            {health.state === "loading" && <span className="text-slate-500">백엔드 확인 중...</span>}
            {health.state === "ok" && (
              <span className="rounded bg-emerald-100 px-2 py-1 font-mono text-emerald-700">
                /api/health ok
              </span>
            )}
            {health.state === "error" && (
              <span className="rounded bg-rose-100 px-2 py-1 font-mono text-rose-700">
                백엔드 연결 실패
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewReceipt />} />
          <Route path="/receipts/:id" element={<ReceiptDetail />} />
        </Routes>
      </main>
    </div>
  );
}
