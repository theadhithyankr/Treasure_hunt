import { Unlock } from 'lucide-react';
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
                <span className="text-sm font-semibold text-gray-700">
                    Clue #{clueIndex + 1}
                </span>
                <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> {completedClues}/{totalClues}
                </span>
            </div>

            {/* Clue card */}
            <div className="clue-card">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
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
            </div>

            {/* Submission form */}
            <SubmissionForm clue={clue} />
        </div>
    );
}
