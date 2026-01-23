'use client';

import RegimeDashboard from '@/components/nexora/RegimeDashboard';
import RiskMonitoring from '@/components/nexora/RiskMonitoring';
import UnifiedPortfolio from '@/components/nexora/UnifiedPortfolio';

export default function OverviewPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <RegimeDashboard />
                <RiskMonitoring />
            </div>
            <div className="pt-4">
                <UnifiedPortfolio />
            </div>
        </div>
    );
}
