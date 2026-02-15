import { useState } from 'react';
import { doc, updateDoc, serverTimestamp, addDoc, collection, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useMysteryData, useAllAccusations } from '../../../hooks/useMystery';
import { hapticSuccess, hapticError } from '../../../utils/haptics';
import { Play, Pause, Eye, CheckCircle, XCircle, Trophy, RefreshCw, AlertTriangle } from 'lucide-react';

export default function MysteryStatus() {
    const { mystery, loading } = useMysteryData();
    const { accusations } = useAllAccusations();
    const [updating, setUpdating] = useState(false);

    const handleToggleActive = async () => {
        if (!mystery) return;

        if (!mystery.active && (!mystery.victim.name || mystery.suspects.length === 0)) {
            alert('Please complete mystery setup before activating');
            return;
        }

        setUpdating(true);
        try {
            await updateDoc(doc(db, 'mystery', 'current'), {
                active: !mystery.active
            });
            hapticSuccess();
        } catch (err: any) {
            hapticError();
            alert('Failed to update: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleReveal = async () => {
        if (!mystery || !mystery.active) return;

        if (!confirm('Reveal the mystery to all teams? This cannot be undone!')) return;

        setUpdating(true);
        try {
            // Update mystery to revealed
            await updateDoc(doc(db, 'mystery', 'current'), {
                revealed: true,
                revealedAt: serverTimestamp()
            });

            // Find the culprit
            const culprit = mystery.suspects.find(s => s.isCulprit);
            if (culprit) {
                // Create announcement
                const correctTeams = accusations.filter(a => a.correct);
                const message = correctTeams.length > 0
                    ? `The mystery is solved! ${culprit.name} was the culprit! Congratulations to ${correctTeams.map(t => t.teamName).join(', ')} for guessing correctly! 🎉`
                    : `The mystery is revealed! ${culprit.name} was the culprit!`;

                await addDoc(collection(db, 'announcements'), {
                    title: '🔍 Mystery Revealed!',
                    message,
                    priority: 'high',
                    createdAt: serverTimestamp()
                });
            }

            hapticSuccess();
            alert('Mystery revealed!');
        } catch (err: any) {
            hapticError();
            alert('Failed to reveal: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Are you sure you want to RESET the mystery?\n\nThis will:\n- Deactivate the mystery\n- Hide the reveal\n- DELETE ALL accusations from teams\n\nThis action cannot be undone.')) return;

        setUpdating(true);
        try {
            // Reset mystery status
            await updateDoc(doc(db, 'mystery', 'current'), {
                active: false,
                revealed: false,
                revealedAt: null
            });

            // Delete all accusations
            const batch = writeBatch(db);
            const accusationsRef = collection(db, 'accusations');
            const snapshot = await getDocs(accusationsRef);

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            hapticSuccess();
            alert('Mystery progress has been reset.');
        } catch (err: any) {
            hapticError();
            alert('Failed to reset: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="text-4xl mb-2 animate-pulse">🔍</div>
                <p className="text-gray-700">Loading...</p>
            </div>
        );
    }

    if (!mystery) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-600">No mystery configured yet. Go to Setup tab to create one.</p>
            </div>
        );
    }

    const culprit = mystery.suspects.find(s => s.isCulprit);
    const correctAccusations = accusations.filter(a => a.correct);
    const incorrectAccusations = accusations.filter(a => !a.correct);

    return (
        <div className="p-4 space-y-4">
            {/* Status Card */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Mystery Status</h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-sm text-gray-600 font-semibold">Status</p>
                        <p className={`text-lg font-bold ${mystery.active ? 'text-green-600' : 'text-gray-600'}`}>
                            {mystery.active ? '🟢 Active' : '⚫ Inactive'}
                        </p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-sm text-gray-600 font-semibold">Revealed</p>
                        <p className={`text-lg font-bold ${mystery.revealed ? 'text-blue-600' : 'text-gray-600'}`}>
                            {mystery.revealed ? '✅ Yes' : '❌ No'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleToggleActive}
                        className={`flex-1 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${mystery.active
                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                            : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                            }`}
                        disabled={updating}
                    >
                        {mystery.active ? (
                            <>
                                <Pause className="w-5 h-5" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Activate
                            </>
                        )}
                    </button>

                    {mystery.active && !mystery.revealed && (
                        <button
                            onClick={handleReveal}
                            className="flex-1 py-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                            disabled={updating}
                        >
                            <Eye className="w-5 h-5" />
                            Reveal Mystery
                        </button>
                    )}
                </div>
            </div>

            {/* Culprit Info (Coordinator Only) */}
            {culprit && (
                <div className="glass rounded-3xl shadow-glass p-4 border-2 border-red-300">
                    <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                        🔒 Culprit (Hidden from Players)
                    </h3>
                    <div className="flex items-center gap-3">
                        {culprit.photo && (
                            <img src={culprit.photo} alt={culprit.name} className="w-16 h-16 rounded-full object-cover" />
                        )}
                        <div>
                            <p className="font-bold text-gray-900">{culprit.name}</p>
                            <p className="text-sm text-gray-600">{culprit.occupation}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Accusations Summary */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Team Accusations ({accusations.length})
                </h3>

                {accusations.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No accusations yet</p>
                ) : (
                    <div className="space-y-3">
                        {/* Correct Accusations */}
                        {correctAccusations.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Correct ({correctAccusations.length})
                                </h4>
                                <div className="space-y-2">
                                    {correctAccusations.map((acc) => (
                                        <div key={acc.id} className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-900">{acc.teamName}</p>
                                                    <p className="text-sm text-gray-600">Accused: {acc.suspectName}</p>
                                                    {acc.reasoning && (
                                                        <p className="text-xs text-gray-500 mt-1 italic">"{acc.reasoning}"</p>
                                                    )}
                                                </div>
                                                <Trophy className="w-6 h-6 text-yellow-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Incorrect Accusations */}
                        {incorrectAccusations.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    Incorrect ({incorrectAccusations.length})
                                </h4>
                                <div className="space-y-2">
                                    {incorrectAccusations.map((acc) => (
                                        <div key={acc.id} className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                                            <p className="font-bold text-gray-900">{acc.teamName}</p>
                                            <p className="text-sm text-gray-600">Accused: {acc.suspectName}</p>
                                            {acc.reasoning && (
                                                <p className="text-xs text-gray-500 mt-1 italic">"{acc.reasoning}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mystery Summary */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Mystery Overview</h3>

                <div className="space-y-2">
                    <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-sm text-gray-600 font-semibold">Victim</p>
                        <p className="text-gray-900">{mystery.victim.name || 'Not set'}</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-sm text-gray-600 font-semibold">Suspects</p>
                        <p className="text-gray-900">{mystery.suspects.length} suspects</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-sm text-gray-600 font-semibold">Evidence</p>
                        <p className="text-gray-900">{mystery.evidence.length} pieces of evidence</p>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="glass rounded-3xl shadow-glass p-4 border-2 border-red-500/20">
                <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Resetting the mystery will deactivate it and clear all team accusations.
                    This is useful if you want to restart the event.
                </p>
                <button
                    onClick={handleReset}
                    className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    disabled={updating}
                >
                    <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
                    {updating ? 'Resetting...' : 'Reset Mystery Progress'}
                </button>
            </div>
        </div>
    );
}
