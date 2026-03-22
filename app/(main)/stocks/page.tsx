import { cn } from '@/lib/utils';
import { getDb } from '@/lib/db';
import { getStockPrice } from '@/lib/stock/yahoo';
import { getUsdtKrwRate } from '@/lib/exchange/upbit';
import Link from 'next/link';
import RebalancingTab from './RebalancingTab';
import { StockDialog } from '@/app/(main)/settings/components/StockDialog';
import { StockDeleteButton } from '@/app/(main)/settings/components/StockDeleteButton';

interface StockHoldingRow {
  id: number;
  ticker: string;
  name: string;
  shares: number;
  avg_price: number | null;
}

interface StockHoldingWithPrice extends StockHoldingRow {
  price: number | null;
  currency: string | null;
  resolvedName: string;
  priceKrw: number | null;
  totalKrw: number | null;
  profitKrw: number | null;
  profitPct: number | null;
}

function formatKrw(v: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(v);
}

function formatUsd(v: number) {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface StocksPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function StocksPage({ searchParams }: StocksPageProps) {
  const { view = 'holdings' } = await searchParams;

  const db = await getDb();

  const rows = db
    .query<StockHoldingRow, []>('SELECT id, ticker, name, shares, avg_price FROM stock_holdings')
    .all();

  const usdtKrw = rows.length > 0 ? await getUsdtKrwRate().catch(() => 1400) : 1;

  const holdingsRaw: StockHoldingWithPrice[] = await Promise.all(
    rows.map(async (row) => {
      try {
        const { price, currency, name } = await getStockPrice(row.ticker);
        const isKrw = currency === 'KRW';
        const priceKrw = isKrw ? price : price * usdtKrw;
        const totalKrw = priceKrw * row.shares;
        const avgPriceKrw =
          row.avg_price != null ? (isKrw ? row.avg_price : row.avg_price * usdtKrw) : null;
        const profitKrw =
          avgPriceKrw != null ? (priceKrw - avgPriceKrw) * row.shares : null;
        const profitPct =
          avgPriceKrw != null ? ((priceKrw - avgPriceKrw) / avgPriceKrw) * 100 : null;

        return {
          ...row,
          price,
          currency,
          resolvedName: row.name || name,
          priceKrw,
          totalKrw,
          profitKrw,
          profitPct,
        };
      } catch {
        return {
          ...row,
          price: null,
          currency: null,
          resolvedName: row.name || row.ticker,
          priceKrw: null,
          totalKrw: null,
          profitKrw: null,
          profitPct: null,
        };
      }
    }),
  );

  const holdings = holdingsRaw.sort((a, b) => {
    if (a.totalKrw == null && b.totalKrw == null) return 0;
    if (a.totalKrw == null) return 1;
    if (b.totalKrw == null) return -1;
    return b.totalKrw - a.totalKrw;
  });

  const totalValueKrw = holdings.reduce((sum, h) => sum + (h.totalKrw ?? 0), 0);
  const totalProfitKrw = holdings.reduce((sum, h) => sum + (h.profitKrw ?? 0), 0);
  const totalCostKrw = holdings.reduce((sum, h) => {
    if (h.profitKrw == null || h.totalKrw == null) return sum;
    return sum + (h.totalKrw - h.profitKrw);
  }, 0);
  const totalProfitPct = totalCostKrw > 0 ? (totalProfitKrw / totalCostKrw) * 100 : null;
  const hasProfitData = holdings.some((h) => h.profitKrw != null);

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Stocks</h1>
          <StockDialog />
        </div>
        <p className="text-muted-foreground text-sm">보유 종목이 없습니다. 종목을 추가하세요.</p>
      </div>
    );
  }

  const rebalancingHoldings = holdings.map((h) => ({
    ticker: h.ticker,
    name: h.resolvedName,
    totalKrw: h.totalKrw,
    priceKrw: h.priceKrw,
    shares: h.shares,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stocks</h1>
        <StockDialog />
      </div>

      {/* Tab nav */}
      <div className="flex w-fit gap-1 rounded-lg border p-1">
        <Link
          href="/stocks?view=holdings"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            view === 'holdings'
              ? 'bg-primary/10 text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          보유 종목
        </Link>
        <Link
          href="/stocks?view=rebalancing"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            view === 'rebalancing'
              ? 'bg-primary/10 text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          리밸런싱
        </Link>
      </div>

      {/* Summary cards — visible on both views */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs">총 평가금액</p>
          <p className="mt-0.5 text-lg font-semibold">{formatKrw(totalValueKrw)}</p>
        </div>
        {hasProfitData && (
          <div className="rounded-xl border px-4 py-3">
            <p className="text-muted-foreground text-xs">총 수익금</p>
            <p
              className={`mt-0.5 text-lg font-semibold ${totalProfitKrw >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {totalProfitKrw >= 0 ? '+' : ''}
              {formatKrw(totalProfitKrw)}
            </p>
          </div>
        )}
      </div>

      {/* View: Holdings */}
      {view === 'holdings' && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-muted/50">
                {['티커', '종목명', '수량', '현재가', '평가금액', '비중'].map((col) => (
                  <th
                    key={col}
                    className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
                <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider lg:table-cell">
                  매입단가
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider lg:table-cell">
                  수익금
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  수익률
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const isKrw = h.currency === 'KRW';
                return (
                  <tr key={h.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{h.ticker}</td>
                    <td className="text-muted-foreground px-4 py-3">{h.resolvedName}</td>
                    <td className="px-4 py-3">{h.shares.toLocaleString('ko-KR')}</td>
                    <td className="px-4 py-3">
                      {h.price != null && h.currency != null ? (
                        <span>
                          {isKrw ? formatKrw(h.price) : formatUsd(h.price)}
                          {!isKrw && h.priceKrw != null && (
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({formatKrw(h.priceKrw)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {h.totalKrw != null ? (
                        formatKrw(h.totalKrw)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {h.totalKrw != null && totalValueKrw > 0
                        ? `${((h.totalKrw / totalValueKrw) * 100).toFixed(1)}%`
                        : '-'}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {h.avg_price != null ? (
                        isKrw ? formatKrw(h.avg_price) : formatUsd(h.avg_price)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {h.profitKrw != null ? (
                        <span className={h.profitKrw >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {h.profitKrw >= 0 ? '+' : ''}
                          {formatKrw(h.profitKrw)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {h.profitPct != null ? (
                        <span className={h.profitPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {h.profitPct >= 0 ? '+' : ''}
                          {h.profitPct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center">
                        <StockDialog
                          mode="edit"
                          initialData={{
                            id: h.id,
                            ticker: h.ticker,
                            name: h.resolvedName,
                            shares: h.shares,
                            avgPrice: h.avg_price,
                          }}
                        />
                        <StockDeleteButton id={h.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Totals row */}
              <tr className="bg-muted/50 border-t font-medium">
                <td className="px-4 py-3" colSpan={4}>
                  합계
                </td>
                <td className="px-4 py-3">{formatKrw(totalValueKrw)}</td>
                <td className="text-muted-foreground px-4 py-3">100%</td>
                <td className="hidden px-4 py-3 lg:table-cell" />
                <td className="hidden px-4 py-3 lg:table-cell">
                  {hasProfitData ? (
                    <span className={totalProfitKrw >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {totalProfitKrw >= 0 ? '+' : ''}
                      {formatKrw(totalProfitKrw)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {totalProfitPct != null ? (
                    <span className={totalProfitPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {totalProfitPct >= 0 ? '+' : ''}
                      {totalProfitPct.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-2 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* View: Rebalancing */}
      {view === 'rebalancing' && (
        <RebalancingTab holdings={rebalancingHoldings} totalValueKrw={totalValueKrw} />
      )}
    </div>
  );
}
