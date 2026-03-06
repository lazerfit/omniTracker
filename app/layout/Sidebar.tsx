import { IconHome } from '@tabler/icons-react';

const Sidebar = () => {
  return (
    <aside className="flex h-full w-20 items-baseline justify-center border p-4">
      <div className="flex flex-col">
        <button>Om</button>
        <div className="mt-12 flex flex-col items-center">
          <button className="cursor-pointer rounded-lg border px-4 py-2">
            <IconHome />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
