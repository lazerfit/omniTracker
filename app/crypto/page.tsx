import { IconExternalLink } from '@tabler/icons-react';

import { cn } from '@/lib/utils';
import { getBtcEtfQuotes, getEthEtfQuotes } from '@/lib/crypto/etf';
import { getCryptoNews } from '@/lib/crypto/news';
import { getCoinPrices } from '@/lib/crypto/prices';
import type { EtfQuote } from '@/lib/crypto/etf';
import type { NewsItem } from '@/lib/crypto/news';
import type { CoinPrice } from '@/lib/crypto/prices';

function formatRelativeTime(pubDate: string): string {
  const now = Date.now();
  const then = new Date(pubDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

function EtfCard({ etf }: { etf: EtfQuote }) {
  const change = etf.changePercent;
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{etf.ticker}</span>
        <span
          className={cn('text-xs font-medium', change >= 0 ? 'text-green-500' : 'text-red-500')}
        >
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </span>
      </div>
      <p className="text-muted-foreground truncate text-xs">{etf.name}</p>
      <p className="mt-2 text-lg font-semibold">${etf.price.toFixed(2)}</p>
      <p className="text-muted-foreground text-xs">Vol {(etf.volume / 1e6).toFixed(1)}M</p>
    </div>
  );
}

export default async function CryptoPage() {
  const [pricesResult, newsResult, btcEtfResult, ethEtfResult] = await Promise.allSettled([
    getCoinPrices(),
    getCryptoNews(),
    getBtcEtfQuotes(),
    getEthEtfQuotes(),
  ]);

  const prices: CoinPrice[] = pricesResult.status === 'fulfilled' ? pricesResult.value : [];
  const news: NewsItem[] = newsResult.status === 'fulfilled' ? newsResult.value : [];
  const btcEtfs: EtfQuote[] = btcEtfResult.status === 'fulfilled' ? btcEtfResult.value : [];
  const ethEtfs: EtfQuote[] = ethEtfResult.status === 'fulfilled' ? ethEtfResult.value : [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Crypto</h1>

      {/* Section 1: 코인 시세 */}
      <section>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
          주요 코인 시세
        </h2>
        {pricesResult.status === 'rejected' ? (
          <p className="text-muted-foreground text-sm">데이터를 불러올 수 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {prices.map((coin) => {
              const change = coin.changePercent24h;
              return (
                <div key={coin.symbol} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{coin.symbol}</span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        change >= 0 ? 'text-green-500' : 'text-red-500',
                      )}
                    >
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{coin.name}</p>
                  <p className="mt-2 text-lg font-semibold">
                    $
                    {coin.price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Vol ${(coin.volume / 1e9).toFixed(2)}B
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: ETF */}
      <section>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
          ETF 시세
        </h2>
        <div className="flex flex-col gap-6">
          {/* BTC ETFs */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Bitcoin ETF</span>
              <a
                href="https://farside.co.uk/bitcoin-etf-flow-all-data/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
              >
                유출입 데이터 (FarSide)
                <IconExternalLink size={12} />
              </a>
            </div>
            {btcEtfResult.status === 'rejected' || btcEtfs.length === 0 ? (
              <p className="text-muted-foreground text-sm">데이터를 불러올 수 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {btcEtfs.map((etf) => (
                  <EtfCard key={etf.ticker} etf={etf} />
                ))}
              </div>
            )}
          </div>

          {/* ETH ETFs */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Ethereum ETF</span>
              <a
                href="https://farside.co.uk/ethereum-etf-flow-all-data/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
              >
                유출입 데이터 (FarSide)
                <IconExternalLink size={12} />
              </a>
            </div>
            {ethEtfResult.status === 'rejected' || ethEtfs.length === 0 ? (
              <p className="text-muted-foreground text-sm">데이터를 불러올 수 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {ethEtfs.map((etf) => (
                  <EtfCard key={etf.ticker} etf={etf} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: 뉴스 */}
      <section>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
          크립토 뉴스
        </h2>
        {newsResult.status === 'rejected' || news.length === 0 ? (
          <p className="text-muted-foreground text-sm">뉴스를 불러올 수 없습니다.</p>
        ) : (
          <div className="divide-y overflow-hidden rounded-xl border">
            {news.map((item) => (
              <div key={item.link} className="px-4 py-3 transition-colors hover:bg-muted/30">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {item.source} · {formatRelativeTime(item.pubDate)}
                      </p>
                    </div>
                    <IconExternalLink
                      className="text-muted-foreground mt-0.5 shrink-0"
                      size={14}
                    />
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
