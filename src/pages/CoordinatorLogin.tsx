import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hapticError, hapticSuccess } from '../utils/haptics';

export default function CoordinatorLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signInCoordinator } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInCoordinator(email, password);
            hapticSuccess();
            navigate('/coordinator/dashboard');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-treasure-100 to-treasure-200 p-6 safe-area-top safe-area-bottom">
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🧭</div>
                    <h1 className="text-3xl font-adventure text-treasure-700 mb-2">
                        Coordinator Login
                    </h1>
                    <p className="text-treasure-600">
                        Manage teams and clues
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-treasure-700 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="coordinator@example.com"
                            className="input-field"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-treasure-700 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="input-field"
                            required
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
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
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
