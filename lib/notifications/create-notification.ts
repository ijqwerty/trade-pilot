import { connectToDatabase } from '@/database/mongoose';
import { Notification } from '@/database/models/notification.model';

export function isSafeInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

/**
 * Server-only write helper for Inngest (and other server jobs).
 * Not a public client server action — call only from trusted server code.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ created: boolean; id?: string }> {
  const userId = input.userId?.trim();
  if (!userId) {
    throw new Error('createNotification requires userId');
  }

  const type = input.type?.trim();
  const title = input.title?.trim();
  const body = input.body?.trim();
  if (!type || !title || !body) {
    throw new Error('createNotification requires type, title, and body');
  }

  const symbol = input.symbol?.trim().toUpperCase() || undefined;
  const dedupeKey = input.dedupeKey?.trim() || undefined;

  let href: string | undefined;
  if (input.href != null && input.href !== '') {
    const candidate = input.href.trim();
    if (!isSafeInternalHref(candidate)) {
      throw new Error('createNotification href must be an in-app path starting with /');
    }
    href = candidate;
  }

  try {
    await connectToDatabase();
    const doc = await Notification.create({
      userId,
      type,
      title,
      body,
      ...(symbol ? { symbol } : {}),
      ...(href ? { href } : {}),
      ...(dedupeKey ? { dedupeKey } : {}),
      readAt: null,
      createdAt: new Date(),
    });

    return { created: true, id: String(doc._id) };
  } catch (err) {
    const isDuplicate =
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: number }).code === 11000;

    if (isDuplicate && dedupeKey) {
      return { created: false };
    }

    throw err;
  }
}
