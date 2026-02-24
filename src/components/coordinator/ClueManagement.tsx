import { useState, useRef } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Clue } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { Camera, PenTool, QrCode, Image as ImageIcon, Trash2, Edit2, FileText } from 'lucide-react';

interface ClueManagementProps {
    clues: Clue[];
    loading: boolean;
}

export default function ClueManagement({ clues, loading }: ClueManagementProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingClue, setEditingClue] = useState<Clue | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'text' | 'photo' | 'scan'>('text');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedFile = await compressImage(file);
            setSelectedFile(compressedFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (err) {
            setError('Failed to process image');
            hapticError();
        }
    };

    const handleCreateClue = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            let imageUrl = '';

            if (selectedFile) {
                const result = await uploadToCloudinary(selectedFile);
                imageUrl = result.url;
            }

            await addDoc(collection(db, 'clues'), {
                index: clues.length,
                title,
                content,
                type,
                correctAnswer,
                imageUrl: imageUrl || null,
                createdAt: serverTimestamp()
            });

            hapticSuccess();
            resetForm();
            alert('Clue created successfully!');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to create clue');
        } finally {
            setCreating(false);
        }
    };

    const handleEditClue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClue) return;

        setError('');
        setCreating(true);

        try {
            let imageUrl = editingClue.imageUrl || '';

            if (selectedFile) {
                const result = await uploadToCloudinary(selectedFile);
                imageUrl = result.url;
            }

            await updateDoc(doc(db, 'clues', editingClue.id), {
                title,
                content,
                type,
                correctAnswer,
                imageUrl: imageUrl || null
            });

            hapticSuccess();
            resetForm();
            alert('Clue updated successfully!');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to update clue');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClue = async (clueId: string, clueTitle: string) => {
        if (!confirm(`Delete clue "${clueTitle}"? This cannot be undone.`)) return;

        try {
            await deleteDoc(doc(db, 'clues', clueId));
            hapticSuccess();
            alert('Clue deleted successfully!');
        } catch (err: any) {
            hapticError();
            alert('Failed to delete clue: ' + err.message);
        }
    };

    const startEdit = (clue: Clue) => {
        setEditingClue(clue);
        setTitle(clue.title);
        setContent(clue.content);
        setType(clue.type);
        setCorrectAnswer(clue.correctAnswer || '');
        setPreviewUrl(clue.imageUrl || null);
        setShowForm(true);
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setType('text');
        setCorrectAnswer('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowForm(false);
        setEditingClue(null);
        setError('');
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <FileText className="w-10 h-10 mb-2 animate-pulse mx-auto text-primary-500" />
                <p className="text-gray-700">Loading clues...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Clues</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                    {showForm ? '✕ Cancel' : '+ New Clue'}
                </button>
            </div>

            {/* Create/Edit Clue Form */}
            {showForm && (
                <form onSubmit={editingClue ? handleEditClue : handleCreateClue} className="glass rounded-3xl shadow-glass p-4 mb-4 space-y-3">
                    <h3 className="text-lg font-bold text-gray-900">
                        {editingClue ? 'Edit Clue' : 'Create New Clue'}
                    </h3>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Clue Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Find the Hidden Statue"
                            className="input-field"
                            required
                            disabled={creating}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Clue Content
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write the clue description..."
                            className="input-field"
                            rows={4}
                            required
                            disabled={creating}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Submission Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'text' | 'photo' | 'scan')}
                            className="input-field"
                            disabled={creating}
                        >
                            <option value="text">Text Answer</option>
                            <option value="photo">Photo Submission</option>
                            <option value="scan">QR/Barcode Scan</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Correct Answer {type === 'scan' && '(Barcode/QR value)'}
                        </label>
                        <input
                            type="text"
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            placeholder={type === 'photo' ? 'Leave empty for manual review' : 'Enter correct answer'}
                            className="input-field"
                            required={type !== 'photo'}
                            disabled={creating}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Clue Image (Optional)
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {previewUrl ? (
                            <div className="space-y-2">
                                <img src={previewUrl} alt="Preview" className="w-full rounded-lg shadow-md" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                                    disabled={creating}
                                >
                                    Change Image
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-4 border-2 border-dashed border-primary-400 rounded-lg hover:border-primary-500 hover:bg-primary-50 flex flex-col items-center justify-center"
                                disabled={creating}
                            >
                                <Camera className="w-8 h-8 mb-1 text-primary-500" />
                                <span className="text-sm text-gray-600">Upload Image</span>
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 btn-primary"
                            disabled={creating || !title.trim() || !content.trim() || (type !== 'photo' && !correctAnswer.trim())}
                        >
                            {creating ? 'Saving...' : editingClue ? 'Update Clue' : 'Create Clue'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 active:scale-95 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Clues List */}
            {clues.length === 0 ? (
                <div className="glass rounded-3xl shadow-glass p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No clues yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {clues.map((clue, index) => (
                        <div key={clue.id} className="glass rounded-3xl shadow-glass p-4">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-gray-900">{clue.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{clue.content}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded flex items-center gap-1">
                                            {clue.type === 'text' && (
                                                <>
                                                    <PenTool className="w-4 h-4" /> Text
                                                </>
                                            )}
                                            {clue.type === 'photo' && (
                                                <>
                                                    <Camera className="w-4 h-4" /> Photo
                                                </>
                                            )}
                                            {clue.type === 'scan' && (
                                                <>
                                                    <QrCode className="w-4 h-4" /> Scan
                                                </>
                                            )}
                                        </span>
                                        {clue.imageUrl && (
                                            <span className="flex items-center gap-1">
                                                <ImageIcon className="w-4 h-4" /> Has image
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => startEdit(clue)}
                                    className="flex-1 px-3 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClue(clue.id, clue.title)}
                                    className="flex-1 px-3 py-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
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
