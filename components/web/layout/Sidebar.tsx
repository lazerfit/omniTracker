'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconChartBar,
  IconCurrencyBitcoin,
  IconAdjustments,
  IconSettings,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/stocks', label: 'Stocks', icon: IconChartBar },
  { href: '/crypto', label: 'Crypto', icon: IconCurrencyBitcoin },
  { href: '/rebalancing', label: 'Rebalancing', icon: IconAdjustments },
  { href: '/settings', label: 'Settings', icon: IconSettings },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

function NavItem({ href, label, icon: Icon }: NavItemProps) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2.5 transition-colors',
        isActive
          ? 'bg-primary/10 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
    >
      <Icon size={20} />
      <span className="text-xs">{label}</span>
    </Link>
  );
}

const Sidebar = () => {
  return (
    <aside className="hidden h-full w-50 flex-col items-center border-r p-4 lg:flex">
      <div className="mt-4 flex w-full flex-col gap-1">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
            <span className="text-background text-sm font-bold tracking-tight">OT</span>
          </div>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
