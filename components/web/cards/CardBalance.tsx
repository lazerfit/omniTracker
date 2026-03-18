'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BalanceResponse {
  total: number;
  currency: string;
}

const CardBalance = () => {
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

  const formatted = data
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        data.total,
      )
    : null;

  return (
    <Card className="flex-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Total Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <span className="text-muted-foreground text-sm">Loading...</span>}
        {error && <span className="text-destructive text-sm">{error}</span>}
        {formatted && (
          <>
            <span className="text-xl font-bold tracking-tight">{formatted}</span>
            <span className="text-primary/80 ml-2 text-sm">{data!.currency}</span>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CardBalance;
