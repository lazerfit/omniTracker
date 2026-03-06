import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';

const MyAssets = () => {
  return (
    <Card className="w-[33%] border-none">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <div>My Assets </div>
          <div>MENU</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-100">Profits</CardContent>
    </Card>
  );
};

export default MyAssets;
