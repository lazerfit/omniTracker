import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

import CardProfit from '../CardProfit';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  cleanup();
});

function makeProfitFetch(payload: object, status = 200) {
  return mock(() =>
    Promise.resolve(new Response(JSON.stringify(payload), { status })),
  );
}

describe('CardProfit', () => {
  it('shows "Loading..." initially', () => {
    global.fetch = mock(() => new Promise(() => {})) as unknown as typeof fetch;
    render(<CardProfit />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows profit value with "+" sign when positive', async () => {
    global.fetch = makeProfitFetch({
      profit: 1234.56,
      profitPct: 5.5,
      currency: 'USD',
      from: '2024-01-01',
      to: '2024-01-31',
    }) as unknown as typeof fetch;

    render(<CardProfit />);

    await waitFor(() => {
      const el = screen.getByText((content) => content.includes('+') && content.includes('1,234.56'));
      expect(el).toBeTruthy();
    });
  });

  it('shows profit value with red color class when negative', async () => {
    global.fetch = makeProfitFetch({
      profit: -500.0,
      profitPct: -2.3,
      currency: 'USD',
      from: '2024-01-01',
      to: '2024-01-31',
    }) as unknown as typeof fetch;

    render(<CardProfit />);

    await waitFor(() => {
      const el = screen.getByText((content) => content.includes('500.00'));
      expect(el.className).toContain('text-red-500');
    });
  });

  it('shows "No snapshot data yet" when profit is null', async () => {
    global.fetch = makeProfitFetch({
      profit: null,
      profitPct: null,
      currency: 'USD',
      from: '',
      to: '',
    }) as unknown as typeof fetch;

    render(<CardProfit />);

    await waitFor(() => {
      expect(screen.getByText('No snapshot data yet')).toBeTruthy();
    });
  });

  it('shows error message when fetch fails', async () => {
    global.fetch = makeProfitFetch({}, 500) as unknown as typeof fetch;

    render(<CardProfit />);

    await waitFor(() => {
      expect(screen.getByText('HTTP 500')).toBeTruthy();
    });
  });

  it('shows date range (from → to) when data is available', async () => {
    global.fetch = makeProfitFetch({
      profit: 100,
      profitPct: 1.0,
      currency: 'USD',
      from: '2024-01-01',
      to: '2024-01-31',
    }) as unknown as typeof fetch;

    render(<CardProfit />);

    await waitFor(() => {
      expect(screen.getByText('2024-01-01 → 2024-01-31')).toBeTruthy();
    });
  });
});
