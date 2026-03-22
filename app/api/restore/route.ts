import { getDb } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';

interface BackupExchangeKey {
  exchange: string;
  apiKey: string;
  apiSecret: string;
}

interface BackupStockHolding {
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number | null;
}

interface BackupCryptoHolding {
  symbol: string;
  name: string;
  amount: number;
  avgPrice: number | null;
}

interface BackupFile {
  version: number;
  exchangeKeys?: BackupExchangeKey[];
  stockHoldings?: BackupStockHolding[];
  cryptoHoldings?: BackupCryptoHolding[];
}

export async function POST(request: Request): Promise<NextResponse> {
  let backup: BackupFile;
  try {
    backup = (await request.json()) as BackupFile;
  } catch {
    return NextResponse.json({ error: '올바른 JSON 파일이 아닙니다.' }, { status: 400 });
  }

  if (backup.version !== 1) {
    return NextResponse.json({ error: '지원하지 않는 백업 버전입니다.' }, { status: 400 });
  }

  const db = await getDb();

  const results = { exchangeKeys: 0, stockHoldings: 0, cryptoHoldings: 0 };

  // Restore exchange keys (upsert by exchange name)
  for (const key of backup.exchangeKeys ?? []) {
    if (!key.exchange || !key.apiKey || !key.apiSecret) continue;
    const encKey = encrypt(key.apiKey);
    const encSecret = encrypt(key.apiSecret);
    const iv = JSON.stringify({ apiKey: encKey.iv, apiSecret: encSecret.iv });
    const authTag = JSON.stringify({ apiKey: encKey.authTag, apiSecret: encSecret.authTag });

    const existing = db
      .query<{ id: number }, [string]>('SELECT id FROM exchange_keys WHERE exchange = ?')
      .get(key.exchange);

    if (existing) {
      db.run(
        'UPDATE exchange_keys SET api_key = ?, api_secret = ?, iv = ?, auth_tag = ? WHERE exchange = ?',
        [encKey.encrypted, encSecret.encrypted, iv, authTag, key.exchange],
      );
    } else {
      db.run(
        'INSERT INTO exchange_keys (exchange, api_key, api_secret, iv, auth_tag) VALUES (?, ?, ?, ?, ?)',
        [key.exchange, encKey.encrypted, encSecret.encrypted, iv, authTag],
      );
    }
    results.exchangeKeys++;
  }

  // Restore stock holdings (upsert by ticker)
  for (const stock of backup.stockHoldings ?? []) {
    if (!stock.ticker || stock.shares == null) continue;
    const existing = db
      .query<{ id: number }, [string]>('SELECT id FROM stock_holdings WHERE ticker = ?')
      .get(stock.ticker.toUpperCase());

    if (existing) {
      db.run(
        'UPDATE stock_holdings SET name = ?, shares = ?, avg_price = ? WHERE ticker = ?',
        [stock.name ?? '', stock.shares, stock.avgPrice ?? null, stock.ticker.toUpperCase()],
      );
    } else {
      db.run(
        'INSERT INTO stock_holdings (ticker, name, shares, avg_price) VALUES (?, ?, ?, ?)',
        [stock.ticker.toUpperCase(), stock.name ?? '', stock.shares, stock.avgPrice ?? null],
      );
    }
    results.stockHoldings++;
  }

  // Restore crypto holdings (upsert by symbol)
  for (const crypto of backup.cryptoHoldings ?? []) {
    if (!crypto.symbol || crypto.amount == null) continue;
    const existing = db
      .query<{ id: number }, [string]>('SELECT id FROM crypto_holdings WHERE symbol = ?')
      .get(crypto.symbol.toUpperCase());

    if (existing) {
      db.run(
        'UPDATE crypto_holdings SET name = ?, amount = ?, avg_price = ? WHERE symbol = ?',
        [crypto.name ?? '', crypto.amount, crypto.avgPrice ?? null, crypto.symbol.toUpperCase()],
      );
    } else {
      db.run(
        'INSERT INTO crypto_holdings (symbol, name, amount, avg_price) VALUES (?, ?, ?, ?)',
        [crypto.symbol.toUpperCase(), crypto.name ?? '', crypto.amount, crypto.avgPrice ?? null],
      );
    }
    results.cryptoHoldings++;
  }

  return NextResponse.json({ ok: true, restored: results });
}
