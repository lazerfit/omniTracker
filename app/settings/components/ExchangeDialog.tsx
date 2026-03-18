'use client';

import { useState } from 'react';

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
import { cn } from '@/lib/utils';

interface ExchangeDialogProps {
  exchange: string;
}

export const ExchangeDialog = ({ exchange }: ExchangeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const apiKey = data.get('api-key') as string;
    const apiSecret = data.get('api-secret') as string;

    setIsPending(true);
    try {
      const res = await fetch('/api/exchange-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange, apiKey, apiSecret }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={cn('h-auto w-full justify-between rounded-xl border p-4', 'hover:bg-accent')}
        >
          <span className="text-sm font-medium">{exchange}</span>
          <span className="text-muted-foreground text-xs">API 미설정</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{exchange} API 설정</DialogTitle>
            <DialogDescription>{exchange} API 키와 시크릿을 입력하세요.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" name="api-key" placeholder="API Key를 입력하세요" />
            </Field>
            <Field>
              <Label htmlFor="api-secret">Secret Key</Label>
              <Input
                id="api-secret"
                name="api-secret"
                type="password"
                placeholder="Secret Key를 입력하세요"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
