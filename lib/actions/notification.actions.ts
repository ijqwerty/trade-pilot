'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Notification } from '@/database/models/notification.model';
import { auth } from '@/lib/better-auth/auth';
import { isSafeInternalHref } from '@/lib/notifications/create-notification';
import { headers } from 'next/headers';

async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

function mapNotification(item: {
  _id: unknown;
  userId: string;
  type: string;
  title: string;
  body: string;
  symbol?: string | null;
  href?: string | null;
  readAt?: Date | null;
  createdAt: Date;
  dedupeKey?: string | null;
}): AppNotification {
  const href =
    item.href && isSafeInternalHref(String(item.href)) ? String(item.href) : undefined;

  return {
    id: String(item._id),
    userId: String(item.userId),
    type: String(item.type),
    title: String(item.title),
    body: String(item.body),
    ...(item.symbol ? { symbol: String(item.symbol) } : {}),
    ...(href ? { href } : {}),
    readAt: item.readAt ?? null,
    createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
    ...(item.dedupeKey ? { dedupeKey: String(item.dedupeKey) } : {}),
  };
}

export async function getMyNotifications(): Promise<
  { success: true; data: AppNotification[] } | { success: false; error: string }
> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to view notifications' };
  }

  try {
    await connectToDatabase();
    const items = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      success: true,
      data: items.map((item) =>
        mapNotification({
          _id: item._id,
          userId: String(item.userId),
          type: String(item.type),
          title: String(item.title),
          body: String(item.body),
          symbol: item.symbol,
          href: item.href,
          readAt: item.readAt ?? null,
          createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
          dedupeKey: item.dedupeKey,
        })
      ),
    };
  } catch (err) {
    console.error('getMyNotifications error:', err);
    return { success: false, error: 'Failed to load notifications' };
  }
}

export async function getMyUnreadCount(): Promise<number> {
  const userId = await getSessionUserId();
  if (!userId) return 0;

  try {
    await connectToDatabase();
    return await Notification.countDocuments({
      userId,
      $or: [{ readAt: null }, { readAt: { $exists: false } }],
    });
  } catch (err) {
    console.error('getMyUnreadCount error:', err);
    return 0;
  }
}

export async function markNotificationRead(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to update notifications' };
  }

  const notificationId = id?.trim();
  if (!notificationId) {
    return { success: false, error: 'Notification id is required' };
  }

  try {
    await connectToDatabase();
    await Notification.updateOne(
      { _id: notificationId, userId, $or: [{ readAt: null }, { readAt: { $exists: false } }] },
      { $set: { readAt: new Date() } }
    );
    return { success: true };
  } catch (err) {
    console.error('markNotificationRead error:', err);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

export async function markAllNotificationsRead(): Promise<
  { success: true } | { success: false; error: string }
> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to update notifications' };
  }

  try {
    await connectToDatabase();
    await Notification.updateMany(
      { userId, $or: [{ readAt: null }, { readAt: { $exists: false } }] },
      { $set: { readAt: new Date() } }
    );
    return { success: true };
  } catch (err) {
    console.error('markAllNotificationsRead error:', err);
    return { success: false, error: 'Failed to mark notifications as read' };
  }
}
