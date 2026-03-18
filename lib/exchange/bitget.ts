import { createHmac } from 'crypto';

interface BitgetAsset {
  coinName: string;
  available: string;
  frozen: string;
  locked: string;
  usdtValuation: string;
}

interface BitgetAccountResponse {
  data: BitgetAsset[];
}

const PATH = '/api/v2/spot/account/assets';

export async function getBitgetBalance(apiKey: string, apiSecret: string): Promise<number> {
  const timestamp = Date.now().toString();

  // ACCESS-SIGN: Base64(HMAC-SHA256(timestamp + 'GET' + path, apiSecret))
  const prehash = `${timestamp}GET${PATH}`;
  const signature = createHmac('sha256', apiSecret).update(prehash).digest('base64');

  // TODO: add passphrase support — Bitget requires ACCESS-PASSPHRASE for sub-accounts
  const response = await fetch(`https://api.bitget.com${PATH}`, {
    headers: {
      'ACCESS-KEY': apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bitget API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as BitgetAccountResponse;

  let total = 0;
  for (const asset of data.data) {
    total += parseFloat(asset.usdtValuation);
  }

  console.log('[Bitget]', {
    assets: data.data.map((a) => ({ coin: a.coinName, usdtValuation: `$${a.usdtValuation}` })),
    total: `$${total}`,
  });

  return total;
}
