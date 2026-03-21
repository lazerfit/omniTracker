import { getDb } from '@/lib/db';
import { getStockPrice } from '@/lib/stock/yahoo';
import { getUsdtKrwRate } from '@/lib/exchange/upbit';
import { StockDialog } from '@/app/settings/components/StockDialog';
import { StockDeleteButton } from '@/app/settings/components/StockDeleteButton';

interface StockHoldingRow {
  id: number;
  ticker: string;
  name: string;
  shares: number;
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
    .query<StockHoldingRow, []>('SELECT id, ticker, name, shares FROM stock_holdings')
    .all();

  const usdtKrw = rows.length > 0 ? await getUsdtKrwRate() : 1;

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

            return (
              <div
                key={holding.id}
                className="flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 text-sm font-bold">{holding.ticker}</span>
                  <span className="text-muted-foreground truncate text-sm">{holding.resolvedName}</span>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-muted-foreground text-sm">
                    {holding.shares.toLocaleString('ko-KR')}주
                  </span>

                  <div className="min-w-[120px] text-right">
                    {holding.price != null && holding.currency != null ? (
                      <>
                        <div className="text-sm font-medium">
                          {isKrw
                            ? formatKrw(holding.price)
                            : formatUsd(holding.price)}
                        </div>
                        {!isKrw && priceKrw != null && (
                          <div className="text-muted-foreground text-xs">
                            {formatKrw(priceKrw)}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>

                  <div className="min-w-[120px] text-right">
                    {totalKrw != null ? (
                      <span className="text-sm font-medium">{formatKrw(totalKrw)}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>

                  <StockDeleteButton id={holding.id} />
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
