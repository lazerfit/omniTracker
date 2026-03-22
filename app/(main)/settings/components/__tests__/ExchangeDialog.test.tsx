import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => '/',
}));

import { ExchangeDialog } from '../ExchangeDialog';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('ExchangeDialog', () => {
  it('renders trigger button with exchange name', () => {
    render(<ExchangeDialog exchange="Binance" />);
    expect(screen.getByText('Binance')).toBeTruthy();
  });

  it('opens dialog when trigger is clicked', async () => {
    render(<ExchangeDialog exchange="Binance" />);

    fireEvent.click(screen.getByText('Binance').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Binance API 설정')).toBeTruthy();
    });
  });

  it('submits correct payload to API', async () => {
    const successResponse = new Response(
      JSON.stringify({ id: 1, exchange: 'Binance', createdAt: '2024-01-01' }),
      { status: 201 },
    );
    const fetchMock = mock(() => Promise.resolve(successResponse));
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<ExchangeDialog exchange="Binance" />);
    fireEvent.click(screen.getByText('Binance').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Binance API 설정')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'test-key' },
    });
    fireEvent.change(screen.getByLabelText('Secret Key'), {
      target: { value: 'test-secret' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/exchange-keys');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      exchange: 'Binance',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    });
  });

  // Radix UI dialog close animation runs in happy-dom; set a longer per-test timeout.
  it(
    'closes dialog on successful submit',
    async () => {
      const successResponse = new Response(
        JSON.stringify({ id: 1, exchange: 'Binance', createdAt: '2024-01-01' }),
        { status: 201 },
      );
      global.fetch = mock(() => Promise.resolve(successResponse)) as unknown as typeof fetch;

      render(<ExchangeDialog exchange="Binance" />);
      fireEvent.click(screen.getByText('Binance').closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Binance API 설정')).toBeTruthy();
      });

      fireEvent.change(screen.getByLabelText('API Key'), {
        target: { value: 'test-key' },
      });
      fireEvent.change(screen.getByLabelText('Secret Key'), {
        target: { value: 'test-secret' },
      });

      fireEvent.click(screen.getByRole('button', { name: '저장' }));

      await waitFor(
        () => {
          expect(screen.queryByText('Binance API 설정')).toBeNull();
        },
        { timeout: 10000 },
      );
    },
    15000,
  );

  it('shows 저장 중... while pending', async () => {
    global.fetch = mock(() => new Promise(() => {})) as unknown as typeof fetch;

    render(<ExchangeDialog exchange="Binance" />);
    fireEvent.click(screen.getByText('Binance').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Binance API 설정')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'test-key' },
    });
    fireEvent.change(screen.getByLabelText('Secret Key'), {
      target: { value: 'test-secret' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(screen.getByText('저장 중...')).toBeTruthy();
    });
  });
});
