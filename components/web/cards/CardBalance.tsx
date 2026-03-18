import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

const CardBalance = () => {
  return (
    <Card className="flex-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Total Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-xl font-bold tracking-tight">1,000,000,000</span>
        <span className="text-primary/80 ml-2 text-sm">KRW</span>
      </CardContent>
    </Card>
  );
};

export default CardBalance;
