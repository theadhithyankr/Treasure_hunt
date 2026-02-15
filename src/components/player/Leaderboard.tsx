import { useLeaderboard } from '../../hooks/useFirestore';
import type { Team } from '../../types';

export default function Leaderboard() {
    const { leaderboard, loading } = useLeaderboard();

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="text-4xl mb-2 animate-pulse">🏆</div>
                <p className="text-treasure-700">Loading rankings...</p>
            </div>
        );
    }

    return (
        <div className="px-4 py-6">
            <h2 className="text-2xl font-adventure text-treasure-700 mb-4 text-center">
                🏆 Leaderboard
            </h2>

            {leaderboard.length === 0 ? (
                <div className="card text-center py-8">
                    <p className="text-gray-600">No teams yet!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {leaderboard.map((team: Team, index: number) => (
                        <div
                            key={team.id}
                            className={`bg-white rounded-lg p-4 shadow-lg flex items-center ${index === 0 ? 'border-4 border-yellow-400' : 'border-2 border-treasure-200'
                                }`}
                        >
                            {/* Rank badge */}
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${index === 0
                                    ? 'bg-yellow-500'
                                    : index === 1
                                        ? 'bg-gray-400'
                                        : index === 2
                                            ? 'bg-amber-600'
                                            : 'bg-treasure-500'
                                    }`}
                            >
                                {index + 1}
                            </div>

                            {/* Team info */}
                            <div className="flex-1 ml-4 min-w-0">
                                <h3 className="font-bold text-lg truncate">{team.name}</h3>
                                <p className="text-sm text-gray-600">
                                    {team.completedClues?.length || 0} clues solved
                                </p>
                            </div>

                            {/* Trophy for leader */}
                            {index === 0 && <span className="text-3xl ml-2">👑</span>}
                            {index === 1 && <span className="text-3xl ml-2">🥈</span>}
                            {index === 2 && <span className="text-3xl ml-2">🥉</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
