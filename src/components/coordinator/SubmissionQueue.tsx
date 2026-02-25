import { doc, updateDoc, deleteDoc, arrayUnion, addDoc, collection, serverTimestamp, getDocs, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Submission } from '../../types';
import { deleteFromCloudinary } from '../../utils/cloudinary';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { Check, PenTool, Camera, QrCode, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';
import { formatTimestamp } from '../../utils/helpers';

interface SubmissionQueueProps {
    submissions: Submission[];
    loading: boolean;
}

// Filter out upload_failed so the queue only shows actionable items by default
// but still allow the coordinator to delete failed ones.

export default function SubmissionQueue({ submissions, loading }: SubmissionQueueProps) {
    const handleApprove = async (submission: Submission) => {
        if (!confirm(`Approve submission from ${submission.teamName}?`)) return;

        try {
            // Update submission status
            await updateDoc(doc(db, 'submissions', submission.id), {
                status: 'approved'
            });

            // Delete submission image from Cloudinary — no longer needed
            if (submission.type === 'photo' && submission.cloudinaryPublicId) {
                await deleteFromCloudinary(submission.cloudinaryPublicId);
            }

            // Add clue to team's completed clues
            await updateDoc(doc(db, 'teams', submission.teamId), {
                completedClues: arrayUnion(submission.clueId)
            });

            // Check if team completed all clues
            const teamDoc = await getDocs(query(collection(db, 'teams')));
            const team = teamDoc.docs.find(d => d.id === submission.teamId)?.data();
            const cluesSnapshot = await getDocs(collection(db, 'clues'));
            const totalClues = cluesSnapshot.size;
            const completedClues = (team?.completedClues || []).length + 1; // +1 for the one we just approved

            // If team completed all clues, create auto-announcement
            if (completedClues === totalClues) {
                await addDoc(collection(db, 'announcements'), {
                    title: '🎉 Team Completed!',
                    message: `Congratulations to ${submission.teamName} for completing all ${totalClues} clues! 🏆`,
                    priority: 'high',
                    createdAt: serverTimestamp()
                });
            }

            hapticSuccess();
        } catch (err: any) {
            hapticError();
            alert('Failed to approve: ' + err.message);
        }
    };

    const handleReject = async (submission: Submission) => {
        if (!confirm(`Reject submission from ${submission.teamName}?`)) return;

        const reason = prompt('Optional: Enter a rejection reason for the team (leave blank to skip)') ?? '';

        try {
            await updateDoc(doc(db, 'submissions', submission.id), {
                status: 'rejected',
                ...(reason.trim() ? { feedback: reason.trim() } : {})
            });

            // Delete submission image from Cloudinary — no longer needed
            if (submission.type === 'photo' && submission.cloudinaryPublicId) {
                await deleteFromCloudinary(submission.cloudinaryPublicId);
            }

            // Push a notification so the player sees a toast in real time
            const notifMessage = reason.trim()
                ? `Your answer for "${submission.clueTitle}" was rejected. Reason: ${reason.trim()}`
                : `Your answer for "${submission.clueTitle}" was rejected. Try again!`;

            await addDoc(collection(db, 'notifications'), {
                teamId: submission.teamId,
                type: 'rejection',
                clueTitle: submission.clueTitle,
                message: notifMessage,
                read: false,
                createdAt: serverTimestamp()
            });

            hapticSuccess();
        } catch (err: any) {
            hapticError();
            alert('Failed to reject: ' + err.message);
        }
    };

    const handleDelete = async (submission: Submission) => {
        if (!confirm(`Permanently delete this submission from ${submission.teamName}?`)) return;

        try {
            // Delete submission image from Cloudinary if it exists
            if (submission.type === 'photo' && submission.cloudinaryPublicId) {
                await deleteFromCloudinary(submission.cloudinaryPublicId);
            }
            await deleteDoc(doc(db, 'submissions', submission.id));
            hapticSuccess();
            alert('Submission deleted!');
        } catch (err: any) {
            hapticError();
            alert('Failed to delete: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <Check className="w-10 h-10 mb-2 animate-pulse mx-auto text-primary-500" />
                <p className="text-gray-700">Loading submissions...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-primary bg-clip-text text-transparent">
                Submission Queue
            </h2>

            {submissions.length === 0 ? (
                <div className="card text-center py-8">
                    <Check className="w-12 h-12 mb-3 mx-auto text-gray-300" />
                    <p className="text-gray-600">No pending submissions</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {submissions.map((submission) => (
                        <div key={submission.id} className="glass rounded-3xl shadow-glass p-4">
                            <div className="mb-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{submission.teamName}</h3>
                                        <p className="text-sm text-primary-600">{submission.clueTitle}</p>
                                        {/* Upload status badges */}
                                        {submission.uploading && (
                                            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Photo uploading…
                                            </span>
                                        )}
                                        {submission.status === 'upload_failed' && (
                                            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                                                <AlertTriangle className="w-3 h-3" />
                                                Upload failed
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatTimestamp(submission.submittedAt)}
                                    </span>
                                </div>

                                {/* Submission Content */}
                                {submission.type === 'photo' ? (
                                    <img
                                        src={submission.content}
                                        alt="Submission"
                                        className="w-full rounded-lg shadow-md mb-3"
                                    />
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <p className="text-sm font-mono text-gray-800">{submission.content}</p>
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                    Type: {submission.type === 'text' && (
                                        <>
                                            <PenTool className="w-4 h-4" /> Text
                                        </>
                                    )}
                                    {submission.type === 'photo' && (
                                        <>
                                            <Camera className="w-4 h-4" /> Photo
                                        </>
                                    )}
                                    {submission.type === 'scan' && (
                                        <>
                                            <QrCode className="w-4 h-4" /> Scan
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {submission.status === 'pending' && !submission.uploading ? (
                                    <>
                                        <button
                                            onClick={() => handleApprove(submission)}
                                            disabled={submission.type === 'photo' && !submission.content}
                                            className="flex-1 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(submission)}
                                            className="flex-1 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </>
                                ) : submission.status === 'pending' && submission.uploading ? (
                                    <div className="flex-1 py-3 text-center text-sm text-amber-600 font-semibold">
                                        Waiting for photo…
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleDelete(submission)}
                                        className="w-full py-3 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
