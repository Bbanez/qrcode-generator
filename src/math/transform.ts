import { vec2, type Vec2 } from './vec2';

export function xyToIdx(x: number, y: number, width: number): number {
    return x + y * width;
}

export function idxToXy(idx: number, width: number): Vec2 {
    const x = idx % width;
    return vec2(x, (idx - x) / width);
}
