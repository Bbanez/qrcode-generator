import type { Vec2 } from './vec2';

export class SimpleLinearFn {
    k: number;
    n: number;

    constructor(p1: Vec2, p2: Vec2) {
        this.k = (p2.y - p1.y) / (p2.x - p1.x);
        this.n = p1.y - this.k * p1.x;
    }

    cal(x: number): number {
        return this.k * x + this.n;
    }

    inv(y: number): number {
        return (y - this.n) / this.k;
    }
}
