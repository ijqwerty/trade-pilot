const DEFAULT_NEXT = '/';

export const REQUEST_URL_HEADER = 'x-url';

function decodeUntilStable(value: string, maxRounds = 5): string {
    let current = value;
    for (let i = 0; i < maxRounds; i++) {
        try {
            const decoded = decodeURIComponent(current);
            if (decoded === current) break;
            current = decoded;
        } catch {
            break;
        }
    }
    return current;
}

function pathnameOf(pathWithSearch: string): string {
    const q = pathWithSearch.indexOf('?');
    return q === -1 ? pathWithSearch : pathWithSearch.slice(0, q);
}

function isAuthReturnTarget(pathname: string): boolean {
    return (
        pathname === '/sign-in' ||
        pathname === '/sign-up' ||
        pathname.startsWith('/sign-in/') ||
        pathname.startsWith('/sign-up/')
    );
}

/** Same-origin internal path only. Unsafe or missing values become `/`. */
export function getSafeNextPath(raw: string | null | undefined): string {
    if (!raw) return DEFAULT_NEXT;

    const trimmed = raw.trim();
    if (!trimmed) return DEFAULT_NEXT;

    const withoutHash = trimmed.split('#')[0];
    const decoded = decodeUntilStable(withoutHash).replace(/\\/g, '/');

    if (!decoded.startsWith('/')) return DEFAULT_NEXT;
    if (decoded.startsWith('//')) return DEFAULT_NEXT;
    if (/https?:/i.test(decoded)) return DEFAULT_NEXT;
    if (isAuthReturnTarget(pathnameOf(decoded))) return DEFAULT_NEXT;

    return decoded;
}

export function buildSignInRedirect(nextPath?: string | null): string {
    const safe = getSafeNextPath(nextPath);
    if (safe === DEFAULT_NEXT) return '/sign-in';
    const params = new URLSearchParams();
    params.set('next', safe);
    return `/sign-in?${params.toString()}`;
}

function nextQueryFromUrlCandidate(candidate: string | null): string | null {
    if (!candidate) return null;
    try {
        const url = candidate.startsWith('http')
            ? new URL(candidate)
            : new URL(candidate, 'http://localhost');
        return url.searchParams.get('next');
    } catch {
        return null;
    }
}

export function getRequestedPathFromHeaders(headerList: Headers): string {
    const rawUrl = headerList.get(REQUEST_URL_HEADER);
    if (!rawUrl) return DEFAULT_NEXT;
    try {
        const url = new URL(rawUrl);
        return getSafeNextPath(`${url.pathname}${url.search}`);
    } catch {
        return DEFAULT_NEXT;
    }
}

/** Prefer `next` on the auth request URL; otherwise default `/`. */
export function getSafeNextFromAuthHeaders(headerList: Headers): string {
    const fromRequest = nextQueryFromUrlCandidate(headerList.get(REQUEST_URL_HEADER));
    if (fromRequest) return getSafeNextPath(fromRequest);

    const fromNextUrl = nextQueryFromUrlCandidate(headerList.get('next-url'));
    if (fromNextUrl) return getSafeNextPath(fromNextUrl);

    const fromReferer = nextQueryFromUrlCandidate(headerList.get('referer'));
    if (fromReferer) return getSafeNextPath(fromReferer);

    return DEFAULT_NEXT;
}
