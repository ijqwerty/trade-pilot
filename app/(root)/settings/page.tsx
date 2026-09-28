import SettingsForm from '@/components/settings/SettingsForm';
import { getMyProfile } from '@/lib/actions/profile.actions';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const result = await getMyProfile();

  if (!result.success) {
    redirect('/sign-in?next=/settings');
  }

  return (
    <div className="packet-page packet-page--narrow">
      <header className="packet-page-header">
        <div>
          <h1 className="packet-page-title">Settings</h1>
          <p className="packet-page-lede">
            Update your personalization and choose how TradePilot notifies you.
          </p>
        </div>
      </header>
      <SettingsForm initialProfile={result.data} />
    </div>
  );
}
