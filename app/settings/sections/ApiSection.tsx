import { ExchangeDialog } from '@/app/settings/components/ExchangeDialog';

const EXCHANGES = ['Binance', 'Bybit', 'Bitget', 'OKX'];

const ApiSection = () => {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">거래소 API 관리</h2>
      <div className="flex flex-col gap-2">
        {EXCHANGES.map((exchange) => (
          <ExchangeDialog key={exchange} exchange={exchange} />
        ))}
      </div>
    </div>
  );
};

export default ApiSection;
