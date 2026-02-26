import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

export default function TerritoryLockScreen() {
    const [phase, setPhase] = useState<'enter' | 'lock' | 'wait'>('enter');

    // Animate through intro phases
    useEffect(() => {
        const t1 = setTimeout(() => setPhase('lock'), 2500);
        const t2 = setTimeout(() => setPhase('wait'), 5000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-yellow-400/30 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Radial glow behind lock */}
            <div className="absolute w-72 h-72 rounded-full bg-yellow-500/10 blur-3xl animate-pulse" />

            <div
                className={`flex flex-col items-center gap-8 px-8 text-center transition-all duration-1000 ${
                    phase === 'enter' ? 'opacity-100 scale-100' : 'opacity-100'
                }`}
            >
                {/* Lock icon */}
                <div
                    className={`transition-all duration-1000 ${
                        phase === 'lock' || phase === 'wait'
                            ? 'scale-125 drop-shadow-[0_0_40px_rgba(234,179,8,0.6)]'
                            : 'scale-100'
                    }`}
                >
                    <Lock
                        className={`w-24 h-24 transition-colors duration-1000 ${
                            phase === 'enter' ? 'text-white' : 'text-yellow-400'
                        }`}
                        strokeWidth={1.5}
                    />
                </div>

                {/* Main message */}
                <div className="space-y-3">
                    <h1
                        className={`text-3xl font-black tracking-widest uppercase transition-all duration-1000 ${
                            phase === 'enter'
                                ? 'text-white opacity-0 translate-y-4'
                                : 'text-yellow-400 opacity-100 translate-y-0'
                        }`}
                    >
                        You Have Entered
                    </h1>
                    <h2
                        className={`text-4xl font-black tracking-wide uppercase transition-all duration-1000 delay-300 ${
                            phase === 'lock' || phase === 'wait'
                                ? 'text-white opacity-100 translate-y-0'
                                : 'text-white opacity-0 translate-y-4'
                        }`}
                    >
                        A New Territory
                    </h2>
                </div>

                {/* Sub-text and waiting state */}
                <div
                    className={`transition-all duration-1000 delay-500 ${
                        phase === 'wait' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                >
                    <div className="w-px h-12 bg-gradient-to-b from-yellow-400/0 via-yellow-400/60 to-yellow-400/0 mx-auto mb-6" />
                    <p className="text-gray-400 text-sm tracking-widest uppercase mb-8">
                        Access Restricted
                    </p>
                    <div className="bg-gray-900 border border-yellow-400/20 rounded-2xl px-6 py-5 max-w-xs">
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            This region is sealed. A higher authority must grant you passage.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                            <p className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">
                                Awaiting Authorization
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom team seal */}
            {phase === 'wait' && (
                <div className="absolute bottom-10 text-center animate-fade-in">
                    <p className="text-gray-600 text-xs tracking-widest uppercase">
                        Stand by for further instructions
                    </p>
                </div>
            )}
        </div>
    );
}
