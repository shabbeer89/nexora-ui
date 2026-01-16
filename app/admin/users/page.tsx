'use client';

import { useEffect, useState } from 'react';
import { AdminGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backend-api';
import { Plus, Trash2, Edit2, RefreshCw, Search, Shield, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    organization_id?: string;
    is_active: boolean;
    mfa_enabled: boolean;
    created_at: string;
    last_login?: string;
}

function UsersPageContent() {
    const { isSuperAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form state
    const [formEmail, setFormEmail] = useState('');
    const [formUsername, setFormUsername] = useState('');
    const [formRole, setFormRole] = useState('TRADER');
    const [formPassword, setFormPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await backendApi.get('/users');
            setUsers(response.data.users || response.data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            // Mock data for demo
            setUsers([
                { id: '1', email: 'admin@example.com', username: 'admin', role: 'SUPER_ADMIN', is_active: true, mfa_enabled: true, created_at: '2024-01-01' },
                { id: '2', email: 'trader@example.com', username: 'trader1', role: 'TRADER', is_active: true, mfa_enabled: false, created_at: '2024-02-15' },
                { id: '3', email: 'manager@example.com', username: 'manager', role: 'ADMIN', is_active: true, mfa_enabled: true, created_at: '2024-03-01' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingUser) {
                await backendApi.put(`/users/${editingUser.id}`, {
                    email: formEmail,
                    username: formUsername,
                    role: formRole
                });
                toast.success('User updated successfully');
            } else {
                await backendApi.post('/users', {
                    email: formEmail,
                    username: formUsername,
                    role: formRole,
                    password: formPassword
                });
                toast.success('User created successfully');
            }

            setShowAddModal(false);
            setEditingUser(null);
            resetForm();
            await fetchUsers();
        } catch (err) {
            toast.error(editingUser ? 'Failed to update user' : 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await backendApi.delete(`/users/${userId}`);
            toast.success('User deleted');
            await fetchUsers();
        } catch (err) {
            toast.error('Failed to delete user');
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormEmail(user.email);
        setFormUsername(user.username);
        setFormRole(user.role);
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormEmail('');
        setFormUsername('');
        setFormRole('TRADER');
        setFormPassword('');
        setEditingUser(null);
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'text-purple-400 bg-purple-900/20';
            case 'ADMIN': return 'text-blue-400 bg-blue-900/20';
            default: return 'text-green-400 bg-green-900/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-slate-400 mt-1">Manage platform users and their roles</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-800">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">User</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Role</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">MFA</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Created</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.username}</p>
                                                <p className="text-sm text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.mfa_enabled ? (
                                            <Shield className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <span className="text-slate-500 text-sm">Off</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md p-6">
                        <h3 className="text-lg font-medium text-white mb-4">
                            {editingUser ? 'Edit User' : 'Add User'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    required
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={formUsername}
                                    onChange={(e) => setFormUsername(e.target.value)}
                                    required
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                                <select
                                    value={formRole}
                                    onChange={(e) => setFormRole(e.target.value)}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white"
                                >
                                    <option value="TRADER">Trader</option>
                                    <option value="ADMIN">Admin</option>
                                    {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                                </select>
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={formPassword}
                                        onChange={(e) => setFormPassword(e.target.value)}
                                        required
                                        className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white"
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UsersPage() {
    return (
        <AdminGuard>
            <UsersPageContent />
        </AdminGuard>
    );
}
