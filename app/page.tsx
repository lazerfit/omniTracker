import MarketInsight from '@/components/cards/MarketInsight';
import MyAssets from '@/components/cards/MyAssets';
import PortfolioDistribution from '@/components/cards/PortfolioDistribution';
import PortfileValue from '@/components/cards/PortfolioValue';
import TotalProfits from '@/components/cards/TotalProfits';

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-4">
        <PortfileValue />
        <TotalProfits />
      </div>
      <div className="flex justify-between gap-4">
        <PortfolioDistribution />
        <MyAssets />
        <MarketInsight />
      </div>
    </div>
  );
}
