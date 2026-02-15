import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Clue } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import CameraScanner from './CameraScanner';

interface SubmissionFormProps {
    clue: Clue;
}

export default function SubmissionForm({ clue }: SubmissionFormProps) {
    const { currentUser } = useAuth();
    const [textAnswer, setTextAnswer] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Compress image
            const compressedFile = await compressImage(file);
            setSelectedFile(compressedFile);

            // Create preview
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

    const handleScanComplete = (scannedValue: string) => {
        setTextAnswer(scannedValue);
        setShowScanner(false);
        hapticSuccess();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.teamId || !currentUser?.teamName) return;

        setSubmitting(true);
        setError('');

        try {
            let submissionContent = textAnswer;

            // Handle photo submission - convert to base64
            if (clue.type === 'photo' && selectedFile) {
                const reader = new FileReader();
                submissionContent = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(selectedFile);
                });
            }

            // Create submission
            await addDoc(collection(db, 'submissions'), {
                teamId: currentUser.teamId,
                teamName: currentUser.teamName,
                clueId: clue.id,
                clueTitle: clue.title,
                type: clue.type,
                content: submissionContent,
                status: 'pending',
                submittedAt: serverTimestamp()
            });

            hapticSuccess();
            alert('Submission sent! Wait for coordinator approval.');

            // Reset form
            setTextAnswer('');
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = () => {
        if (clue.type === 'text' || clue.type === 'scan') {
            return textAnswer.trim().length > 0;
        }
        if (clue.type === 'photo') {
            return selectedFile !== null;
        }
        return false;
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="card space-y-4">
                <h3 className="text-lg font-bold text-treasure-700">Submit Your Answer</h3>

                {/* Text Input */}
                {(clue.type === 'text' || clue.type === 'scan') && (
                    <div>
                        <textarea
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            placeholder="Enter your answer..."
                            className="input-field"
                            rows={3}
                            disabled={submitting}
                        />
                    </div>
                )}

                {/* QR/Barcode Scanner Button */}
                {clue.type === 'scan' && (
                    <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="w-full py-6 bg-treasure-500 text-white rounded-lg shadow-lg hover:bg-treasure-600 active:bg-treasure-700 transition-colors"
                        disabled={submitting}
                    >
                        <span className="text-4xl block mb-2">📷</span>
                        <span className="text-lg font-bold">Scan QR/Barcode</span>
                    </button>
                )}

                {/* Photo Upload */}
                {clue.type === 'photo' && (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {previewUrl ? (
                            <div className="space-y-3">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full rounded-lg shadow-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                                    disabled={submitting}
                                >
                                    📸 Take Another Photo
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-8 border-4 border-dashed border-treasure-400 rounded-lg hover:border-treasure-500 hover:bg-treasure-50 active:bg-treasure-100 transition-colors"
                                disabled={submitting}
                            >
                                <span className="text-5xl block mb-2">📸</span>
                                <p className="text-lg font-semibold text-treasure-700">
                                    Take or Upload Photo
                                </p>
                            </button>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={!canSubmit() || submitting}
                >
                    {submitting ? 'Submitting...' : '✓ Submit Answer'}
                </button>
            </form>

            {/* Camera Scanner Modal */}
            {showScanner && (
                <CameraScanner
                    onScanComplete={handleScanComplete}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </>
    );
}
