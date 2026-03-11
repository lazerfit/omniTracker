import { IconBell } from '@tabler/icons-react';
import AvatarDropdown from '@/components/buttons/AvatarDropdown';

const Header = () => {
  return (
    <header className="h-14 w-full p-8 py-10">
      <div className="flex h-full w-full flex-1 items-center justify-end">
        <div className="bg-card flex gap-2 rounded-full p-1">
          <button className="bg-background flex h-8 w-8 items-center justify-center rounded-full">
            <IconBell />
          </button>
          <AvatarDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
