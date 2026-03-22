import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

import { StockDialog } from '../StockDialog';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  cleanup();
});

describe('StockDialog — add mode', () => {
  it('renders "종목 추가" trigger button', () => {
    render(<StockDialog mode="add" />);
    expect(screen.getByRole('button', { name: '종목 추가' })).toBeTruthy();
  });

  it('opens dialog showing "주식 종목 추가" title when trigger is clicked', async () => {
    render(<StockDialog mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: '종목 추가' }));
    await waitFor(() => {
      expect(screen.getByText('주식 종목 추가')).toBeTruthy();
    });
  });

  it('submits POST to /api/stock-holdings with ticker, shares, avg_price', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 1 }), { status: 201 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<StockDialog mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: '종목 추가' }));

    await waitFor(() => {
      expect(screen.getByText('주식 종목 추가')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('티커 (Ticker)'), {
      target: { value: 'AAPL' },
    });
    fireEvent.change(screen.getByLabelText('수량'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText('매수 평균단가 (선택)'), {
      target: { value: '150' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/stock-holdings');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string);
    expect(body.ticker).toBe('AAPL');
    expect(body.shares).toBe(10);
    expect(body.avg_price).toBe(150);
  });

  it('shows "저장 중..." while pending', async () => {
    global.fetch = mock(() => new Promise(() => {})) as unknown as typeof fetch;

    render(<StockDialog mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: '종목 추가' }));

    await waitFor(() => {
      expect(screen.getByText('주식 종목 추가')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('티커 (Ticker)'), {
      target: { value: 'AAPL' },
    });
    fireEvent.change(screen.getByLabelText('수량'), {
      target: { value: '5' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(screen.getByText('저장 중...')).toBeTruthy();
    });
  });
});

describe('StockDialog — edit mode', () => {
  const editData = { id: 42, ticker: 'TSLA', name: 'Tesla', shares: 5, avgPrice: 200 };

  it('renders pencil icon button with aria-label "종목 수정"', () => {
    render(<StockDialog mode="edit" initialData={editData} />);
    expect(screen.getByRole('button', { name: '종목 수정' })).toBeTruthy();
  });

  it('opens dialog showing ticker in title', async () => {
    render(<StockDialog mode="edit" initialData={editData} />);
    fireEvent.click(screen.getByRole('button', { name: '종목 수정' }));
    await waitFor(() => {
      expect(screen.getByText('TSLA 수정')).toBeTruthy();
    });
  });

  it('submits PATCH to /api/stock-holdings/:id', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 42 }), { status: 200 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<StockDialog mode="edit" initialData={editData} />);
    fireEvent.click(screen.getByRole('button', { name: '종목 수정' }));

    await waitFor(() => {
      expect(screen.getByText('TSLA 수정')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/stock-holdings/42');
    expect(init.method).toBe('PATCH');
  });
});
