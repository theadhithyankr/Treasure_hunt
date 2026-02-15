export function triggerHaptic(duration: number = 200): void {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

export function hapticSuccess(): void {
    triggerHaptic(200);
}

export function hapticError(): void {
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}
