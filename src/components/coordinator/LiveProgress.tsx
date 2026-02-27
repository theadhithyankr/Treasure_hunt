import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Team, Clue, ClueStatus } from '../../types';
import { Clock, CheckCircle, AlertCircle, Timer, MonitorPlay } from 'lucide-react';

export default function LiveProgress() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [clues, setClues] = useState<Clue[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Fetch clues once
    useEffect(() => {
        const q = query(collection(db, 'clues'), orderBy('index'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setClues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clue)));
        });
        return () => unsubscribe();
    }, []);

    // Fetch teams
    useEffect(() => {
        const q = query(collection(db, 'teams'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            } as Team));
            setTeams(teamsData);
        });
        return () => unsubscribe();
    }, []);

    // Update timer every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (ms: number) => {
        if (ms < 0) ms = 0;
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const getClueTitle = (clueId?: string) => {
        if (!clueId) return 'Starting...';
        return clues.find(c => c.id === clueId)?.title || 'Unknown Clue';
    };

    const calculateStats = (team: Team) => {
        const statuses = team.clueStatuses || {};
        let totalNetTime = 0;
        let currentClueTime = 0;
        let currentStatus = 'unknown';
        let activeClueId = team.currentClueId;

        // Calculate total time for completed/pending clues
        Object.values(statuses).forEach((status: ClueStatus) => {
            if (status.unlockedAt && status.submittedAt) {
                // Determine timestamps. Firestore timestamps need conversion if not normalized
                const start = status.unlockedAt?.toDate ? status.unlockedAt.toDate() : new Date(status.unlockedAt);
                const end = status.submittedAt?.toDate ? status.submittedAt.toDate() : new Date(status.submittedAt);
                totalNetTime += (end.getTime() - start.getTime());
            } else if (status.status === 'active' && status.unlockedAt) {
                 // Current active clue duration
                 const start = status.unlockedAt?.toDate ? status.unlockedAt.toDate() : new Date(status.unlockedAt);
                 currentClueTime = currentTime.getTime() - start.getTime();
                 currentStatus = 'active';
            }
        });

        // If the current clue is pending approval, we can show that duration
        if (activeClueId && statuses[activeClueId]?.status === 'pending') {
             currentStatus = 'pending';
             const status = statuses[activeClueId];
             const start = status.unlockedAt?.toDate ? status.unlockedAt.toDate() : new Date(status.unlockedAt);
             const end = status.submittedAt?.toDate ? status.submittedAt.toDate() : new Date(status.submittedAt);
             currentClueTime = end.getTime() - start.getTime(); // Frozen time while waiting
        }

        // If team completed everything
        if (team.completedClues?.length === clues.length && clues.length > 0) {
            currentStatus = 'finished';
            currentClueTime = 0; 
        }

        return { totalNetTime, currentClueTime, currentStatus };
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-amber-900/20">
            <div className="p-6 bg-amber-50 border-b border-amber-900/10 flex justify-between items-center">
                <h2 className="text-2xl font-bold font-serif text-amber-900 flex items-center gap-2">
                    <MonitorPlay className="w-6 h-6" />
                    Live Tracking
                </h2>
                <div className="text-sm text-amber-800 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Updates Live
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-amber-100/50 text-amber-900 font-serif">
                        <tr>
                            <th className="p-4 rounded-tl-lg">Team</th>
                            <th className="p-4">Current Clue</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Time on Current</th>
                            <th className="p-4 rounded-tr-lg">Total Solve Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/10">
                        {teams.map(team => {
                            const stats = calculateStats(team);
                            return (
                                <tr key={team.id} className="hover:bg-amber-50/50 transition-colors">
                                    <td className="p-4 font-medium text-amber-900">
                                        {team.name}
                                        <div className="text-xs text-amber-600 font-mono mt-1">{team.code}</div>
                                    </td>
                                    <td className="p-4 text-amber-800">
                                        {stats.currentStatus === 'finished' ? 
                                            <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> All Done</span> : 
                                            getClueTitle(team.currentClueId)
                                        }
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                            ${stats.currentStatus === 'active' ? 'bg-blue-100 text-blue-700' : 
                                              stats.currentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                              stats.currentStatus === 'finished' ? 'bg-emerald-100 text-emerald-700' :
                                              'bg-gray-100 text-gray-600'}`}>
                                            {stats.currentStatus === 'active' && <Timer className="w-3 h-3 animate-pulse" />}
                                            {stats.currentStatus === 'pending' && <AlertCircle className="w-3 h-3" />}
                                            {stats.currentStatus}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-amber-900">
                                        {stats.currentStatus === 'finished' ? '-' : formatDuration(stats.currentClueTime)}
                                    </td>
                                    <td className="p-4 font-mono font-bold text-amber-900">
                                        {formatDuration(stats.totalNetTime)}
                                    </td>
                                </tr>
                            );
                        })}
                        {teams.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-amber-600 italic">
                                    No teams yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}