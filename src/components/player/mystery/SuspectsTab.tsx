import { UserCircle, AlertTriangle } from 'lucide-react';
import type { Suspect, Accusation } from '../../../types';

interface SuspectsTabProps {
    suspects: Suspect[];
    currentAccusation: Accusation | null;
    onAccuse: (suspect: Suspect) => void;
    mysteryRevealed: boolean;
}

export default function SuspectsTab({ suspects, currentAccusation, onAccuse, mysteryRevealed }: SuspectsTabProps) {
    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Suspects</h3>
                <p className="text-sm text-gray-600">
                    {currentAccusation
                        ? `You accused: ${currentAccusation.suspectName}`
                        : 'Review the suspects and make your accusation'}
                </p>
            </div>

            {/* Suspects List */}
            {suspects.length === 0 ? (
                <div className="glass rounded-3xl shadow-glass p-8 text-center">
                    <UserCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No suspects identified yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {suspects.map((suspect) => {
                        const isAccused = currentAccusation?.suspectId === suspect.id;
                        const isCulprit = mysteryRevealed && suspect.isCulprit;

                        return (
                            <div
                                key={suspect.id}
                                className={`glass rounded-3xl shadow-glass p-4 ${isAccused ? 'ring-2 ring-primary-500' : ''
                                    } ${isCulprit ? 'ring-2 ring-red-500' : ''}`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    {suspect.photo ? (
                                        <img
                                            src={suspect.photo}
                                            alt={suspect.name}
                                            className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                            <UserCircle className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-lg text-gray-900">{suspect.name}</h4>
                                        <p className="text-sm text-gray-600">{suspect.age} • {suspect.occupation}</p>
                                        <p className="text-sm text-primary-600 font-semibold mt-1">
                                            {suspect.relationship}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                    <div className="bg-white/50 rounded-xl p-3">
                                        <p className="text-xs text-gray-600 font-semibold mb-1">ALIBI</p>
                                        <p className="text-sm text-gray-800">{suspect.alibi}</p>
                                    </div>

                                    <div className="bg-white/50 rounded-xl p-3">
                                        <p className="text-xs text-gray-600 font-semibold mb-1">MOTIVE</p>
                                        <p className="text-sm text-gray-800">{suspect.motive}</p>
                                    </div>
                                </div>

                                {/* Reveal Status */}
                                {mysteryRevealed && isCulprit && (
                                    <div className="bg-red-100 border-2 border-red-400 rounded-xl p-3 mb-3">
                                        <p className="text-red-700 font-bold text-center flex items-center justify-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            CULPRIT REVEALED
                                        </p>
                                    </div>
                                )}

                                {/* Accusation Status */}
                                {isAccused ? (
                                    <div className="bg-primary-100 border-2 border-primary-400 rounded-xl p-3">
                                        <p className="text-primary-700 font-bold text-center">
                                            ✓ Your Accusation
                                        </p>
                                    </div>
                                ) : !currentAccusation && !mysteryRevealed ? (
                                    <button
                                        onClick={() => onAccuse(suspect)}
                                        className="w-full py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all"
                                    >
                                        Accuse {suspect.name}
                                    </button>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
