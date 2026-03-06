import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PortfolioValue = () => {
  return (
    <Card className="w-[67%] border-none">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <div>Portfolio Value</div>
          <div>MENU</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-100 w-full">
        <div>GRAPH</div>
      </CardContent>
    </Card>
  );
};

export default PortfolioValue;
