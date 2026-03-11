import { IconHome } from '@tabler/icons-react';

const Sidebar = () => {
  return (
    <aside className="flex h-full w-20 items-baseline justify-center p-4">
      <div className="mt-4 flex flex-col">
        <button>Om</button>
        <div className="bg-card mt-12 flex flex-col items-center rounded-xl">
          <button className="cursor-pointer rounded-lg px-4 py-2">
            <IconHome />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
