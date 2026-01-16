"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, Smartphone, CheckCircle2, AlertTriangle, Copy, RefreshCw, KeyRound, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

export default function MFAPage() {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{ enabled: boolean; backup_codes_remaining: number } | null>(null);
    const [setupData, setSetupData] = useState<{ secret: string; qr_code_base64: string; provisioning_uri: string; backup_codes: string[] } | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/auth/mfa/status');
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch MFA status");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSetup = async () => {
        try {
            const res = await fetch('/api/auth/mfa/setup', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Setup failed");

            setSetupData(data);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleEnable = async () => {
        if (verificationCode.length !== 6) {
            toast.error("Please enter a 6-digit code");
            return;
        }

        setIsVerifying(true);
        try {
            const res = await fetch('/api/auth/mfa/enable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verification_token: verificationCode })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Verification failed");
            }

            toast.success("MFA Enabled Successfully");
            setSetupData(null); // Clear setup flow
            fetchStatus(); // Refresh status
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDisable = async () => {
        if (verificationCode.length !== 6) {
            toast.error("Please enter current code to disable");
            return;
        }

        setIsVerifying(true);
        try {
            const res = await fetch('/api/auth/mfa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: verificationCode })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to disable MFA");
            }

            toast.success("MFA Disabled");
            setVerificationCode("");
            fetchStatus();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[500px]">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-500" />
                    Security Settings
                </h1>
                <p className="text-slate-400 mt-2">Manage Multi-Factor Authentication (MFA) to secure your account.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className={cn(
                        "rounded-xl border p-6 flex flex-col items-center text-center",
                        status?.enabled
                            ? "bg-green-500/10 border-green-500/20"
                            : "bg-slate-900/50 border-slate-800"
                    )}>
                        {status?.enabled ? (
                            <>
                                <div className="p-3 bg-green-500/20 rounded-full mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">MFA Enabled</h3>
                                <p className="text-sm text-green-300/80 mt-1">Your account is protected.</p>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-slate-800 rounded-full mb-4">
                                    <Lock className="w-8 h-8 text-slate-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">MFA Disabled</h3>
                                <p className="text-sm text-slate-400 mt-1">Enable 2FA for better security.</p>
                            </>
                        )}
                    </div>

                    {/* Add Disable flow here if enabled */}
                    {status?.enabled && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="text-sm font-medium text-white mb-4">Disable MFA</h3>
                            <p className="text-xs text-slate-400 mb-4">Enter a current code to disable protection.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-lg tracking-widest text-white focus:border-red-500 outline-none"
                                />
                                <button
                                    onClick={handleDisable}
                                    disabled={isVerifying || verificationCode.length !== 6}
                                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg font-medium transition-colors"
                                >
                                    Disable
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Action Area */}
                <div className="md:col-span-2">
                    {!status?.enabled && !setupData && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                            <Smartphone className="w-12 h-12 text-blue-500 mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">Protect your account</h3>
                            <p className="text-slate-400 max-w-md mb-8">
                                Multi-factor authentication adds an extra layer of security to your Hummingbot account.
                                We recommend using Google Authenticator or Authy.
                            </p>
                            <button
                                onClick={handleSetup}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                            >
                                Setup 2FA Now
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    )}

                    {!status?.enabled && setupData && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-blue-500" />
                                Scan QR Code
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* QR Code Column */}
                                <div className="flex flex-col items-center justify-center space-y-4 p-4 bg-white rounded-xl">
                                    {setupData.qr_code_base64 ? (
                                        <img
                                            src={`data:image/png;base64,${setupData.qr_code_base64}`}
                                            alt="MFA QR Code"
                                            className="w-48 h-48 mix-blend-multiply"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center p-4">
                                            QR Generation Unavailable<br />Use Secret Key
                                        </div>
                                    )}
                                </div>

                                {/* Manual Entry Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Manual Entry Secret</label>
                                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3">
                                            <code className="text-blue-400 font-mono text-sm flex-1">{setupData.secret}</code>
                                            <button
                                                onClick={() => copyToClipboard(setupData.secret)}
                                                className="text-slate-500 hover:text-white transition-colors"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Verify Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-center text-xl tracking-widest text-white focus:border-blue-500 outline-none"
                                            />
                                            <button
                                                onClick={handleEnable}
                                                disabled={isVerifying || verificationCode.length !== 6}
                                                className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Verify"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Backup Codes */}
                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                    <h4 className="text-yellow-500 font-medium flex items-center gap-2 mb-3">
                                        <AlertTriangle className="w-4 h-4" />
                                        Save Backup Codes
                                    </h4>
                                    <p className="text-xs text-yellow-200/80 mb-4">
                                        Store these codes safely. You can use them to access your account if you lose your authenticator device.
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {setupData.backup_codes.map((code, i) => (
                                            <code key={i} className="bg-black/20 text-yellow-200 text-xs px-2 py-1.5 rounded text-center font-mono">
                                                {code}
                                            </code>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(setupData.backup_codes.join('\n'))}
                                        className="mt-4 text-xs font-medium text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
                                    >
                                        <Copy className="w-3 h-3" />
                                        Copy All Codes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Missing Icon Component
const ChevronRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);
