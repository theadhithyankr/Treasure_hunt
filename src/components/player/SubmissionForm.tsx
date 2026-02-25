import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Clue } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { QrCode, Camera, Check, Clock, XCircle, RotateCcw } from 'lucide-react';
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
    const [submissionStatus, setSubmissionStatus] = useState<'pending' | 'rejected' | null>(null);
    const [rejectionFeedback, setRejectionFeedback] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Real-time listener: watch for pending/rejected submission on this clue
    useEffect(() => {
        if (!currentUser?.teamId) return;

        const q = query(
            collection(db, 'submissions'),
            where('teamId', '==', currentUser.teamId),
            where('clueId', '==', clue.id),
            where('status', 'in', ['pending', 'rejected']),
            orderBy('submittedAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setSubmissionStatus(null);
                setRejectionFeedback('');
                return;
            }
            const data = snapshot.docs[0].data();
            setSubmissionStatus(data.status as 'pending' | 'rejected');
            setRejectionFeedback(data.feedback || '');
        });

        return () => unsubscribe();
    }, [currentUser?.teamId, clue.id]);

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
        setIsScanned(true);
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
            let submissionType = 'text';
            let cloudinaryPublicId: string | undefined;

            // Determine what type of submission this is
            if (selectedFile) {
                submissionType = 'photo';
                const { url, publicId } = await uploadToCloudinary(selectedFile);
                submissionContent = url;
                cloudinaryPublicId = publicId;
            } else if (textAnswer.trim()) {
                // Check if it was scanned
                submissionType = isScanned ? 'scan' : 'text';
            }

            // Create submission
            await addDoc(collection(db, 'submissions'), {
                teamId: currentUser.teamId,
                teamName: currentUser.teamName,
                clueId: clue.id,
                clueTitle: clue.title,
                type: submissionType,
                expectedType: clue.type, // Store expected type for validation
                content: submissionContent,
                ...(cloudinaryPublicId ? { cloudinaryPublicId } : {}),
                status: 'pending',
                submittedAt: serverTimestamp()
            });

            hapticSuccess();
            // Reset form — status will update via the onSnapshot listener
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
        return textAnswer.trim().length > 0 || selectedFile !== null;
    };

    // ── Waiting for approval ──────────────────────────────────────────────────
    if (submissionStatus === 'pending') {
        return (
            <div className="glass rounded-3xl shadow-glass p-6">
                <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="w-7 h-7 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-amber-700">Waiting for Approval</h3>
                        <p className="text-sm text-gray-500 mt-1">Your answer has been submitted and is being reviewed by the coordinator.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Rejection banner — shown above the form so player can try again */}
            {submissionStatus === 'rejected' && (
                <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-bold text-red-700 text-sm">Submission Rejected</p>
                        {rejectionFeedback
                            ? <p className="text-xs text-red-600 mt-0.5">{rejectionFeedback}</p>
                            : <p className="text-xs text-red-500 mt-0.5">Please try again with a different answer.</p>
                        }
                    </div>
                    <RotateCcw className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass rounded-3xl shadow-glass p-6 space-y-4">
                <h3 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {submissionStatus === 'rejected' ? 'Try Again' : 'Submit Your Answer'}
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
                    {submitting ? 'Submitting...' : (
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
