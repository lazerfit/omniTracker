'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SettingsTabValue, SETTINGS_TABS } from './constants';

interface SidebarProps {
  activeTab: SettingsTabValue;
}

const Sidebar = ({ activeTab }: SidebarProps) => {
  const router = useRouter();

  return (
    <div className="w-full lg:h-full lg:w-56">
      {/* Mobile: horizontal scrollable tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border p-2 lg:hidden">
        {SETTINGS_TABS.map((item) => (
          <Button
            key={item.value}
            variant="ghost"
            size="sm"
            className={cn('shrink-0', activeTab === item.value ? 'bg-primary/10' : '')}
            onClick={() => router.push(`?tab=${item.value}`)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden h-full rounded-xl border p-4 lg:block">
        <nav className="flex w-full flex-col gap-1">
          {SETTINGS_TABS.map((item) => (
            <Button
              key={item.value}
              className={activeTab === item.value ? 'bg-primary/10' : ''}
              variant="ghost"
              onClick={() => router.push(`?tab=${item.value}`)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
