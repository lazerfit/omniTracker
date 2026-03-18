import { createHmac } from 'crypto';

interface OkxAccountData {
  totalEq: string;
}

interface OkxAccountResponse {
  data: OkxAccountData[];
}

const PATH = '/api/v5/account/balance';

export async function getOkxBalance(apiKey: string, apiSecret: string): Promise<number> {
  const timestamp = new Date().toISOString();

  // OK-ACCESS-SIGN: Base64(HMAC-SHA256(timestamp + 'GET' + path, apiSecret))
  const prehash = `${timestamp}GET${PATH}`;
  const signature = createHmac('sha256', apiSecret).update(prehash).digest('base64');

  // TODO: add passphrase support — OKX requires OK-ACCESS-PASSPHRASE for funded accounts
  const response = await fetch(`https://www.okx.com${PATH}`, {
    headers: {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OKX API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as OkxAccountResponse;

  if (!data.data || data.data.length === 0) {
    return 0;
  }

  return parseFloat(data.data[0].totalEq);
}
