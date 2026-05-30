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
export function vec2(vec: Vec2): Vec2;
export function vec2(arg1?: number | Vec2, arg2?: number): Vec2 {
    if (arg1 === undefined) {
        return new Vec2(0, 0);
    } else if (typeof arg1 === 'number') {
        const x = arg1;
        const y = arg2 === undefined ? arg1 : arg2;
        return new Vec2(x, y);
    } else {
        return new Vec2(arg1.x, arg1.y);
    }
}
