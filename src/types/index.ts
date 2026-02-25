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
    cloudinaryPublicId?: string; // set only for photo submissions
    type: 'text' | 'photo' | 'scan';
    status: 'pending' | 'approved' | 'rejected' | 'upload_failed';
    /** True while a photo is still being uploaded to Cloudinary */
    uploading?: boolean;
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

export interface Victim {
    name: string;
    photo: string;
    age: number;
    occupation: string;
    bio: string;
    lastSeen: string;
}

export interface Suspect {
    id: string;
    name: string;
    photo: string;
    age: number;
    occupation: string;
    relationship: string;
    alibi: string;
    motive: string;
    isCulprit: boolean;
}

export interface Evidence {
    id: string;
    title: string;
    description: string;
    image?: string;
    foundAt: string;
    unlockClueId?: string;
    relatedSuspectId?: string;
}

export interface MysteryData {
    id: 'current';
    active: boolean;
    startClueId?: string; // New: Clue that triggers mystery start/theme change
    revealed: boolean;
    revealedAt?: Date;
    victim: Victim;
    suspects: Suspect[];
    evidence: Evidence[];
}

export interface Accusation {
    id: string;
    teamId: string;
    teamName: string;
    suspectId: string;
    suspectName: string;
    reasoning?: string;
    submittedAt: Date;
    correct: boolean;
}

export interface User {
    uid: string;
    role: 'player' | 'coordinator';
    teamId?: string; // for players
    teamName?: string; // for players
}
