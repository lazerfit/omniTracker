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

interface CryptoDialogProps {
  mode?: 'add' | 'edit';
  initialData?: {
    id: number;
    symbol: string;
    name: string;
    amount: number;
    avgPrice: number | null;
  };
}

export const CryptoDialog = ({ mode = 'add', initialData }: CryptoDialogProps) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setPending(true);
    try {
      if (mode === 'edit' && initialData != null) {
        const amount = parseFloat(formData.get('amount') as string);
        const avgPriceRaw = formData.get('avg_price') as string;
        const avgPrice = avgPriceRaw !== '' ? parseFloat(avgPriceRaw) : null;

        const res = await fetch(`/api/crypto-holdings/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, avg_price: avgPrice }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const symbol = formData.get('symbol') as string;
        const name = formData.get('name') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const avgPriceRaw = formData.get('avg_price') as string;
        const avgPrice = avgPriceRaw !== '' ? parseFloat(avgPriceRaw) : null;

        const res = await fetch('/api/crypto-holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, name, amount, avg_price: avgPrice }),
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

  const title = mode === 'edit' && initialData != null ? `${initialData.symbol} 수정` : '코인 추가';
  const description =
    mode === 'edit'
      ? '수량과 매수 평균단가를 수정하세요.'
      : '심볼과 수량을 입력하세요.\n예: BTC, ETH, SOL, XRP';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'edit' ? (
          <Button variant="ghost" size="icon" aria-label="코인 수정">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            코인 추가
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
              <>
                <Field>
                  <Label htmlFor="symbol">심볼 (Symbol)</Label>
                  <Input id="symbol" name="symbol" placeholder="예: BTC, ETH, SOL" required />
                </Field>
                <Field>
                  <Label htmlFor="name">이름 (선택)</Label>
                  <Input id="name" name="name" placeholder="예: Bitcoin" />
                </Field>
              </>
            ) : (
              <Field>
                <Label>심볼 (Symbol)</Label>
                <p className="text-sm font-medium">{initialData?.symbol}</p>
              </Field>
            )}
            <Field>
              <Label htmlFor="amount">수량</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="any"
                placeholder="보유 수량"
                defaultValue={initialData?.amount ?? ''}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="avg_price">매수 평균단가 USD (선택)</Label>
              <Input
                id="avg_price"
                name="avg_price"
                type="number"
                min="0"
                step="any"
                placeholder="예: 42000"
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
