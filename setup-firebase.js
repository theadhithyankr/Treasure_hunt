// Firebase Setup Script
// Run this with: node setup-firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCREt1hA4eZA02H87kKWO3tdMHxf46sQ50",
    authDomain: "one-piece-b5d33.firebaseapp.com",
    projectId: "one-piece-b5d33",
    storageBucket: "one-piece-b5d33.firebasestorage.app",
    messagingSenderId: "483888352023",
    appId: "1:483888352023:web:efdb4f08244fa65d354552",
    measurementId: "G-EB0T6687H2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupFirebase() {
    try {
        console.log('🔧 Setting up Firebase...\n');

        // 1. Create coordinator user (if not exists)
        console.log('1️⃣ Creating coordinator account...');
        let coordinatorUid;
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                'coordinator@treasurehunt.com',
                'Coordinator123!'
            );
            coordinatorUid = userCredential.user.uid;
            console.log('✅ Coordinator created!');
            console.log('   Email: coordinator@treasurehunt.com');
            console.log('   Password: Coordinator123!');
            console.log('   UID:', coordinatorUid);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log('⚠️  Coordinator already exists, skipping...');
                // You'll need to manually get the UID from Firebase Console
                coordinatorUid = 'PASTE_YOUR_COORDINATOR_UID_HERE';
            } else {
                throw error;
            }
        }

        // 2. Add coordinator role to Firestore
        if (coordinatorUid !== 'PASTE_YOUR_COORDINATOR_UID_HERE') {
            console.log('\n2️⃣ Adding coordinator role to Firestore...');
            await setDoc(doc(db, 'users', coordinatorUid), {
                uid: coordinatorUid,
                role: 'coordinator'
            });
            console.log('✅ Coordinator role added!');
        }

        // 3. Create sample teams
        console.log('\n3️⃣ Creating sample teams...');
        const teams = [
            { name: 'Team Alpha', code: 'ALPHA1' },
            { name: 'Team Beta', code: 'BETA22' },
            { name: 'Team Gamma', code: 'GAMMA3' }
        ];

        for (const team of teams) {
            await addDoc(collection(db, 'teams'), {
                name: team.name,
                code: team.code,
                completedClues: [],
                createdAt: new Date()
            });
            console.log(`✅ Created ${team.name} (Code: ${team.code})`);
        }

        // 4. Create sample clues
        console.log('\n4️⃣ Creating sample clues...');
        const clues = [
            {
                index: 0,
                title: 'The First Challenge',
                content: 'Find the place where knowledge flows freely. Look for the tallest shelf and scan the code on the red book.',
                type: 'scan',
                correctAnswer: 'LIBRARY2024',
                imageUrl: null
            },
            {
                index: 1,
                title: 'Capture the Moment',
                content: 'Take a photo of your entire team doing a silly pose in front of the main entrance!',
                type: 'photo',
                correctAnswer: '',
                imageUrl: null
            },
            {
                index: 2,
                title: 'The Riddle',
                content: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
                type: 'text',
                correctAnswer: 'echo',
                imageUrl: null
            }
        ];

        for (const clue of clues) {
            await addDoc(collection(db, 'clues'), {
                ...clue,
                createdAt: new Date()
            });
            console.log(`✅ Created clue: ${clue.title}`);
        }

        // 5. Create welcome announcement
        console.log('\n5️⃣ Creating welcome announcement...');
        await addDoc(collection(db, 'announcements'), {
            message: '🎉 Welcome to the Treasure Hunt! Good luck to all teams!',
            createdAt: new Date()
        });
        console.log('✅ Welcome announcement created!');

        console.log('\n🎉 Firebase setup complete!\n');
        console.log('📱 You can now:');
        console.log('   1. Login as coordinator: coordinator@treasurehunt.com / Coordinator123!');
        console.log('   2. Join as player with codes: ALPHA1, BETA22, or GAMMA3');
        console.log('   3. Start solving clues!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up Firebase:', error);
        process.exit(1);
    }
}

setupFirebase();
