import CardBalance from '@/components/web/cards/CardBalance';
import CardProfit from '@/components/web/cards/CardProfit';

export default function Home() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardBalance />
        <CardProfit />
      </div>
    </div>
  );
}
