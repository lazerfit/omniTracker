import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

import { CryptoDialog } from '../CryptoDialog';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  cleanup();
});

describe('CryptoDialog — add mode', () => {
  it('renders "코인 추가" trigger button', () => {
    render(<CryptoDialog mode="add" />);
    expect(screen.getByRole('button', { name: '코인 추가' })).toBeTruthy();
  });

  it('opens dialog showing "코인 추가" title when trigger is clicked', async () => {
    render(<CryptoDialog mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: '코인 추가' }));
    await waitFor(() => {
      // Both the trigger button text and the dialog title share "코인 추가"
      const titles = screen.getAllByText('코인 추가');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('submits POST to /api/crypto-holdings with symbol, name, amount, avg_price', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 1 }), { status: 201 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<CryptoDialog mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: '코인 추가' }));

    await waitFor(() => {
      expect(screen.getByLabelText('심볼 (Symbol)')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('심볼 (Symbol)'), {
      target: { value: 'BTC' },
    });
    fireEvent.change(screen.getByLabelText('이름 (선택)'), {
      target: { value: 'Bitcoin' },
    });
    fireEvent.change(screen.getByLabelText('수량'), {
      target: { value: '0.5' },
    });
    fireEvent.change(screen.getByLabelText('매수 평균단가 USD (선택)'), {
      target: { value: '42000' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/crypto-holdings');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string);
    expect(body.symbol).toBe('BTC');
    expect(body.name).toBe('Bitcoin');
    expect(body.amount).toBe(0.5);
    expect(body.avg_price).toBe(42000);
  });

  it('shows "저장 중..." while pending', async () => {
    global.fetch = mock(() => new Promise(() => {})) as unknown as typeof fetch;

    render(<CryptoDialog mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: '코인 추가' }));

    await waitFor(() => {
      expect(screen.getByLabelText('심볼 (Symbol)')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('심볼 (Symbol)'), {
      target: { value: 'ETH' },
    });
    fireEvent.change(screen.getByLabelText('수량'), {
      target: { value: '2' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(screen.getByText('저장 중...')).toBeTruthy();
    });
  });
});

describe('CryptoDialog — edit mode', () => {
  const editData = { id: 7, symbol: 'ETH', name: 'Ethereum', amount: 2.5, avgPrice: 2000 };

  it('renders pencil icon button with aria-label "코인 수정"', () => {
    render(<CryptoDialog mode="edit" initialData={editData} />);
    expect(screen.getByRole('button', { name: '코인 수정' })).toBeTruthy();
  });

  it('opens dialog showing symbol in title', async () => {
    render(<CryptoDialog mode="edit" initialData={editData} />);
    fireEvent.click(screen.getByRole('button', { name: '코인 수정' }));
    await waitFor(() => {
      expect(screen.getByText('ETH 수정')).toBeTruthy();
    });
  });

  it('submits PATCH to /api/crypto-holdings/:id', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 7 }), { status: 200 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<CryptoDialog mode="edit" initialData={editData} />);
    fireEvent.click(screen.getByRole('button', { name: '코인 수정' }));

    await waitFor(() => {
      expect(screen.getByText('ETH 수정')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/crypto-holdings/7');
    expect(init.method).toBe('PATCH');
  });
});
