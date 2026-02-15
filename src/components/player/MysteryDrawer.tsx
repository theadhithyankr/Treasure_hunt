import { useState } from 'react';
import { X } from 'lucide-react';
import VictimTab from './mystery/VictimTab';
import EvidenceTab from './mystery/EvidenceTab';
import SuspectsTab from './mystery/SuspectsTab';
import AccusationModal from './mystery/AccusationModal';
import { useMysteryData, useUnlockedEvidence, useTeamAccusation } from '../../hooks/useMystery';
import type { Suspect } from '../../types';

interface MysteryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    teamName: string;
    completedClues: string[];
}

type TabType = 'victim' | 'evidence' | 'suspects';

export default function MysteryDrawer({ isOpen, onClose, teamId, teamName, completedClues }: MysteryDrawerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('victim');
    const [accusingSuspect, setAccusingSuspect] = useState<Suspect | null>(null);


    const { mystery, loading } = useMysteryData();
    const { unlockedEvidence, totalEvidence } = useUnlockedEvidence(completedClues);
    const { accusation } = useTeamAccusation(teamId);

    if (!mystery || !mystery.active) return null;

    const handleAccuse = (suspect: Suspect) => {
        setAccusingSuspect(suspect);
    };

    const tabs = [
        { id: 'victim' as TabType, label: 'Victim' },
        { id: 'evidence' as TabType, label: 'Evidence', badge: unlockedEvidence.length },
        { id: 'suspects' as TabType, label: 'Suspects', badge: mystery.suspects.length },
    ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-md bg-gradient-to-br from-blue-50 via-white to-orange-50 shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="bg-gradient-primary text-white p-4 safe-area-top sticky top-0 z-10 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">🔍 Mystery Case</h2>
                            <p className="text-sm text-white/90">Solve the mystery</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 active:bg-white/40 transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all relative ${activeTab === tab.id
                                    ? 'bg-white text-primary-600 shadow-lg'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                {tab.label}
                                {tab.badge !== undefined && (
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-white/30 text-white'
                                        }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100vh-180px)] pb-safe">
                    {loading ? (
                        <div className="p-6 text-center">
                            <div className="text-4xl mb-2 animate-pulse">🔍</div>
                            <p className="text-gray-700">Loading mystery...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'victim' && <VictimTab victim={mystery.victim} />}
                            {activeTab === 'evidence' && (
                                <EvidenceTab
                                    unlockedEvidence={unlockedEvidence}
                                    totalEvidence={totalEvidence}
                                />
                            )}
                            {activeTab === 'suspects' && (
                                <SuspectsTab
                                    suspects={mystery.suspects}
                                    currentAccusation={accusation}
                                    onAccuse={handleAccuse}
                                    mysteryRevealed={mystery.revealed}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Accusation Status */}
                {accusation && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary-100 border-t-2 border-primary-300 p-4 safe-area-bottom">
                        <p className="text-primary-700 font-bold text-center">
                            ✓ You accused: {accusation.suspectName}
                        </p>
                        {mystery.revealed && (
                            <p className="text-center text-sm mt-1">
                                {accusation.correct ? (
                                    <span className="text-green-600 font-semibold">🎉 Correct!</span>
                                ) : (
                                    <span className="text-red-600 font-semibold">❌ Incorrect</span>
                                )}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Accusation Modal */}
            {accusingSuspect && (
                <AccusationModal
                    suspect={accusingSuspect}
                    teamId={teamId}
                    teamName={teamName}
                    onClose={() => setAccusingSuspect(null)}
                />
            )}
        </>
    );
}
