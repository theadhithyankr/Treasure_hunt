export function generateTeamCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isMobile(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export async function shareContent(title: string, text: string, url?: string): Promise<boolean> {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url: url || window.location.href });
            return true;
        } catch (error) {
            console.error('Error sharing:', error);
            return false;
        }
    }
    return false;
}

export function formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}
