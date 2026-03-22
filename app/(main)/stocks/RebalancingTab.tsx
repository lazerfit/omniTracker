'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface HoldingInfo {
  ticker: string;
  name: string;
  totalKrw: number | null;
  priceKrw: number | null;
  shares: number;
}

interface RebalancingTabProps {
  holdings: HoldingInfo[];
  totalValueKrw: number;
}

interface RebalanceTarget {
  ticker: string;
  targetPct: number;
}

function formatKrw(v: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(v);
}

export default function RebalancingTab({ holdings, totalValueKrw }: RebalancingTabProps) {
  const [targets, setTargets] = useState<Record<string, number>>(() =>
    Object.fromEntries(holdings.map((h) => [h.ticker, 0])),
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/rebalance-targets')
      .then((res) => res.json())
      .then((data: RebalanceTarget[]) => {
        if (!Array.isArray(data)) return;
        setTargets((prev) => {
          const next = { ...prev };
          for (const { ticker, targetPct } of data) {
            if (ticker in next) {
              next[ticker] = targetPct;
            }
          }
          return next;
        });
      })
      .catch(() => {
        // silently ignore fetch errors on mount
      });
  }, []);

  const targetSum = Object.values(targets).reduce((sum, v) => sum + v, 0);
  const isExact100 = Math.abs(targetSum - 100) < 0.001;

  async function handleSave() {
    setSaving(true);
    try {
      const payload = holdings.map((h) => ({
        ticker: h.ticker,
        targetPct: targets[h.ticker] ?? 0,
      }));
      await fetch('/api/rebalance-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: payload }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'rounded-md border px-4 py-1.5 text-sm font-medium transition-colors',
              'hover:bg-muted/60 disabled:opacity-50',
            )}
          >
            목표 저장
          </button>
          {saved && <span className="text-sm text-green-500">저장되었습니다</span>}
        </div>
        <div className="text-sm font-medium">
          목표 합계:{' '}
          <span className={cn(isExact100 ? 'text-green-500' : 'text-red-500')}>
            {targetSum.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {['티커 / 종목명', '현재금액', '현재비중', '목표비중', '차이(KRW)', '차이(주)', '액션'].map(
                (col) => (
                  <th
                    key={col}
                    className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const currentPct =
                h.totalKrw != null && totalValueKrw > 0
                  ? (h.totalKrw / totalValueKrw) * 100
                  : 0;
              const targetPct = targets[h.ticker] ?? 0;
              const currentKrw = h.totalKrw ?? 0;
              const targetKrw = (targetPct / 100) * totalValueKrw;
              const diffKrw = targetKrw - currentKrw;
              const diffShares =
                h.priceKrw != null && h.priceKrw > 0
                  ? diffKrw / h.priceKrw
                  : null;

              const hasDiff = h.priceKrw != null && Math.abs(diffKrw) > 0.5;
              const isBuy = diffKrw > 0;

              return (
                <tr key={h.ticker} className="border-t hover:bg-muted/30">
                  {/* 티커 / 종목명 */}
                  <td className="px-4 py-3">
                    <span className="font-medium">{h.ticker}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{h.name}</span>
                  </td>

                  {/* 현재금액 */}
                  <td className="px-4 py-3">
                    {h.totalKrw != null ? (
                      formatKrw(h.totalKrw)
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* 현재비중 */}
                  <td className="text-muted-foreground px-4 py-3">
                    {h.totalKrw != null && totalValueKrw > 0
                      ? `${currentPct.toFixed(1)}%`
                      : '-'}
                  </td>

                  {/* 목표비중 input */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={targets[h.ticker] ?? 0}
                      onChange={(e) =>
                        setTargets((prev) => ({
                          ...prev,
                          [h.ticker]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-20 rounded border bg-transparent px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>

                  {/* 차이(KRW) */}
                  <td className="px-4 py-3">
                    {hasDiff ? (
                      <span className={cn(isBuy ? 'text-green-500' : 'text-red-500')}>
                        {isBuy ? '+' : ''}
                        {formatKrw(diffKrw)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* 차이(주) */}
                  <td className="px-4 py-3">
                    {hasDiff && diffShares != null ? (
                      <span className={cn(isBuy ? 'text-green-500' : 'text-red-500')}>
                        {diffShares >= 0 ? '+' : ''}
                        {diffShares.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* 액션 badge */}
                  <td className="px-4 py-3">
                    {hasDiff ? (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          isBuy
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-600',
                        )}
                      >
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr className="bg-muted/50 border-t font-medium">
              <td className="px-4 py-3" colSpan={2}>
                합계
              </td>
              <td className="text-muted-foreground px-4 py-3">
                {totalValueKrw > 0 ? formatKrw(totalValueKrw) : '-'}
              </td>
              <td className="px-4 py-3">
                <span className={cn(isExact100 ? 'text-green-500' : 'text-red-500')}>
                  {targetSum.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3" colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
