import SettingsForm from '@/components/settings/SettingsForm';
import { getMyProfile } from '@/lib/actions/profile.actions';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const result = await getMyProfile();

  if (!result.success) {
    redirect('/sign-in?next=/settings');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Settings</h1>
        <p className="text-gray-500 mt-2">
          Update your personalization and choose how TradePilot notifies you.
        </p>
      </div>
      <SettingsForm initialProfile={result.data} />
    </div>
  );
}
