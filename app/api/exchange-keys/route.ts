import { encrypt } from '@/lib/crypto';
import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface ExchangeKeyRow {
  id: number;
  exchange: string;
  created_at: string;
}

export function GET(): NextResponse {
  const db = getDb();
  const rows = db
    .query<ExchangeKeyRow, []>(
      'SELECT id, exchange, created_at FROM exchange_keys ORDER BY created_at DESC',
    )
    .all();

  const result = rows.map((row) => ({
    id: row.id,
    exchange: row.exchange,
    apiKey: '****',
    createdAt: row.created_at,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { exchange, apiKey, apiSecret } = body as {
    exchange?: string;
    apiKey?: string;
    apiSecret?: string;
  };

  if (!exchange || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'exchange, apiKey, and apiSecret are required' },
      { status: 400 },
    );
  }

  const encryptedApiKey = encrypt(apiKey);
  const encryptedApiSecret = encrypt(apiSecret);

  const iv = JSON.stringify({
    apiKey: encryptedApiKey.iv,
    apiSecret: encryptedApiSecret.iv,
  });

  const authTag = JSON.stringify({
    apiKey: encryptedApiKey.authTag,
    apiSecret: encryptedApiSecret.authTag,
  });

  const db = getDb();
  const result = db
    .query<{ id: number; created_at: string }, [string, string, string, string, string]>(
      `INSERT INTO exchange_keys (exchange, api_key, api_secret, iv, auth_tag)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, created_at`,
    )
    .get(exchange, encryptedApiKey.encrypted, encryptedApiSecret.encrypted, iv, authTag);

  return NextResponse.json(
    { id: result!.id, exchange, createdAt: result!.created_at },
    { status: 201 },
  );
}
