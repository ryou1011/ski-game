export class Random {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        // LCG parameters
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
}
