'use client';

import TradingCockpit from '@/components/dashboard/TradingCockpit';

export default function CockpitPage() {
    return (
        <div className="animate-in fade-in zoom-in-95 duration-700">
            <TradingCockpit symbol="BTC-USDT" />
        </div>
    );
}
