'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  getMyNotifications,
  getMyUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/actions/notification.actions';

type ListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; items: AppNotification[] };

const NotificationBell = ({ initialUnreadCount }: NotificationBellProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [listState, setListState] = useState<ListState>({ status: 'idle' });
  const [markingAll, setMarkingAll] = useState(false);

  const refreshUnread = async () => {
    const count = await getMyUnreadCount();
    setUnreadCount(count);
  };

  const loadNotifications = async () => {
    setListState({ status: 'loading' });
    const result = await getMyNotifications();
    if (!result.success) {
      setListState({ status: 'error' });
      return;
    }
    setListState({ status: 'ready', items: result.data });
    await refreshUnread();
  };

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      await loadNotifications();
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount <= 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const result = await markAllNotificationsRead();
      if (result.success) {
        setUnreadCount(0);
        setListState((prev) =>
          prev.status === 'ready'
            ? {
                status: 'ready',
                items: prev.items.map((item) => ({
                  ...item,
                  readAt: item.readAt ?? new Date(),
                })),
              }
            : prev
        );
        await refreshUnread();
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (item: AppNotification) => {
    if (!item.readAt) {
      await markNotificationRead(item.id);
      setListState((prev) =>
        prev.status === 'ready'
          ? {
              status: 'ready',
              items: prev.items.map((row) =>
                row.id === item.id ? { ...row, readAt: new Date() } : row
              ),
            }
          : prev
      );
      await refreshUnread();
    }

    if (item.href) {
      setOpen(false);
      router.push(item.href);
    }
  };

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-[var(--briefing-slate)] hover:text-[var(--briefing-teal)]"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--briefing-clay)] px-1 text-[0.625rem] font-bold leading-none tracking-[0.06em] text-[#f7f2ee]">
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(100vw-2rem,22rem)] border-[color-mix(in_srgb,var(--briefing-ink)_14%,transparent)] bg-[#f7f8f8] p-0 text-[var(--briefing-slate)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--briefing-ink)_14%,transparent)] px-4 py-3">
          <h2 className="text-sm font-medium text-[var(--briefing-ink)]">Notifications</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={unreadCount <= 0 || markingAll}
            onClick={handleMarkAll}
            className="h-auto px-2 py-1 text-xs text-[var(--briefing-slate)] hover:text-[var(--briefing-teal)] disabled:opacity-40"
          >
            Mark all as read
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {listState.status === 'loading' || listState.status === 'idle' ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--briefing-slate)]" />
            </div>
          ) : null}

          {listState.status === 'error' ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--briefing-slate)]">
              {"Couldn't load notifications"}
            </p>
          ) : null}

          {listState.status === 'ready' && listState.items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-[var(--briefing-ink)]">No notifications yet</p>
              <p className="mt-1 text-xs text-[var(--briefing-slate)]">
                Price and volume alerts will show up here.
              </p>
            </div>
          ) : null}

          {listState.status === 'ready' && listState.items.length > 0 ? (
            <ul className="divide-y divide-[color-mix(in_srgb,var(--briefing-ink)_12%,transparent)]">
              {listState.items.map((item) => {
                const unread = !item.readAt;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--briefing-teal)_8%,transparent)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-sm font-medium ${
                            unread ? 'text-[var(--briefing-ink)]' : 'text-[var(--briefing-slate)]'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.symbol ? (
                          <span
                            className={`shrink-0 text-xs ${
                              unread ? 'text-[var(--briefing-clay)]' : 'text-[var(--briefing-slate)]'
                            }`}
                          >
                            {item.symbol}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`line-clamp-2 text-xs ${
                          unread ? 'text-[var(--briefing-slate)]' : 'text-[var(--briefing-slate)]'
                        }`}
                      >
                        {item.body}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
