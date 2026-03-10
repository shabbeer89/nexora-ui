import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ADMIN_PATHS = ['/nexora/admin'];

function getTokenFromRequest(req: NextRequest): string | null {
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return req.cookies.get('auth_token')?.value || null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

function hasAdminScope(payload: Record<string, unknown>): boolean {
    const scopes = payload?.scopes ?? payload?.scope ?? [];
    if (Array.isArray(scopes)) return scopes.includes('admin');
    if (typeof scopes === 'string') return scopes.split(' ').includes('admin');
    return false;
}

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isAdminPath = PROTECTED_ADMIN_PATHS.some(p => pathname.startsWith(p));
    if (!isAdminPath) return NextResponse.next();

    const token = getTokenFromRequest(req);
    if (!token) {
        const loginUrl = new URL('/login', req.url); // CORRECTED PATH
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayload(token);
    if (!payload || !hasAdminScope(payload)) {
        const overviewUrl = new URL('/nexora/overview', req.url);
        overviewUrl.searchParams.set('error', 'insufficient_permissions');
        return NextResponse.redirect(overviewUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/nexora/admin/:path*'],
};
