import Header from '@/components/web/layout/Header';
import Sidebar from '@/components/web/layout/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full">
      <Sidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Header />
        <main className="h-full w-full overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
