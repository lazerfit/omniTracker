import { ExchangeDialog } from '@/app/(main)/settings/components/ExchangeDialog';
import { getDb } from '@/lib/db';

const EXCHANGE_GROUPS = [
  { label: '국내 코인거래소', exchanges: ['Upbit'] },
  { label: '해외 코인거래소', exchanges: ['Binance', 'Bybit', 'Bitget', 'OKX'] },
];

const ApiSection = async () => {
  const db = await getDb();
  const rows = db.query<{ exchange: string }, []>('SELECT exchange FROM exchange_keys').all();
  const configuredSet = new Set(rows.map((r) => r.exchange));

  return (
    <div className="flex flex-col gap-6">
      {EXCHANGE_GROUPS.map(({ label, exchanges }) => (
        <div key={label}>
          <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
            {label}
          </h3>
          <div className="flex flex-col gap-2">
            {exchanges.map((exchange) => (
              <ExchangeDialog
                key={exchange}
                exchange={exchange}
                isConfigured={configuredSet.has(exchange)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApiSection;
