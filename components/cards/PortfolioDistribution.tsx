import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';

const PortfolioDistribution = () => {
  return (
    <Card className="w-[33%] border-none">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <div>Portfolio Distribution</div>
          <div>MENU</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-100">Profits</CardContent>
    </Card>
  );
};

export default PortfolioDistribution;
