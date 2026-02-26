import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Unlock, Search, XCircle, X } from 'lucide-react';
import ClueDisplay from '../../components/player/ClueDisplay';
import Announcements from '../../components/player/Announcements';
import BottomNav from '../../components/player/BottomNav';
import MysteryDrawer from '../../components/player/MysteryDrawer';
import { useClues, useTeam } from '../../hooks/useFirestore';
import { useMysteryData, useUnlockedEvidence, useTeamAccusation } from '../../hooks/useMystery';
import { collection, query, orderBy, limit, onSnapshot, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

type TabType = 'clues' | 'leaderboard' | 'announcements';

export default function PlayerDashboard() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('clues');
    const [unreadCount, setUnreadCount] = useState(0);
    const [mysteryDrawerOpen, setMysteryDrawerOpen] = useState(false);

    const { clues, loading: cluesLoading } = useClues();
    const { team, loading: teamLoading } = useTeam(currentUser?.teamId);
    const { mystery } = useMysteryData();
    const { unlockedEvidence } = useUnlockedEvidence(team?.completedClues || []);

    // Rejection toast state
    const [rejectionToasts, setRejectionToasts] = useState<Array<{ id: string; message: string }>>([]);

    const completedClueIds = team?.completedClues || [];
    const totalCount = clues.length;
    const completedCount = completedClueIds.length;

    // Check if team has accused
    const { accusation } = useTeamAccusation(currentUser?.teamId || '');

    // Check if mystery is unlocked for this team
    // It must be active, they must have found the start clue, AND they shouldn't have solved it yet
    const isMysterySolved = accusation?.correct === true;

    const isMysteryUnlocked = mystery?.active &&
        (!mystery.startClueId || completedClueIds.includes(mystery.startClueId)) &&
        !isMysterySolved;

    // Check if mystery is "in progress" (unlocked but not yet accused/revealed)
    const isMysteryInProgress = isMysteryUnlocked && !accusation && !mystery.revealed;

    // Find current clue (first incomplete clue)
    const currentClue = clues.find(clue => !completedClueIds.includes(clue.id));
    const currentClueIndex = currentClue ? clues.findIndex(c => c.id === currentClue.id) : -1;

    // Listen for rejection notifications pushed by coordinator
    useEffect(() => {
        if (!currentUser?.teamId) return;

        const q = query(
            collection(db, 'notifications'),
            where('teamId', '==', currentUser.teamId),
            where('read', '==', false),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const toastId = change.doc.id;

                    // Show toast
                    setRejectionToasts(prev => [...prev, { id: toastId, message: data.message || 'Your submission was rejected. Try again!' }]);

                    // Auto-dismiss after 8 seconds
                    setTimeout(() => {
                        setRejectionToasts(prev => prev.filter(t => t.id !== toastId));
                    }, 8000);

                    // Mark as read in Firestore so it doesn't re-appear on refresh
                    updateDoc(doc(db, 'notifications', toastId), { read: true });
                }
            });
        });

        return () => unsubscribe();
    }, [currentUser?.teamId]);

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
        <div className={`min-h-screen pb-20 transition-colors duration-1000 ${isMysteryUnlocked
            ? 'bg-slate-900 text-slate-100'
            : 'bg-gradient-to-br from-blue-50 via-white to-orange-50'
            }`}>
            {/* Header */}
            <header className={`${isMysteryUnlocked
                ? 'bg-slate-800/90 border-slate-700 shadow-purple-900/20'
                : 'bg-gradient-primary text-white shadow-glow-primary'
                } backdrop-blur-md sticky top-0 z-10 px-4 py-3 border-b border-transparent transition-all duration-1000`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className={`text-xl font-bold truncate ${isMysteryUnlocked
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-400'
                            : 'text-white'
                            }`}>
                            {isMysteryUnlocked ? '🕵️ Murder Mystery' : (currentUser?.teamName || team?.name)}
                        </h1>
                        {isMysteryInProgress && (
                            <p className="text-sm text-red-400 font-semibold animate-pulse">
                                ⚠️ Mystery in Progress
                            </p>
                        )}
                        {isMysterySolved && (
                            <p className="text-sm">
                                <span className="px-2 py-0.5 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full text-xs font-bold text-green-100">
                                    ✓ Case Solved
                                </span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleSignOut}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isMysteryUnlocked
                            ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                            : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 active:bg-white/40'
                            }`}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 safe-area-bottom">
                {activeTab === 'clues' && (
                    !cluesLoading && !teamLoading ? (
                        isMysteryInProgress ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-fade-in">
                                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-sm w-full">
                                    <div className="text-6xl mb-4">🕵️‍♀️</div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Mystery Unlocked!</h2>
                                    <p className="text-slate-400 mb-6">
                                        A crime has been committed. You must solve the mystery before continuing the treasure hunt.
                                    </p>
                                    <button
                                        onClick={() => setMysteryDrawerOpen(true)}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all animate-pulse"
                                    >
                                        Open Case File
                                    </button>
                                </div>
                            </div>
                        ) : (
                            currentClue ? (
                                <ClueDisplay
                                    clue={currentClue}
                                    clueIndex={currentClueIndex}
                                    totalClues={totalCount}
                                    completedClues={completedCount}
                                    isMysteryTheme={isMysteryUnlocked}
                                />
                            ) : (
                                <div className={`card text-center py-12 ${isMysteryUnlocked ? 'bg-slate-800 border-slate-700' : ''
                                    }`}>
                                    <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                                    <h2 className={`text-2xl font-bold mb-2 ${isMysteryUnlocked ? 'text-white' : 'text-gray-900'
                                        }`}>All Clues Completed!</h2>
                                    <p className={isMysteryUnlocked ? 'text-slate-400' : 'text-gray-600'}>
                                        Congratulations! You've solved all the clues! 🎉
                                    </p>
                                </div>
                            )
                        )
                    ) : (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        </div>
                    )
                )}

                {activeTab === 'announcements' && (
                    <Announcements isMysteryTheme={isMysteryUnlocked} />
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                unreadAnnouncementsCount={unreadCount}
                isMysteryTheme={isMysteryUnlocked}
            />

            {/* Mystery Drawer Button */}
            {isMysteryUnlocked && (
                <button
                    onClick={() => setMysteryDrawerOpen(true)}
                    className="fixed top-20 right-4 z-30 w-14 h-14 bg-gradient-to-br from-purple-600 to-red-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 active:scale-95 transition-all flex items-center justify-center animate-bounce-slow"
                >
                    <Search className="w-6 h-6" />
                    {unlockedEvidence.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg border-2 border-slate-900">
                            {unlockedEvidence.length}
                        </span>
                    )}
                </button>
            )}

            {/* Rejection Toasts */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
                {rejectionToasts.map(toast => (
                    <div
                        key={toast.id}
                        className="flex items-start gap-3 bg-red-600 text-white px-4 py-3 rounded-2xl shadow-2xl pointer-events-auto animate-fade-in"
                    >
                        <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">Submission Rejected</p>
                            <p className="text-xs text-red-200">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => setRejectionToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="flex-shrink-0 hover:text-red-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Mystery Drawer */}
            <MysteryDrawer
                isOpen={mysteryDrawerOpen}
                onClose={() => setMysteryDrawerOpen(false)}
                teamId={currentUser?.teamId || ''}
                teamName={currentUser?.teamName || ''}
                completedClues={completedClueIds}
            />
        </div>
    );
}
