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