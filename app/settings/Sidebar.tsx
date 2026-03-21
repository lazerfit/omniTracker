'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { SettingsTabValue, SETTINGS_TABS } from './constants';

interface SidebarProps {
  activeTab: SettingsTabValue;
}

const Sidebar = ({ activeTab }: SidebarProps) => {
  const router = useRouter();

  return (
    <div className="h-full w-64 rounded-xl border p-4 md:pr-6">
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
  );
};

export default Sidebar;
