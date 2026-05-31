import { SimpleLinearFn } from '../math/simple_linear_fn';
import { vec2 } from '../math/vec2';

const norm = new SimpleLinearFn(vec2(0, 0), vec2(255, 1));

export class Color {
    r: number;
    g: number;
    b: number;
    a: number;

    constructor(r: number, g: number, b: number, a = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    rgba(): number {
        return (this.r << 24) | (this.g << 16) | (this.b << 8) | this.a;
    }

    get rn(): number {
        return norm.cal(this.r);
    }

    get gn(): number {
        return norm.cal(this.g);
    }

    get bn(): number {
        return norm.cal(this.b);
    }

    get an(): number {
        return norm.cal(this.a);
    }

    toHex(): string {
        const r = this.r.toString(16).padStart(2, '0');
        const g = this.g.toString(16).padStart(2, '0');
        const b = this.b.toString(16).padStart(2, '0');
        const a = this.a.toString(16).padStart(2, '0');
        return `${r}${g}${b}${a}`;
    }

    static fromHex(hex: string): Color | null {
        if (hex.startsWith('#')) {
            hex = hex.slice(1);
        }
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            return new Color(r, g, b);
        } else if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return new Color(r, g, b);
        } else if (hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const a = parseInt(hex.slice(6, 8), 16);
            return new Color(r, g, b, a);
        }
        return null;
    }
}
