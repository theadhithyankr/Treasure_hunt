import { useState } from 'react';
import { setDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useTeams, useClues, useTreasureConfig } from '../../hooks/useFirestore';
import type { TreasureConfig } from '../../types';
import { MapPin, FlaskConical, CheckCircle, Clock, Save, Trophy, Users } from 'lucide-react';

export default function TreasureFinalePanel() {
    const { teams, loading: teamsLoading } = useTeams();
    const { clues } = useClues();
    const { config, loading: configLoading } = useTreasureConfig();

    const totalClues = clues.length;

    // Local form state (synced from Firestore config)
    const [mapImageUrl, setMapImageUrl] = useState('');
    const [mapDescription, setMapDescription] = useState('');
    const [formulaText, setFormulaText] = useState('');
    const [missingAnswer, setMissingAnswer] = useState('');
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadedFromDb, setLoadedFromDb] = useState(false);

    // Populate form once config loads
    if (!configLoading && config && !loadedFromDb) {
        setMapImageUrl(config.mapImageUrl || '');
        setMapDescription(config.mapDescription || '');
        setFormulaText(config.formulaText || '');
        setMissingAnswer(config.missingAnswer || '');
        setLoadedFromDb(true);
    }

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const payload: Partial<TreasureConfig> = {
                mapImageUrl: mapImageUrl.trim() || undefined,
                mapDescription: mapDescription.trim() || undefined,
                formulaText: formulaText.trim() || undefined,
                missingAnswer: missingAnswer.trim(),
            };
            await setDoc(doc(db, 'treasureConfig', 'current'), payload, { merge: true });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save treasure config:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleApproveTeam = async (teamId: string) => {
        try {
            await updateDoc(doc(db, 'teams', teamId), { treasureApproved: true });
        } catch (err) {
            console.error('Failed to approve team:', err);
        }
    };

    const handleRevokeTeam = async (teamId: string) => {
        try {
            await updateDoc(doc(db, 'teams', teamId), { treasureApproved: false });
        } catch (err) {
            console.error('Failed to revoke team approval:', err);
        }
    };

    // Teams that finished all clues
    const completedTeams = teams.filter(
        t => totalClues > 0 && (t.completedClues?.length || 0) >= totalClues
    );

    return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto">

            {/* ── SECTION: Team Status ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
                    <Users className="w-5 h-5 text-amber-600" />
                    <h2 className="font-bold text-amber-900">Teams Awaiting Approval</h2>
                    <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {completedTeams.length} / {teams.length}
                    </span>
                </div>

                {teamsLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                    </div>
                ) : completedTeams.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No teams have completed all clues yet.</p>
                        <p className="text-gray-400 text-xs mt-1">{totalClues} clue{totalClues !== 1 ? 's' : ''} in the hunt</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {completedTeams.map((team) => {
                            const approved = team.treasureApproved === true;
                            const formulaDone = team.formulaCompleted === true;
                            return (
                                <div key={team.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">
                                            {team.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {team.completedClues?.length || 0}/{totalClues} clues
                                            {formulaDone && (
                                                <span className="ml-2 text-green-600 font-semibold">
                                                    ✓ Formula solved!
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {approved ? (
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                                                <CheckCircle className="w-3 h-3" />
                                                Approved
                                            </span>
                                            <button
                                                onClick={() => handleRevokeTeam(team.id)}
                                                className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleApproveTeam(team.id)}
                                            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:from-amber-400 hover:to-yellow-400 active:scale-95 transition-all"
                                        >
                                            <Trophy className="w-3.5 h-3.5" />
                                            Approve &amp; Unlock
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── SECTION: Map Configuration ───────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-50 to-accent-50 border-b border-primary-100">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <h2 className="font-bold text-primary-900">Map &amp; Location</h2>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Map Image URL
                        </label>
                        <input
                            type="url"
                            value={mapImageUrl}
                            onChange={e => setMapImageUrl(e.target.value)}
                            placeholder="https://example.com/treasure-map.jpg"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400/60"
                        />
                        {mapImageUrl && (
                            <img
                                src={mapImageUrl}
                                alt="Map preview"
                                className="mt-2 w-full max-h-40 object-cover rounded-lg border border-gray-200"
                                onError={e => (e.currentTarget.style.display = 'none')}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Location Description / Hints
                        </label>
                        <textarea
                            value={mapDescription}
                            onChange={e => setMapDescription(e.target.value)}
                            placeholder="Describe the treasure location or add hints here…"
                            rows={4}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400/60"
                        />
                    </div>
                </div>
            </div>

            {/* ── SECTION: Formula Configuration ───────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                    <FlaskConical className="w-5 h-5 text-purple-600" />
                    <h2 className="font-bold text-purple-900">The Formula</h2>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Formula Text (use ??? for the missing part)
                        </label>
                        <input
                            type="text"
                            value={formulaText}
                            onChange={e => setFormulaText(e.target.value)}
                            placeholder='e.g.  "The treasure lies at  ??? × N"'
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400/60"
                        />
                        {formulaText && (
                            <div className="mt-2 bg-stone-800 rounded-xl px-4 py-3 text-center">
                                <span className="text-amber-300 font-mono font-bold text-lg">
                                    {formulaText}
                                </span>
                                <p className="text-stone-500 text-xs mt-1">Player preview</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Correct Answer (what players must type)
                        </label>
                        <input
                            type="text"
                            value={missingAnswer}
                            onChange={e => setMissingAnswer(e.target.value)}
                            placeholder="The exact answer players must enter"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400/60"
                        />
                        <p className="text-gray-400 text-xs mt-1">
                            Matching is case-insensitive and ignores leading/trailing spaces.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── SAVE BUTTON ───────────────────────────────────────────────── */}
            <button
                onClick={handleSaveConfig}
                disabled={saving || !missingAnswer.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    saved
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gradient-primary text-white shadow-glow-primary hover:opacity-90'
                } disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
            >
                {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        Saved!
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5" />
                        Save Treasure Config
                    </>
                )}
            </button>

            <p className="text-center text-gray-400 text-xs pb-4">
                Configuration is applied immediately to all approved teams.
            </p>
        </div>
    );
}
