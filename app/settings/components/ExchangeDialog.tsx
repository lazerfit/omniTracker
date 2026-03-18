'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '저장 중...' : '저장'}
    </Button>
  );
}

export const ExchangeDialog = ({ exchange }: ExchangeDialogProps) => {
  const [open, setOpen] = useState(false);

  const [, action] = useActionState(async (_: unknown, formData: FormData) => {
    const apiKey = formData.get('api-key') as string;
    const apiSecret = formData.get('api-secret') as string;
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
    }
  }, null);

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
        <form action={action}>
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
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
