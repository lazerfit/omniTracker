import { decrypt } from '@/lib/crypto';
import { getDb } from '@/lib/db';
import { getBinanceBalance } from '@/lib/exchange/binance';
import { getBitgetBalance } from '@/lib/exchange/bitget';
import { getBybitBalance } from '@/lib/exchange/bybit';
import { getOkxBalance } from '@/lib/exchange/okx';

interface ExchangeKeyRow {
  id: number;
  exchange: string;
  api_key: string;
  api_secret: string;
  iv: string;
  auth_tag: string;
}

export async function takeSnapshot(): Promise<void> {
  const db = await getDb();

  const rows = db
    .query<
      ExchangeKeyRow,
      []
    >('SELECT id, exchange, api_key, api_secret, iv, auth_tag FROM exchange_keys')
    .all();

  const insertSnapshot = db.query<void, [string, number, string]>(
    `INSERT INTO portfolio_snapshots (exchange, total_value, currency) VALUES (?, ?, ?)`
  );

  for (const row of rows) {
    try {
      const ivObj = JSON.parse(row.iv) as { apiKey: string; apiSecret: string };
      const authTagObj = JSON.parse(row.auth_tag) as { apiKey: string; apiSecret: string };

      const apiKey = decrypt(row.api_key, ivObj.apiKey, authTagObj.apiKey);
      const apiSecret = decrypt(row.api_secret, ivObj.apiSecret, authTagObj.apiSecret);

      const exchange = row.exchange.toLowerCase();
      let totalValue: number;

      if (exchange === 'binance') {
        totalValue = await getBinanceBalance(apiKey, apiSecret);
      } else if (exchange === 'bybit') {
        totalValue = await getBybitBalance(apiKey, apiSecret);
      } else if (exchange === 'bitget') {
        totalValue = await getBitgetBalance(apiKey, apiSecret);
      } else if (exchange === 'okx') {
        totalValue = await getOkxBalance(apiKey, apiSecret);
      } else {
        console.warn(`[snapshot] Unrecognized exchange "${row.exchange}" (id=${row.id}), skipping`);
        continue;
      }

      insertSnapshot.run(row.exchange, totalValue, 'USD');
    } catch (err) {
      console.error(`[snapshot] Failed for exchange "${row.exchange}" (id=${row.id}):`, err);
    }
  }
}
