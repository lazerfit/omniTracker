'use client';

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import { SettingsTabValue } from './constants';
import ProfileSection from './sections/ProfileSection';
import ApiSection from './sections/ApiSection';

const SETTINGS_VIEW: Record<SettingsTabValue, ReactNode> = {
  profile: <ProfileSection />,
  api: <ApiSection />,
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTabValue>('profile');

  const handleActiveTab = (tab: SettingsTabValue) => {
    setActiveTab(tab);
  };

  return (
    <section className="flex h-full w-full items-center justify-center">
      <div className="flex h-full w-400 justify-center">
        <Sidebar activeTab={activeTab} onTabChange={handleActiveTab} />
        <div className="ml-4 h-full w-full rounded-xl border">
          <div className="px-8 py-4">
            <h2 className="text-2xl font-bold capitalize">{activeTab} Settings</h2>
            {SETTINGS_VIEW[activeTab]}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
