import { useState, useRef } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Clue } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { QrCode, Camera, Check } from 'lucide-react';
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
    const [isScanned, setIsScanned] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedFile = await compressImage(file);
            setSelectedFile(compressedFile);

            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(compressedFile);
        } catch (err) {
            setError('Failed to process image');
            hapticError();
        }
    };

    const handleScanComplete = (scannedValue: string) => {
        setTextAnswer(scannedValue);
        setIsScanned(true);
        setShowScanner(false);
        hapticSuccess();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.teamId || !currentUser?.teamName) return;
        // Prevent double-tap / accidental re-submit
        if (submitting) return;

        setSubmitting(true);
        setError('');

        try {
            // ── Duplicate guard ─────────────────────────────────────────────
            // Check if this team already has a pending/approved submission for
            // this exact clue so that concurrent taps don't create duplicates.
            const dupQuery = query(
                collection(db, 'submissions'),
                where('teamId', '==', currentUser.teamId),
                where('clueId', '==', clue.id),
                where('status', 'in', ['pending', 'approved', 'uploading'])
            );
            const dupSnap = await getDocs(dupQuery);
            if (!dupSnap.empty) {
                setError('You already have a submission pending for this clue.');
                hapticError();
                setSubmitting(false);
                return;
            }

            const isPhoto = !!selectedFile;
            const submissionType = isPhoto ? 'photo' : isScanned ? 'scan' : 'text';

            if (isPhoto) {
                // ── OPTIMISTIC WRITE ──────────────────────────────────────────
                // Write a placeholder immediately so the coordinator sees the
                // submission arrive in real time, even before the upload finishes.
                const docRef = await addDoc(collection(db, 'submissions'), {
                    teamId: currentUser.teamId,
                    teamName: currentUser.teamName,
                    clueId: clue.id,
                    clueTitle: clue.title,
                    type: submissionType,
                    expectedType: clue.type,
                    content: '',           // will be filled in after upload
                    status: 'pending',
                    uploading: true,       // coordinator can show a "⏳ uploading" badge
                    submittedAt: serverTimestamp(),
                });

                try {
                    const { url, publicId } = await uploadToCloudinary(selectedFile!);

                    // Patch the placeholder with the real URL
                    await updateDoc(doc(db, 'submissions', docRef.id), {
                        content: url,
                        cloudinaryPublicId: publicId,
                        uploading: false,
                    });
                } catch (uploadErr: any) {
                    // Mark the submission as failed so coordinator / player can see it
                    await updateDoc(doc(db, 'submissions', docRef.id), {
                        status: 'upload_failed',
                        uploading: false,
                    });
                    hapticError();
                    setError('Photo upload failed — please try again.');
                    setSubmitting(false);
                    return;
                }
            } else {
                // Text / scan — plain Firestore write, always fast
                await addDoc(collection(db, 'submissions'), {
                    teamId: currentUser.teamId,
                    teamName: currentUser.teamName,
                    clueId: clue.id,
                    clueTitle: clue.title,
                    type: submissionType,
                    expectedType: clue.type,
                    content: textAnswer.trim(),
                    status: 'pending',
                    uploading: false,
                    submittedAt: serverTimestamp(),
                });
            }

            hapticSuccess();
            alert('Submission sent! Wait for coordinator approval.');

            // Reset form
            setTextAnswer('');
            setSelectedFile(null);
            setPreviewUrl(null);
            setIsScanned(false);
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = () => textAnswer.trim().length > 0 || selectedFile !== null;

    return (
        <>
            <form onSubmit={handleSubmit} className="glass rounded-3xl shadow-glass p-6 space-y-4">
                <h3 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Submit Your Answer
                </h3>

                {/* Text Input - Always shown */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Text Answer
                    </label>
                    <textarea
                        value={textAnswer}
                        onChange={(e) => {
                            setTextAnswer(e.target.value);
                            setIsScanned(false);
                        }}
                        placeholder="Enter your answer..."
                        className="input-field"
                        rows={3}
                        disabled={submitting}
                    />
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-2 gap-3">
                    {/* QR/Barcode Scanner Button - Always shown */}
                    <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="flex flex-col items-center justify-center py-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
                        disabled={submitting}
                    >
                        <QrCode className="w-8 h-8 mb-1" />
                        <span className="text-sm font-semibold">Scan Code</span>
                    </button>

                    {/* Photo Upload Button - Always shown */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center py-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
                        disabled={submitting}
                    >
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-sm font-semibold">Take Photo</span>
                    </button>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Photo Preview */}
                {previewUrl && (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Photo Preview:</p>
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full rounded-lg shadow-md"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedFile(null);
                                setPreviewUrl(null);
                            }}
                            className="w-full py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-300 transition-colors"
                            disabled={submitting}
                        >
                            Remove Photo
                        </button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={!canSubmit() || submitting}
                >
                    {submitting ? (
                        selectedFile
                            ? 'Uploading photo…'
                            : 'Submitting…'
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Check className="w-5 h-5" /> Submit Answer
                        </span>
                    )}
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
