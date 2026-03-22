'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconMenu2,
  IconLayoutDashboard,
  IconChartBar,
  IconCurrencyBitcoin,
  IconSettings,
  IconAdjustments,
} from '@tabler/icons-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/stocks', label: 'Stocks', icon: IconChartBar },
  { href: '/crypto', label: 'Crypto', icon: IconCurrencyBitcoin },
  { href: '/rebalancing', label: 'Rebalancing', icon: IconAdjustments },
  { href: '/settings', label: 'Settings', icon: IconSettings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-muted/50"
        aria-label="Open navigation menu"
      >
        <IconMenu2 size={20} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-4">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">Om</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
