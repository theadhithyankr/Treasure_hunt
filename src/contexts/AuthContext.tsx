import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    type User as FirebaseUser,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User } from '../types';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signInCoordinator: (email: string, password: string) => Promise<void>;
    signInPlayer: (teamCode: string, teamName?: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set persistence to local
        setPersistence(auth, browserLocalPersistence);

        // Check for stored player session first
        const storedUser = localStorage.getItem('treasureHuntUser');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setCurrentUser(userData);
                setLoading(false);
                return;
            } catch (err) {
                console.error('Failed to parse stored user:', err);
                localStorage.removeItem('treasureHuntUser');
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    setCurrentUser(userDoc.data() as User);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInCoordinator = async (email: string, password: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

        if (!userDoc.exists() || userDoc.data().role !== 'coordinator') {
            await firebaseSignOut(auth);
            throw new Error('Invalid coordinator credentials');
        }

        setCurrentUser(userDoc.data() as User);
    };

    const signInPlayer = async (teamCode: string, teamName?: string) => {
        // Find team by code using query
        const teamsRef = collection(db, 'teams');
        const q = query(teamsRef, where('code', '==', teamCode.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error('Invalid team code');
        }

        const teamDoc = querySnapshot.docs[0];
        const team = teamDoc.data();

        // Create anonymous user session
        const userId = `player_${teamCode}_${Date.now()}`;
        const userData: User = {
            uid: userId,
            role: 'player',
            teamId: teamDoc.id,
            teamName: team.name || teamName
        };

        // Store in Firestore
        await setDoc(doc(db, 'users', userId), userData);

        // Store in localStorage for persistence
        localStorage.setItem('treasureHuntUser', JSON.stringify(userData));

        setCurrentUser(userData);
    };

    const signOut = async () => {
        if (currentUser?.role === 'coordinator') {
            await firebaseSignOut(auth);
        }
        localStorage.removeItem('treasureHuntUser');
        setCurrentUser(null);
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        signInCoordinator,
        signInPlayer,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
