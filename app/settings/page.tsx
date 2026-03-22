import Sidebar from './Sidebar';
import { SettingsTabValue } from './constants';
import ProfileSection from './sections/ProfileSection';
import NotificationSection from './sections/NotificationSection';
import ApiSection from './sections/ApiSection';
import CryptoSection from './sections/CryptoSection';
import DataSection from './sections/DataSection';

const SettingsPage = async ({ searchParams }: { searchParams: Promise<{ tab?: string }> }) => {
  const { tab } = await searchParams;
  const activeTab: SettingsTabValue = (tab as SettingsTabValue) || 'profile';

  return (
    <section className="flex h-full w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-center">
      <Sidebar activeTab={activeTab} />
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border lg:h-full">
        <div className="px-4 py-4 md:px-8">
          <h2 className="mb-6 text-2xl font-bold capitalize">{activeTab} Settings</h2>
          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'notifications' && <NotificationSection />}
          {activeTab === 'api' && <ApiSection />}
          {activeTab === 'crypto' && <CryptoSection />}
          {activeTab === 'data' && <DataSection />}
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
