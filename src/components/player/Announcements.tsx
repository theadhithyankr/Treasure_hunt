import { Megaphone, Bell, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Announcement {
    id: string;
    title: string;
    message: string;
    createdAt: any;
    priority: 'low' | 'medium' | 'high';
}

export default function Announcements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const announcementData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Announcement[];
            setAnnouncements(announcementData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'border-red-400 bg-red-50';
            case 'medium':
                return 'border-yellow-400 bg-yellow-50';
            default:
                return 'border-blue-400 bg-blue-50';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return <Bell className="w-5 h-5 text-red-500" />;
            case 'medium':
                return <Megaphone className="w-5 h-5 text-yellow-600" />;
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <Megaphone className="w-10 h-10 mb-2 animate-pulse mx-auto text-primary-500" />
                <p className="text-gray-700">Loading announcements...</p>
            </div>
        );
    }

    return (
        <div className="px-4 py-6">
            <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <Megaphone className="w-6 h-6 text-primary-500" />
                <span className="bg-gradient-primary bg-clip-text text-transparent">Announcements</span>
            </h2>

            {announcements.length === 0 ? (
                <div className="card text-center py-12">
                    <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">No Announcements Yet</h3>
                    <p className="text-sm text-gray-500">
                        Check back later for updates from coordinators
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className={`rounded-2xl p-4 border-l-4 glass ${getPriorityColor(announcement.priority)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    {getPriorityIcon(announcement.priority)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg mb-1 text-gray-900">
                                        {announcement.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-gray-700">
                                        {announcement.message}
                                    </p>
                                    {announcement.createdAt && (
                                        <p className="text-xs mt-2 text-gray-500">
                                            {new Date(announcement.createdAt.toDate()).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
