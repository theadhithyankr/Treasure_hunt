import { UserCircle } from 'lucide-react';
import type { Victim } from '../../../types';

interface VictimTabProps {
    victim: Victim;
}

export default function VictimTab({ victim }: VictimTabProps) {
    return (
        <div className="p-4 space-y-4">
            {/* Victim Photo */}
            <div className="flex justify-center">
                {victim.photo ? (
                    <img
                        src={victim.photo}
                        alt={victim.name}
                        className="w-48 h-48 rounded-full object-cover shadow-xl border-4 border-gray-200"
                    />
                ) : (
                    <div className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircle className="w-32 h-32 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Victim Info */}
            <div className="glass rounded-3xl shadow-glass p-4 space-y-3">
                <h3 className="text-2xl font-bold text-center text-gray-900">{victim.name}</h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-gray-600 font-semibold">Age</p>
                        <p className="text-gray-900 font-bold">{victim.age}</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-gray-600 font-semibold">Occupation</p>
                        <p className="text-gray-900 font-bold">{victim.occupation}</p>
                    </div>
                </div>

                <div className="bg-white/50 rounded-xl p-3">
                    <p className="text-gray-600 font-semibold mb-1">Biography</p>
                    <p className="text-gray-800 text-sm leading-relaxed">{victim.bio}</p>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                    <p className="text-red-700 font-semibold mb-1 flex items-center gap-2">
                        <span className="text-lg">🚨</span> Last Seen
                    </p>
                    <p className="text-red-900 text-sm font-medium">{victim.lastSeen}</p>
                </div>
            </div>
        </div>
    );
}
