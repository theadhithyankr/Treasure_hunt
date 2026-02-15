import { Map, Trophy, Megaphone } from 'lucide-react';

type TabType = 'clue' | 'leaderboard' | 'announcements';

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const tabs = [
        { id: 'clue' as TabType, icon: Map, label: 'Clue' },
        { id: 'leaderboard' as TabType, icon: Trophy, label: 'Ranks' },
        { id: 'announcements' as TabType, icon: Megaphone, label: 'News' },
    ];

    return (
        <nav className="fixed bottom-4 left-4 right-4 z-20 animate-slide-up">
            <div className="glass rounded-3xl shadow-glass p-2">
                <div className="flex justify-around gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex flex-col items-center p-3 min-w-[70px] rounded-2xl transition-all duration-300 ${isActive
                                        ? 'bg-gradient-primary text-white shadow-glow-primary scale-105'
                                        : 'text-gray-600 hover:bg-white/50 active:scale-95'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'animate-scale-in' : ''}`} />
                                <span className="text-xs mt-1 font-semibold">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
