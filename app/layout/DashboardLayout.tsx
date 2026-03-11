import { ReactNode } from 'react';

interface DashBoardLayoutProps {
  left: ReactNode;
  main: ReactNode;
  right: ReactNode;
}

const DashboardLayout = ({ left, main, right }: DashBoardLayoutProps) => {
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_280px]">
      <div className="hidden flex-col lg:flex">{left}</div>
      <div className="w-full">{main}</div>
      <div className="hidden flex-col lg:flex">{right}</div>
    </div>
  );
};

export default DashboardLayout;
