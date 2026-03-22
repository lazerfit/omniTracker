'use client';

import { useEffect, useState } from 'react';
import { IconBell } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    void fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setNotifications(data as Notification[]));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead() {
    await fetch('/api/notifications/read', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) void markRead(); }}>
      <DropdownMenuTrigger asChild>
        <button className="bg-background text-muted-foreground hover:text-foreground relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors">
          <IconBell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-white">
        <div className="border-b px-3 py-2 text-sm font-semibold">알림</div>
        {notifications.length === 0 ? (
          <p className="text-muted-foreground px-3 py-4 text-center text-sm">
            알림이 없습니다.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`border-b px-3 py-2.5 last:border-0 ${!n.read ? 'bg-blue-50/50' : ''}`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && (
                  <p className="text-muted-foreground mt-0.5 text-xs">{n.body}</p>
                )}
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {new Date(n.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
