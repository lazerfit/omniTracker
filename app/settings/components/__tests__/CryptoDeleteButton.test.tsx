import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

const refreshMock = mock(() => {});

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: refreshMock }),
}));

import { CryptoDeleteButton } from '../CryptoDeleteButton';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  refreshMock.mockClear();
  cleanup();
});

describe('CryptoDeleteButton', () => {
  it('renders button with aria-label "코인 삭제"', () => {
    render(<CryptoDeleteButton id={1} />);
    expect(screen.getByRole('button', { name: '코인 삭제' })).toBeTruthy();
  });

  it('calls DELETE /api/crypto-holdings/:id on click', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(null, { status: 200 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<CryptoDeleteButton id={33} />);
    fireEvent.click(screen.getByRole('button', { name: '코인 삭제' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/crypto-holdings/33');
    expect(init.method).toBe('DELETE');
  });

  it('calls router.refresh() after successful delete', async () => {
    global.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 200 })),
    ) as unknown as typeof fetch;

    render(<CryptoDeleteButton id={12} />);
    fireEvent.click(screen.getByRole('button', { name: '코인 삭제' }));

    await waitFor(() => {
      expect(refreshMock.mock.calls.length).toBe(1);
    });
  });
});
