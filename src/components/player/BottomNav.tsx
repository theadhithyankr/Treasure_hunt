type TabType = 'clue' | 'leaderboard' | 'announcements';

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const tabs = [
        { id: 'clue' as TabType, icon: '🗺️', label: 'Clue' },
        { id: 'leaderboard' as TabType, icon: '🏆', label: 'Ranks' },
        { id: 'announcements' as TabType, icon: '📢', label: 'News' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-treasure-500 safe-area-bottom shadow-lg z-20">
            <div className="flex justify-around py-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-treasure-100 text-treasure-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="text-2xl">{tab.icon}</span>
                        <span className="text-xs mt-1 font-semibold">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
