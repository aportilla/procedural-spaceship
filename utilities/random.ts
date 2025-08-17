export class SeededRandom {
    private seed: number;
    
    constructor(seed: string) {
        this.seed = this.hashCode(seed);
    }
    
    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    random(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    
    weightedRandom(target: number, standardDeviation: number = 0.1): number {
        const u1 = this.random();
        const u2 = this.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        let result = target + z * standardDeviation;
        return Math.max(0, Math.min(1, result));
    }
    
    range(min: number, max: number): number {
        return min + this.random() * (max - min);
    }
    
    int(min: number, max: number): number {
        return Math.floor(this.range(min, max + 1));
    }
}