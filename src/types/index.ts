export interface Team {
    id: string;
    name: string;
    code: string; // 6-digit join code
    completedClues: string[]; // clue IDs
    createdAt: Date;
}

export interface Clue {
    id: string;
    index: number; // order
    title: string;
    content: string;
    imageUrl?: string;
    type: 'text' | 'photo' | 'scan';
    correctAnswer: string; // or barcode value
    createdAt: Date;
}

export interface Submission {
    id: string;
    teamId: string;
    teamName: string;
    clueId: string;
    clueTitle: string;
    content: string; // answer or photo URL
    type: 'text' | 'photo' | 'scan';
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
}

export interface Announcement {
    id: string;
    title?: string;
    message: string;
    priority?: 'normal' | 'high';
    createdAt: Date;
    editedAt?: Date;
}

export interface MysteryData {
    id: 'current';
    active: boolean;
    victim: {
        name: string;
        photo: string;
        bio: string;
    };
    evidence: Array<{
        title: string;
        description: string;
        image?: string;
    }>;
    suspects: Array<{
        name: string;
        photo: string;
        alibi: string;
    }>;
}

export interface User {
    uid: string;
    role: 'player' | 'coordinator';
    teamId?: string; // for players
    teamName?: string; // for players
}
