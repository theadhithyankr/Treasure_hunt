import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Check, Megaphone, Activity } from 'lucide-react';
import TeamManagement from '../../components/coordinator/TeamManagement';
import ClueManagement from '../../components/coordinator/ClueManagement';
import SubmissionQueue from '../../components/coordinator/SubmissionQueue';
import BroadcastPanel from '../../components/coordinator/BroadcastPanel';
import CoordinatorLeaderboard from '../../components/coordinator/CoordinatorLeaderboard';
import LiveProgress from '../../components/coordinator/LiveProgress';
import { useTeams, useClues, useSubmissions } from '../../hooks/useFirestore';

type TabType = 'teams' | 'clues' | 'submissions' | 'broadcast';
type TeamViewType = 'leaderboard' | 'management' | 'tracking';

export default function CoordinatorDashboard() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('teams');
    const [teamView, setTeamView] = useState<TeamViewType>('leaderboard');

    const { teams, loading: teamsLoading } = useTeams();
    const { clues, loading: cluesLoading } = useClues();
    const { submissions, loading: submissionsLoading } = useSubmissions();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const pendingSubmissions = submissions.filter(s => s.status === 'pending');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
            {/* Header */}
            <header className="bg-gradient-primary text-white p-4 safe-area-top sticky top-0 z-10 shadow-glow-primary">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">🧭 Coordinator Dashboard</h1>
                        <p className="text-sm text-white/90">
                            {teams.length} teams • {clues.length} clues
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold hover:bg-white/30 active:bg-white/40 transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="pb-20">
                {activeTab === 'teams' && (
                    <div className="flex flex-col gap-4">
                        {/* Sub-Navigation for Teams */}
                        <div className="flex justify-center p-2 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 shadow-sm gap-2 mx-4 mt-2 rounded-xl">
                             <button
                                onClick={() => setTeamView('leaderboard')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    teamView === 'leaderboard' 
                                    ? 'bg-amber-100 text-amber-900 shadow-sm ring-1 ring-amber-200' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                Leaderboard
                            </button>
                            <button
                                onClick={() => setTeamView('tracking')}
                                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    teamView === 'tracking' 
                                    ? 'bg-amber-100 text-amber-900 shadow-sm ring-1 ring-amber-200' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                <Activity className="w-4 h-4" />
                                Live Tracking
                            </button>
                            <button
                                onClick={() => setTeamView('management')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    teamView === 'management' 
                                    ? 'bg-amber-100 text-amber-900 shadow-sm ring-1 ring-amber-200' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                Manage
                            </button>
                        </div>

                        <div className="px-4">
                            {teamView === 'leaderboard' && (
                                <CoordinatorLeaderboard
                                    teams={teams}
                                    clues={clues}
                                    onManageTeams={() => setTeamView('management')}
                                />
                            )}
                            {teamView === 'tracking' && <LiveProgress />}
                            {teamView === 'management' && <TeamManagement teams={teams} loading={teamsLoading} />}
                        </div>
                    </div>
                )}

                {activeTab === 'clues' && (
                    <ClueManagement clues={clues} loading={cluesLoading} />
                )}

                {activeTab === 'submissions' && (
                    <SubmissionQueue submissions={pendingSubmissions} loading={submissionsLoading} />
                )}

                {activeTab === 'broadcast' && (
                    <BroadcastPanel />
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 glass border-t border-primary-200 safe-area-bottom shadow-glass z-20">
                <div className="flex justify-around py-2">
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`flex flex-col items-center p-2 min-w-[70px] rounded-xl transition-all ${activeTab === 'teams'
                            ? 'bg-gradient-primary text-white shadow-glow-primary'
                            : 'text-gray-600 hover:bg-primary-50'
                            }`}
                    >
                        <Users className="w-6 h-6" />
                        <span className="text-xs mt-1 font-semibold">Teams</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('clues')}
                        className={`flex flex-col items-center p-2 min-w-[70px] rounded-xl transition-all ${activeTab === 'clues'
                            ? 'bg-gradient-primary text-white shadow-glow-primary'
                            : 'text-gray-600 hover:bg-primary-50'
                            }`}
                    >
                        <FileText className="w-6 h-6" />
                        <span className="text-xs mt-1 font-semibold">Clues</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('submissions')}
                        className={`flex flex-col items-center p-2 min-w-[70px] rounded-xl transition-all relative ${activeTab === 'submissions'
                            ? 'bg-gradient-primary text-white shadow-glow-primary'
                            : 'text-gray-600 hover:bg-primary-50'
                            }`}
                    >
                        {pendingSubmissions.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                                {pendingSubmissions.length}
                            </span>
                        )}
                        <Check className="w-6 h-6" />
                        <span className="text-xs mt-1 font-semibold">Queue</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('broadcast')}
                        className={`flex flex-col items-center p-2 min-w-[70px] rounded-xl transition-all ${activeTab === 'broadcast'
                            ? 'bg-gradient-primary text-white shadow-glow-primary'
                            : 'text-gray-600 hover:bg-primary-50'
                            }`}
                    >
                        <Megaphone className="w-6 h-6" />
                        <span className="text-xs mt-1 font-semibold">News</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
