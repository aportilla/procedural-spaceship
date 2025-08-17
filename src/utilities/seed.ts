export function getInitialSeed(): string {
    if (typeof window !== 'undefined' && window.location) {
        const url = new URL(window.location.href);
        const urlSeed = url.searchParams.get('seed');
        if (urlSeed && urlSeed.length > 0) {
            return urlSeed;
        }
    }
    return Math.random().toString(36).slice(2, 10);
}

export function randomSeed(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = 'spaceship-';
    for (let i = 0; i < 6; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
}