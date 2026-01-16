'use client';

import { useEffect, useState } from 'react';
import { SuperAdminGuard } from '@/components/auth/RoleGuard';
import { backendApi } from '@/lib/backend-api';
import { Plus, Trash2, Edit2, RefreshCw, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
    id: string;
    name: string;
    subscription_tier: string;
    max_users: number;
    is_active: boolean;
    created_at: string;
    user_count?: number;
}

function OrganizationsPageContent() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

    // Form
    const [formName, setFormName] = useState('');
    const [formTier, setFormTier] = useState('BASIC');
    const [formMaxUsers, setFormMaxUsers] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            const response = await backendApi.get('/organizations');
            setOrgs(response.data.organizations || response.data || []);
        } catch (err) {
            console.error('Error fetching organizations:', err);
            setOrgs([
                { id: '1', name: 'Acme Trading', subscription_tier: 'ENTERPRISE', max_users: 50, is_active: true, created_at: '2024-01-01', user_count: 12 },
                { id: '2', name: 'Alpha Capital', subscription_tier: 'PROFESSIONAL', max_users: 20, is_active: true, created_at: '2024-02-15', user_count: 8 },
                { id: '3', name: 'Beta Finance', subscription_tier: 'BASIC', max_users: 5, is_active: false, created_at: '2024-03-01', user_count: 2 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingOrg) {
                await backendApi.put(`/organizations/${editingOrg.id}`, {
                    name: formName,
                    subscription_tier: formTier,
                    max_users: formMaxUsers
                });
                toast.success('Organization updated');
            } else {
                await backendApi.post('/organizations', {
                    name: formName,
                    subscription_tier: formTier,
                    max_users: formMaxUsers
                });
                toast.success('Organization created');
            }

            setShowModal(false);
            resetForm();
            await fetchOrgs();
        } catch (err) {
            toast.error('Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (orgId: string) => {
        if (!confirm('Delete this organization and all its users?')) return;

        try {
            await backendApi.delete(`/organizations/${orgId}`);
            toast.success('Organization deleted');
            await fetchOrgs();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const openEdit = (org: Organization) => {
        setEditingOrg(org);
        setFormName(org.name);
        setFormTier(org.subscription_tier);
        setFormMaxUsers(org.max_users);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormName('');
        setFormTier('BASIC');
        setFormMaxUsers(5);
        setEditingOrg(null);
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'ENTERPRISE': return 'text-purple-400 bg-purple-900/20';
            case 'PROFESSIONAL': return 'text-blue-400 bg-blue-900/20';
            default: return 'text-green-400 bg-green-900/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Organizations</h1>
                    <p className="text-slate-400 mt-1">Manage multi-tenant organizations</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchOrgs} disabled={loading} className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Organization
                    </button>
                </div>
            </div>

            {/* Orgs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-400">Loading...</div>
                ) : orgs.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-400">No organizations found</div>
                ) : (
                    orgs.map((org) => (
                        <div key={org.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{org.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(org.subscription_tier)}`}>
                                            {org.subscription_tier}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(org)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(org.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-400">Users</p>
                                    <p className="text-white flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {org.user_count || 0} / {org.max_users}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Status</p>
                                    <p className={org.is_active ? 'text-green-400' : 'text-red-400'}>
                                        {org.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md p-6">
                        <h3 className="text-lg font-medium text-white mb-4">
                            {editingOrg ? 'Edit Organization' : 'Add Organization'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Tier</label>
                                <select value={formTier} onChange={(e) => setFormTier(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white">
                                    <option value="BASIC">Basic</option>
                                    <option value="PROFESSIONAL">Professional</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Max Users</label>
                                <input type="number" value={formMaxUsers} onChange={(e) => setFormMaxUsers(Number(e.target.value))} min={1} className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {submitting ? 'Saving...' : (editingOrg ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OrganizationsPage() {
    return (
        <SuperAdminGuard>
            <OrganizationsPageContent />
        </SuperAdminGuard>
    );
}
