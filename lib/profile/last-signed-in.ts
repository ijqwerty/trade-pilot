import { connectToDatabase } from '@/database/mongoose';
import { UserProfile } from '@/database/models/user-profile.model';
import { buildDefaultProfileFields } from '@/lib/profile/defaults';

function isSameUtcCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Updates lastSignedInAt at most once per UTC calendar day; creates a default profile if missing. */
export async function touchLastSignedInAt(userId: string): Promise<void> {
  await connectToDatabase();
  const now = new Date();
  const existing = await UserProfile.findOne({ userId }).select('lastSignedInAt').lean();

  if (!existing) {
    await UserProfile.create({
      userId,
      ...buildDefaultProfileFields(),
      lastSignedInAt: now,
    });
    return;
  }

  const last = existing.lastSignedInAt;
  if (last instanceof Date && isSameUtcCalendarDay(last, now)) {
    return;
  }

  await UserProfile.updateOne({ userId }, { $set: { lastSignedInAt: now } });
}
