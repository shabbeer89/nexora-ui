'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import BotDetailView from '@/components/nexora/BotDetailView';

export default function BotDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { fetchBots } = useStore();

    if (!id) return null;

    return (
        <div className="animate-in fade-in duration-700">
            <BotDetailView
                botId={id as string}
                onBack={() => {
                    fetchBots();
                    router.push('/nexora/engines');
                }}
            />
        </div>
    );
}
