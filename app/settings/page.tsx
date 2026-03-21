import Sidebar from './Sidebar';
import { SettingsTabValue } from './constants';
import ProfileSection from './sections/ProfileSection';
import ApiSection from './sections/ApiSection';
import StockSection from './sections/StockSection';

const SettingsPage = async ({ searchParams }: { searchParams: Promise<{ tab?: string }> }) => {
  const { tab } = await searchParams;
  const activeTab: SettingsTabValue = (tab as SettingsTabValue) || 'profile';

  return (
    <section className="flex h-full w-full items-center justify-center">
      <div className="flex h-full w-400 justify-center">
        <Sidebar activeTab={activeTab} />
        <div className="ml-4 h-full w-full rounded-xl border">
          <div className="px-8 py-4">
            <h2 className="mb-6 text-2xl font-bold capitalize">{activeTab} Settings</h2>
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'api' && <ApiSection />}
            {activeTab === 'stocks' && <StockSection />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
