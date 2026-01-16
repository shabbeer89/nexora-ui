"use client";
import { useStore } from "@/store/useStore";
import { BotCard } from "@/components/dashboard/BotCard";
import { Plus, Search, Filter, LayoutGrid, Play, Square } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BulkActionsBar } from "@/components/orchestration/BulkActionsBar";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import { Folder, Trash2, Edit2, Check, X, Palette } from "lucide-react";

const PREDEFINED_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#eab308',
    '#a855f7', '#ec4899', '#f97316', '#06b6d4',
];

export default function OrchestrationPage() {
    const { bots, groups, fetchBots, fetchGroups, createGroup, deleteGroup, updateGroup } = useStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'error'>('all');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupColor, setNewGroupColor] = useState("");
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");

    useEffect(() => {
        fetchBots();
        fetchGroups();
    }, [fetchBots, fetchGroups]);

    // Group Handlers
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        const color = newGroupColor || `hsl(${Math.random() * 360}, 70%, 60%)`;
        try {
            await createGroup(newGroupName, color);
            setNewGroupName("");
            setNewGroupColor("");
            setIsCreating(false);
            toast.success("Group created");
        } catch (error) { toast.error("Failed to create group"); }
    };

    const handleDeleteGroup = async (id: string) => {
        if (confirm("Delete this group? Bots will remain.")) {
            try {
                await deleteGroup(id);
                if (selectedGroupId === id) setSelectedGroupId(null);
                toast.success("Group deleted");
            } catch (error) { toast.error("Failed to delete group"); }
        }
    };

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editingGroupId) return;
        try {
            // Ensure we don't send an empty color string if somehow state is invalid
            // If editColor is empty, we try to fall back to the existing group's color or a default
            const currentGroup = groups.find(g => g.id === editingGroupId);
            const colorToSend = editColor || currentGroup?.color || PREDEFINED_COLORS[0];

            await updateGroup(editingGroupId, { name: editName, color: colorToSend });
            setEditingGroupId(null);
            toast.success("Group updated");
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.error || error?.message || "Failed to update group";
            toast.error(msg);
        }
    };

    // Filter bots
    const filteredBots = bots.filter(bot => {
        const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bot.strategy?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || bot.status === statusFilter;

        let matchesGroup = true;
        if (selectedGroupId) {
            const group = groups.find(g => g.id === selectedGroupId);
            matchesGroup = group?.bots?.some(b => b.id === bot.id) ?? false;
        }

        return matchesSearch && matchesStatus && matchesGroup;
    });

    const activeBots = bots.filter(b => b.status === "running").length;
    const totalBots = bots.length;

    return (
        <div className="flex h-full bg-slate-950">

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 space-y-6 p-8 overflow-y-auto">
                    {/* Stats & Search Redesign */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Search Card - Expanded */}
                        <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800/50 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-center shadow-xl">
                            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Find your bots
                            </h3>
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by name, strategy, or market..."
                                    className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {['DCA', 'Grid', 'Vwap', 'Arb'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSearchQuery(tag)}
                                        className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Unified Stats, Filter & Action Slate */}
                        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl flex flex-col">
                            {/* Stats Header */}
                            <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-800/50 bg-slate-950/30">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Active</p>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-2xl font-black text-white">{activeBots}</span>
                                    </div>
                                </div>
                                <div className="text-center border-l border-slate-800/50">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Total</p>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <span className="text-2xl font-black text-white">{totalBots}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2 grid grid-cols-2 gap-2">
                                {/* Vertical Status Filters */}
                                <div className="flex flex-col gap-1 pr-2 border-r border-slate-800/50">
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                                            statusFilter === 'all'
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className={cn("w-3.5 h-3.5", statusFilter === 'all' ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
                                            <span>All</span>
                                        </div>
                                        <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded-md",
                                            statusFilter === 'all' ? "bg-white/20" : "bg-slate-800 text-slate-500")}>
                                            {totalBots}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setStatusFilter('running')}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                                            statusFilter === 'running'
                                                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Play className={cn("w-3.5 h-3.5", statusFilter === 'running' ? "text-white" : "text-slate-500 group-hover:text-green-400")} />
                                            <span>Running</span>
                                        </div>
                                        <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded-md",
                                            statusFilter === 'running' ? "bg-white/20" : "bg-slate-800 text-slate-500")}>
                                            {activeBots}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setStatusFilter('stopped')}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                                            statusFilter === 'stopped'
                                                ? "bg-slate-700 text-white shadow-lg"
                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Square className={cn("w-3.5 h-3.5", statusFilter === 'stopped' ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                                            <span>Stopped</span>
                                        </div>
                                        <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded-md",
                                            statusFilter === 'stopped' ? "bg-white/20" : "bg-slate-800 text-slate-500")}>
                                            {totalBots - activeBots}
                                        </span>
                                    </button>
                                </div>

                                {/* Main Actions */}
                                <div className="flex flex-col gap-2 pl-1">
                                    <Link
                                        href="/orchestration/new"
                                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/10"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>New Bot</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Group Navigation Bar */}
                    <div className="relative group/nav">
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar no-scrollbar scroll-smooth">
                            <button
                                onClick={() => setSelectedGroupId(null)}
                                className={cn(
                                    "whitespace-nowrap px-6 py-3 rounded-xl text-xs font-bold transition-all border",
                                    selectedGroupId === null
                                        ? "bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/20"
                                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 shadow-sm"
                                )}
                            >
                                All Instances
                            </button>

                            {groups.map((group) => (
                                <button
                                    key={group.id}
                                    onClick={() => setSelectedGroupId(group.id)}
                                    className={cn(
                                        "whitespace-nowrap px-6 py-3 rounded-xl text-xs font-bold transition-all border group/item flex items-center gap-2.5",
                                        selectedGroupId === group.id
                                            ? "bg-slate-800 text-white border-slate-700 shadow-md"
                                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 shadow-sm"
                                    )}
                                    style={{
                                        borderColor: selectedGroupId === group.id ? group.color : undefined,
                                        boxShadow: selectedGroupId === group.id ? `0 0 20px ${group.color}20` : undefined,
                                    }}
                                >
                                    <div
                                        className="w-2.5 h-2.5 rounded-full relative"
                                        style={{ backgroundColor: group.color }}
                                    >
                                        <div
                                            className="absolute inset-0 rounded-full blur-[4px] animate-pulse"
                                            style={{ backgroundColor: group.color, opacity: 0.6 }}
                                        />
                                    </div>
                                    <span>{group.name}</span>
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-950/50 border border-white/5 opacity-60">
                                        {Array.from(new Set(group.bots?.map(b => b.id) || []))
                                            .filter(id => bots.some(bot => bot.id === id)).length}
                                    </span>
                                </button>
                            ))}

                            <button
                                onClick={() => setIsManageModalOpen(true)}
                                className="whitespace-nowrap px-4 py-3 rounded-xl text-xs font-bold bg-slate-900/50 border border-slate-800 border-dashed text-slate-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Manage Groups</span>
                            </button>
                        </div>
                    </div>

                    {/* Group Management Modal */}
                    {isManageModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-950/80" onClick={() => setIsManageModalOpen(false)} />
                            <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">Manage Groups</h3>
                                    <button onClick={() => setIsManageModalOpen(false)} className="text-slate-500 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    {groups.map(group => (
                                        <div key={group.id} className={cn("bg-slate-950/50 rounded-xl border border-slate-800/50 p-3", editingGroupId === group.id ? "space-y-3" : "flex items-center justify-between")}>
                                            {editingGroupId === group.id ? (
                                                <>
                                                    <input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full bg-slate-900 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                                                        placeholder="Group Name"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                    />
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {PREDEFINED_COLORS.map(color => (
                                                                <button
                                                                    key={color}
                                                                    onClick={() => setEditColor(color)}
                                                                    className={cn("w-5 h-5 rounded-full transition-all", editColor === color ? "ring-2 ring-white scale-110" : "opacity-40 hover:opacity-100")}
                                                                    style={{ backgroundColor: color }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={handleSaveEdit} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg" title="Save">
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setEditingGroupId(null)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg" title="Cancel">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                                                        <span className="text-sm font-medium text-slate-200">{group.name}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-bold ml-2">
                                                            {Array.from(new Set(group.bots?.map(b => b.id) || []))
                                                                .filter(id => bots.some(bot => bot.id === id)).length} bots
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => { setEditingGroupId(group.id); setEditName(group.name); setEditColor(group.color); }} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}

                                    {isCreating ? (
                                        <div className="p-4 bg-slate-950 rounded-xl border border-blue-500/30 space-y-4">
                                            <input
                                                placeholder="Group Name"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                                autoFocus
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {PREDEFINED_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setNewGroupColor(color)}
                                                        className={cn("w-5 h-5 rounded-full", newGroupColor === color ? "ring-2 ring-white" : "opacity-60")}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleCreateGroup} className="flex-1 bg-blue-600 py-2 rounded-lg text-xs font-bold text-white">Add</button>
                                                <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-slate-400">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsCreating(true)} className="w-full py-3 border border-dashed border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-all flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            Add New Group
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bot Grid */}
                    {filteredBots.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/30 border border-slate-800 border-dashed rounded-xl">
                            <p className="text-slate-400">No bots found matching your filters.</p>
                            {(searchQuery || statusFilter !== 'all') && (
                                <button
                                    onClick={() => { setSearchQuery(""); setStatusFilter('all'); }}
                                    className="mt-2 text-blue-500 hover:text-blue-400 text-sm"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-32">
                            {filteredBots
                                .sort((a, b) => {
                                    // Running bots first
                                    if (a.status === 'running' && b.status !== 'running') return -1;
                                    if (a.status !== 'running' && b.status === 'running') return 1;
                                    // Then by name
                                    return a.name.localeCompare(b.name);
                                })
                                .map((bot) => (
                                    <BotCard key={bot.id} bot={bot} />
                                ))}
                        </div>
                    )}
                </div>

                {/* Bulk Actions Bar */}
                <BulkActionsBar filteredBots={filteredBots} />
            </div>
        </div>
    );
}
