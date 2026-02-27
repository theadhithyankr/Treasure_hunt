import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Team, ClueStatus } from '../../types';
import { generateTeamCode } from '../../utils/helpers';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { Trophy, Users, Edit2, Trash2, RotateCcw } from 'lucide-react';

interface TeamManagementProps {
    teams: Team[];
    loading: boolean;
}

export default function TeamManagement({ teams, loading }: TeamManagementProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [teamName, setTeamName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            const teamCode = generateTeamCode();

            // Fetch the first clue to initialize status
            const cluesQuery = query(collection(db, 'clues'), orderBy('index', 'asc'), limit(1));
            const clueSnap = await getDocs(cluesQuery);
            
            const clueStatuses: Record<string, ClueStatus> = {};
            let currentClueId: string | undefined;

            if (!clueSnap.empty) {
                const firstClue = clueSnap.docs[0];
                currentClueId = firstClue.id;
                clueStatuses[firstClue.id] = {
                    clueId: firstClue.id,
                    unlockedAt: serverTimestamp(),
                    status: 'active'
                };
            }

            await addDoc(collection(db, 'teams'), {
                name: teamName,
                code: teamCode,
                completedClues: [],
                clueStatuses,
                currentClueId,
                createdAt: serverTimestamp()
            });

            hapticSuccess();
            setTeamName('');
            setShowForm(false);
            alert(`Team created! Code: ${teamCode}`);
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    const handleEditTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTeam) return;

        setError('');
        setCreating(true);

        try {
            await updateDoc(doc(db, 'teams', editingTeam.id), {
                name: teamName
            });

            hapticSuccess();
            setTeamName('');
            setEditingTeam(null);
            setShowForm(false);
            alert('Team updated successfully!');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to update team');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteTeam = async (team: Team) => {
        if (!confirm(`Delete team "${team.name}"? This will also delete all their submissions. This cannot be undone.`)) return;

        try {
            // Delete all submissions from this team
            const submissionsQuery = query(collection(db, 'submissions'), where('teamId', '==', team.id));
            const submissionsSnapshot = await getDocs(submissionsQuery);

            const deletePromises = submissionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete the team
            await deleteDoc(doc(db, 'teams', team.id));

            hapticSuccess();
            alert('Team deleted successfully!');
        } catch (err: any) {
            hapticError();
            alert('Failed to delete team: ' + err.message);
        }
    };

    const handleResetProgress = async (team: Team) => {
        if (!confirm(`Reset progress for team "${team.name}"? This will clear all completed clues.`)) return;

        try {
            await updateDoc(doc(db, 'teams', team.id), {
                completedClues: []
            });

            hapticSuccess();
            alert('Team progress reset!');
        } catch (err: any) {
            hapticError();
            alert('Failed to reset progress: ' + err.message);
        }
    };

    const startEdit = (team: Team) => {
        setEditingTeam(team);
        setTeamName(team.name);
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingTeam(null);
        setTeamName('');
        setError('');
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <Users className="w-10 h-10 mb-2 animate-pulse mx-auto text-primary-500" />
                <p className="text-gray-700">Loading teams...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Teams</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                    {showForm ? '✕ Cancel' : '+ New Team'}
                </button>
            </div>

            {/* Create/Edit Team Form */}
            {showForm && (
                <form onSubmit={editingTeam ? handleEditTeam : handleCreateTeam} className="glass rounded-3xl shadow-glass p-4 mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {editingTeam ? 'Edit Team' : 'Create New Team'}
                    </h3>

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

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 btn-primary"
                            disabled={creating || !teamName.trim()}
                        >
                            {creating ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                        </button>
                        <button
                            type="button"
                            onClick={cancelForm}
                            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 active:scale-95 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Teams List */}
            {teams.length === 0 ? (
                <div className="glass rounded-3xl shadow-glass p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No teams yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {teams.map((team) => (
                        <div key={team.id} className="glass rounded-3xl shadow-glass p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg truncate text-gray-900">{team.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Code: <span className="font-mono font-bold text-primary-600">{team.code}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Trophy className="w-4 h-4 text-accent-500" />
                                        {team.completedClues?.length || 0} clues completed
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => startEdit(team)}
                                    className="flex-1 min-w-[100px] px-3 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleResetProgress(team)}
                                    className="flex-1 min-w-[100px] px-3 py-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                                    disabled={!team.completedClues || team.completedClues.length === 0}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </button>
                                <button
                                    onClick={() => handleDeleteTeam(team)}
                                    className="flex-1 min-w-[100px] px-3 py-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
