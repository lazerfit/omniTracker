'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StockDialogProps {
  mode?: 'add' | 'edit';
  initialData?: {
    id: number;
    ticker: string;
    name: string;
    shares: number;
    avgPrice: number | null;
  };
}

export const StockDialog = ({ mode = 'add', initialData }: StockDialogProps) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setPending(true);
    try {
      if (mode === 'edit' && initialData != null) {
        const shares = parseFloat(formData.get('shares') as string);
        const avgPriceRaw = formData.get('avg_price') as string;
        const avgPrice = avgPriceRaw !== '' ? parseFloat(avgPriceRaw) : null;

        const res = await fetch(`/api/stock-holdings/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shares, avg_price: avgPrice }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const ticker = formData.get('ticker') as string;
        const shares = parseFloat(formData.get('shares') as string);
        const avgPriceRaw = formData.get('avg_price') as string;
        const avgPrice = avgPriceRaw !== '' ? parseFloat(avgPriceRaw) : null;

        const res = await fetch('/api/stock-holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker, shares, avg_price: avgPrice }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  };

  const title = mode === 'edit' && initialData != null ? `${initialData.ticker} 수정` : '주식 종목 추가';
  const description =
    mode === 'edit'
      ? '수량과 매수 평균단가를 수정하세요.'
      : '티커와 수량을 입력하세요.\n국내주식: 005930.KS (KOSPI), 035420.KQ (KOSDAQ)\n해외주식: AAPL, TSLA';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'edit' ? (
          <Button variant="ghost" size="icon" aria-label="종목 수정">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            종목 추가
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription style={{ whiteSpace: 'pre-line' }}>{description}</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            {mode === 'add' ? (
              <Field>
                <Label htmlFor="ticker">티커 (Ticker)</Label>
                <Input
                  id="ticker"
                  name="ticker"
                  placeholder="예: AAPL, 005930.KS"
                  required
                />
              </Field>
            ) : (
              <Field>
                <Label>티커 (Ticker)</Label>
                <p className="text-sm font-medium">{initialData?.ticker}</p>
              </Field>
            )}
            <Field>
              <Label htmlFor="shares">수량</Label>
              <Input
                id="shares"
                name="shares"
                type="number"
                min="0"
                step="any"
                placeholder="보유 수량"
                defaultValue={initialData?.shares ?? ''}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="avg_price">매수 평균단가 (선택)</Label>
              <Input
                id="avg_price"
                name="avg_price"
                type="number"
                min="0"
                step="any"
                placeholder="예: 75000"
                defaultValue={initialData?.avgPrice ?? ''}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
