import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

import CardHoldings from '../CardHoldings';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  cleanup();
});

function makeBalanceFetch(payload: object, status = 200) {
  return mock(() =>
    Promise.resolve(new Response(JSON.stringify(payload), { status })),
  );
}

const emptyResponse = { total: 0, exchanges: [], stocks: [] };

describe('CardHoldings', () => {
  it('shows "Loading..." initially', () => {
    global.fetch = mock(() => new Promise(() => {})) as unknown as typeof fetch;
    render(<CardHoldings />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows "보유 종목이 없습니다." when items are empty', async () => {
    global.fetch = makeBalanceFetch(emptyResponse) as unknown as typeof fetch;

    render(<CardHoldings />);

    await waitFor(() => {
      expect(screen.getByText('보유 종목이 없습니다.')).toBeTruthy();
    });
  });

  it('renders exchange balances as crypto items', async () => {
    global.fetch = makeBalanceFetch({
      total: 1000000,
      exchanges: [{ exchange: 'Binance', balanceKrw: 1000000 }],
      stocks: [],
    }) as unknown as typeof fetch;

    render(<CardHoldings />);

    await waitFor(() => {
      expect(screen.getByText('Binance')).toBeTruthy();
    });
  });

  it('renders stock holdings as stock items', async () => {
    global.fetch = makeBalanceFetch({
      total: 500000,
      exchanges: [],
      stocks: [{ ticker: 'AAPL', name: 'Apple Inc.', shares: 10, priceKrw: 50000, totalKrw: 500000 }],
    }) as unknown as typeof fetch;

    render(<CardHoldings />);

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeTruthy();
      expect(screen.getByText('Apple Inc.')).toBeTruthy();
    });
  });

  it('sorts items by amountKrw descending', async () => {
    global.fetch = makeBalanceFetch({
      total: 3000000,
      exchanges: [
        { exchange: 'Upbit', balanceKrw: 500000 },
        { exchange: 'Binance', balanceKrw: 2000000 },
      ],
      stocks: [],
    }) as unknown as typeof fetch;

    render(<CardHoldings />);

    await waitFor(() => {
      expect(screen.getByText('Binance')).toBeTruthy();
      expect(screen.getByText('Upbit')).toBeTruthy();
    });

    const allText = document.body.textContent ?? '';
    const binanceIdx = allText.indexOf('Binance');
    const upbitIdx = allText.indexOf('Upbit');
    expect(binanceIdx).toBeLessThan(upbitIdx);
  });

  it('shows percentage for each item', async () => {
    global.fetch = makeBalanceFetch({
      total: 1000000,
      exchanges: [{ exchange: 'Binance', balanceKrw: 1000000 }],
      stocks: [],
    }) as unknown as typeof fetch;

    render(<CardHoldings />);

    await waitFor(() => {
      expect(screen.getByText('100.0%')).toBeTruthy();
    });
  });

  it('shows error when fetch fails', async () => {
    global.fetch = makeBalanceFetch({}, 500) as unknown as typeof fetch;

    render(<CardHoldings />);

    await waitFor(() => {
      expect(screen.getByText('HTTP 500')).toBeTruthy();
    });
  });
});
