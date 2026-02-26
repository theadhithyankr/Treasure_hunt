import { Map, Megaphone } from 'lucide-react';

type TabType = 'clues' | 'leaderboard' | 'announcements';

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    unreadAnnouncementsCount?: number;
    isMysteryTheme?: boolean;
}

export default function BottomNav({ activeTab, onTabChange, unreadAnnouncementsCount = 0, isMysteryTheme }: BottomNavProps) {
    const tabs = [
        { id: 'clues' as TabType, icon: Map, label: 'Clue' },
        { id: 'announcements' as TabType, icon: Megaphone, label: 'News', badge: unreadAnnouncementsCount },
    ];

    return (
        <nav className="fixed bottom-4 left-4 right-4 z-20 animate-slide-up">
            <div className={`rounded-3xl p-2 transition-colors duration-500 ${isMysteryTheme
                ? 'bg-slate-800/90 border border-slate-700 shadow-purple-900/20 backdrop-blur-md'
                : 'glass shadow-glass'
                }`}>
                <div className="flex justify-around items-center">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex flex-col items-center p-2 min-w-[60px] rounded-2xl transition-all duration-300 relative ${isActive
                                    ? isMysteryTheme
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 scale-105'
                                        : 'bg-gradient-primary text-white shadow-glow-primary scale-105'
                                    : isMysteryTheme
                                        ? 'text-slate-400 hover:bg-slate-700'
                                        : 'text-gray-500 hover:bg-white/50'
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
