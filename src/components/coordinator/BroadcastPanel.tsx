import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAnnouncements } from '../../hooks/useFirestore';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { formatTimestamp } from '../../utils/helpers';

export default function BroadcastPanel() {
    const { announcements, loading } = useAnnouncements();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSending(true);

        try {
            await addDoc(collection(db, 'announcements'), {
                message,
                createdAt: serverTimestamp()
            });

            hapticSuccess();
            setMessage('');
            alert('Announcement sent!');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to send announcement');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-adventure text-treasure-700 mb-4">
                Broadcast Announcements
            </h2>

            {/* Broadcast Form */}
            <form onSubmit={handleBroadcast} className="card mb-4">
                <h3 className="text-lg font-bold text-treasure-700 mb-3">
                    Send Announcement
                </h3>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your announcement..."
                    className="input-field mb-3"
                    rows={4}
                    required
                    disabled={sending}
                />

                {error && (
                    <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-3 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={sending || !message.trim()}
                >
                    {sending ? 'Sending...' : '📢 Broadcast to All Teams'}
                </button>
            </form>

            {/* Announcements History */}
            <h3 className="text-lg font-bold text-treasure-700 mb-3">
                Recent Announcements
            </h3>

            {loading ? (
                <div className="text-center py-6">
                    <div className="text-3xl mb-2 animate-pulse">📢</div>
                    <p className="text-treasure-700">Loading...</p>
                </div>
            ) : announcements.length === 0 ? (
                <div className="card text-center py-8">
                    <div className="text-5xl mb-3">📢</div>
                    <p className="text-gray-600">No announcements yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((announcement) => (
                        <div key={announcement.id} className="card">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">📢</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800">{announcement.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTimestamp(announcement.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
