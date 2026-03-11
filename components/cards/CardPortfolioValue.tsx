import { Card, CardHeader, CardDescription, CardContent, CardTitle } from '../ui/card';

const CardPortfolioValue = () => {
  return (
    <Card className="w-70">
      <CardHeader>
        <CardTitle>Portfolio Value</CardTitle>
        <CardDescription>+10,000$</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
    </Card>
  );
};

export default CardPortfolioValue;
