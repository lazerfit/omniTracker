'use client';

import { SettingsTabValue, SETTINGS_TABS } from './constants';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeTab: SettingsTabValue;
  onTabChange: (tab: SettingsTabValue) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const menuItems = SETTINGS_TABS;

  return (
    <div className="h-full w-64 rounded-xl border p-4 md:pr-6">
      <nav className="flex w-full flex-col gap-1">
        {menuItems.map((item) => (
          <Button
            key={item.value}
            className={activeTab === item.value ? 'bg-primary/10' : ''}
            variant={'ghost'}
            onClick={() => onTabChange(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
