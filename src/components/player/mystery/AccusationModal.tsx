import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { hapticSuccess, hapticError } from '../../../utils/haptics';
import { AlertTriangle, X } from 'lucide-react';
import type { Suspect } from '../../../types';

interface AccusationModalProps {
    suspect: Suspect;
    teamId: string;
    teamName: string;
    onClose: () => void;
}

export default function AccusationModal({ suspect, teamId, teamName, onClose }: AccusationModalProps) {
    const [useCustomSuspect, setUseCustomSuspect] = useState(false);
    const [customSuspectName, setCustomSuspectName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (useCustomSuspect && !customSuspectName.trim()) {
            alert('Please enter a suspect name');
            return;
        }

        setSubmitting(true);

        try {
            await addDoc(collection(db, 'accusations'), {
                teamId,
                teamName,
                suspectId: useCustomSuspect ? 'custom' : suspect.id,
                suspectName: useCustomSuspect ? customSuspectName.trim() : suspect.name,
                isCustom: useCustomSuspect,
                reasoning: reasoning.trim() || null,
                submittedAt: serverTimestamp(),
                correct: !useCustomSuspect && suspect.isCulprit // Custom suspects can't be automatically verified as correct unless we add logic for it
            });

            hapticSuccess();
            alert(`You have accused ${useCustomSuspect ? customSuspectName : suspect.name}!`);
            onClose();
        } catch (err: any) {
            hapticError();
            alert('Failed to submit accusation: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="glass rounded-3xl shadow-glass p-6 max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Make Accusation</h3>
                        <p className="text-sm text-gray-600 mt-1">This is your final answer!</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Warning */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-700 font-semibold text-sm">Warning</p>
                            <p className="text-red-600 text-xs mt-1">
                                Once submitted, you cannot change your accusation!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Suspect Selection */}
                <div className="mb-4">
                    <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl mb-3">
                        <button
                            type="button"
                            onClick={() => setUseCustomSuspect(false)}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!useCustomSuspect ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Selected Suspect
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseCustomSuspect(true)}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${useCustomSuspect ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Someone Else?
                        </button>
                    </div>

                    {!useCustomSuspect ? (
                        <div className="bg-white/50 rounded-xl p-4 border border-white/50">
                            <p className="text-sm text-gray-600 mb-2">You are accusing:</p>
                            <div className="flex items-center gap-3">
                                {suspect.photo && (
                                    <img
                                        src={suspect.photo}
                                        alt={suspect.name}
                                        className="w-16 h-16 rounded-full object-cover shadow-sm bg-gray-200"
                                    />
                                )}
                                <div>
                                    <p className="font-bold text-lg text-gray-900">{suspect.name}</p>
                                    <p className="text-sm text-gray-600">{suspect.occupation}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/50 rounded-xl p-4 border border-white/50">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Who do you think did it?
                            </label>
                            <input
                                type="text"
                                value={customSuspectName}
                                onChange={(e) => setCustomSuspectName(e.target.value)}
                                placeholder="Enter suspect name..."
                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder-gray-400 text-gray-900 transition-all outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Reasoning (Optional)
                        </label>
                        <textarea
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            placeholder="Why do you think they're guilty?"
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder-gray-400 text-gray-900 transition-all outline-none min-h-[100px]"
                            rows={4}
                            disabled={submitting}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all text-sm"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 active:scale-95 transition-all text-sm"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Confirm Accusation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
