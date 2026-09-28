'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { signInWithEmail } from '@/lib/actions/auth.actions';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSafeNextPath } from '@/lib/auth/safe-next';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignIn = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: SignInFormData) => {
    setSubmitError(null);
    try {
      const result = await signInWithEmail(data);
      if (result.success) {
        router.push(getSafeNextPath(searchParams.get('next')));
        return;
      }
      const message =
        ('error' in result && typeof result.error === 'string'
          ? result.error
          : null) ||
        'Sign in failed. Check your email and password, then try again.';
      setSubmitError(message);
      toast.error('Sign in failed', { description: message });
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error ? e.message : 'Sign in failed. Please try again.';
      setSubmitError(message);
      toast.error('Sign in failed', { description: message });
    }
  };

  return (
    <>
      <h1 className="form-title">Welcome back</h1>
      <p className="form-lede">
        Sign in to open today&apos;s morning briefing and the symbols you follow.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="form-section" noValidate>
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
          placeholder="Enter your password"
          type="password"
          autoComplete="current-password"
          register={register}
          error={errors.password}
          validation={{
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          }}
        />

        {submitError && (
          <p className="form-submit-error" role="alert">
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <FooterLink
          text="Don't have an account?"
          linkText="Create an account"
          href="/sign-up"
        />
      </form>
    </>
  );
};

const SignInPage = () => (
  <Suspense
    fallback={
      <>
        <h1 className="form-title">Welcome back</h1>
        <p className="form-lede">Loading sign in…</p>
      </>
    }
  >
    <SignIn />
  </Suspense>
);

export default SignInPage;
