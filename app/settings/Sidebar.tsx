'use client';

import SettingsSidebarButton from './components/SettingsSidebarButton';
import { SettingsTabValue, SETTINGS_TABS } from './constants';

interface SidebarProps {
  activeTab: SettingsTabValue;
  onTabChange: (tab: SettingsTabValue) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const menuItems = SETTINGS_TABS;

  return (
    <div className="h-full w-64 border-r p-4 md:pr-6">
      <nav className="flex w-full flex-col gap-1">
        {menuItems.map((item) => (
          <SettingsSidebarButton
            key={item.value}
            onClick={() => onTabChange(item.value)}
            className={activeTab === item.value ? 'bg-accent' : ''}
          >
            {item.label}
          </SettingsSidebarButton>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
