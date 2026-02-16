import { Trophy, Users, Shield, ArrowRight } from 'lucide-react';
import type { Team, Clue } from '../../types';

interface CoordinatorLeaderboardProps {
    teams: Team[];
    clues: Clue[];
    onManageTeams: () => void;
}

export default function CoordinatorLeaderboard({ teams, clues, onManageTeams }: CoordinatorLeaderboardProps) {
    // Sort teams by completed clues count (descending)
    // Note: detailed timestamps aren't available in Team type yet, so we sort by count only
    const sortedTeams = [...teams].sort((a, b) => {
        const countA = a.completedClues?.length || 0;
        const countB = b.completedClues?.length || 0;
        if (countA !== countB) return countB - countA;
        return a.name.localeCompare(b.name);
    });

    const totalClues = clues.length;

    return (
        <div className="p-4 safe-area-bottom pb-24">
            {/* Header with Manage Toggle */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Leaderboard
                    </h2>
                    <p className="text-sm text-gray-600">
                        {teams.length} teams competing
                    </p>
                </div>
                <button
                    onClick={onManageTeams}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl font-semibold shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-sm"
                >
                    <Users className="w-4 h-4" />
                    Manage Teams
                </button>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-4">
                {sortedTeams.map((team, index) => {
                    const completedCount = team.completedClues?.length || 0;
                    const progress = totalClues > 0 ? (completedCount / totalClues) * 100 : 0;
                    const isWinner = totalClues > 0 && completedCount === totalClues;

                    // Rank styling
                    let rankColor = 'text-gray-500 font-semibold';
                    let rankBg = 'bg-gray-100';
                    if (index === 0) { rankColor = 'text-yellow-600 font-bold'; rankBg = 'bg-yellow-100 border-yellow-200'; }
                    if (index === 1) { rankColor = 'text-gray-600 font-bold'; rankBg = 'bg-gray-200 border-gray-300'; }
                    if (index === 2) { rankColor = 'text-amber-700 font-bold'; rankBg = 'bg-orange-100 border-orange-200'; }

                    return (
                        <div key={team.id} className="glass rounded-3xl p-4 relative overflow-hidden transition-all hover:shadow-lg">
                            {/* Progress Background (Subtle) */}
                            <div
                                className="absolute bottom-0 left-0 top-[95%] h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            />

                            <div className="flex items-center gap-4 relative z-10">
                                {/* Rank Badge */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${rankBg} ${rankColor} shadow-inner`}>
                                    {index + 1}
                                </div>

                                {/* Team Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-gray-900 truncate">
                                            {team.name}
                                        </h3>
                                        {isWinner && (
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200 flex items-center gap-1">
                                                <Trophy className="w-3 h-3" />
                                                WINNER
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Stats */}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-4 text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Shield className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium text-gray-900">{completedCount}</span>
                                                <span className="text-gray-400">/</span>
                                                <span>{totalClues}</span>
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span className="font-mono text-gray-500">{team.code}</span>
                                        </div>
                                        <span className="font-bold text-primary-600">
                                            {Math.round(progress)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {teams.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No teams yet.</p>
                        <p className="text-sm mt-1">Create teams in the "Manage Teams" section.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
