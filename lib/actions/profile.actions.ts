'use server';

import { connectToDatabase } from '@/database/mongoose';
import { UserProfile } from '@/database/models/user-profile.model';
import { auth } from '@/lib/better-auth/auth';
import { buildDefaultProfileFields } from '@/lib/profile/defaults';
import { validateProfilePersonalization } from '@/lib/profile/validate';
import { headers } from 'next/headers';

async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

function mapProfile(doc: {
  userId: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
  dailyNewsEmail: boolean;
  alertEmail: boolean;
  alertInApp: boolean;
  lastSignedInAt?: Date | null;
}): UserProfileData {
  return {
    userId: String(doc.userId),
    country: String(doc.country),
    investmentGoals: String(doc.investmentGoals),
    riskTolerance: String(doc.riskTolerance),
    preferredIndustry: String(doc.preferredIndustry),
    dailyNewsEmail: doc.dailyNewsEmail !== false,
    alertEmail: doc.alertEmail !== false,
    alertInApp: doc.alertInApp !== false,
    ...(doc.lastSignedInAt ? { lastSignedInAt: doc.lastSignedInAt } : {}),
  };
}

export async function upsertProfileOnSignUp(
  userId: string,
  fields: {
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
  }
): Promise<void> {
  const validationError = validateProfilePersonalization(fields);
  if (validationError) {
    throw new Error(validationError);
  }

  await connectToDatabase();
  await UserProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        ...buildDefaultProfileFields(),
        country: fields.country.trim(),
        investmentGoals: fields.investmentGoals,
        riskTolerance: fields.riskTolerance,
        preferredIndustry: fields.preferredIndustry,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function getMyProfile(): Promise<
  { success: true; data: UserProfileData } | { success: false; error: string }
> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to view settings' };
  }

  try {
    await connectToDatabase();
    const doc = await UserProfile.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, ...buildDefaultProfileFields() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    if (!doc) {
      return { success: false, error: 'Failed to load profile' };
    }

    return {
      success: true,
      data: mapProfile({
        userId: String(doc.userId),
        country: String(doc.country),
        investmentGoals: String(doc.investmentGoals),
        riskTolerance: String(doc.riskTolerance),
        preferredIndustry: String(doc.preferredIndustry),
        dailyNewsEmail: doc.dailyNewsEmail,
        alertEmail: doc.alertEmail,
        alertInApp: doc.alertInApp,
        lastSignedInAt: doc.lastSignedInAt ?? null,
      }),
    };
  } catch (err) {
    console.error('getMyProfile error:', err);
    return { success: false, error: 'Failed to load profile' };
  }
}

export async function updateMyProfile(
  partial: UpdateMyProfileInput
): Promise<{ success: true; data: UserProfileData } | { success: false; error: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to update settings' };
  }

  const validationError = validateProfilePersonalization({
    country: partial.country,
    investmentGoals: partial.investmentGoals,
    riskTolerance: partial.riskTolerance,
    preferredIndustry: partial.preferredIndustry,
  });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const $set: Record<string, unknown> = {};
  if (partial.country !== undefined) $set.country = partial.country.trim();
  if (partial.investmentGoals !== undefined) $set.investmentGoals = partial.investmentGoals;
  if (partial.riskTolerance !== undefined) $set.riskTolerance = partial.riskTolerance;
  if (partial.preferredIndustry !== undefined) {
    $set.preferredIndustry = partial.preferredIndustry;
  }
  if (partial.dailyNewsEmail !== undefined) $set.dailyNewsEmail = partial.dailyNewsEmail;
  if (partial.alertEmail !== undefined) $set.alertEmail = partial.alertEmail;
  if (partial.alertInApp !== undefined) $set.alertInApp = partial.alertInApp;

  if (Object.keys($set).length === 0) {
    return { success: false, error: 'No fields to update' };
  }

  try {
    await connectToDatabase();
    const doc = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set,
        $setOnInsert: { userId, ...buildDefaultProfileFields() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    if (!doc) {
      return { success: false, error: 'Failed to update profile' };
    }

    return {
      success: true,
      data: mapProfile({
        userId: String(doc.userId),
        country: String(doc.country),
        investmentGoals: String(doc.investmentGoals),
        riskTolerance: String(doc.riskTolerance),
        preferredIndustry: String(doc.preferredIndustry),
        dailyNewsEmail: doc.dailyNewsEmail,
        alertEmail: doc.alertEmail,
        alertInApp: doc.alertInApp,
        lastSignedInAt: doc.lastSignedInAt ?? null,
      }),
    };
  } catch (err) {
    console.error('updateMyProfile error:', err);
    return { success: false, error: 'Failed to update profile' };
  }
}
