'use client';

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Briefcase, Zap, ShieldAlert, Globe, BrainCircuit, BarChart3,
    GanttChartSquare, LayoutGrid, Settings2, Bell, Target, TrendingDown, Settings,
    AlertTriangle, Activity, LogOut, UserCircle, History, FileText, ChevronDown,
    ChevronRight, Terminal, ArrowUpDown, CandlestickChart, Layers, FileCode,
    Plug, Percent, Container, Archive, TrendingUp, Users, Building2, Shield,
    DollarSign, ClipboardList, Key, Brain, Wallet, GripVertical, Plus, Edit, Trash2,
    Palette, PanelLeftClose, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearTokens } from '@/lib/backend-api';
import { useStore } from '@/store/useStore';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import BottomDrawer from './BottomDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { NexoraModal } from '../ui/NexoraModal';
import './Sidebar.css';

// --- Types & Interfaces ---

export type TabType =
    | 'overview' | 'portfolio' | 'strategies' | 'risk' | 'engines'
    | 'cockpit' | 'macro' | 'ml' | 'analytics' | 'emergency'
    | 'trades' | 'orders' | 'alerts' | 'hyperopt' | 'drawdown' | 'history' | 'terminal';

interface NavItem {
    id?: TabType | string;
    href?: string;
    label: string;
    icon: string;
    color?: string;
    minRole?: "ADMIN" | "SUPER_ADMIN";
}

interface NavGroup {
    id: string;
    label: string;
    items: NavItem[];
    color?: string; // Group theme color
}

interface SidebarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

// --- Icon Mapping ---

const ICON_MAP: Record<string, React.ElementType> = {
    LayoutDashboard, Briefcase, Zap, ShieldAlert, Globe, BrainCircuit, BarChart3,
    GanttChartSquare, LayoutGrid, Settings2, Bell, Target, TrendingDown, Settings,
    AlertTriangle, Activity, LogOut, UserCircle, History, FileText, ChevronDown,
    ChevronRight, Terminal, ArrowUpDown, CandlestickChart, Layers, FileCode,
    Plug, Percent, Container, Archive, TrendingUp, Users, Building2, Shield,
    DollarSign, ClipboardList, Key, Brain, Wallet
};

const PRESET_COLORS = [
    { name: 'Cyan', class: 'text-cyan-400', hex: '#22d3ee' },
    { name: 'Emerald', class: 'text-emerald-400', hex: '#34d399' },
    { name: 'Rose', class: 'text-rose-400', hex: '#fb7185' },
    { name: 'Amber', class: 'text-amber-400', hex: '#fbbf24' },
    { name: 'Purple', class: 'text-purple-400', hex: '#c084fc' },
    { name: 'Blue', class: 'text-blue-400', hex: '#60a5fa' },
    { name: 'Slate', class: 'text-slate-400', hex: '#94a3b8' },
];

// --- Initial Data ---

