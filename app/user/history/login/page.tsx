"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface LoginEntry {
    dateTime: string;
    os: string;
    ipAddress: string;
    device: string;
    browser: string;
    status: 'successful' | 'failed';
}

export default function LoginHistoryPage() {
    const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);

    useEffect(() => {
        // Mock data - replace with actual API call
        const now = new Date();
        setLoginHistory([
            {
                dateTime: now.toISOString(),
                os: "Linux 64",
                ipAddress: "103.156.25.178",
                device: "Microsoft Windows",
                browser: "Chrome",
                status: "successful"
            },
            {
                dateTime: new Date(now.getTime() - 3600000).toISOString(),
                os: "Windows 10.0",
                ipAddress: "103.156.25.178",
                device: "Microsoft Windows",
                browser: "Chrome",
                status: "successful"
            },
            {
                dateTime: new Date(now.getTime() - 7200000).toISOString(),
                os: "OS X",
                ipAddress: "103.156.25.178",
                device: "Apple Mac",
                browser: "Safari",
                status: "successful"
            }
        ]);
    }, []);

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background-dark)' }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Login History
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Security audit trail of your account access
                </p>
            </div>

            <div
                className="rounded-xl p-6"
                style={{ backgroundColor: 'var(--background-card)' }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>DATE & TIME</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>OS</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>IP ADDRESS</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>DEVICE</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>BROWSER</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loginHistory.map((entry, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {new Date(entry.dateTime).toLocaleString()}
                                    </td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {entry.os}
                                    </td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {entry.ipAddress}
                                    </td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {entry.device}
                                    </td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {entry.browser}
                                    </td>
                                    <td className="py-4 px-2">
                                        <span
                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: entry.status === 'successful'
                                                    ? 'rgba(76, 175, 80, 0.1)'
                                                    : 'rgba(239, 68, 68, 0.1)',
                                                color: entry.status === 'successful'
                                                    ? 'var(--color-success)'
                                                    : 'var(--color-danger)'
                                            }}
                                        >
                                            {entry.status === 'successful' ? (
                                                <CheckCircle className="w-3 h-3" />
                                            ) : (
                                                <XCircle className="w-3 h-3" />
                                            )}
                                            {entry.status === 'successful' ? 'Successful' : 'Failed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button className="w-8 h-8 rounded-full" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        ←
                    </button>
                    <button className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                        1
                    </button>
                    <button className="w-8 h-8 rounded-full" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        →
                    </button>
                </div>
            </div>
        </div>
    );
}
