import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Submission } from '../../types';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { Check, PenTool, Camera, QrCode } from 'lucide-react';
import { formatTimestamp } from '../../utils/helpers';

interface SubmissionQueueProps {
    submissions: Submission[];
    loading: boolean;
}

export default function SubmissionQueue({ submissions, loading }: SubmissionQueueProps) {
    const handleApprove = async (submission: Submission) => {
        if (!confirm(`Approve submission from ${submission.teamName}?`)) return;

        try {
            // Update submission status
            await updateDoc(doc(db, 'submissions', submission.id), {
                status: 'approved'
            });

            // Add clue to team's completed clues
            await updateDoc(doc(db, 'teams', submission.teamId), {
                completedClues: arrayUnion(submission.clueId)
            });

            hapticSuccess();
        } catch (err: any) {
            hapticError();
            alert('Failed to approve: ' + err.message);
        }
    };

    const handleReject = async (submission: Submission) => {
        if (!confirm(`Reject submission from ${submission.teamName}?`)) return;

        try {
            await updateDoc(doc(db, 'submissions', submission.id), {
                status: 'rejected'
            });

            hapticSuccess();
        } catch (err: any) {
            hapticError();
            alert('Failed to reject: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <Check className="w-10 h-10 mb-2 animate-pulse" />
                <p className="text-treasure-700">Loading submissions...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-adventure text-treasure-700 mb-4">
                Submission Queue
            </h2>

            {submissions.length === 0 ? (
                <div className="card text-center py-8">
                    <Check className="w-12 h-12 mb-3" />
                    <p className="text-gray-600">No pending submissions</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {submissions.map((submission) => (
                        <div key={submission.id} className="card">
                            <div className="mb-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg">{submission.teamName}</h3>
                                        <p className="text-sm text-treasure-600">{submission.clueTitle}</p>
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
                                        <p className="text-sm font-mono">{submission.content}</p>
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 mb-3">
                                    Type: {submission.type === 'text' && (
                                        <span className="flex items-center gap-1">
                                            <PenTool className="w-4 h-4" /> Text
                                        </span>
                                    )}
                                    {submission.type === 'photo' && (
                                        <span className="flex items-center gap-1">
                                            <Camera className="w-4 h-4" /> Photo
                                        </span>
                                    )}
                                    {submission.type === 'scan' && (
                                        <span className="flex items-center gap-1">
                                            <QrCode className="w-4 h-4" /> Scan
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleApprove(submission)}
                                    className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 active:bg-green-700"
                                >
                                    <Check className="w-4 h-4 inline mr-1" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(submission)}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 active:bg-red-700"
                                >
                                    ✕ Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
