
import type { Clue } from '../../types';
import SubmissionForm from './SubmissionForm';

interface ClueDisplayProps {
    clue: Clue;
    clueIndex: number;
    totalClues: number;
    completedClues: number;
}

export default function ClueDisplay({ clue, clueIndex, totalClues, completedClues }: ClueDisplayProps) {
    return (
        <div className="space-y-4">
            {/* Progress indicator */}
            <div className="flex items-center justify-between px-2">
                <span className="text-sm font-semibold text-treasure-700">
                    Clue #{clueIndex + 1}
                </span>
                <span className="text-xs text-gray-600">
                    🔓 {completedClues}/{totalClues}
                </span>
            </div>

            {/* Clue card */}
            <div className="clue-card">
                <h2 className="text-2xl font-adventure text-treasure-700 mb-4">
                    {clue.title}
                </h2>

                <p className="text-base leading-relaxed text-gray-800 mb-4 whitespace-pre-wrap">
                    {clue.content}
                </p>

                {clue.imageUrl && (
                    <img
                        src={clue.imageUrl}
                        alt={clue.title}
                        className="w-full rounded-lg shadow-md mb-4"
                        loading="lazy"
                    />
                )}

                {/* Type indicator */}
                <div className="flex items-center gap-2 text-sm text-treasure-600 mb-4">
                    {clue.type === 'text' && (
                        <>
                            <span className="text-xl">✍️</span>
                            <span>Type your answer</span>
                        </>
                    )}
                    {clue.type === 'photo' && (
                        <>
                            <span className="text-xl">📸</span>
                            <span>Take a photo</span>
                        </>
                    )}
                    {clue.type === 'scan' && (
                        <>
                            <span className="text-xl">📷</span>
                            <span>Scan QR/Barcode</span>
                        </>
                    )}
                </div>
            </div>

            {/* Submission form */}
            <SubmissionForm clue={clue} />
        </div>
    );
}
