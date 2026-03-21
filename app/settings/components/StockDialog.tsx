'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '저장 중...' : '저장'}
    </Button>
  );
}

export const StockDialog = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [, action] = useActionState(async (_: unknown, formData: FormData) => {
    const ticker = formData.get('ticker') as string;
    const shares = parseFloat(formData.get('shares') as string);

    try {
      const res = await fetch('/api/stock-holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, shares }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          종목 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form action={action}>
          <DialogHeader>
            <DialogTitle>주식 종목 추가</DialogTitle>
            <DialogDescription>
              보유 종목의 티커와 수량을 입력하세요. (예: AAPL, 005930.KS)
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <Label htmlFor="ticker">티커 (Ticker)</Label>
              <Input
                id="ticker"
                name="ticker"
                placeholder="예: AAPL, 005930.KS"
                required
              />
            </Field>
            <Field>
              <Label htmlFor="shares">수량</Label>
              <Input
                id="shares"
                name="shares"
                type="number"
                min="0"
                step="any"
                placeholder="보유 수량"
                required
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
