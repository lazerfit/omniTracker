'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CryptoDeleteButtonProps {
  id: number;
}

export const CryptoDeleteButton = ({ id }: CryptoDeleteButtonProps) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/crypto-holdings/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="코인 삭제">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};
