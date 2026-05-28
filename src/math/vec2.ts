export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    sub(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    mul(scalar: number): Vec2;
    mul(other: Vec2): Vec2;
    mul(arg: number | Vec2): Vec2 {
        if (typeof arg === 'number') {
            return new Vec2(this.x * arg, this.y * arg);
        } else {
            return new Vec2(this.x * arg.x, this.y * arg.y);
        }
    }

    div(scalar: number): Vec2;
    div(other: Vec2): Vec2;
    div(arg: number | Vec2): Vec2 {
        if (typeof arg === 'number') {
            return new Vec2(this.x / arg, this.y / arg);
        } else {
            return new Vec2(this.x / arg.x, this.y / arg.y);
        }
    }

    eq(other: Vec2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    len(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

export function vec2(): Vec2;
export function vec2(x: number): Vec2;
export function vec2(x: number, y: number): Vec2;
export function vec2(x?: number, y?: number): Vec2 {
    if (x === undefined) {
        return new Vec2(0, 0);
    } else if (y === undefined) {
        return new Vec2(x, x);
    } else {
        return new Vec2(x, y);
    }
}
