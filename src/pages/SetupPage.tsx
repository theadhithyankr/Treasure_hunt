import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

export default function SetupPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string[]>([]);

    const addStatus = (message: string) => {
        setStatus(prev => [...prev, message]);
    };

    const setupSampleData = async () => {
        setLoading(true);
        setStatus([]);

        try {
            addStatus('🔧 Setting up sample data...');

            // Create sample teams
            addStatus('\n📋 Creating sample teams...');
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
                    createdAt: serverTimestamp()
                });
                addStatus(`✅ Created ${team.name} (Code: ${team.code})`);
            }

            // Create sample clues
            addStatus('\n📝 Creating sample clues...');
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
                    createdAt: serverTimestamp()
                });
                addStatus(`✅ Created clue: ${clue.title}`);
            }

            // Create welcome announcement
            addStatus('\n📢 Creating welcome announcement...');
            await addDoc(collection(db, 'announcements'), {
                message: '🎉 Welcome to the Treasure Hunt! Good luck to all teams!',
                createdAt: serverTimestamp()
            });
            addStatus('✅ Welcome announcement created!');

            addStatus('\n🎉 Setup complete!');
            addStatus('\n📱 You can now:');
            addStatus('   • View teams in the Teams tab');
            addStatus('   • View clues in the Clues tab');
            addStatus('   • Join as player with codes: ALPHA1, BETA22, or GAMMA3');

        } catch (error: any) {
            addStatus(`\n❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-treasure-50 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="card">
                    <h1 className="text-3xl font-adventure text-treasure-700 mb-4">
                        🚀 Quick Setup
                    </h1>

                    <p className="text-gray-700 mb-6">
                        Click the button below to populate your database with sample data:
                    </p>

                    <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                        <li>3 sample teams (ALPHA1, BETA22, GAMMA3)</li>
                        <li>3 sample clues (scan, photo, text types)</li>
                        <li>1 welcome announcement</li>
                    </ul>

                    <button
                        onClick={setupSampleData}
                        disabled={loading}
                        className="btn-primary mb-4"
                    >
                        {loading ? '⏳ Setting up...' : '🎯 Create Sample Data'}
                    </button>

                    <button
                        onClick={() => navigate('/coordinator/dashboard')}
                        className="btn-secondary"
                    >
                        ← Back to Dashboard
                    </button>

                    {/* Status Log */}
                    {status.length > 0 && (
                        <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                            {status.map((msg, i) => (
                                <div key={i} className="whitespace-pre-wrap">{msg}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
