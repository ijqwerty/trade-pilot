'use client';

import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import SelectField from '@/components/forms/SelectField';
import { CountrySelectField } from '@/components/forms/CountrySelectField';
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from '@/lib/constants';
import { updateMyProfile } from '@/lib/actions/profile.actions';
import { toast } from 'sonner';

type SettingsFormValues = UpdateMyProfileInput & {
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
  dailyNewsEmail: boolean;
  alertEmail: boolean;
  alertInApp: boolean;
};

const SettingsForm = ({ initialProfile }: { initialProfile: UserProfileData }) => {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    defaultValues: {
      country: initialProfile.country,
      investmentGoals: initialProfile.investmentGoals,
      riskTolerance: initialProfile.riskTolerance,
      preferredIndustry: initialProfile.preferredIndustry,
      dailyNewsEmail: initialProfile.dailyNewsEmail,
      alertEmail: initialProfile.alertEmail,
      alertInApp: initialProfile.alertInApp,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: SettingsFormValues) => {
    const result = await updateMyProfile(data);
    if (result.success) {
      toast.success('Settings saved');
    } else {
      toast.error('Could not save settings', { description: result.error });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-xl">
      <section className="space-y-5 rounded-lg border border-gray-600 bg-gray-800/40 p-6">
        <h2 className="text-lg font-semibold text-gray-100">Personalization</h2>

        <CountrySelectField
          name="country"
          label="Country"
          control={control}
          error={errors.country}
          required
        />

        <SelectField
          name="investmentGoals"
          label="Investment Goals"
          placeholder="Select your investment goal"
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required
        />

        <SelectField
          name="riskTolerance"
          label="Risk Tolerance"
          placeholder="Select your risk level"
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required
        />

        <SelectField
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select your preferred industry"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />
      </section>

      <section className="space-y-5 rounded-lg border border-gray-600 bg-gray-800/40 p-6">
        <h2 className="text-lg font-semibold text-gray-100">Notifications</h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="dailyNewsEmail" className="text-gray-200">
              Daily market news email
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Receive the daily digest at noon UTC with watchlist-aware headlines.
            </p>
          </div>
          <Controller
            name="dailyNewsEmail"
            control={control}
            render={({ field }) => (
              <Switch
                id="dailyNewsEmail"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="alertEmail" className="text-gray-200">
              Price alert emails
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Email when your price alerts trigger (when alerts are enabled).
            </p>
          </div>
          <Controller
            name="alertEmail"
            control={control}
            render={({ field }) => (
              <Switch
                id="alertEmail"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="alertInApp" className="text-gray-200">
              In-app alerts
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Show alert events in the notification bell.
            </p>
          </div>
          <Controller
            name="alertInApp"
            control={control}
            render={({ field }) => (
              <Switch
                id="alertInApp"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full sm:w-auto">
        {isSubmitting ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  );
};

export default SettingsForm;
