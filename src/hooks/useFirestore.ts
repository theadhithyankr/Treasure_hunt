import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Team, Clue, Submission, Announcement } from '../types';

// Hook to fetch all teams
export function useTeams() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'teams'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Team[];
            setTeams(teamsData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { teams, loading };
}

// Hook to fetch all clues
export function useClues() {
    const [clues, setClues] = useState<Clue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'clues'), orderBy('index', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cluesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Clue[];
            setClues(cluesData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { clues, loading };
}

// Hook to fetch submissions
export function useSubmissions(teamId?: string) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let q;
        if (teamId) {
            q = query(
                collection(db, 'submissions'),
                where('teamId', '==', teamId),
                orderBy('submittedAt', 'desc')
            );
        } else {
            q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const submissionsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                submittedAt: doc.data().submittedAt?.toDate() || new Date()
            })) as Submission[];
            setSubmissions(submissionsData);
            setLoading(false);
        });

        return unsubscribe;
    }, [teamId]);

    return { submissions, loading };
}

// Hook to fetch announcements
export function useAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const announcementsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Announcement[];
            setAnnouncements(announcementsData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { announcements, loading };
}

// Hook to fetch leaderboard (teams sorted by completed clues)
export function useLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const teamsSnapshot = await getDocs(collection(db, 'teams'));
            const teamsData = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Team[];

            // Sort by number of completed clues (descending)
            const sorted = teamsData.sort((a, b) =>
                (b.completedClues?.length || 0) - (a.completedClues?.length || 0)
            );

            setLeaderboard(sorted);
            setLoading(false);
        };

        // Fetch initially
        fetchLeaderboard();

        // Set up real-time listener
        const q = query(collection(db, 'teams'));
        const unsubscribe = onSnapshot(q, () => {
            fetchLeaderboard();
        });

        return unsubscribe;
    }, []);

    return { leaderboard, loading };
}

// Hook to fetch a specific team
export function useTeam(teamId?: string) {
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!teamId) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, 'teams', teamId), (snapshot) => {
            if (snapshot.exists()) {
                setTeam({
                    id: snapshot.id,
                    ...snapshot.data(),
                    createdAt: snapshot.data().createdAt?.toDate() || new Date()
                } as Team);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [teamId]);

    return { team, loading };
}
