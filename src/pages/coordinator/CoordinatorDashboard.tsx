import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Check, Megaphone, Search } from 'lucide-react';
import TeamManagement from '../../components/coordinator/TeamManagement';
import ClueManagement from '../../components/coordinator/ClueManagement';
import SubmissionQueue from '../../components/coordinator/SubmissionQueue';
import BroadcastPanel from '../../components/coordinator/BroadcastPanel';
import MysteryManagement from '../../components/coordinator/MysteryManagement';
import { useTeams, useClues, useSubmissions } from '../../hooks/useFirestore';

type TabType = 'teams' | 'clues' | 'submissions' | 'broadcast' | 'mystery';

export default function CoordinatorDashboard() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('teams');

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
                    <TeamManagement teams={teams} loading={teamsLoading} />
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

                {activeTab === 'mystery' && (
                    <MysteryManagement />
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

                    <button
                        onClick={() => setActiveTab('mystery')}
                        className={`flex flex-col items-center p-2 min-w-[70px] rounded-xl transition-all ${activeTab === 'mystery'
                            ? 'bg-gradient-primary text-white shadow-glow-primary'
                            : 'text-gray-600 hover:bg-primary-50'
                            }`}
                    >
                        <Search className="w-6 h-6" />
                        <span className="text-xs mt-1 font-semibold">Mystery</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
