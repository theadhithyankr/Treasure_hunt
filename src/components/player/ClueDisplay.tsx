import { Unlock } from 'lucide-react';
import type { Clue } from '../../types';
import SubmissionForm from './SubmissionForm';

interface ClueDisplayProps {
    clue: Clue;
    clueIndex: number;
    totalClues: number;
    completedClues: number;
    isMysteryTheme?: boolean;
}

export default function ClueDisplay({ clue, clueIndex, totalClues, completedClues, isMysteryTheme }: ClueDisplayProps) {
    return (
        <div className="space-y-4">
            {/* Progress indicator */}
            <div className="flex items-center justify-between px-2">
                <span className={`text-sm font-semibold ${isMysteryTheme ? 'text-slate-400' : 'text-gray-700'}`}>
                    Clue #{clueIndex + 1}
                </span>
                <span className={`text-xs flex items-center gap-1 ${isMysteryTheme ? 'text-slate-500' : 'text-gray-600'}`}>
                    <Unlock className="w-3 h-3" /> {completedClues}/{totalClues}
                </span>
            </div>

            {/* Clue card */}
            <div className={`p-6 rounded-2xl shadow-sm border transition-colors duration-500 ${isMysteryTheme
                    ? 'bg-slate-800 border-slate-700 shadow-purple-900/10'
                    : 'bg-white border-white/50 shadow-glass'
                }`}>
                <h2 className={`text-2xl font-bold mb-4 ${isMysteryTheme ? 'text-white' : 'text-gray-900'
                    }`}>
                    {clue.title}
                </h2>

                <p className={`text-base leading-relaxed mb-4 whitespace-pre-wrap ${isMysteryTheme ? 'text-slate-300' : 'text-gray-800'
                    }`}>
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
