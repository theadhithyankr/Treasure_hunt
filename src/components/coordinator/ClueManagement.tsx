import { useState, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Clue } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { Camera, PenTool, QrCode, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ClueManagementProps {
    clues: Clue[];
    loading: boolean;
}

export default function ClueManagement({ clues, loading }: ClueManagementProps) {
    const [showForm, setShowForm] = useState(false);
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

            // Convert image to base64 instead of uploading to Storage
            if (selectedFile) {
                const reader = new FileReader();
                imageUrl = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(selectedFile);
                });
            }

            // Create clue
            await addDoc(collection(db, 'clues'), {
                index: clues.length, // Next index
                title,
                content,
                type,
                correctAnswer,
                imageUrl: imageUrl || null,
                createdAt: serverTimestamp()
            });

            hapticSuccess();

            // Reset form
            setTitle('');
            setContent('');
            setType('text');
            setCorrectAnswer('');
            setSelectedFile(null);
            setPreviewUrl(null);
            setShowForm(false);

            alert('Clue created successfully!');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to create clue');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClue = async (clueId: string) => {
        if (!confirm('Are you sure you want to delete this clue?')) return;

        try {
            await deleteDoc(doc(db, 'clues', clueId));
            hapticSuccess();
        } catch (err: any) {
            hapticError();
            alert('Failed to delete clue: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="text-4xl mb-2 animate-pulse">📝</div>
                <p className="text-treasure-700">Loading clues...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-adventure text-treasure-700">Clues</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-treasure-500 text-white rounded-lg font-semibold hover:bg-treasure-600 active:bg-treasure-700"
                >
                    {showForm ? '✕ Cancel' : '+ New Clue'}
                </button>
            </div>

            {/* Create Clue Form */}
            {showForm && (
                <form onSubmit={handleCreateClue} className="card mb-4 space-y-3">
                    <h3 className="text-lg font-bold text-treasure-700">Create New Clue</h3>

                    <div>
                        <label className="block text-sm font-semibold text-treasure-700 mb-1">
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
                        <label className="block text-sm font-semibold text-treasure-700 mb-1">
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
                        <label className="block text-sm font-semibold text-treasure-700 mb-1">
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
                        <label className="block text-sm font-semibold text-treasure-700 mb-1">
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
                        <label className="block text-sm font-semibold text-treasure-700 mb-2">
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
                                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                                    disabled={creating}
                                >
                                    Change Image
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-4 border-2 border-dashed border-treasure-400 rounded-lg hover:border-treasure-500 hover:bg-treasure-50"
                                disabled={creating}
                            >
                                <Camera className="w-8 h-8 mb-1" />
                                <span className="text-sm">Upload Image</span>
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={creating || !title.trim() || !content.trim() || (type !== 'photo' && !correctAnswer.trim())}
                    >
                        {creating ? 'Creating...' : 'Create Clue'}
                    </button>
                </form>
            )}

            {/* Clues List */}
            {clues.length === 0 ? (
                <div className="card text-center py-8">
                    <div className="text-5xl mb-3">📝</div>
                    <p className="text-gray-600">No clues yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {clues.map((clue, index) => (
                        <div key={clue.id} className="card">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-treasure-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg">{clue.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{clue.content}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span className="bg-treasure-100 text-treasure-700 px-2 py-1 rounded">
                                            {clue.type === 'text' && (
                                                <span className="flex items-center gap-1">
                                                    <PenTool className="w-4 h-4" /> Text
                                                </span>
                                            )}
                                            {clue.type === 'photo' && (
                                                <span className="flex items-center gap-1">
                                                    <Camera className="w-4 h-4" /> Photo
                                                </span>
                                            )}
                                            {clue.type === 'scan' && (
                                                <span className="flex items-center gap-1">
                                                    <QrCode className="w-4 h-4" /> Scan
                                                </span>
                                            )}
                                        </span>
                                        {clue.imageUrl && (
                                            <span className="flex items-center gap-1">
                                                <ImageIcon className="w-4 h-4" /> Has image
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteClue(clue.id)}
                                    className="text-red-500 hover:text-red-700 text-xl p-2"
                                    title="Delete clue"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
