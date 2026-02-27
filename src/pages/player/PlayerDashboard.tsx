import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, XCircle, X } from 'lucide-react';
import ClueDisplay from '../../components/player/ClueDisplay';
import Announcements from '../../components/player/Announcements';
import BottomNav from '../../components/player/BottomNav';
import { useClues, useTeam, useTreasureConfig } from '../../hooks/useFirestore';
import { collection, query, orderBy, limit, onSnapshot, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import TreasureRevealScreen from '../../components/player/TreasureRevealScreen';

type TabType = 'clues' | 'leaderboard' | 'announcements';

export default function PlayerDashboard() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('clues');
    const [unreadCount, setUnreadCount] = useState(0);

    const { clues, loading: cluesLoading } = useClues();
    const { team, loading: teamLoading } = useTeam(currentUser?.teamId);
    const { config: treasureConfig, loading: configLoading } = useTreasureConfig();


    // If treasure access is granted, show reveal screen
    if (!teamLoading && team?.treasureApproved && !configLoading) {
        return (
            <TreasureRevealScreen
                teamId={team.id}
                teamName={team.name}
                config={treasureConfig}
                alreadyCompleted={!!team.formulaCompleted}
            />
        );
    }

    // Rejection toast state
    const [rejectionToasts, setRejectionToasts] = useState<Array<{ id: string; message: string }>>([]);

    const completedClueIds = team?.completedClues || [];
    const totalCount = clues.length;
    const completedCount = completedClueIds.length;

    // Find current clue (first incomplete clue)
    const currentClue = clues.find(clue => !completedClueIds.includes(clue.id));
    const currentClueIndex = currentClue ? clues.findIndex(c => c.id === currentClue.id) : -1;

    // Show "New Level Unlocked" message if more than 8 clues completed and no current clue (or just as a milestone)
    // Actually, user said: "after 8 clues show the text saying new level unlocked"
    // Assuming this means INSTEAD of the 9th clue, or as a persistent message?
    // Let's assume it blocks them until they act, or just replaces the view.
    // "We are doing it offline after 8 clues" implies the app stops giving clues.
    
    // If completed >= 8 and we want to stop them:
    const showOfflineMessage = completedCount >= 8;

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
        <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-orange-50 transition-colors duration-1000">
            {/* Header */}
            <header className="bg-gradient-primary text-white shadow-glow-primary backdrop-blur-md sticky top-0 z-10 px-4 py-3 border-b border-transparent transition-all duration-1000">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold truncate text-white">
                            {currentUser?.teamName || team?.name}
                        </h1>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 active:bg-white/40"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 safe-area-bottom">
                {activeTab === 'clues' && (
                    !cluesLoading && !teamLoading ? (
                        showOfflineMessage ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-fade-in">
                                <div className="bg-slate-900 p-8 rounded-3xl border border-amber-500/30 shadow-2xl max-w-sm w-full relative overflow-hidden">
                                     <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-shimmer" />
                                    <div className="text-6xl mb-4 animate-bounce">🚪🗝️</div>
                                    <h2 className="text-2xl font-bold text-amber-500 mb-2">New Level Unlocked!</h2>
                                    <p className="text-slate-300 font-mono text-sm leading-relaxed">
                                        You have proven your worth by solving 8 clues.
                                        <br/><br/>
                                        The next phase is strictly offline.
                                        <br/>
                                        <span className="text-white font-bold">Contact a coordinator to proceed.</span>
                                    </p>
                                    <div className="mt-6 flex justify-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                        <span className="w-2 h-2 rounded-full bg-white opacity-50"></span>
                                        <span className="w-2 h-2 rounded-full bg-white opacity-50"></span>
                                    </div>
                                </div>
                            </div>
                        ) : (
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
                                    <h2 className="text-2xl font-bold mb-2 text-gray-900">All Clues Completed!</h2>
                                    <p className="text-gray-600">
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
                    <Announcements />
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                unreadAnnouncementsCount={unreadCount}
            />

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
        </div>
    );
}
