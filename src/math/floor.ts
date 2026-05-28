import { Vec2 } from './vec2';

export function floor(x: number): number;
export function floor(vec: Vec2): Vec2;
export function floor(arg: number | Vec2): number | Vec2 {
    if (typeof arg === 'number') {
        return Math.floor(arg);
    } else {
        return new Vec2(Math.floor(arg.x), Math.floor(arg.y));
    }
}
