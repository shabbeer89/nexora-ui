'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import BotWizard from '@/components/nexora/BotWizard';

export default function NewBotPage() {
    const router = useRouter();
    const { fetchBots } = useStore();

    return (
        <div className="animate-in fade-in duration-700">
            <BotWizard
                onClose={() => router.push('/nexora/engines')}
                onSuccess={() => {
                    fetchBots();
                    router.push('/nexora/engines');
                }}
            />
        </div>
    );
}
