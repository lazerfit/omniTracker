import { IconExternalLink } from '@tabler/icons-react';

import CardBalance from '@/components/web/cards/CardBalance';
import CardHoldings from '@/components/web/cards/CardHoldings';
import CardProfit from '@/components/web/cards/CardProfit';

const QUICK_LINKS = [
  { label: 'Binance', url: 'https://www.binance.com', description: '글로벌 1위 거래소' },
  { label: 'Bybit', url: 'https://www.bybit.com', description: '선물 특화 거래소' },
  { label: 'Upbit', url: 'https://upbit.com', description: '국내 1위 거래소' },
  { label: '토스증권', url: 'https://tossinvest.com', description: '주식 · ETF 투자' },
];

export default function Home() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardBalance />
        <CardProfit />
      </div>
      <CardHoldings />

      <section>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
          바로가기
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{link.label}</span>
                <IconExternalLink size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{link.description}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
