import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  useRouter: () => ({ push: mock(() => {}), replace: mock(() => {}) }),
}));

import SetupPage from '../page';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  cleanup();
});

describe('SetupPage', () => {
  beforeEach(() => {
    // Default: setup not done yet
    global.fetch = mock((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ done: false }), { status: 200 }));
    }) as unknown as typeof fetch;
  });

  it('renders the setup form', () => {
    render(<SetupPage />);
    expect(screen.getByText('Omni Tracker')).toBeTruthy();
    expect(screen.getByLabelText('사용자 이름')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호 확인')).toBeTruthy();
  });

  it('shows error when passwords do not match', async () => {
    render(<SetupPage />);

    fireEvent.change(screen.getByLabelText('사용자 이름'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: '계정 만들기' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeTruthy();
    });
  });

  it('shows error message from API on failure', async () => {
    global.fetch = mock((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve(
          new Response(JSON.stringify({ error: '비밀번호는 8자 이상이어야 합니다.' }), {
            status: 400,
          }),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ done: false }), { status: 200 }));
    }) as unknown as typeof fetch;

    render(<SetupPage />);

    fireEvent.change(screen.getByLabelText('사용자 이름'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '계정 만들기' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호는 8자 이상이어야 합니다.')).toBeTruthy();
    });
  });
});
