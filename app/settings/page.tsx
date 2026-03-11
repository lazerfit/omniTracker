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
    <section className="flex h-full w-full justify-center border">
      <div className="flex h-full w-312 justify-between border md:w-full">
        <Sidebar activeTab={activeTab} onTabChange={handleActiveTab} />
        <div className="h-full w-232 border">
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
