import { getDb } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';

interface ExchangeKeyRow {
  exchange: string;
  api_key: string;
  api_secret: string;
  iv: string;
  auth_tag: string;
}

interface StockRow {
  ticker: string;
  name: string;
  shares: number;
  avg_price: number | null;
}

interface CryptoRow {
  symbol: string;
  name: string;
  amount: number;
  avg_price: number | null;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();

  const exchangeRows = db
    .query<ExchangeKeyRow, []>('SELECT exchange, api_key, api_secret, iv, auth_tag FROM exchange_keys')
    .all();

  const exchangeKeys = exchangeRows.map((row) => {
    const ivObj = JSON.parse(row.iv) as { apiKey: string; apiSecret: string };
    const authTagObj = JSON.parse(row.auth_tag) as { apiKey: string; apiSecret: string };
    return {
      exchange: row.exchange,
      apiKey: decrypt(row.api_key, ivObj.apiKey, authTagObj.apiKey),
      apiSecret: decrypt(row.api_secret, ivObj.apiSecret, authTagObj.apiSecret),
    };
  });

  const stockHoldings = db
    .query<StockRow, []>('SELECT ticker, name, shares, avg_price FROM stock_holdings')
    .all()
    .map((r) => ({ ticker: r.ticker, name: r.name, shares: r.shares, avgPrice: r.avg_price }));

  const cryptoHoldings = db
    .query<CryptoRow, []>('SELECT symbol, name, amount, avg_price FROM crypto_holdings')
    .all()
    .map((r) => ({ symbol: r.symbol, name: r.name, amount: r.amount, avgPrice: r.avg_price }));

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    exchangeKeys,
    stockHoldings,
    cryptoHoldings,
  };

  const filename = `omnitracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
