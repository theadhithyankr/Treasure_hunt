import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAnnouncements } from '../../hooks/useFirestore';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { formatTimestamp } from '../../utils/helpers';
import { Megaphone, Edit2, Trash2 } from 'lucide-react';

export default function BroadcastPanel() {
    const { announcements, loading } = useAnnouncements();
    const [showForm, setShowForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<'normal' | 'high'>('normal');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSending(true);

        try {
            await addDoc(collection(db, 'announcements'), {
                title: title.trim() || null,
                message,
                priority,
                createdAt: serverTimestamp()
            });

            hapticSuccess();
            resetForm();
            alert('Announcement sent!');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to send announcement');
        } finally {
            setSending(false);
        }
    };

    const handleEditAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAnnouncement) return;

        setError('');
        setSending(true);

        try {
            await updateDoc(doc(db, 'announcements', editingAnnouncement.id), {
                title: title.trim() || null,
                message,
                priority,
                editedAt: serverTimestamp()
            });

            hapticSuccess();
            resetForm();
            alert('Announcement updated!');
        } catch (err: any) {
            hapticError();
            setError(err.message || 'Failed to update announcement');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteAnnouncement = async (announcementId: string) => {
        if (!confirm('Delete this announcement? This cannot be undone.')) return;

        try {
            await deleteDoc(doc(db, 'announcements', announcementId));
            hapticSuccess();
            alert('Announcement deleted!');
        } catch (err: any) {
            hapticError();
            alert('Failed to delete announcement: ' + err.message);
        }
    };

    const handleDeleteAllAnnouncements = async () => {
        if (announcements.length === 0) return;
        if (!confirm(`Are you sure you want to delete ALL ${announcements.length} announcements? This cannot be undone.`)) return;

        setIsDeletingAll(true);
        try {
            const batch = writeBatch(db);
            announcements.forEach((announcement) => {
                const docRef = doc(db, 'announcements', announcement.id);
                batch.delete(docRef);
            });
            await batch.commit();

            hapticSuccess();
            alert('All announcements deleted!');
        } catch (err: any) {
            hapticError();
            console.error('Failed to delete all announcements:', err);
            alert('Failed to delete all announcements: ' + err.message);
        } finally {
            setIsDeletingAll(false);
        }
    };

    const startEdit = (announcement: any) => {
        setEditingAnnouncement(announcement);
        setTitle(announcement.title || '');
        setMessage(announcement.message);
        setPriority(announcement.priority || 'normal');
        setShowForm(true);
    };

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setPriority('normal');
        setShowForm(false);
        setEditingAnnouncement(null);
        setError('');
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Announcements
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                    {showForm ? '✕ Cancel' : '+ New Announcement'}
                </button>
            </div>

            {/* Broadcast Form */}
            {showForm && (
                <form onSubmit={editingAnnouncement ? handleEditAnnouncement : handleBroadcast} className="glass rounded-3xl shadow-glass p-4 mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {editingAnnouncement ? 'Edit Announcement' : 'Send Announcement'}
                    </h3>

                    <div className="mb-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Important Update"
                            className="input-field"
                            disabled={sending}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your announcement..."
                            className="input-field"
                            rows={4}
                            required
                            disabled={sending}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Priority
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as 'normal' | 'high')}
                            className="input-field"
                            disabled={sending}
                        >
                            <option value="normal">Normal</option>
                            <option value="high">High Priority</option>
                        </select>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 btn-primary flex items-center justify-center gap-2"
                            disabled={sending || !message.trim()}
                        >
                            <Megaphone className="w-5 h-5" />
                            {sending ? 'Sending...' : editingAnnouncement ? 'Update' : 'Broadcast to All Teams'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 active:scale-95 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Announcements History */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">
                    Recent Announcements
                </h3>
                {announcements.length > 0 && (
                    <button
                        onClick={handleDeleteAllAnnouncements}
                        disabled={isDeletingAll}
                        className="text-xs px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" />
                        {isDeletingAll ? 'Deleting...' : 'Delete All'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="glass rounded-3xl shadow-glass p-6 text-center">
                    <Megaphone className="w-10 h-10 mb-2 animate-pulse mx-auto text-primary-500" />
                    <p className="text-gray-700">Loading...</p>
                </div>
            ) : announcements.length === 0 ? (
                <div className="glass rounded-3xl shadow-glass p-8 text-center">
                    <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No announcements yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((announcement) => (
                        <div key={announcement.id} className="glass rounded-3xl shadow-glass p-4">
                            <div className="flex items-start gap-3 mb-3">
                                <Megaphone className={`w-6 h-6 flex-shrink-0 ${announcement.priority === 'high' ? 'text-red-500' : 'text-primary-500'}`} />
                                <div className="flex-1 min-w-0">
                                    {announcement.title && (
                                        <h4 className="font-bold text-gray-900 mb-1">{announcement.title}</h4>
                                    )}
                                    <p className="text-sm text-gray-800">{announcement.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTimestamp(announcement.createdAt)}
                                        {announcement.editedAt && ' (edited)'}
                                    </p>
                                    {announcement.priority === 'high' && (
                                        <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                            High Priority
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => startEdit(announcement)}
                                    className="flex-1 px-3 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                                    className="flex-1 px-3 py-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
