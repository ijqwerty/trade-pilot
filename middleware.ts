import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { REQUEST_URL_HEADER, buildSignInRedirect } from "@/lib/auth/safe-next";

function isPublicAuthPath(pathname: string) {
    return (
        pathname === "/sign-in" ||
        pathname === "/sign-up" ||
        pathname.startsWith("/sign-in/") ||
        pathname.startsWith("/sign-up/")
    );
}

function nextWithRequestUrl(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(REQUEST_URL_HEADER, request.url);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    const { pathname } = request.nextUrl;

    if (!sessionCookie) {
        if (isPublicAuthPath(pathname)) {
            return nextWithRequestUrl(request);
        }

        const requested = `${pathname}${request.nextUrl.search}`;
        return NextResponse.redirect(new URL(buildSignInRedirect(requested), request.url));
    }

    return nextWithRequestUrl(request);
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
    ],
};
