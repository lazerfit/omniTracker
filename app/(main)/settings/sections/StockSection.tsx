import { getDb } from '@/lib/db';
import { getStockPrice } from '@/lib/stock/yahoo';
import { getUsdtKrwRate } from '@/lib/exchange/upbit';
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
}

function formatKrw(value: number): string {
  return `₩${Math.round(value).toLocaleString('ko-KR')}`;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const StockSection = async () => {
  const db = await getDb();

  const rows = db
    .query<StockHoldingRow, []>('SELECT id, ticker, name, shares, avg_price FROM stock_holdings')
    .all();

  const usdtKrw = rows.length > 0 ? await getUsdtKrwRate().catch(() => 1400) : 1;

  const holdings: StockHoldingWithPrice[] = await Promise.all(
    rows.map(async (row) => {
      try {
        const { price, currency, name } = await getStockPrice(row.ticker);
        return {
          ...row,
          price,
          currency,
          resolvedName: row.name || name,
        };
      } catch {
        return {
          ...row,
          price: null,
          currency: null,
          resolvedName: row.name || row.ticker,
        };
      }
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          보유 종목
        </h3>
        <StockDialog />
      </div>

      {holdings.length === 0 ? (
        <p className="text-muted-foreground text-sm">등록된 종목이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {holdings.map((holding) => {
            const isKrw = holding.currency === 'KRW';
            const priceKrw =
              holding.price != null
                ? isKrw
                  ? holding.price
                  : holding.price * usdtKrw
                : null;
            const totalKrw = priceKrw != null ? priceKrw * holding.shares : null;
            const avgPriceKrw =
              holding.avg_price != null
                ? isKrw
                  ? holding.avg_price
                  : holding.avg_price * usdtKrw
                : null;
            const profitKrw =
              avgPriceKrw != null && priceKrw != null
                ? (priceKrw - avgPriceKrw) * holding.shares
                : null;
            const profitPct =
              avgPriceKrw != null && priceKrw != null
                ? ((priceKrw - avgPriceKrw) / avgPriceKrw) * 100
                : null;

            return (
              <div key={holding.id} className="rounded-xl border px-4 py-3">
                {/* Row 1: ticker + name + action buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{holding.ticker}</span>
                  <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
                    {holding.resolvedName}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <StockDialog
                      mode="edit"
                      initialData={{
                        id: holding.id,
                        ticker: holding.ticker,
                        name: holding.resolvedName,
                        shares: holding.shares,
                        avgPrice: holding.avg_price,
                      }}
                    />
                    <StockDeleteButton id={holding.id} />
                  </div>
                </div>
                {/* Row 2: shares + price + total + profit */}
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span>{holding.shares.toLocaleString('ko-KR')}주</span>
                  {holding.price != null && holding.currency != null && (
                    <span>
                      현재가 {isKrw ? formatKrw(holding.price) : formatUsd(holding.price)}
                    </span>
                  )}
                  {totalKrw != null && (
                    <span className="text-foreground font-medium">{formatKrw(totalKrw)}</span>
                  )}
                  {profitKrw != null && holding.avg_price != null && profitPct != null && (
                    <span className={profitKrw >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {profitKrw >= 0 ? '+' : ''}
                      {formatKrw(profitKrw)} ({profitPct >= 0 ? '+' : ''}
                      {profitPct.toFixed(2)}%)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockSection;
