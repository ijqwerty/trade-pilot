'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import SelectField from '@/components/forms/SelectField';
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from '@/lib/constants';
import { CountrySelectField } from '@/components/forms/CountrySelectField';
import FooterLink from '@/components/forms/FooterLink';
import { signUpWithEmail } from '@/lib/actions/auth.actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Suspense, useState } from 'react';
import { getSafeNextPath } from '@/lib/auth/safe-next';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      country: 'US',
      investmentGoals: 'Growth',
      riskTolerance: 'Medium',
      preferredIndustry: 'Technology',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: SignUpFormData) => {
    setSubmitError(null);
    try {
      const result = await signUpWithEmail(data);
      if (result.success) {
        router.push(getSafeNextPath(searchParams.get('next')));
        return;
      }
      const message =
        ('error' in result && typeof result.error === 'string'
          ? result.error
          : null) ||
        'Could not create your account. Check your details and try again.';
      setSubmitError(message);
      toast.error('Sign up failed', { description: message });
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error
          ? e.message
          : 'Could not create your account. Please try again.';
      setSubmitError(message);
      toast.error('Sign up failed', { description: message });
    }
  };

  return (
    <>
      <h1 className="form-title">Create your account</h1>
      <p className="form-lede">
        Set up TradePilot once, then open your morning market briefing whenever
        you return.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className="form-section" aria-labelledby="account-heading">
          <h2 id="account-heading" className="form-section-label">
            Account
          </h2>

          <InputField
            name="fullName"
            label="Full Name"
            placeholder="Jane Investor"
            autoComplete="name"
            register={register}
            error={errors.fullName}
            validation={{
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Enter at least 2 characters',
              },
            }}
          />

          <InputField
            name="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            register={register}
            error={errors.email}
            validation={{
              required: 'Email is required',
              pattern: {
                value: EMAIL_PATTERN,
                message: 'Enter a valid email address',
              },
            }}
          />

          <InputField
            name="password"
            label="Password"
            placeholder="Create a password"
            type="password"
            autoComplete="new-password"
            register={register}
            error={errors.password}
            hint="Use at least 8 characters."
            validation={{
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            }}
          />
        </section>

        <section
          className="form-section"
          aria-labelledby="preferences-heading"
        >
          <h2 id="preferences-heading" className="form-section-label">
            Briefing preferences
          </h2>

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
            hint="Shapes how we frame watchlist and alert context for you."
          />

          <SelectField
            name="riskTolerance"
            label="Risk Tolerance"
            placeholder="Select your risk level"
            options={RISK_TOLERANCE_OPTIONS}
            control={control}
            error={errors.riskTolerance}
            required
            hint="Helps keep alert and digest language aligned with your comfort."
          />

          <SelectField
            name="preferredIndustry"
            label="Preferred Industry"
            placeholder="Select your preferred industry"
            options={PREFERRED_INDUSTRIES}
            control={control}
            error={errors.preferredIndustry}
            required
            hint="Used to bias starting suggestions toward sectors you follow."
          />
        </section>

        {submitError && (
          <p className="form-submit-error auth-actions" role="alert">
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn auth-actions w-full"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Open your briefing'}
        </Button>

        <FooterLink
          text="Already have an account?"
          linkText="Sign in"
          href="/sign-in"
        />
      </form>
    </>
  );
};

const SignUpPage = () => (
  <Suspense
    fallback={
      <>
        <h1 className="form-title">Create your account</h1>
        <p className="form-lede">Loading registration…</p>
      </>
    }
  >
    <SignUp />
  </Suspense>
);

export default SignUpPage;
