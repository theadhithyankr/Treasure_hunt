import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hapticError, hapticSuccess } from '../utils/haptics';

export default function PlayerLogin() {
    const [teamCode, setTeamCode] = useState('');
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signInPlayer } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInPlayer(teamCode, teamName);
            hapticSuccess();
            navigate('/player/dashboard');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to join team');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-treasure-100 to-treasure-200 p-6 safe-area-top safe-area-bottom">
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🎒</div>
                    <h1 className="text-3xl font-adventure text-treasure-700 mb-2">
                        Join Your Team
                    </h1>
                    <p className="text-treasure-600">
                        Enter your team code to start the adventure
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="teamCode" className="block text-sm font-semibold text-treasure-700 mb-2">
                            Team Code
                        </label>
                        <input
                            id="teamCode"
                            type="text"
                            value={teamCode}
                            onChange={(e) => setTeamCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="input-field text-center text-2xl tracking-widest"
                            maxLength={6}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="teamName" className="block text-sm font-semibold text-treasure-700 mb-2">
                            Your Name (Optional)
                        </label>
                        <input
                            id="teamName"
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter your name"
                            className="input-field"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || teamCode.length !== 6}
                    >
                        {loading ? 'Joining...' : 'Join Team'}
                    </button>
                </form>

                {/* Back link */}
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 text-treasure-600 text-center w-full py-3"
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
}
