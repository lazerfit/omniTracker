import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, mock } from 'bun:test';

// Must be declared before component import so the mock is in place when the
// module is first evaluated.
let currentPathname = '/';

mock.module('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push: mock(() => {}), refresh: mock(() => {}) }),
}));

mock.module('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import Sidebar from '../Sidebar';

afterEach(() => {
  currentPathname = '/';
  cleanup();
});

describe('Sidebar', () => {
  it('renders the "Om" brand text', () => {
    render(<Sidebar />);
    expect(screen.getByText('Om')).toBeTruthy();
  });

  it('renders all 5 nav items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Stocks')).toBeTruthy();
    expect(screen.getByText('Crypto')).toBeTruthy();
    expect(screen.getByText('Rebalancing')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('Dashboard item has active styling when pathname is "/"', () => {
    currentPathname = '/';
    render(<Sidebar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.className).toContain('bg-primary/10');
  });

  it('non-active items do not have active styling when pathname is "/"', () => {
    currentPathname = '/';
    render(<Sidebar />);
    const stocksLink = screen.getByText('Stocks').closest('a');
    expect(stocksLink?.className).not.toContain('bg-primary/10');
    expect(stocksLink?.className).toContain('text-muted-foreground');
  });

  it('Stocks item is active when pathname is "/stocks"', () => {
    currentPathname = '/stocks';
    render(<Sidebar />);
    const stocksLink = screen.getByText('Stocks').closest('a');
    expect(stocksLink?.className).toContain('bg-primary/10');
  });

  it('Dashboard item is not active when pathname is "/stocks"', () => {
    currentPathname = '/stocks';
    render(<Sidebar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.className).not.toContain('bg-primary/10');
  });
});
