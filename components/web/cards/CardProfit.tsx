'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StockProfit {
  profitKrw: number;
  profitPct: number | null;
}

interface CryptoProfit {
  profitKrw: number;
  profitPct: number | null;
  from: string;
  to: string;
}

interface ProfitResponse {
  stock: StockProfit | null;
  crypto: CryptoProfit | null;
}

function formatKrw(v: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(v);
}

function ProfitRow({
  label,
  profitKrw,
  profitPct,
  sub,
}: {
  label: string;
  profitKrw: number;
  profitPct: number | null;
  sub?: string;
}) {
  const isPos = profitKrw >= 0;
  const color = isPos ? 'text-green-500' : 'text-red-500';
  const sign = isPos ? '+' : '';
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground text-xs">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-sm font-semibold ${color}`}>
            {sign}
            {formatKrw(profitKrw)}
          </span>
          {profitPct != null && (
            <span className={`text-xs ${color}`}>
              {sign}
              {profitPct.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      {sub && <p className="text-muted-foreground text-right text-xs">{sub}</p>}
    </div>
  );
}

const CardProfit = () => {
  const [data, setData] = useState<ProfitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/portfolio/profit')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ProfitResponse>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const hasData = data?.stock != null || data?.crypto != null;

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Profits</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <span className="text-muted-foreground text-sm">Loading...</span>}
        {(error || (!loading && !hasData)) && (
          <span className="text-muted-foreground text-sm">API 항목이 입력되지 않았습니다.</span>
        )}
        {hasData && (
          <div className="flex flex-col gap-3">
            {data!.stock != null && (
              <ProfitRow
                label="주식 (실시간)"
                profitKrw={data!.stock.profitKrw}
                profitPct={data!.stock.profitPct}
              />
            )}
            {data!.crypto != null && (
              <ProfitRow
                label="크립토 (전일 대비)"
                profitKrw={data!.crypto.profitKrw}
                profitPct={data!.crypto.profitPct}
                sub={`${data!.crypto.from} → ${data!.crypto.to}`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CardProfit;
