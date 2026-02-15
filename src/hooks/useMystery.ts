import { useState, useEffect } from 'react';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MysteryData, Accusation, Evidence } from '../types';

// Fetch mystery data
export function useMysteryData() {
    const [mystery, setMystery] = useState<MysteryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'mystery', 'current'),
            (snapshot) => {
                if (snapshot.exists()) {
                    setMystery({ id: 'current', ...snapshot.data() } as MysteryData);
                } else {
                    setMystery(null);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching mystery:', error);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    return { mystery, loading };
}

// Get evidence unlocked by a specific team
export function useUnlockedEvidence(completedClues: string[]) {
    const { mystery } = useMysteryData();
    const [unlockedEvidence, setUnlockedEvidence] = useState<Evidence[]>([]);

    useEffect(() => {
        if (!mystery || !mystery.active) {
            setUnlockedEvidence([]);
            return;
        }

        // Filter evidence that's unlocked by completed clues
        const unlocked = mystery.evidence.filter(evidence => {
            // If no unlock condition, it's always visible
            if (!evidence.unlockClueId) return true;
            // Check if team has completed the required clue
            return completedClues.includes(evidence.unlockClueId);
        });

        setUnlockedEvidence(unlocked);
    }, [mystery, completedClues]);

    return { unlockedEvidence, totalEvidence: mystery?.evidence.length || 0 };
}

// Get team's accusation
export function useTeamAccusation(teamId: string) {
    const [accusation, setAccusation] = useState<Accusation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!teamId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'accusations'),
            where('teamId', '==', teamId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setAccusation({ id: doc.id, ...doc.data() } as Accusation);
            } else {
                setAccusation(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [teamId]);

    return { accusation, loading };
}

// Get all accusations (for coordinator)
export function useAllAccusations() {
    const [accusations, setAccusations] = useState<Accusation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'accusations'),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Accusation));
                setAccusations(data);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    return { accusations, loading };
}
