'use server';

import { connectToDatabase } from '@/database/mongoose';
import { UserProfile } from '@/database/models/user-profile.model';

export const getAllUsersForNewsEmail = async (): Promise<UserForNewsEmail[]> => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Mongoose connection not connected');

    const users = await db
      .collection('user')
      .find(
        { email: { $exists: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1 } }
      )
      .toArray();

    const eligibleAuthUsers = users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: (user.id as string) || user._id?.toString() || '',
        email: user.email as string,
        name: user.name as string,
      }))
      .filter((user) => user.id && user.email);

    if (eligibleAuthUsers.length === 0) return [];

    const userIds = eligibleAuthUsers.map((u) => u.id);
    const optedOutProfiles = await UserProfile.find({
      userId: { $in: userIds },
      dailyNewsEmail: false,
    })
      .select('userId')
      .lean();

    const optedOutIds = new Set(optedOutProfiles.map((p) => String(p.userId)));

    return eligibleAuthUsers.filter((user) => !optedOutIds.has(user.id));
  } catch (e) {
    console.error('Error fetching users for news email:', e);
    return [];
  }
};
