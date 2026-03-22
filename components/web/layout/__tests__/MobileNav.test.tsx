import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

mock.module('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

mock.module('next/link', () => ({
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

import { MobileNav } from '../MobileNav';

afterEach(() => {
  cleanup();
});

describe('MobileNav', () => {
  it('renders hamburger button with correct aria-label', () => {
    render(<MobileNav />);
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeTruthy();
  });

  it('opens sheet drawer when hamburger button is clicked and shows "Om" title', async () => {
    render(<MobileNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await waitFor(() => {
      expect(screen.getByText('Om')).toBeTruthy();
    });
  });

  it('shows all 5 nav items in the drawer after opening', async () => {
    render(<MobileNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeTruthy();
      expect(screen.getByText('Stocks')).toBeTruthy();
      expect(screen.getByText('Crypto')).toBeTruthy();
      expect(screen.getByText('Rebalancing')).toBeTruthy();
      expect(screen.getByText('Settings')).toBeTruthy();
    });
  });
});
