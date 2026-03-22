'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

interface NotificationItem {
  key: string;
  label: string;
  description: string;
}

const NOTIFICATION_ITEMS: NotificationItem[] = [
  { key: 'priceAlert', label: '가격 알림', description: '보유 자산 가격 변동 시 알림' },
  { key: 'dailyReport', label: '일일 리포트', description: '매일 포트폴리오 요약 리포트' },
  { key: 'newsAlert', label: '뉴스 알림', description: '주요 크립토/주식 뉴스 알림' },
  { key: 'tradeAlert', label: '거래 체결', description: '거래 체결 및 잔고 변동 알림' },
];

type NotificationState = Record<string, boolean>;

const NotificationSection = () => {
  const [states, setStates] = useState<NotificationState>(
    Object.fromEntries(NOTIFICATION_ITEMS.map((item) => [item.key, false])),
  );

  const handleChange = (key: string, value: boolean) => {
    setStates((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="divide-y rounded-xl border px-4">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
            <Switch
              checked={states[item.key]}
              onCheckedChange={(v) => handleChange(item.key, v)}
            />
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-4 text-xs">알림 기능은 추후 업데이트 예정입니다.</p>
    </div>
  );
};

export default NotificationSection;
