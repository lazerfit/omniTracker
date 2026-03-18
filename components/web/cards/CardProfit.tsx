import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

const CardPortfolio = () => {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Profits</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-xl font-bold tracking-tight text-red-500">+1,000,000,000</span>
        <span className="text-primary/80 ml-2 text-sm">KRW</span>
      </CardContent>
    </Card>
  );
};

export default CardPortfolio;
