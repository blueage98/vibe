import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function Dashboard() {
  const [receipts, setReceipts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get("/receipts")
      .then((res) => {
        setReceipts(res.data);
        setStatus("ok");
      })
      .catch((err) => {
        setError(err?.message ?? "알 수 없는 오류");
        setStatus("error");
      });
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let total = 0;
    let thisMonth = 0;
    const byCategory = {};
    for (const r of receipts) {
      const amt = Number(r.amount);
      total += amt;
      if (r.purchased_at?.startsWith(ym)) thisMonth += amt;
      byCategory[r.category] = (byCategory[r.category] || 0) + amt;
    }
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);
    return { total, thisMonth, byCategory: topCategories, count: receipts.length };
  }, [receipts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">대시보드</h2>
        <Link
          to="/new"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + 신규 영수증 등록
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="이번 달 지출" value={won(stats.thisMonth)} accent="text-emerald-700" />
        <StatCard label="전체 지출" value={won(stats.total)} accent="text-slate-900" />
        <StatCard label="등록된 영수증" value={`${stats.count} 건`} accent="text-slate-700" />
      </div>

      {/* 카테고리별 합계 */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">카테고리별 지출</h3>
        {stats.byCategory.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">아직 등록된 영수증이 없습니다.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {stats.byCategory.map(([cat, amount]) => {
              const ratio = stats.total > 0 ? (amount / stats.total) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3 text-sm">
                  <span
                    className={`inline-block w-14 shrink-0 rounded px-2 py-0.5 text-center text-xs font-medium ${
                      CATEGORY_COLORS[cat] || CATEGORY_COLORS.기타
                    }`}
                  >
                    {cat}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded bg-emerald-500"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right tabular-nums text-slate-700">
                    {won(amount)}
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-400">
                    {ratio.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 영수증 목록 */}
      <section className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-5 py-3 text-sm font-semibold text-slate-700">
          영수증 목록
        </div>
        {status === "loading" && (
          <div className="p-5 text-sm text-slate-500">불러오는 중...</div>
        )}
        {status === "error" && (
          <div className="p-5 text-sm text-rose-700">오류: {error}</div>
        )}
        {status === "ok" && receipts.length === 0 && (
          <div className="p-5 text-sm text-slate-500">
            아직 등록된 영수증이 없습니다.{" "}
            <Link to="/new" className="font-semibold text-emerald-700 hover:underline">
              첫 영수증을 등록해보세요 →
            </Link>
          </div>
        )}
        {status === "ok" && receipts.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">날짜</th>
                <th className="px-5 py-2 font-medium">가맹점</th>
                <th className="px-5 py-2 font-medium">카테고리</th>
                <th className="px-5 py-2 text-right font-medium">금액</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-emerald-50/40"
                >
                  <td className="px-5 py-3">
                    <Link
                      to={`/receipts/${r.id}`}
                      className="block text-slate-700 hover:text-emerald-700"
                    >
                      {r.purchased_at}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      to={`/receipts/${r.id}`}
                      className="font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {r.store_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        CATEGORY_COLORS[r.category] || CATEGORY_COLORS.기타
                      }`}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <Link to={`/receipts/${r.id}`} className="hover:text-emerald-700">
                      {won(r.amount)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}
