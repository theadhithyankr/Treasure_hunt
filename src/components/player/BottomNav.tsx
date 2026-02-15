import { Map, Trophy, Megaphone } from 'lucide-react';

type TabType = 'clues' | 'leaderboard' | 'announcements';

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    unreadAnnouncementsCount?: number;
}

export default function BottomNav({ activeTab, onTabChange, unreadAnnouncementsCount = 0 }: BottomNavProps) {
    const tabs = [
        { id: 'clues' as TabType, icon: Map, label: 'Clue' },
        { id: 'leaderboard' as TabType, icon: Trophy, label: 'Ranks' },
        { id: 'announcements' as TabType, icon: Megaphone, label: 'News', badge: unreadAnnouncementsCount },
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
                                className={`flex flex-col items-center p-3 min-w-[70px] rounded-2xl transition-all duration-300 relative ${isActive
                                        ? 'bg-gradient-primary text-white shadow-glow-primary scale-105'
                                        : 'text-gray-600 hover:bg-white/50 active:scale-95'
                                    }`}
                            >
                                {/* Notification badge */}
                                {tab.badge && tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                                        {tab.badge}
                                    </span>
                                )}
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
