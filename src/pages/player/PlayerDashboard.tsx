import { useState } from 'react';
import { useClues, useTeam } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Clue } from '../../types';
import { Map, Unlock, PartyPopper } from 'lucide-react';
import ClueDisplay from '../../components/player/ClueDisplay';
import Leaderboard from '../../components/player/Leaderboard';
import Announcements from '../../components/player/Announcements';
import BottomNav from '../../components/player/BottomNav';

type TabType = 'clue' | 'leaderboard' | 'announcements';

export default function PlayerDashboard() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('clue');

    const { team, loading: teamLoading } = useTeam(currentUser?.teamId);
    const { clues, loading: cluesLoading } = useClues();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    // Find current clue (first incomplete clue)
    const currentClue = clues.find((clue: Clue) =>
        !team?.completedClues?.includes(clue.id)
    );

    const completedCount = team?.completedClues?.length || 0;
    const totalCount = clues.length;

    if (teamLoading || cluesLoading) {
        return (
            <div className="min-h-screen bg-treasure-50 flex items-center justify-center">
                <div className="text-center">
                    <Map className="w-16 h-16 mb-4 animate-bounce" />
                    <p className="text-treasure-700 text-lg">Loading your adventure...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
            {/* Header */}
            <header className="bg-gradient-primary text-white p-4 sticky top-0 z-10 shadow-glow-primary">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold truncate text-white">{currentUser?.teamName || team?.name}</h1>
                        <p className="text-sm text-white/90 flex items-center gap-1">
                            <Unlock className="w-4 h-4" />
                            {completedCount}/{totalCount} Clues Solved
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold text-white hover:bg-white/30 active:bg-white/40 transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="pb-20">
                {activeTab === 'clue' && (
                    <div className="p-4">
                        {currentClue ? (
                            <ClueDisplay
                                clue={currentClue}
                                clueIndex={clues.indexOf(currentClue)}
                                totalClues={totalCount}
                                completedClues={completedCount}
                            />
                        ) : (
                            <div className="card text-center py-12">
                                <PartyPopper className="w-16 h-16 mb-4" />
                                <h2 className="text-2xl font-adventure text-treasure-700 mb-2">
                                    All Clues Completed!
                                </h2>
                                <p className="text-gray-600">
                                    Congratulations! You've solved all the clues!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <Leaderboard />
                )}

                {activeTab === 'announcements' && (
                    <Announcements />
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
