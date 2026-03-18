import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="flex h-full w-50 items-baseline justify-center border-r p-4">
      <div className="mt-4 flex flex-col">
        <button>Om</button>
        <div className="mt-12 flex flex-col items-center rounded-xl">
          <Link href={'/'} className={buttonVariants({ variant: 'ghost' })}>
            Dashboard
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
