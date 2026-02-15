import { Trophy, Crown, Award } from 'lucide-react';
import { useTeams } from '../../hooks/useFirestore';
import type { Team } from '../../types';

export default function Leaderboard() {
    const { teams: leaderboard, loading } = useTeams();

    if (loading) {
        return (
            <div className="p-6 text-center">
                <Trophy className="w-10 h-10 mb-2 animate-pulse mx-auto text-primary-500" />
                <p className="text-gray-700">Loading rankings...</p>
            </div>
        );
    }

    return (
        <div className="px-4 py-6">
            <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-primary-500" />
                <span className="bg-gradient-primary bg-clip-text text-transparent">Leaderboard</span>
            </h2>

            {leaderboard.length === 0 ? (
                <div className="card text-center py-8">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No teams yet!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {leaderboard.map((team: Team, index: number) => (
                        <div
                            key={team.id}
                            className={`glass rounded-2xl p-4 flex items-center transition-all hover:shadow-xl ${index === 0
                                ? 'border-2 border-yellow-400 shadow-glow-accent'
                                : 'border border-white/30'
                                }`}
                        >
                            {/* Rank badge */}
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${index === 0
                                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg'
                                    : index === 1
                                        ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                                        : index === 2
                                            ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                                            : 'bg-gradient-primary'
                                    }`}
                            >
                                {index + 1}
                            </div>

                            {/* Team info */}
                            <div className="flex-1 ml-4 min-w-0">
                                <h3 className="font-bold text-lg truncate text-gray-900">{team.name}</h3>
                                <p className="text-sm text-gray-600">
                                    {team.completedClues?.length || 0} clues solved
                                </p>
                            </div>

                            {/* Crown icon - only for 1st place */}
                            {index === 0 && (
                                <div className="ml-2 flex-shrink-0">
                                    <Crown className="w-7 h-7 text-yellow-500" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
