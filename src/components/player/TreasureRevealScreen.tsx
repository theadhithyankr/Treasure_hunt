import { useState, useEffect } from 'react';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { TreasureConfig } from '../../types';
import { MapPin, FlaskConical, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { hapticSuccess, hapticError } from '../../utils/haptics';

interface TreasureRevealScreenProps {
    teamId: string;
    teamName: string;
    config: TreasureConfig;
    alreadyCompleted: boolean;
}

export default function TreasureRevealScreen({
    teamId,
    teamName,
    config,
    alreadyCompleted,
}: TreasureRevealScreenProps) {
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>(
        alreadyCompleted ? 'correct' : 'idle'
    );
    const [shaking, setShaking] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (alreadyCompleted) setStatus('correct');
    }, [alreadyCompleted]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // If no answer is configured, treat any non-empty answer as correct or show error?
        // Better: Validate that a correct answer exists.
        const correct = config.missingAnswer ? config.missingAnswer.trim().toLowerCase() : '';

        if (!correct) {
            console.error("No correct answer configured");
            setError('Configuration error: No answer set by coordinator.');
            return;
        }

        const trimmed = answer.trim().toLowerCase();

        if (trimmed === correct) {
            try {
                // Update DB first to ensure it saves
                await updateDoc(doc(db, 'teams', teamId), { 
                    formulaCompleted: true,
                    treasureFoundAt: serverTimestamp()
                });
                setStatus('correct');
                hapticSuccess();
            } catch (err) {
                console.error('Failed to save formula completion:', err);
                // Still show success to user? Or error? 
                // Showing success is risk if it didn't save.
                // But for a game, blocking usage due to network might be annoying. 
                // Let's optimistic update but log error. 
                // For now, let's just proceed to success screen.
                setStatus('correct'); 
            }
        } else {
            setStatus('wrong');
            setShaking(true);
            hapticError();
            setError(''); // Clear any system errors on wrong answer attempts
            setTimeout(() => {
                setShaking(false);
                setStatus('idle');
            }, 1500);
        }
    };

    if (status === 'correct') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-950 via-amber-900 to-yellow-800 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-yellow-400 text-xl animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`,
                            }}
                        >
                            {['✨', '�', '💎', '�', '🏆'][Math.floor(Math.random() * 5)]}
                        </div>
                    ))}
                </div>
                <div className="text-center px-8 relative z-10">
                    <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_40px_rgba(234,179,8,0.8)]" />
                    <h1 className="text-4xl font-black text-yellow-300 mb-3 tracking-wide">
                        TREASURE FOUND!
                    </h1>
                    <p className="text-yellow-200/80 text-lg mb-2">
                        {teamName} — you've cracked the code.
                    </p>
                    <p className="text-yellow-100/60 text-sm tracking-widest uppercase">
                        The hunt is complete.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-stone-900/80 backdrop-blur-md border-b border-amber-400/20 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <h1 className="text-lg font-bold text-amber-300 tracking-wide">
                        Access Granted — New Territory
                    </h1>
                </div>
                <p className="text-stone-400 text-xs mt-1">
                    Classify this information. Share with no one.
                </p>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">

                {/* MAP SECTION */}
                {(config.mapImageUrl || config.mapDescription) && (
                    <div className="bg-stone-800 border border-amber-400/30 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-400/20">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-300 font-bold text-sm tracking-widest uppercase">
                                Location Intelligence
                            </span>
                        </div>

                        {config.mapImageUrl && (
                            <div className="relative">
                                <img
                                    src={config.mapImageUrl}
                                    alt="Treasure map"
                                    className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    style={{ maxHeight: '260px' }}
                                    onClick={() => setImageOpen(true)}
                                />
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                                    Tap to enlarge
                                </div>
                            </div>
                        )}

                        {config.mapDescription && (
                            <div className="px-4 py-4">
                                <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-wrap">
                                    {config.mapDescription}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Full-screen image overlay */}
                {imageOpen && config.mapImageUrl && (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                        onClick={() => setImageOpen(false)}
                    >
                        <img
                            src={config.mapImageUrl}
                            alt="Treasure map"
                            className="max-w-full max-h-full rounded-xl object-contain"
                        />
                        <button
                            className="absolute top-4 right-4 text-white/70 hover:text-white text-sm font-semibold"
                            onClick={() => setImageOpen(false)}
                        >
                            ✕ Close
                        </button>
                    </div>
                )}

                {/* FORMULA SECTION */}
                {config.formulaText && (
                    <div className="bg-stone-800 border border-purple-400/30 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-purple-400/20">
                            <FlaskConical className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300 font-bold text-sm tracking-widest uppercase">
                                The Formula
                            </span>
                        </div>

                        <div className="px-4 py-5">
                            <div className="bg-stone-900 border border-stone-700 rounded-xl px-4 py-4 mb-5">
                                <p className="text-2xl font-mono font-bold text-amber-300 text-center tracking-wide">
                                    {config.formulaText}
                                </p>
                            </div>

                            <p className="text-stone-400 text-xs mb-4 text-center tracking-widest uppercase">
                                Complete the formula — enter the missing value
                            </p>

                            {error && (
                                <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-3 mb-4 text-red-200 text-sm flex items-center gap-2">
                                    <XCircle className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div
                                    className={`transition-all duration-100 ${
                                        shaking ? 'animate-[shake_0.3s_ease-in-out_3]' : ''
                                    }`}
                                >
                                    {status === 'wrong' && (
                                        <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                                            <XCircle className="w-4 h-4 flex-shrink-0" />
                                            Incorrect. Try again.
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={answer}
                                        onChange={e => setAnswer(e.target.value)}
                                        placeholder="Enter the missing formula…"
                                        autoComplete="off"
                                        className={`w-full bg-stone-900 border rounded-xl px-4 py-3 text-white placeholder-stone-600 font-mono text-base focus:outline-none focus:ring-2 transition-all ${
                                            status === 'wrong'
                                                ? 'border-red-500 focus:ring-red-500/30'
                                                : 'border-stone-600 focus:ring-amber-400/30 focus:border-amber-400/60'
                                        }`}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!answer.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-xl font-black text-base tracking-wide shadow-lg hover:from-amber-400 hover:to-yellow-400 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    Unlock the Treasure
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* If no config is set yet */}
                {!config.mapImageUrl && !config.mapDescription && !config.formulaText && (
                    <div className="text-center py-16">
                        <CheckCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <p className="text-amber-300 font-bold text-lg">Access Unlocked</p>
                        <p className="text-stone-400 text-sm mt-2">
                            Your coordinator is preparing the final challenge.
                        </p>
                        <div className="flex gap-1 justify-center mt-4">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
