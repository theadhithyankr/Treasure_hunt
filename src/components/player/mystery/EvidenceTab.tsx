import { Lock, MapPin, Image as ImageIcon } from 'lucide-react';
import type { Evidence } from '../../../types';

interface EvidenceTabProps {
    unlockedEvidence: Evidence[];
    totalEvidence: number;
}

export default function EvidenceTab({ unlockedEvidence, totalEvidence }: EvidenceTabProps) {
    const lockedCount = totalEvidence - unlockedEvidence.length;

    return (
        <div className="p-4 space-y-4">
            {/* Progress Header */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">Evidence Collected</h3>
                    <span className="px-3 py-1 bg-gradient-primary text-white rounded-full text-sm font-bold">
                        {unlockedEvidence.length}/{totalEvidence}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(unlockedEvidence.length / totalEvidence) * 100}%` }}
                    />
                </div>
            </div>

            {/* Unlocked Evidence */}
            {unlockedEvidence.length === 0 ? (
                <div className="glass rounded-3xl shadow-glass p-8 text-center">
                    <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No evidence discovered yet</p>
                    <p className="text-sm text-gray-500 mt-1">Complete clues to unlock evidence</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {unlockedEvidence.map((evidence) => (
                        <div key={evidence.id} className="glass rounded-3xl shadow-glass p-4 animate-scale-in">
                            <div className="flex items-start gap-3">
                                {evidence.image ? (
                                    <img
                                        src={evidence.image}
                                        alt={evidence.title}
                                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 mb-1">{evidence.title}</h4>
                                    <p className="text-sm text-gray-700 mb-2">{evidence.description}</p>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <MapPin className="w-3 h-3" />
                                        <span>Found at: {evidence.foundAt}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Locked Evidence Hint */}
            {lockedCount > 0 && (
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-4 text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 font-semibold">{lockedCount} Evidence Locked</p>
                    <p className="text-sm text-gray-500 mt-1">Complete more clues to unlock</p>
                </div>
            )}
        </div>
    );
}
