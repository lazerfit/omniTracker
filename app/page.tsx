import CardPortfolioValue from '@/components/cards/CardPortfolioValue';
import DashboardLayout from './layout/DashboardLayout';

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-4">
        <DashboardLayout
          left={<CardPortfolioValue />}
          main={<div className="border">main</div>}
          right={<CardPortfolioValue />}
        />
      </div>
      <div className="flex justify-between gap-4"></div>
    </div>
  );
}
