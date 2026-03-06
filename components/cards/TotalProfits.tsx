import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';

const TotalProfits = () => {
  return (
    <Card className="w-[33%] border-none">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <div>Total Profits</div>
          <div>MENU</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-100">Profits</CardContent>
    </Card>
  );
};

export default TotalProfits;
