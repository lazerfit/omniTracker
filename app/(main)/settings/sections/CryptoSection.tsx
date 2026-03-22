import { getDb } from '@/lib/db';
import { getCoinPrice } from '@/lib/crypto/prices';
import { CryptoDialog } from '@/app/(main)/settings/components/CryptoDialog';
import { CryptoDeleteButton } from '@/app/(main)/settings/components/CryptoDeleteButton';

interface CryptoHoldingRow {
  id: number;
  symbol: string;
  name: string;
  amount: number;
  avg_price: number | null;
}

interface CryptoHoldingWithPrice extends CryptoHoldingRow {
  priceUsd: number | null;
}

function formatUsd(v: number) {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CryptoSection = async () => {
  const db = await getDb();

  const rows = db
    .query<CryptoHoldingRow, []>('SELECT id, symbol, name, amount, avg_price FROM crypto_holdings')
    .all();

  const holdings: CryptoHoldingWithPrice[] = await Promise.all(
    rows.map(async (row) => {
      try {
        const { price } = await getCoinPrice(row.symbol);
        return { ...row, priceUsd: price };
      } catch {
        return { ...row, priceUsd: null };
      }
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          보유 코인
        </h3>
        <CryptoDialog />
      </div>

      {holdings.length === 0 ? (
        <p className="text-muted-foreground text-sm">등록된 코인이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {holdings.map((holding) => {
            const totalUsd =
              holding.priceUsd != null ? holding.priceUsd * holding.amount : null;
            const profitUsd =
              holding.priceUsd != null && holding.avg_price != null
                ? (holding.priceUsd - holding.avg_price) * holding.amount
                : null;
            const profitPct =
              holding.priceUsd != null && holding.avg_price != null
                ? ((holding.priceUsd - holding.avg_price) / holding.avg_price) * 100
                : null;

            return (
              <div key={holding.id} className="rounded-xl border px-4 py-3">
                {/* Row 1: symbol + name + action buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{holding.symbol}</span>
                  <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
                    {holding.name || holding.symbol}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <CryptoDialog
                      mode="edit"
                      initialData={{
                        id: holding.id,
                        symbol: holding.symbol,
                        name: holding.name,
                        amount: holding.amount,
                        avgPrice: holding.avg_price,
                      }}
                    />
                    <CryptoDeleteButton id={holding.id} />
                  </div>
                </div>
                {/* Row 2: amount + price + total + profit */}
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span>{holding.amount.toLocaleString('en-US')}개</span>
                  {holding.priceUsd != null && (
                    <span>현재가 {formatUsd(holding.priceUsd)}</span>
                  )}
                  {totalUsd != null && (
                    <span className="text-foreground font-medium">{formatUsd(totalUsd)}</span>
                  )}
                  {profitUsd != null && profitPct != null && (
                    <span className={profitUsd >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {profitUsd >= 0 ? '+' : ''}
                      {formatUsd(profitUsd)} ({profitPct >= 0 ? '+' : ''}
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

export default CryptoSection;
