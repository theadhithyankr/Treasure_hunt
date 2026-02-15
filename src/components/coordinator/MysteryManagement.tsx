import { useState } from 'react';
import MysterySetup from './mystery/MysterySetup';
import MysteryStatus from './mystery/MysteryStatus';
import { Settings, Activity } from 'lucide-react';

type TabType = 'setup' | 'status';

export default function MysteryManagement() {
    const [activeTab, setActiveTab] = useState<TabType>('status');

    const tabs = [
        { id: 'status' as TabType, label: 'Status', icon: Activity },
        { id: 'setup' as TabType, label: 'Setup', icon: Settings },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="bg-gradient-primary p-4 safe-area-top sticky top-0 z-10 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-3">🔍 Mystery Management</h2>
                <div className="flex gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'bg-white text-primary-600 shadow-lg'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-safe">
                {activeTab === 'status' && <MysteryStatus />}
                {activeTab === 'setup' && <MysterySetup />}
            </div>
        </div>
    );
}
