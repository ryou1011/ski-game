export class SimplexNoise {
    constructor(seed = Math.random()) {
        this.p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        for (let i = 0; i < 256; i++) {
            let r = i + ~~(seed * (256 - i));
            let temp = this.p[i];
            this.p[i] = this.p[r];
            this.p[r] = temp;
        }
        this.perm = new Uint8Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }
    noise2D(x, y) {
        let X = Math.floor(x) & 255;
        let Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        let u = fade(x);
        let v = fade(y);
        let n00 = grad(this.perm[X + this.perm[Y]], x, y);
        let n01 = grad(this.perm[X + this.perm[Y + 1]], x, y - 1);
        let n10 = grad(this.perm[X + 1 + this.perm[Y]], x - 1, y);
        let n11 = grad(this.perm[X + 1 + this.perm[Y + 1]], x - 1, y - 1);
        let nx0 = lerp(n00, n10, u);
        let nx1 = lerp(n01, n11, u);
        let nxy = lerp(nx0, nx1, v);
        return nxy;
    }
}

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

function grad(hash, x, y) {
    let h = hash & 7;
    let u = h < 4 ? x : y;
    let v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
}
