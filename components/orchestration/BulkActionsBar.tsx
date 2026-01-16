"use client";

import { useStore } from "@/store/useStore";
import { Play, Square, Trash2, FolderInput, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { backendApi } from "@/lib/backend-api";

import { Bot } from "@/types/bot";

interface BulkActionsBarProps {
    filteredBots: Bot[];
}

export function BulkActionsBar({ filteredBots }: BulkActionsBarProps) {
    const { selectedBotIds, clearSelection, groups, assignBotsToGroup, removeBotsFromGroup, fetchBots, toggleSelectAll } = useStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showGroupSelector, setShowGroupSelector] = useState(false);

    if (selectedBotIds.length === 0) return null;

    const handleBulkAction = async (action: 'start' | 'stop' | 'delete') => {
        if (isProcessing) return;
        setIsProcessing(true);
        const toastId = toast.loading(`Processing ${action} for ${selectedBotIds.length} bots...`);

        try {
            // Execute sequentially to avoid overwhelming server
            for (const botId of selectedBotIds) {
                if (action === 'delete') {
                    await backendApi.delete(`/bots/${botId}`);
                } else {
                    await backendApi.post(`/bots/${botId}/${action}`);
                }
            }

            toast.success(`Successfully ${action}ed ${selectedBotIds.length} bots`);
            clearSelection();
            await fetchBots();
        } catch (error) {
            toast.error(`Failed to ${action} some bots`);
        } finally {
            toast.dismiss(toastId);
            setIsProcessing(false);
        }
    };

    const handleAssignGroup = async (groupId: string) => {
        try {
            await assignBotsToGroup(selectedBotIds, groupId);
            toast.success("Bots assigned to group");
            setShowGroupSelector(false);
            clearSelection();
        } catch (error) {
            toast.error("Failed to assign bots");
        }
    };

    const handleToggleGroup = async (e: React.MouseEvent, groupId: string, action: 'add' | 'remove') => {
        e.stopPropagation();
        try {
            if (action === 'add') {
                await assignBotsToGroup(selectedBotIds, groupId, false);
                toast.success("Bots assigned to group");
            } else {
                await removeBotsFromGroup(selectedBotIds, groupId);
                toast.success("Bots removed from group");
            }
        } catch (error) {
            toast.error(action === 'add' ? "Failed to assign bots" : "Failed to remove bots");
        }
    };

    // Check selection state
    const allSelected = selectedBotIds.length > 0 && selectedBotIds.length === filteredBots.length;
    const isPartial = selectedBotIds.length > 0 && selectedBotIds.length < filteredBots.length;

    const handleSelectAllToggle = () => {
        if (allSelected) {
            // If all selected, deselect all
            clearSelection();
        } else {
            // If partial or none, select all visible bots
            const allIds = filteredBots.map(b => b.id);
            toggleSelectAll(allIds);
        }
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl p-2.5 flex items-center gap-1.5 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-[95vw] sm:max-w-none">
            {/* Select All Checkbox */}
            <button
                onClick={handleSelectAllToggle}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title={allSelected ? "Deselect All" : "Select All"}
            >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedBotIds.length > 0 ? 'bg-blue-600 border-blue-600' : 'border-slate-600'
                    }`}>
                    {allSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {isPartial && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                    )}
                </div>
            </button>

            <div className="bg-slate-950/50 rounded-xl px-4 py-2 mr-1 border border-slate-800/50 flex items-center gap-2">
                <span className="font-black text-blue-400 text-lg leading-none">{selectedBotIds.length}</span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hidden sm:inline">selected</span>
            </div>

            <div className="h-8 w-px bg-slate-700 mx-1"></div>

            <button
                onClick={() => handleBulkAction('start')}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-green-500/10 rounded-xl text-green-500 hover:text-green-400 transition-all font-bold text-sm"
                title="Start Selected"
            >
                <Play className="w-4.5 h-4.5 fill-current" />
                <span className="hidden md:inline">Start</span>
            </button>

            <button
                onClick={() => handleBulkAction('stop')}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-yellow-500/10 rounded-xl text-yellow-500 hover:text-yellow-400 transition-all font-bold text-sm"
                title="Stop Selected"
            >
                <Square className="w-4.5 h-4.5 fill-current" />
                <span className="hidden md:inline">Stop</span>
            </button>

            <div className="relative">
                <button
                    onClick={() => setShowGroupSelector(!showGroupSelector)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-500/10 rounded-xl text-blue-400 hover:text-blue-300 transition-all font-bold text-sm"
                    title="Move to Group"
                >
                    <FolderInput className="w-4.5 h-4.5" />
                    <span className="hidden md:inline">Group</span>
                </button>

                {showGroupSelector && (
                    <div className="absolute bottom-full left-0 mb-4 w-64 bg-slate-900/60 backdrop-blur-2xl border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="p-3 border-b border-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/30">
                            Assign to Group
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {groups.map(group => {
                                // Count how many selected bots are in this group
                                const botsInGroup = selectedBotIds.filter(botId =>
                                    group.bots?.some(b => b.id === botId)
                                ).length;
                                const allInGroup = botsInGroup === selectedBotIds.length;
                                const someInGroup = botsInGroup > 0 && botsInGroup < selectedBotIds.length;

                                return (
                                    <button
                                        key={group.id}
                                        onClick={() => handleAssignGroup(group.id)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 flex items-center justify-between group/item"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            {/* Checkbox */}
                                            <div
                                                onClick={(e) => handleToggleGroup(e, group.id, allInGroup ? 'remove' : 'add')}
                                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${allInGroup
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : someInGroup
                                                        ? 'bg-blue-600/50 border-blue-600'
                                                        : 'border-slate-600 hover:border-slate-400'
                                                    }`}
                                            >
                                                {allInGroup && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                                {someInGroup && !allInGroup && (
                                                    <div className="w-2 h-2 bg-white rounded-sm" />
                                                )}
                                            </div>

                                            {/* Group Color & Name */}
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                                            <span className="text-slate-300 group-hover/item:text-white transition-colors">
                                                {group.name}
                                            </span>
                                        </div>

                                        {/* Membership Count */}
                                        {botsInGroup > 0 && (
                                            <span className="text-xs text-slate-500 font-mono">
                                                {botsInGroup}/{selectedBotIds.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            {groups.length === 0 && (
                                <div className="p-4 text-center text-xs text-slate-500">
                                    No groups created
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-8 w-px bg-slate-700 mx-1"></div>

            <button
                onClick={() => handleBulkAction('delete')}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 rounded-xl text-red-500 hover:text-red-400 transition-all font-bold text-sm"
                title="Delete Selected"
            >
                <Trash2 className="w-4.5 h-4.5" />
                <span className="hidden md:inline">Delete</span>
            </button>

            <button
                onClick={clearSelection}
                className="ml-2 p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