const INITIAL_NAV_GROUPS: NavGroup[] = [
    {
        id: "mission-control",
        label: "Mission Control",
        color: "text-cyan-400",
        items: [
            { href: '/nexora/overview', label: 'Dashboard', icon: 'LayoutDashboard', color: 'text-cyan-400' },
            { href: '/nexora/cockpit', label: 'Market Overview', icon: 'Activity', color: 'text-emerald-400' },
            { href: '/nexora/activity', label: 'Global Activity', icon: 'History', color: 'text-blue-400' },
            { href: '/nexora/charts', label: 'Live Charts', icon: 'CandlestickChart', color: 'text-purple-400' },
            { href: '/nexora/terminal', label: 'System Terminal', icon: 'Terminal', color: 'text-blue-500' },
        ]
    },
    {
        id: "execution-engine",
        label: "Execution Engine",
        color: "text-blue-400",
        items: [
            { href: '/nexora/orchestration', label: 'Fleet Orchestration', icon: 'LayoutGrid', color: 'text-cyan-400' },
            { href: '/nexora/engines', label: 'Engine Performance', icon: 'BarChart3', color: 'text-emerald-400' },
            { href: '/nexora/strategies', label: 'Strategy Designs', icon: 'Zap', color: 'text-yellow-400' },
            { href: '/nexora/manual', label: 'Manual Trade', icon: 'ArrowUpDown', color: 'text-slate-400' },
            { href: '/nexora/trades', label: 'Active Trades', icon: 'Briefcase', color: 'text-blue-400' },
            { href: '/nexora/orders', label: 'Live Orders', icon: 'GanttChartSquare', color: 'text-indigo-400' },
        ]
    },
    {
        id: "intelligence-lab",
        label: "Intelligence Lab",
        color: "text-purple-400",
        items: [
            { id: 'ml', label: 'FreqAI models', icon: 'BrainCircuit', color: 'text-purple-400' },
            { id: 'macro', label: 'Global Macro', icon: 'Globe', color: 'text-sky-400' },
            { id: 'hyperopt', label: 'Optimization', icon: 'Target', color: 'text-orange-400' },
            { href: '/nexora/backtesting', label: 'Backtesting', icon: 'Layers', color: 'text-slate-400' },
            { href: '/nexora/scripts', label: 'Strategy Scripts', icon: 'FileCode', color: 'text-yellow-600' },
        ]
    }
];

// --- Main Component ---

