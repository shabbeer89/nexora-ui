'use client';

import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    requiredRoles?: UserRole[];
    fallback?: React.ReactNode;
    redirectTo?: string;
}

/**
 * RoleGuard - Protects routes based on user role
 * 
 * Usage:
 *   <RoleGuard requiredRole="ADMIN">
 *     <AdminPage />
 *   </RoleGuard>
 * 
 *   <RoleGuard requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
 *     <ManagementPage />
 *   </RoleGuard>
 */
export function RoleGuard({
    children,
    requiredRole,
    requiredRoles,
    fallback,
    redirectTo
}: RoleGuardProps) {
    const router = useRouter();
    const { isAuthenticated, hasRole, hasAnyRole, role } = useAuth();

    // Not authenticated yet - show loading
    if (!isAuthenticated) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // Check role access
    let hasAccess = false;

    if (requiredRole) {
        hasAccess = hasRole(requiredRole);
    } else if (requiredRoles && requiredRoles.length > 0) {
        hasAccess = hasAnyRole(requiredRoles);
    } else {
        // No role requirement specified, allow access
        hasAccess = true;
    }

    if (!hasAccess) {
        // Redirect if specified
        if (redirectTo) {
            router.push(redirectTo);
            return null;
        }

        // Show fallback or default access denied
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-red-900/20 mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-slate-400 max-w-md">
                    You don't have permission to access this page.
                    {requiredRole && (
                        <span className="block mt-1 text-sm">
                            Required: <span className="text-yellow-500">{requiredRole}</span>
                            {role && <span> | Your role: <span className="text-blue-500">{role}</span></span>}
                        </span>
                    )}
                </p>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * AdminGuard - Shorthand for admin-only pages
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard requiredRole="ADMIN">
            {children}
        </RoleGuard>
    );
}

/**
 * SuperAdminGuard - Shorthand for super-admin-only pages
 */
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard requiredRole="SUPER_ADMIN">
            {children}
        </RoleGuard>
    );
}
