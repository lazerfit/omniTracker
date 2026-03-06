import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';

const MarketInsight = () => {
  return (
    <Card className="w-[33%] border-none">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <div>Market Insight </div>
          <div>MENU</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-100">Profits</CardContent>
    </Card>
  );
};

export default MarketInsight;
