'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import { upsertProfileOnSignUp } from "@/lib/actions/profile.actions";
import { touchLastSignedInAt } from "@/lib/profile/last-signed-in";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            const userId = response.user?.id;
            if (userId) {
                try {
                    await upsertProfileOnSignUp(userId, {
                        country,
                        investmentGoals,
                        riskTolerance,
                        preferredIndustry,
                    });
                } catch (profileErr) {
                    console.error('Sign up profile upsert failed', profileErr);
                }
            }

            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign up failed' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        const userId = response.user?.id;
        if (userId) {
            try {
                await touchLastSignedInAt(userId);
            } catch (touchErr) {
                console.error('Sign in lastSignedInAt update failed', touchErr);
            }
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}
