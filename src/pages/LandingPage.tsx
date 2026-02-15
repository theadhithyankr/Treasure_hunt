import { useNavigate } from 'react-router-dom';
import { Map, Sparkles } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Gradient Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-3xl shadow-glow-primary mb-8 animate-scale-in">
                    <Map className="w-12 h-12 text-white" />
                </div>

                {/* Title */}
                <h1 className="text-6xl font-adventure bg-gradient-primary bg-clip-text text-transparent mb-6">
                    Treasure Hunt
                </h1>

                {/* Subtitle */}
                <p className="text-gray-700 text-xl mb-12 flex items-center justify-center gap-2 font-semibold">
                    <Sparkles className="w-6 h-6 text-primary-500" />
                    Adventure Awaits
                    <Sparkles className="w-6 h-6 text-primary-500" />
                </p>

                {/* Action Buttons */}
                <div className="space-y-4 animate-slide-up">
                    <button
                        onClick={() => navigate('/player/login')}
                        className="btn-primary"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Map className="w-5 h-5" />
                            Join as Player
                        </span>
                    </button>

                    <button
                        onClick={() => navigate('/coordinator/login')}
                        className="btn-secondary"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Coordinator Login
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
