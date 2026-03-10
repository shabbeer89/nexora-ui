'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Filter, UserPlus, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NexoraUser {
    username: string;
    email?: string;
    full_name?: string;
    disabled?: boolean;
    scopes: string[];
    role?: string;
}

function getRoleLabel(user: NexoraUser): string {
    if (user.scopes?.includes('admin')) return 'SUPER_ADMIN';
    if (user.scopes?.includes('write')) return 'TRADER';
    if (user.scopes?.includes('read')) return 'ANALYST';
    if (user.role) return user.role.toUpperCase();
    return 'USER';
}

export default function NexoraUsersPage() {
    const [users, setUsers] = useState<NexoraUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Try /api/admin/users first, fallback to /api/auth/me (single user)
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : data.users || [];
                setUsers(list);
            } else if (res.status === 404) {
                // Admin users endpoint not implemented — show current user only
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const me = await meRes.json();
                    setUsers([me]);
                } else {
                    throw new Error('Could not fetch user data');
                }
            } else {
                throw new Error(`API error ${res.status}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filtered = users.filter(u =>
        !search ||
        (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* User Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" />
                        Identity Matrix <span className="text-indigo-500 font-mono text-sm not-italic ml-2">// USER REGISTRY</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Live personnel clearance and access privilege management
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all disabled:opacity-50"
                        aria-label="Refresh users"
                    >
                        <RefreshCw className={cn('w-4 h-4 text-slate-400', loading && 'animate-spin')} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                        <UserPlus className="w-4 h-4" />
                        Authorize New Identity
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        id="user-search"
                        aria-label="Search users"
                        placeholder="Scan Identities by Username, Email, or Role..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[11px] font-black text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all uppercase tracking-widest"
                    />
                </div>
                <button aria-label="Filter options" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-slate-400">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-rose-400">Failed to load users</div>
                        <div className="text-xs text-rose-300/70">{error}</div>
                    </div>
                    <button onClick={fetchUsers} className="ml-auto px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-bold text-rose-400 transition-colors">
                        Retry
                    </button>
                </div>
            )}

            {/* Matrix Table */}
            <div className="bg-[#0b1120]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-600">
                        <Users className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm font-black uppercase tracking-widest">
                            {search ? 'No users match your search' : 'No users found'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Personnel Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Clearance Level</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Permissions</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Matrix Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filtered.map((user, i) => (
                                    <tr key={user.username || i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white uppercase tracking-tight">
                                                        {user.full_name || user.username}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-500">{user.email || user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                                {getRoleLabel(user)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex gap-1 flex-wrap">
                                                {(user.scopes || []).map(scope => (
                                                    <span key={scope} className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[8px] font-black text-cyan-400 uppercase">
                                                        {scope}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={cn('w-1.5 h-1.5 rounded-full', user.disabled ? 'bg-slate-700' : 'bg-emerald-500 animate-pulse')}></div>
                                                <span className={cn('text-[10px] font-black uppercase tracking-widest', user.disabled ? 'text-slate-600' : 'text-emerald-500')}>
                                                    {user.disabled ? 'Disabled' : 'Active'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button aria-label={`Manage ${user.username}`} className="p-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                                <Shield className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="text-[9px] font-mono text-slate-700 text-right">
                {filtered.length} user{filtered.length !== 1 ? 's' : ''} loaded from live API
            </div>
        </div>
    );
}
