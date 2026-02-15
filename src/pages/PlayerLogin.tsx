import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Map, ArrowLeft, Loader2 } from 'lucide-react';

export default function PlayerLogin() {
    const [teamCode, setTeamCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signInPlayer } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInPlayer(teamCode.toUpperCase(), playerName);
            navigate('/player/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to join team');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="mb-4 flex items-center gap-2 text-primary-700 hover:text-primary-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold">Back</span>
                </button>

                {/* Login Card */}
                <div className="glass rounded-3xl shadow-glass p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-glow-primary mb-4">
                            <Map className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                            Join the Hunt
                        </h1>
                        <p className="text-gray-600">
                            Enter your team code to begin
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Team Code
                            </label>
                            <input
                                type="text"
                                value={teamCode}
                                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                                placeholder="Enter team code"
                                className="input-field uppercase tracking-wider font-mono"
                                required
                                disabled={loading}
                                maxLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Enter your name"
                                className="input-field"
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm animate-scale-in">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !teamCode.trim() || !playerName.trim()}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Joining...
                                </span>
                            ) : (
                                'Start Adventure'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
