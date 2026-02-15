import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Unlock } from 'lucide-react';
import ClueDisplay from '../../components/player/ClueDisplay';
import Leaderboard from '../../components/player/Leaderboard';
import Announcements from '../../components/player/Announcements';
import BottomNav from '../../components/player/BottomNav';
import { useClues } from '../../hooks/useFirestore';
import { useTeam } from '../../hooks/useFirestore';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

type TabType = 'clues' | 'leaderboard' | 'announcements';

export default function PlayerDashboard() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('clues');
    const [unreadCount, setUnreadCount] = useState(0);

    const { clues, loading: cluesLoading } = useClues();
    const { team, loading: teamLoading } = useTeam(currentUser?.teamId);

    const completedClueIds = team?.completedClues || [];
    const totalCount = clues.length;
    const completedCount = completedClueIds.length;

    // Find current clue (first incomplete clue)
    const currentClue = clues.find(clue => !completedClueIds.includes(clue.id));
    const currentClueIndex = currentClue ? clues.findIndex(c => c.id === currentClue.id) : -1;

    // Track unread announcements
    useEffect(() => {
        const q = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setUnreadCount(0);
                return;
            }

            const latestAnnouncement = snapshot.docs[0];
            const latestTimestamp = latestAnnouncement.data().createdAt?.toMillis() || 0;
            const lastRead = parseInt(localStorage.getItem('lastReadAnnouncement') || '0');

            if (latestTimestamp > lastRead) {
                // Count unread announcements
                const unreadQuery = query(
                    collection(db, 'announcements'),
                    orderBy('createdAt', 'desc')
                );

                onSnapshot(unreadQuery, (allSnapshot) => {
                    const unread = allSnapshot.docs.filter(doc => {
                        const timestamp = doc.data().createdAt?.toMillis() || 0;
                        return timestamp > lastRead;
                    });
                    setUnreadCount(unread.length);
                });
            } else {
                setUnreadCount(0);
            }
        });

        return unsubscribe;
    }, []);

    // Mark announcements as read when viewing
    useEffect(() => {
        if (activeTab === 'announcements') {
            localStorage.setItem('lastReadAnnouncement', Date.now().toString());
            setUnreadCount(0);
        }
    }, [activeTab]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (cluesLoading || teamLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 pb-20">
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
            <main className="p-4">
                {activeTab === 'clues' && (
                    currentClue ? (
                        <ClueDisplay
                            clue={currentClue}
                            clueIndex={currentClueIndex}
                            totalClues={totalCount}
                            completedClues={completedCount}
                        />
                    ) : (
                        <div className="card text-center py-12">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Clues Completed!</h2>
                            <p className="text-gray-600">
                                Congratulations! You've solved all the clues! 🎉
                            </p>
                        </div>
                    )
                )}

                {activeTab === 'leaderboard' && (
                    <Leaderboard />
                )}

                {activeTab === 'announcements' && (
                    <Announcements />
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                unreadAnnouncementsCount={unreadCount}
            />
        </div>
    );
}
