import { decrypt } from '@/lib/crypto';
import { getDb } from '@/lib/db';
import { getBinanceBalance } from '@/lib/exchange/binance';
import { getBitgetBalance } from '@/lib/exchange/bitget';
import { getOkxBalance } from '@/lib/exchange/okx';
import { NextResponse } from 'next/server';

interface ExchangeKeyRow {
  id: number;
  exchange: string;
  api_key: string;
  api_secret: string;
  iv: string;
  auth_tag: string;
}

interface ExchangeBalance {
  exchange: string;
  balance: number;
  currency: string;
  error?: string;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();

  const rows = db
    .query<ExchangeKeyRow, []>(
      'SELECT id, exchange, api_key, api_secret, iv, auth_tag FROM exchange_keys',
    )
    .all();

  const results: ExchangeBalance[] = await Promise.all(
    rows.map(async (row) => {
      try {
        const ivObj = JSON.parse(row.iv) as { apiKey: string; apiSecret: string };
        const authTagObj = JSON.parse(row.auth_tag) as { apiKey: string; apiSecret: string };
        const apiKey = decrypt(row.api_key, ivObj.apiKey, authTagObj.apiKey);
        const apiSecret = decrypt(row.api_secret, ivObj.apiSecret, authTagObj.apiSecret);

        const exchange = row.exchange.toLowerCase();
        let balance: number;

        if (exchange === 'binance') {
          balance = await getBinanceBalance(apiKey, apiSecret);
        } else if (exchange === 'bitget') {
          balance = await getBitgetBalance(apiKey, apiSecret);
        } else if (exchange === 'okx') {
          balance = await getOkxBalance(apiKey, apiSecret);
        } else {
          return { exchange: row.exchange, balance: 0, currency: 'USD', error: 'Unsupported exchange' };
        }

        return { exchange: row.exchange, balance, currency: 'USD' };
      } catch (err) {
        return {
          exchange: row.exchange,
          balance: 0,
          currency: 'USD',
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }),
  );

  const total = results.reduce((sum, r) => sum + r.balance, 0);

  return NextResponse.json({ total, currency: 'USD', exchanges: results });
}
