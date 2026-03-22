import React from 'react';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

import AvatarDropdown from '../AvatarDropdown';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  cleanup();
});

function makeProfileFetch(profile: { name: string; avatarUrl: string }) {
  return mock(() =>
    Promise.resolve(new Response(JSON.stringify(profile), { status: 200 })),
  );
}

describe('AvatarDropdown', () => {
  it('fetches /api/profile on mount', async () => {
    const fetchMock = makeProfileFetch({ name: 'Alice', avatarUrl: '' });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AvatarDropdown />);

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('/api/profile');
  });

  it('shows "U" as fallback initials when name is empty', async () => {
    global.fetch = makeProfileFetch({ name: '', avatarUrl: '' }) as unknown as typeof fetch;

    render(<AvatarDropdown />);

    await waitFor(() => {
      expect(screen.getByText('U')).toBeTruthy();
    });
  });

  it('shows first letter of name as initials when name is set', async () => {
    global.fetch = makeProfileFetch({ name: 'Kim', avatarUrl: '' }) as unknown as typeof fetch;

    render(<AvatarDropdown />);

    await waitFor(() => {
      expect(screen.getByText('K')).toBeTruthy();
    });
  });

  it('re-fetches profile when "profile-updated" event is dispatched', async () => {
    let callCount = 0;
    global.fetch = mock(() => {
      callCount += 1;
      const name = callCount === 1 ? 'Alice' : 'Bob';
      return Promise.resolve(new Response(JSON.stringify({ name, avatarUrl: '' }), { status: 200 }));
    }) as unknown as typeof fetch;

    render(<AvatarDropdown />);

    await waitFor(() => {
      expect(screen.getByText('A')).toBeTruthy();
    });

    act(() => {
      window.dispatchEvent(new Event('profile-updated'));
    });

    await waitFor(() => {
      expect(screen.getByText('B')).toBeTruthy();
    });
  });
});