export default function Sidebar({ activeTab, setActiveTab, isExpanded, setIsExpanded }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAdmin, isSuperAdmin } = useAuth();
    const logout = useStore(state => state.logout);
    const [hasMounted, setHasMounted] = useState(false);

    // State for navigation groups (persisted in localStorage)
    const [navGroups, setNavGroups] = useState<NavGroup[]>(INITIAL_NAV_GROUPS);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    // Modal States
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<NavGroup | null>(null);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].class);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

    // Item Modal States
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ groupId: string, item: NavItem } | null>(null);
    const [newItemLabel, setNewItemLabel] = useState("");
    const [itemToDelete, setItemToDelete] = useState<{ groupId: string, itemId: string } | null>(null);
    const [isItemDeleteConfirmOpen, setIsItemDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        const saved = localStorage.getItem('nexora-sidebar-layout-v3');
        if (saved) {
            try {
                setNavGroups(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved sidebar layout", e);
            }
        }
    }, []);

    useEffect(() => {
        if (hasMounted) {
            localStorage.setItem('nexora-sidebar-layout-v3', JSON.stringify(navGroups));
        }
    }, [navGroups, hasMounted]);

    const toggleGroup = (id: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleLogout = () => {
        clearTokens();
        logout();
        router.push('/login');
    };

    // --- Group Management ---

    const openCreateGroup = () => {
        setEditingGroup(null);
        setNewGroupName("");
        setSelectedColor(PRESET_COLORS[0].class);
        setIsGroupModalOpen(true);
    };

    const openEditGroup = (group: NavGroup) => {
        setEditingGroup(group);
        setNewGroupName(group.label);
        setSelectedColor(group.color || PRESET_COLORS[0].class);
        setIsGroupModalOpen(true);
    };

    const saveGroup = () => {
        if (!newGroupName.trim()) return;

        if (editingGroup) {
            setNavGroups(prev => prev.map(g => g.id === editingGroup.id
                ? { ...g, label: newGroupName, color: selectedColor }
                : g
            ));
        } else {
            const newGroup: NavGroup = {
                id: `group-${Date.now()}`,
                label: newGroupName,
                color: selectedColor,
                items: []
            };
            setNavGroups(prev => [...prev, newGroup]);
        }
        setIsGroupModalOpen(false);
    };

    const confirmDeleteGroup = (id: string) => {
        setGroupToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const deleteGroup = () => {
        if (groupToDelete) {
            setNavGroups(prev => prev.filter(g => g.id !== groupToDelete));
            setGroupToDelete(null);
        }
        setIsDeleteConfirmOpen(false);
    };

    // --- Item Management ---

    const openEditItem = (groupId: string, item: NavItem) => {
        setEditingItem({ groupId, item });
        setNewItemLabel(item.label);
        setIsItemModalOpen(true);
    };

    const saveItem = () => {
        if (!newItemLabel.trim() || !editingItem) return;

        setNavGroups(prev => prev.map(g => {
            if (g.id === editingItem.groupId) {
                return {
                    ...g,
                    items: g.items.map(i => {
                        const iId = i.id || i.href;
                        const editingId = editingItem.item.id || editingItem.item.href;
                        return iId === editingId ? { ...i, label: newItemLabel } : i;
                    })
                };
            }
            return g;
        }));
        setIsItemModalOpen(false);
    };

    const confirmDeleteItem = (groupId: string, item: NavItem) => {
        const itemId = String(item.id || item.href);
        setItemToDelete({ groupId, itemId });
        setIsItemDeleteConfirmOpen(true);
    };

    const deleteItem = () => {
        if (itemToDelete) {
            setNavGroups(prev => prev.map(g => {
                if (g.id === itemToDelete.groupId) {
                    return {
                        ...g,
                        items: g.items.filter(i => String(i.id || i.href) !== itemToDelete.itemId)
                    };
                }
                return g;
            }));
            setItemToDelete(null);
        }
        setIsItemDeleteConfirmOpen(false);
    };

    // --- Drag & Drop logic ---

    const onDragEnd = (result: DropResult) => {
        const { destination, source, type } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'group') {
            const newGroups = Array.from(navGroups);
            const [removed] = newGroups.splice(source.index, 1);
            newGroups.splice(destination.index, 0, removed);
            setNavGroups(newGroups);
            return;
        }

        const sourceGroupIndex = navGroups.findIndex(g => g.id === source.droppableId);
        const destGroupIndex = navGroups.findIndex(g => g.id === destination.droppableId);
        if (sourceGroupIndex === -1 || destGroupIndex === -1) return;

        const newGroups = Array.from(navGroups);
        const sourceItems = Array.from(newGroups[sourceGroupIndex].items);
        const destItems = sourceGroupIndex === destGroupIndex ? sourceItems : Array.from(newGroups[destGroupIndex].items);

        const [movedItem] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, movedItem);

        newGroups[sourceGroupIndex].items = sourceItems;
        if (sourceGroupIndex !== destGroupIndex) {
            newGroups[destGroupIndex].items = destItems;
        }
        setNavGroups(newGroups);
    };

    if (!hasMounted) return <aside className="fixed left-0 top-0 h-screen w-20 bg-slate-950 border-r border-white/5 z-50" />;

    return (
        <>
            <aside
                className={cn(
                    "fixed left-0 top-0 h-screen sidebar-container bg-slate-950 border-r border-white/5 flex flex-col z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1.3,0.32,1)]",
                    isExpanded ? "w-72" : "w-20"
                )}
            >
                {/* Logo Section */}
                <div className={cn("p-6 border-b border-white/5 flex items-center transition-all", isExpanded ? "px-8 justify-between" : "justify-center px-0")}>
                    <motion.div
                        layout
                        className="flex items-center gap-3"
                        onMouseEnter={() => !isExpanded && setIsExpanded(true)}
                        onClick={() => setIsExpanded(true)}
                    >
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
                        >
                            <span className="font-black text-white text-sm">NX</span>
                        </motion.div>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="animate-brand"
                            >
                                <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Nexora</h1>
                                <p className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest mt-1">Mission Control</p>
                            </motion.div>
                        )}
                    </motion.div>

                    {isExpanded && (
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest"
                        >
                            <PanelLeftClose className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Navigation Groups with Drag & Drop */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="all-groups" type="group" direction="vertical">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex-1 overflow-y-auto no-scrollbar py-6"
                            >
                                {navGroups.map((group, gIdx) => (
                                    <Draggable key={group.id} draggableId={group.id} index={gIdx}>
                                        {(groupProvided, groupSnapshot) => (
                                            <div
                                                ref={groupProvided.innerRef}
                                                {...groupProvided.draggableProps}
                                                className={cn(
                                                    "mb-4 px-2",
                                                    groupSnapshot.isDragging && "group-dragging"
                                                )}
                                            >
                                                <div className="flex items-center">
                                                    {isExpanded ? (
                                                        <div className="w-full flex items-center gap-1 group/header sidebar-group-header">
                                                            <div {...groupProvided.dragHandleProps} className="p-1 opacity-0 group-hover/header:opacity-100 transition-opacity cursor-grab">
                                                                <GripVertical className="w-3 h-3 text-slate-600" />
                                                            </div>
                                                            <div className="flex-1 flex items-center justify-between">
                                                                <button
                                                                    onClick={() => toggleGroup(group.id)}
                                                                    className={cn(
                                                                        "flex items-center gap-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors cursor-pointer",
                                                                        group.color || "text-slate-500 hover:text-white"
                                                                    )}
                                                                >
                                                                    <span>{group.label}</span>
                                                                    {collapsedGroups[group.id] ? (
                                                                        <ChevronRight className="w-3 h-3 opacity-50" />
                                                                    ) : (
                                                                        <ChevronDown className="w-3 h-3 opacity-50" />
                                                                    )}
                                                                </button>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                                                    <button onClick={() => openEditGroup(group)} className="p-1 text-slate-500 hover:text-cyan-400"><Edit className="w-3 h-3" /></button>
                                                                    <button onClick={() => confirmDeleteGroup(group.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-px bg-white/5 mx-2 my-4 w-full" />
                                                    )}
                                                </div>

                                                <Droppable droppableId={group.id} type="item">
                                                    {(itemProvided, itemSnapshot) => (
                                                        <div
                                                            {...itemProvided.droppableProps}
                                                            ref={itemProvided.innerRef}
                                                            className={cn(
                                                                "space-y-1 transition-all duration-300",
                                                                (isExpanded && collapsedGroups[group.id]) ? "h-0 overflow-hidden" : "mt-1",
                                                                itemSnapshot.isDraggingOver && "bg-white/[0.02] rounded-2xl"
                                                            )}
                                                        >
                                                            {group.items.map((item, iIdx) => {
                                                                if (item.minRole === 'ADMIN' && !isAdmin) return null;
                                                                if (item.minRole === 'SUPER_ADMIN' && !isSuperAdmin) return null;

                                                                const Icon = ICON_MAP[item.icon] || LayoutGrid;
                                                                const isActive = item.href ? pathname === item.href : activeTab === item.id;
                                                                const uniqueId = String(item.id || item.href || `item-${group.id}-${iIdx}`);

                                                                return (
                                                                    <Draggable key={uniqueId} draggableId={uniqueId} index={iIdx}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                className="px-1"
                                                                            >
                                                                                <div className="flex items-center gap-1 group/item">
                                                                                    {isExpanded && (
                                                                                        <div {...provided.dragHandleProps} className="p-1 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-grab">
                                                                                            <GripVertical className="w-3 h-3 text-slate-700" />
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex-1 relative">
                                                                                        <motion.button
                                                                                            whileHover={{ scale: 1.02, x: (isExpanded && !snapshot.isDragging) ? 4 : 0 }}
                                                                                            whileTap={{ scale: 0.98 }}
                                                                                            onClick={() => {
                                                                                                if (item.href) router.push(item.href);
                                                                                                else if (item.id) setActiveTab(item.id as TabType);
                                                                                            }}
                                                                                            className={cn(
                                                                                                "w-full flex items-center rounded-2xl transition-all sidebar-item relative",
                                                                                                isExpanded ? "px-4 py-2.5 gap-3" : "justify-center p-3",
                                                                                                isActive
                                                                                                    ? "bg-white/10 text-white active"
                                                                                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]",
                                                                                                snapshot.isDragging && "item-dragging"
                                                                                            )}
                                                                                        >
                                                                                            <Icon className={cn(
                                                                                                "w-5 h-5 transition-colors duration-300 flex-shrink-0",
                                                                                                isActive ? (item.color || group.color) : "group-hover/item:text-slate-300"
                                                                                            )} />
                                                                                            {isExpanded && (
                                                                                                <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden pr-12">
                                                                                                    {item.label}
                                                                                                </span>
                                                                                            )}
                                                                                            {isActive && <div className="sidebar-item-glow" style={{ backgroundColor: PRESET_COLORS.find(c => c.class === (item.color || group.color))?.hex }} />}
                                                                                        </motion.button>

                                                                                        {isExpanded && (
                                                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                                                                                <button onClick={(e) => { e.stopPropagation(); openEditItem(group.id, item); }} className="p-1 text-slate-600 hover:text-cyan-400 transition-colors"><Edit className="w-3 h-3" /></button>
                                                                                                <button onClick={(e) => { e.stopPropagation(); confirmDeleteItem(group.id, item); }} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                );
                                                            })}
                                                            {itemProvided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}

                                {isExpanded && (
                                    <button
                                        onClick={openCreateGroup}
                                        className="mx-6 mt-4 flex items-center justify-center gap-2 p-3 border border-dashed border-white/10 rounded-xl text-slate-500 hover:text-cyan-500 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create Group</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {/* Bottom Drawer */}
                <BottomDrawer
                    isExpanded={isExpanded}
                    handleLogout={handleLogout}
                    setActiveTab={setActiveTab}
                />
            </aside>

            {/* Group Modals */}
            <NexoraModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                title={editingGroup ? "Edit Group" : "Create New Group"}
                footer={
                    <>
                        <button onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 text-xs font-black text-slate-500 hover:text-white uppercase transition-all">Cancel</button>
                        <button onClick={saveGroup} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black rounded-xl uppercase transition-all shadow-lg shadow-cyan-900/40">
                            {editingGroup ? "Save Changes" : "Create Group"}
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Group Name</label>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="e.g. CUSTOM ENGINES"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Group Color Theme</label>
                        <div className="grid grid-cols-7 gap-2">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color.class}
                                    onClick={() => setSelectedColor(color.class)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                                        selectedColor === color.class ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: color.hex }}
                                >
                                    {selectedColor === color.class && <Check className="w-4 h-4 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </NexoraModal>

            <NexoraModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title="Confirm Deletion"
                footer={
                    <>
                        <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 text-xs font-black text-slate-500 hover:text-white uppercase">Cancel</button>
                        <button onClick={deleteGroup} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl uppercase transition-all shadow-lg">
                            Delete Group
                        </button>
                    </>
                }
            >
                <p className="text-slate-400 text-sm leading-relaxed">
                    Are you sure you want to delete this group? All items within it will be removed. This action cannot be undone.
                </p>
            </NexoraModal>

            {/* Item Modals */}
            <NexoraModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                title="Rename Link"
                footer={
                    <>
                        <button onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-xs font-black text-slate-500 hover:text-white uppercase transition-all">Cancel</button>
                        <button onClick={saveItem} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black rounded-xl uppercase transition-all shadow-lg shadow-cyan-900/40">
                            Save Changes
                        </button>
                    </>
                }
            >
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Link Label</label>
                    <input
                        type="text"
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        placeholder="e.g. My Dashboard"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-bold"
                    />
                </div>
            </NexoraModal>

            <NexoraModal
                isOpen={isItemDeleteConfirmOpen}
                onClose={() => setIsItemDeleteConfirmOpen(false)}
                title="Delete Link"
                footer={
                    <>
                        <button onClick={() => setIsItemDeleteConfirmOpen(false)} className="px-4 py-2 text-xs font-black text-slate-500 hover:text-white uppercase">Cancel</button>
                        <button onClick={deleteItem} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl uppercase transition-all shadow-lg">
                            Remove Link
                        </button>
                    </>
                }
            >
                <p className="text-slate-400 text-sm leading-relaxed">
                    Are you sure you want to remove this navigation link? You can always manually re-add it if needed.
                </p>
            </NexoraModal>
        </>
    );
}


