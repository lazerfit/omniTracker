import SettingsSidebarButton from './components/SettingsSidebarButton';

const Sidebar = () => {
  return (
    <div className="h-full w-68 border">
      <div className="flex border">
        <SettingsSidebarButton>Profile setting</SettingsSidebarButton>
      </div>
    </div>
  );
};

export default Sidebar;
