import { useState, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useMysteryData } from '../../../hooks/useMystery';
import { useClues } from '../../../hooks/useFirestore';
import { compressImage } from '../../../utils/imageCompression';
import { hapticSuccess, hapticError } from '../../../utils/haptics';
import { UserCircle, Camera, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import type { Victim, Suspect, Evidence } from '../../../types';

export default function MysterySetup() {
    const { mystery, loading } = useMysteryData();
    const { clues } = useClues();

    // Victim state
    const [victim, setVictim] = useState<Victim>(mystery?.victim || {
        name: '',
        photo: '',
        age: 0,
        occupation: '',
        bio: '',
        lastSeen: ''
    });

    // Suspects state
    const [suspects, setSuspects] = useState<Suspect[]>(mystery?.suspects || []);
    const [editingSuspect, setEditingSuspect] = useState<Suspect | null>(null);
    const [showSuspectForm, setShowSuspectForm] = useState(false);

    // Evidence state
    const [evidence, setEvidence] = useState<Evidence[]>(mystery?.evidence || []);
    const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
    const [showEvidenceForm, setShowEvidenceForm] = useState(false);

    // General settings
    const [startClueId, setStartClueId] = useState<string>(mystery?.startClueId || '');

    const [saving, setSaving] = useState(false);
    const victimPhotoRef = useRef<HTMLInputElement>(null);

    const handleVictimPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedFile = await compressImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setVictim({ ...victim, photo: reader.result as string });
            };
            reader.readAsDataURL(compressedFile);
        } catch (err) {
            hapticError();
            alert('Failed to process image');
        }
    };

    const handleSaveMystery = async () => {
        if (!victim.name || suspects.length === 0) {
            alert('Please add victim details and at least one suspect');
            return;
        }

        const culpritCount = suspects.filter(s => s.isCulprit).length;
        if (culpritCount !== 1) {
            alert('Please mark exactly one suspect as the culprit');
            return;
        }

        setSaving(true);
        try {
            // Sanitize evidence - remove undefined values
            const sanitizedEvidence = evidence.map(ev => ({
                id: ev.id,
                title: ev.title,
                description: ev.description,
                image: ev.image || '',
                foundAt: ev.foundAt,
                ...(ev.unlockClueId && { unlockClueId: ev.unlockClueId }),
                ...(ev.relatedSuspectId && { relatedSuspectId: ev.relatedSuspectId })
            }));

            await setDoc(doc(db, 'mystery', 'current'), {
                active: mystery?.active || false,
                revealed: mystery?.revealed || false,
                startClueId: startClueId || null,
                victim,
                suspects,
                evidence: sanitizedEvidence,
                updatedAt: serverTimestamp()
            });

            hapticSuccess();
            alert('Mystery saved successfully!');
        } catch (err: any) {
            hapticError();
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const addSuspect = (suspect: Suspect) => {
        if (editingSuspect) {
            setSuspects(suspects.map(s => s.id === suspect.id ? suspect : s));
        } else {
            setSuspects([...suspects, { ...suspect, id: Date.now().toString() }]);
        }
        setShowSuspectForm(false);
        setEditingSuspect(null);
    };

    const deleteSuspect = (id: string) => {
        if (confirm('Delete this suspect?')) {
            setSuspects(suspects.filter(s => s.id !== id));
        }
    };

    const addEvidence = (ev: Evidence) => {
        if (editingEvidence) {
            setEvidence(evidence.map(e => e.id === ev.id ? ev : e));
        } else {
            setEvidence([...evidence, { ...ev, id: Date.now().toString() }]);
        }
        setShowEvidenceForm(false);
        setEditingEvidence(null);
    };

    const deleteEvidence = (id: string) => {
        if (confirm('Delete this evidence?')) {
            setEvidence(evidence.filter(e => e.id !== id));
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="text-4xl mb-2 animate-pulse">🔍</div>
                <p className="text-gray-700">Loading mystery...</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Mystery Setup
                    </h2>
                    <p className="text-sm text-gray-500">Configure the murder mystery details</p>
                </div>
                <button
                    onClick={handleSaveMystery}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
                    disabled={saving}
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Mystery'}
                </button>
            </div>

            {/* General Settings */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">General Settings</h3>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Start Trigger (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        Mystery will automatically unlock and change theme when a team completes this clue.
                        If left empty, mystery is available immediately when active.
                    </p>
                    <select
                        value={startClueId}
                        onChange={(e) => setStartClueId(e.target.value)}
                        className="input-field"
                    >
                        <option value="">-- No specific trigger (Immediate) --</option>
                        {clues.map((clue: any) => (
                            <option key={clue.id} value={clue.id}>
                                Unlock after: {clue.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Victim Section */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Victim Details</h3>

                <div className="flex justify-center mb-4">
                    <div className="relative">
                        {victim.photo ? (
                            <img
                                src={victim.photo}
                                alt="Victim"
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserCircle className="w-20 h-20 text-gray-400" />
                            </div>
                        )}
                        <button
                            onClick={() => victimPhotoRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input
                            ref={victimPhotoRef}
                            type="file"
                            accept="image/*"
                            onChange={handleVictimPhotoSelect}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={victim.name}
                            onChange={(e) => setVictim({ ...victim, name: e.target.value })}
                            className="input-field"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                        <input
                            type="number"
                            value={victim.age || ''}
                            onChange={(e) => setVictim({ ...victim, age: parseInt(e.target.value) || 0 })}
                            className="input-field"
                            placeholder="35"
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Occupation</label>
                    <input
                        type="text"
                        value={victim.occupation}
                        onChange={(e) => setVictim({ ...victim, occupation: e.target.value })}
                        className="input-field"
                        placeholder="Business Owner"
                    />
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Biography</label>
                    <textarea
                        value={victim.bio}
                        onChange={(e) => setVictim({ ...victim, bio: e.target.value })}
                        className="input-field"
                        rows={3}
                        placeholder="Background information..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Last Seen</label>
                    <input
                        type="text"
                        value={victim.lastSeen}
                        onChange={(e) => setVictim({ ...victim, lastSeen: e.target.value })}
                        className="input-field"
                        placeholder="Friday evening at the office"
                    />
                </div>
            </div>

            {/* Suspects Section */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Suspects ({suspects.length})</h3>
                    <button
                        onClick={() => {
                            setEditingSuspect(null);
                            setShowSuspectForm(true);
                        }}
                        className="px-3 py-2 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add Suspect
                    </button>
                </div>

                {suspects.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No suspects added yet</p>
                ) : (
                    <div className="space-y-2">
                        {suspects.map((suspect) => (
                            <div key={suspect.id} className="bg-white/50 rounded-xl p-3 flex items-center gap-3">
                                {suspect.photo && (
                                    <img src={suspect.photo} alt={suspect.name} className="w-12 h-12 rounded-full object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900">{suspect.name}</p>
                                    <p className="text-sm text-gray-600">{suspect.occupation}</p>
                                    {suspect.isCulprit && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">CULPRIT</span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setEditingSuspect(suspect);
                                            setShowSuspectForm(true);
                                        }}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteSuspect(suspect.id)}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Evidence Section */}
            <div className="glass rounded-3xl shadow-glass p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Evidence ({evidence.length})</h3>
                    <button
                        onClick={() => {
                            setEditingEvidence(null);
                            setShowEvidenceForm(true);
                        }}
                        className="px-3 py-2 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add Evidence
                    </button>
                </div>

                {evidence.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No evidence added yet</p>
                ) : (
                    <div className="space-y-2">
                        {evidence.map((ev) => (
                            <div key={ev.id} className="bg-white/50 rounded-xl p-3">
                                <div className="flex items-start gap-3 mb-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{ev.title}</p>
                                        <p className="text-sm text-gray-600">{ev.description}</p>
                                        {ev.unlockClueId && (
                                            <p className="text-xs text-primary-600 mt-1">
                                                Unlocks: {clues.find(c => c.id === ev.unlockClueId)?.title || 'Unknown Clue'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingEvidence(ev);
                                                setShowEvidenceForm(true);
                                            }}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteEvidence(ev.id)}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Suspect Form Modal */}
            {showSuspectForm && (
                <SuspectFormModal
                    suspect={editingSuspect}
                    onSave={addSuspect}
                    onClose={() => {
                        setShowSuspectForm(false);
                        setEditingSuspect(null);
                    }}
                />
            )}

            {/* Evidence Form Modal */}
            {showEvidenceForm && (
                <EvidenceFormModal
                    evidence={editingEvidence}
                    clues={clues}
                    suspects={suspects}
                    onSave={addEvidence}
                    onClose={() => {
                        setShowEvidenceForm(false);
                        setEditingEvidence(null);
                    }}
                />
            )}
        </div>
    );
}

// Suspect Form Modal Component
function SuspectFormModal({ suspect, onSave, onClose }: any) {
    const [formData, setFormData] = useState<Suspect>(suspect || {
        id: '',
        name: '',
        photo: '',
        age: 0,
        occupation: '',
        relationship: '',
        alibi: '',
        motive: '',
        isCulprit: false
    });
    const photoRef = useRef<HTMLInputElement>(null);

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedFile = await compressImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result as string });
            };
            reader.readAsDataURL(compressedFile);
        } catch (err) {
            alert('Failed to process image');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Please enter suspect name');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="glass rounded-3xl shadow-glass p-6 max-w-md w-full my-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {suspect ? 'Edit Suspect' : 'Add Suspect'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Photo */}
                    <div className="flex justify-center">
                        <div className="relative">
                            {formData.photo ? (
                                <img src={formData.photo} alt="Suspect" className="w-24 h-24 rounded-full object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserCircle className="w-16 h-16 text-gray-400" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => photoRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full shadow-lg"
                            >
                                <Camera className="w-3 h-3" />
                            </button>
                            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                            <input
                                type="number"
                                value={formData.age || ''}
                                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Occupation</label>
                        <input
                            type="text"
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Relationship to Victim</label>
                        <input
                            type="text"
                            value={formData.relationship}
                            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                            className="input-field"
                            placeholder="Business Partner"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Alibi</label>
                        <textarea
                            value={formData.alibi}
                            onChange={(e) => setFormData({ ...formData, alibi: e.target.value })}
                            className="input-field"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Motive</label>
                        <textarea
                            value={formData.motive}
                            onChange={(e) => setFormData({ ...formData, motive: e.target.value })}
                            className="input-field"
                            rows={2}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isCulprit"
                            checked={formData.isCulprit}
                            onChange={(e) => setFormData({ ...formData, isCulprit: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isCulprit" className="text-sm font-semibold text-red-600">
                            Mark as Culprit (hidden from players)
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 btn-primary">
                            Save Suspect
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Evidence Form Modal Component
function EvidenceFormModal({ evidence, clues, suspects, onSave, onClose }: any) {
    const [formData, setFormData] = useState<Evidence>(evidence || {
        id: '',
        title: '',
        description: '',
        image: '',
        foundAt: '',
        unlockClueId: '',
        relatedSuspectId: ''
    });
    const photoRef = useRef<HTMLInputElement>(null);

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedFile = await compressImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
            };
            reader.readAsDataURL(compressedFile);
        } catch (err) {
            alert('Failed to process image');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) {
            alert('Please enter evidence title');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="glass rounded-3xl shadow-glass p-6 max-w-md w-full my-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {evidence ? 'Edit Evidence' : 'Add Evidence'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Photo */}
                    {formData.image && (
                        <img src={formData.image} alt="Evidence" className="w-full rounded-lg mb-2" />
                    )}
                    <button
                        type="button"
                        onClick={() => photoRef.current?.click()}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 flex items-center justify-center gap-2"
                    >
                        <Camera className="w-4 h-4" />
                        {formData.image ? 'Change Image' : 'Add Image (Optional)'}
                    </button>
                    <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input-field"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Found At</label>
                        <input
                            type="text"
                            value={formData.foundAt}
                            onChange={(e) => setFormData({ ...formData, foundAt: e.target.value })}
                            className="input-field"
                            placeholder="Crime scene, Office desk, etc."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Unlock Condition (Optional)</label>
                        <select
                            value={formData.unlockClueId || ''}
                            onChange={(e) => setFormData({ ...formData, unlockClueId: e.target.value || undefined })}
                            className="input-field"
                        >
                            <option value="">Always visible</option>
                            {clues.map((clue: any) => (
                                <option key={clue.id} value={clue.id}>
                                    Unlock after: {clue.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Related Suspect (Optional)</label>
                        <select
                            value={formData.relatedSuspectId || ''}
                            onChange={(e) => setFormData({ ...formData, relatedSuspectId: e.target.value || undefined })}
                            className="input-field"
                        >
                            <option value="">None</option>
                            {suspects.map((suspect: Suspect) => (
                                <option key={suspect.id} value={suspect.id}>
                                    {suspect.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 btn-primary">
                            Save Evidence
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
