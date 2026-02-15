import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Team } from '../../types';
import { generateTeamCode } from '../../utils/helpers';
import { hapticSuccess } from '../../utils/haptics';

interface TeamManagementProps {
    teams: Team[];
    loading: boolean;
}

export default function TeamManagement({ teams, loading }: TeamManagementProps) {
    const [showForm, setShowForm] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            const teamCode = generateTeamCode();

            await addDoc(collection(db, 'teams'), {
                name: teamName,
                code: teamCode,
                completedClues: [],
                createdAt: serverTimestamp()
            });

            hapticSuccess();
            setTeamName('');
            setShowForm(false);
            alert(`Team created! Code: ${teamCode}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="text-4xl mb-2 animate-pulse">👥</div>
                <p className="text-treasure-700">Loading teams...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-adventure text-treasure-700">Teams</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-treasure-500 text-white rounded-lg font-semibold hover:bg-treasure-600 active:bg-treasure-700"
                >
                    {showForm ? '✕ Cancel' : '+ New Team'}
                </button>
            </div>

            {/* Create Team Form */}
            {showForm && (
                <form onSubmit={handleCreateTeam} className="card mb-4">
                    <h3 className="text-lg font-bold text-treasure-700 mb-3">Create New Team</h3>

                    <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Team name"
                        className="input-field mb-3"
                        required
                        disabled={creating}
                    />

                    {error && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-3 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={creating || !teamName.trim()}
                    >
                        {creating ? 'Creating...' : 'Create Team'}
                    </button>
                </form>
            )}

            {/* Teams List */}
            {teams.length === 0 ? (
                <div className="card text-center py-8">
                    <div className="text-5xl mb-3">👥</div>
                    <p className="text-gray-600">No teams yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {teams.map((team) => (
                        <div key={team.id} className="card">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg truncate">{team.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Code: <span className="font-mono font-bold text-treasure-700">{team.code}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Progress: {team.completedClues?.length || 0} clues completed
                                    </p>
                                </div>
                                <div className="ml-3 text-3xl">
                                    {(team.completedClues?.length || 0) > 0 ? '🏆' : '🎒'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
