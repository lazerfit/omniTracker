import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

import NotificationSection from '../NotificationSection';

afterEach(() => {
  cleanup();
});

describe('NotificationSection', () => {
  it('renders all 4 notification items', () => {
    render(<NotificationSection />);
    expect(screen.getByText('가격 알림')).toBeTruthy();
    expect(screen.getByText('일일 리포트')).toBeTruthy();
    expect(screen.getByText('뉴스 알림')).toBeTruthy();
    expect(screen.getByText('거래 체결')).toBeTruthy();
  });

  it('all switches are initially off (unchecked)', () => {
    render(<NotificationSection />);
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(4);
    for (const sw of switches) {
      expect(sw.getAttribute('aria-checked')).toBe('false');
    }
  });

  it('toggling a switch changes its checked state', async () => {
    render(<NotificationSection />);
    const switches = screen.getAllByRole('switch');
    const firstSwitch = switches[0];

    expect(firstSwitch.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(firstSwitch);

    await waitFor(() => {
      expect(firstSwitch.getAttribute('aria-checked')).toBe('true');
    });
  });

  it('shows the upcoming feature notice', () => {
    render(<NotificationSection />);
    expect(screen.getByText('알림 기능은 추후 업데이트 예정입니다.')).toBeTruthy();
  });
});
