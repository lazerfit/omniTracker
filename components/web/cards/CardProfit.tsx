'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfitResponse {
  profit: number | null;
  profitPct: number | null;
  currency: string;
  from: string;
  to: string;
  message?: string;
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

  const isPositive = data?.profit != null && data.profit >= 0;
  const profitColor = isPositive ? 'text-green-500' : 'text-red-500';
  const sign = isPositive ? '+' : '';

  const formattedProfit =
    data?.profit != null
      ? new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(data.profit)
      : null;

  const formattedPct =
    data?.profitPct != null ? `${sign}${data.profitPct.toFixed(2)}%` : null;

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Profits</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <span className="text-muted-foreground text-sm">Loading...</span>}
        {error && <span className="text-muted-foreground text-sm">API 항목이 입력되지 않았습니다.</span>}
        {!loading && !error && data?.profit == null && (
          <span className="text-muted-foreground text-sm">아직 스냅샷 데이터가 없습니다.</span>
        )}
        {formattedProfit != null && (
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold tracking-tight ${profitColor}`}>
              {sign}{formattedProfit}
            </span>
            <span className="text-primary/80 text-sm">{data!.currency}</span>
            {formattedPct && (
              <span className={`text-sm font-medium ${profitColor}`}>{formattedPct}</span>
            )}
          </div>
        )}
        {data?.from && data?.to && (
          <p className="text-muted-foreground mt-1 text-xs">
            {data.from} → {data.to}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CardProfit;
