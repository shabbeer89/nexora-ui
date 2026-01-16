'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backend-api';
import { Users, Building2, FileText, TrendingUp, Bot, AlertTriangle } from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalOrganizations: number;
    totalBots: number;
    activeBots: number;
    totalTrades: number;
}

function AdminDashboardContent() {
    const { user, isSuperAdmin } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalOrganizations: 0,
        totalBots: 0,
        activeBots: 0,
        totalTrades: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Try to fetch admin stats, fall back to mock data
                const botsRes = await backendApi.get('/bots');
                const bots = botsRes.data || [];

                setStats({
                    totalUsers: 12,
                    activeUsers: 8,
                    totalOrganizations: 3,
                    totalBots: bots.length,
                    activeBots: bots.filter((b: any) => b.status === 'running').length,
                    totalTrades: 156
                });
            } catch (err) {
                console.error('Error fetching admin stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue', href: '/admin/users' },
        { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'green' },
        { label: 'Organizations', value: stats.totalOrganizations, icon: Building2, color: 'purple', href: '/admin/organizations' },
        { label: 'Total Bots', value: stats.totalBots, icon: Bot, color: 'yellow' },
        { label: 'Active Bots', value: stats.activeBots, icon: Bot, color: 'emerald' },
        { label: 'Total Trades', value: stats.totalTrades, icon: TrendingUp, color: 'cyan' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">
                    Welcome back, {user?.name}. Manage your platform here.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat) => {
                    const Card = (
                        <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {loading ? '...' : stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg bg-${stat.color}-900/20`}>
                                    <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                                </div>
                            </div>
                        </div>
                    );

                    return stat.href ? (
                        <Link key={stat.label} href={stat.href}>{Card}</Link>
                    ) : (
                        <div key={stat.label}>{Card}</div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/admin/users" className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="text-white">Manage Users</span>
                    </Link>
                    {isSuperAdmin && (
                        <Link href="/admin/organizations" className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                            <Building2 className="h-5 w-5 text-purple-500" />
                            <span className="text-white">Manage Organizations</span>
                        </Link>
                    )}
                    <Link href="/admin/audit-logs" className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                        <FileText className="h-5 w-5 text-green-500" />
                        <span className="text-white">View Audit Logs</span>
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Recent System Activity</h2>
                <div className="space-y-3">
                    {[
                        { action: 'User login', user: 'admin@example.com', time: '2 mins ago' },
                        { action: 'Bot deployed', user: 'trader@example.com', time: '15 mins ago' },
                        { action: 'Strategy created', user: 'trader@example.com', time: '1 hour ago' },
                        { action: 'Settings updated', user: 'admin@example.com', time: '3 hours ago' },
                    ].map((activity, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                            <div>
                                <p className="text-white">{activity.action}</p>
                                <p className="text-sm text-slate-400">{activity.user}</p>
                            </div>
                            <span className="text-sm text-slate-500">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <AdminGuard>
            <AdminDashboardContent />
        </AdminGuard>
    );
}
