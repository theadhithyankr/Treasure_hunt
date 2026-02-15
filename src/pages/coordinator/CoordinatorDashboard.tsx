import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import TeamManagement from '../../components/coordinator/TeamManagement';
import ClueManagement from '../../components/coordinator/ClueManagement';
import SubmissionQueue from '../../components/coordinator/SubmissionQueue';
import BroadcastPanel from '../../components/coordinator/BroadcastPanel';
import { useTeams, useClues, useSubmissions } from '../../hooks/useFirestore';

type TabType = 'teams' | 'clues' | 'submissions' | 'broadcast';

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
        <div className="min-h-screen bg-treasure-50">
            {/* Header */}
            <header className="bg-treasure-500 text-white p-4 safe-area-top sticky top-0 z-10 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">🧭 Coordinator Dashboard</h1>
                        <p className="text-sm text-treasure-100">
                            {teams.length} teams • {clues.length} clues
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-3 py-2 bg-treasure-600 rounded-lg text-sm hover:bg-treasure-700 active:bg-treasure-800"
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
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-treasure-500 safe-area-bottom shadow-lg z-20">
                <div className="flex justify-around py-2">
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`flex flex - col items - center p - 2 min - w - [60px] rounded - lg transition - colors ${activeTab === 'teams'
                                ? 'bg-treasure-100 text-treasure-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            } `}
                    >
                        <span className="text-2xl">👥</span>
                        <span className="text-xs mt-1 font-semibold">Teams</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('clues')}
                        className={`flex flex - col items - center p - 2 min - w - [60px] rounded - lg transition - colors ${activeTab === 'clues'
                                ? 'bg-treasure-100 text-treasure-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            } `}
                    >
                        <span className="text-2xl">📝</span>
                        <span className="text-xs mt-1 font-semibold">Clues</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('submissions')}
                        className={`flex flex - col items - center p - 2 min - w - [60px] rounded - lg transition - colors relative ${activeTab === 'submissions'
                                ? 'bg-treasure-100 text-treasure-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            } `}
                    >
                        {pendingSubmissions.length > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {pendingSubmissions.length}
                            </span>
                        )}
                        <Check className="w-6 h-6" />
                        <span className="text-xs mt-1 font-semibold">Queue</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('broadcast')}
                        className={`flex flex - col items - center p - 2 min - w - [60px] rounded - lg transition - colors ${activeTab === 'broadcast'
                                ? 'bg-treasure-100 text-treasure-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            } `}
                    >
                        <span className="text-2xl">📢</span>
                        <span className="text-xs mt-1 font-semibold">News</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
