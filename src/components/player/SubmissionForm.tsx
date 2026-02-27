import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Clue } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { QrCode, Camera, Check, Clock, XCircle, RotateCcw, Info } from 'lucide-react';
import CameraScanner from './CameraScanner';

interface SubmissionFormProps {
    clue: Clue;
}

export default function SubmissionForm({ clue }: SubmissionFormProps) {
    const { currentUser } = useAuth();
    const [textAnswer, setTextAnswer] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [statusFromDb, setStatusFromDb] = useState<string | null>(null);
    const [rejectionFeedback, setRejectionFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // New state for photo upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isScanned, setIsScanned] = useState(false);

    // Real-time status listener for this specific clue
    useEffect(() => {
        if (!currentUser?.teamId) return;

        const q = query(
            collection(db, 'submissions'),
            where('teamId', '==', currentUser.teamId),
            where('clueId', '==', clue.id),
            orderBy('submittedAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setStatusFromDb(data.status);
                if (data.status === 'rejected') {
                    setRejectionFeedback(data.feedback || null);
                } else {
                    setRejectionFeedback(null);
                }
            } else {
                setStatusFromDb(null);
            }
        });

        // Cleanup listener
        return () => unsubscribe();
    }, [currentUser?.teamId, clue.id]);

    const submissionStatus = statusFromDb || 'none'; // 'none', 'pending', 'approved', 'rejected'

    const handleCameraScan = (result: string) => {
        if (result) {
            setTextAnswer(result);
            setIsCameraOpen(false);
            setIsScanned(true);
            hapticSuccess();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];
                // Compress image before setting state
                const compressed = await compressImage(file);
                setSelectedFile(compressed);
                // Create preview URL
                const url = URL.createObjectURL(compressed);
                setPreviewUrl(url);
                setError(null);
            } catch (err) {
                console.error("Error processing image:", err);
                setError("Failed to process image. Please try again.");
            }
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.teamId || !currentUser?.teamName) return;

        setError(null);
        setSubmitting(true);

        try {
            // Check for existing pending/approved submissions to prevent duplicates
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

                // Update team status tracking for solving time
                try {
                    await updateDoc(doc(db, 'teams', currentUser.teamId), {
                        [`clueStatuses.${clue.id}.status`]: 'pending',
                        [`clueStatuses.${clue.id}.submittedAt`]: serverTimestamp()
                    });
                } catch (error) {
                    console.error("Error updating team clue status:", error);
                }

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

                // Update team status tracking for solving time
                try {
                    await updateDoc(doc(db, 'teams', currentUser.teamId), {
                        [`clueStatuses.${clue.id}.status`]: 'pending',
                        [`clueStatuses.${clue.id}.submittedAt`]: serverTimestamp()
                    });
                } catch (error) {
                    console.error("Error updating team clue status:", error);
                }
            }

            hapticSuccess();
            // Reset form — status will update via the onSnapshot listener
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
                    <div className="relative">
                        <textarea
                            value={textAnswer}
                            onChange={(e) => {
                                setTextAnswer(e.target.value);
                                if (e.target.value && isScanned) setIsScanned(false);
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all resize-none min-h-[100px]"
                            placeholder="Type your answer here..."
                        />
                        <button
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Scan QR Code"
                        >
                            <QrCode className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Photo Evidence (Optional)
                    </label>
                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="photo-upload"
                        />
                        
                        {!previewUrl ? (
                            <label
                                htmlFor="photo-upload"
                                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all text-gray-500 hover:text-primary-600"
                            >
                                <Camera className="w-5 h-5" />
                                <span className="text-sm font-medium">Take Photo or Upload</span>
                            </label>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="w-full h-48 object-cover object-center"
                                />
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl flex items-center gap-2">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!canSubmit() || submitting}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
                        ${!canSubmit() || submitting
                            ? 'bg-gray-300 cursor-not-allowed shadow-none'
                            : 'bg-gradient-primary hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                >
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Submitting...</span>
                        </>
                    ) : (
                        <>
                            <span>Submit Answer</span>
                            <Check className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            {isCameraOpen && (
                <CameraScanner
                    onClose={() => setIsCameraOpen(false)}
                    onScanComplete={handleCameraScan}
                />
            )}
        </>
    );
}
