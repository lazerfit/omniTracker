import AvatarDropdown from '@/components/web/buttons/AvatarDropdown';
import { NotificationBell } from '@/components/web/layout/NotificationBell';
import { MobileNav } from '@/components/web/layout/MobileNav';

const Header = () => {
  return (
    <header className="h-14 w-full px-4 py-2 md:px-6">
      <div className="flex h-full w-full items-center justify-between">
        <MobileNav />
        <div className="ml-auto flex gap-2 rounded-full bg-card p-1">
          <NotificationBell />
          <AvatarDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
