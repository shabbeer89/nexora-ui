'use client';

import { useRouter } from 'next/navigation';
import FleetOrchestration from '@/components/nexora/FleetOrchestration';

export default function EnginesPage() {
    const router = useRouter();

    return (
        <div className="animate-in fade-in duration-700">
            <FleetOrchestration
                onSelectBot={(id) => router.push(`/nexora/engines/${id}`)}
                onCreateNew={() => router.push('/nexora/engines/new')}
            />
        </div>
    );
}
