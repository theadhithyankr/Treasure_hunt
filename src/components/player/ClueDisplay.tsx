import type { Clue } from '../../types';
import SubmissionForm from './SubmissionForm';

interface ClueDisplayProps {
    clue: Clue;
    clueIndex: number;
    totalClues: number;
    completedClues: number;
    isMysteryTheme?: boolean;
}

export default function ClueDisplay({ clue, isMysteryTheme }: ClueDisplayProps) {
    return (
        <div className="space-y-4">
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
