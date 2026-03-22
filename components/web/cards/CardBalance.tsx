'use client';

import { useEffect, useRef, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExchangeBalance {
  exchange: string;
  balanceKrw: number;
  error?: string;
}

interface StockBalance {
  ticker: string;
  totalKrw: number;
  error?: string;
}

interface BalanceResponse {
  total: number;
  currency: string;
  exchanges: ExchangeBalance[];
  stocks: StockBalance[];
}

interface Segment {
  label: string;
  amount: number;
  pct: number;
  color: string;
}

interface TooltipState {
  segment: Segment;
  x: number;
}

function formatKrw(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

const CardBalance = () => {
  const [data, setData] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/portfolio/balance')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<BalanceResponse>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const formatted = data ? formatKrw(data.total) : null;

  const segments: Segment[] = data
    ? (() => {
        const cryptoTotal = data.exchanges.reduce((s, e) => s + (e.balanceKrw ?? 0), 0);
        const stockTotal = data.stocks.reduce((s, e) => s + (e.totalKrw ?? 0), 0);
        const total = cryptoTotal + stockTotal;
        if (total === 0) return [];
        return [
          { label: '크립토', amount: cryptoTotal, pct: (cryptoTotal / total) * 100, color: 'bg-red-300' },
          { label: '주식', amount: stockTotal, pct: (stockTotal / total) * 100, color: 'bg-blue-300' },
        ].filter((s) => s.amount > 0);
      })()
    : [];

  return (
    <Card className="flex-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Total Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <span className="text-muted-foreground text-sm">Loading...</span>}
        {error && (
          <span className="text-muted-foreground text-sm">
            API 항목이 입력되지 않았습니다.
          </span>
        )}
        {!loading && !error && data?.total === 0 && (
          <span className="text-muted-foreground text-sm">
            API 항목이 입력되지 않았습니다.
          </span>
        )}
        {formatted && data!.total > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-xl font-bold tracking-tight">{formatted}</span>

            {segments.length > 0 && (
              <div className="relative" ref={barRef}>
                {/* Bar */}
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {segments.map((seg) => (
                    <div
                      key={seg.label}
                      className={`${seg.color} h-full cursor-pointer transition-opacity hover:opacity-75`}
                      style={{ width: `${seg.pct}%` }}
                      onMouseEnter={(e) => {
                        const bar = barRef.current;
                        if (!bar) return;
                        const barRect = bar.getBoundingClientRect();
                        const x = e.clientX - barRect.left;
                        setTooltip({ segment: seg, x });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>

                {/* Tooltip */}
                {tooltip && (
                  <div
                    className="pointer-events-none absolute bottom-5 z-10 -translate-x-1/2 rounded-lg border bg-white px-3 py-2 shadow-md"
                    style={{ left: tooltip.x }}
                  >
                    <p className="text-xs font-semibold">{tooltip.segment.label}</p>
                    <p className="text-muted-foreground text-xs">{formatKrw(tooltip.segment.amount)}</p>
                    <p className="text-muted-foreground text-xs">{tooltip.segment.pct.toFixed(1)}%</p>
                  </div>
                )}

                {/* Legend */}
                <div className="mt-2 flex gap-3">
                  {segments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-1.5">
                      <span className={`${seg.color} inline-block h-2 w-2 rounded-full`} />
                      <span className="text-muted-foreground text-xs">{seg.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CardBalance;
