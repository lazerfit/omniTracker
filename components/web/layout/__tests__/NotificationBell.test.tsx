import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

import { NotificationBell } from '../NotificationBell';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  cleanup();
});

function makeNotificationsFetch(notifications: object[]) {
  return mock(() =>
    Promise.resolve(new Response(JSON.stringify(notifications), { status: 200 })),
  );
}

// Radix DropdownMenu requires pointerdown before click to open in happy-dom
function openDropdown(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger);
  fireEvent.click(trigger);
}

describe('NotificationBell', () => {
  it('fetches /api/notifications on mount', async () => {
    const fetchMock = makeNotificationsFetch([]);
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<NotificationBell />);

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('/api/notifications');
  });

  it('shows no badge when there are no unread notifications', async () => {
    global.fetch = makeNotificationsFetch([
      { id: 1, title: 'Read', body: '', read: true, createdAt: '2024-01-01T00:00:00Z' },
    ]) as unknown as typeof fetch;

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.queryByText('1')).toBeNull();
    });
  });

  it('shows unread count badge when there are unread notifications', async () => {
    global.fetch = makeNotificationsFetch([
      { id: 1, title: 'Unread 1', body: '', read: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 2, title: 'Unread 2', body: '', read: false, createdAt: '2024-01-01T00:00:00Z' },
    ]) as unknown as typeof fetch;

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('shows "9+" when unread count exceeds 9', async () => {
    const notifications = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      title: `Notification ${i + 1}`,
      body: '',
      read: false,
      createdAt: '2024-01-01T00:00:00Z',
    }));
    global.fetch = makeNotificationsFetch(notifications) as unknown as typeof fetch;

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('9+')).toBeTruthy();
    });
  });

  it('calls PATCH /api/notifications/read when dropdown is opened', async () => {
    const calls: [string, RequestInit?][] = [];
    global.fetch = mock((url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return Promise.resolve(new Response(
        JSON.stringify(init?.method === 'PATCH' ? null : [
          { id: 1, title: 'Test', body: '', read: false, createdAt: '2024-01-01T00:00:00Z' },
        ]),
        { status: 200 },
      ));
    }) as unknown as typeof fetch;

    render(<NotificationBell />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByText('1')).toBeTruthy();
    });

    openDropdown(screen.getByRole('button'));

    await waitFor(() => {
      const patchCall = calls.find(([, init]) => init?.method === 'PATCH');
      expect(patchCall).toBeTruthy();
      expect(patchCall![0]).toBe('/api/notifications/read');
    });
  });

  it('shows "알림이 없습니다." when notifications array is empty', async () => {
    global.fetch = makeNotificationsFetch([]) as unknown as typeof fetch;

    render(<NotificationBell />);

    openDropdown(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('알림이 없습니다.')).toBeTruthy();
    });
  });

  it('shows notification titles when there are notifications', async () => {
    global.fetch = makeNotificationsFetch([
      { id: 1, title: '비트코인 급등', body: 'BTC +10%', read: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 2, title: '이더리움 알림', body: 'ETH 변동', read: true, createdAt: '2024-01-02T00:00:00Z' },
    ]) as unknown as typeof fetch;

    render(<NotificationBell />);

    openDropdown(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('비트코인 급등')).toBeTruthy();
      expect(screen.getByText('이더리움 알림')).toBeTruthy();
    });
  });
});
