'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExchangeBalance {
  exchange: string;
  balanceKrw: number;
  error?: string;
}

interface StockBalance {
  ticker: string;
  name: string;
  shares: number;
  priceKrw: number;
  totalKrw: number;
  error?: string;
}

interface BalanceResponse {
  total: number;
  exchanges: ExchangeBalance[];
  stocks: StockBalance[];
}

interface HoldingItem {
  key: string;
  label: string;
  sublabel?: string;
  amountKrw: number;
  type: 'crypto' | 'stock';
}

function formatKrw(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

const CardHoldings = () => {
  const [data, setData] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const items: HoldingItem[] = data
    ? [
        ...data.exchanges
          .filter((e) => !e.error && e.balanceKrw > 0)
          .map((e) => ({
            key: `exchange-${e.exchange}`,
            label: e.exchange,
            amountKrw: e.balanceKrw,
            type: 'crypto' as const,
          })),
        ...data.stocks
          .filter((s) => !s.error && s.totalKrw > 0)
          .map((s) => ({
            key: `stock-${s.ticker}`,
            label: s.ticker,
            sublabel: s.name,
            amountKrw: s.totalKrw,
            type: 'stock' as const,
          })),
      ].sort((a, b) => b.amountKrw - a.amountKrw)
    : [];

  const total = data?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">보유 종목</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <span className="text-muted-foreground text-sm">Loading...</span>}
        {error && <span className="text-destructive text-sm">{error}</span>}
        {!loading && !error && items.length === 0 && (
          <span className="text-muted-foreground text-sm">보유 종목이 없습니다.</span>
        )}
        {items.length > 0 && (
          <div className="flex flex-col gap-1">
            {items.map((item, i) => {
              const pct = total > 0 ? (item.amountKrw / total) * 100 : 0;
              return (
                <div key={item.key} className="flex items-center gap-3 py-1.5">
                  <span className="text-muted-foreground w-5 shrink-0 text-right text-xs">{i + 1}</span>

                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${item.type === 'crypto' ? 'bg-red-300' : 'bg-blue-300'}`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-muted-foreground truncate text-xs">{item.sublabel}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium">{formatKrw(item.amountKrw)}</div>
                    <div className="text-muted-foreground text-xs">{pct.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CardHoldings;
