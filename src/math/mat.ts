import { vec2, Vec2 } from './vec2';

export class Mat {
    data: number[][];

    constructor(data: number[][]) {
        this.data = data;
    }

    size(): Vec2 {
        const h = this.data.length;
        if (h === 0) {
            return vec2(0, 0);
        }
        const w = this.data[0].length;
        return vec2(w, h);
    }

    /**
     * This is not the standard matrix multiplication, but an element-wise multiplication.
     */
    mulEl(mat: Mat): Mat {
        const srcSize = this.size();
        const otherSize = mat.size();
        if (srcSize.x !== otherSize.y) {
            throw new Error(
                `Matrix multiplication error: incompatible sizes ${srcSize} and ${otherSize}`,
            );
        }
        const outMat = this.clone();
        for (let y = 0; y < srcSize.y; y++) {
            for (let x = 0; x < otherSize.x; x++) {
                outMat.data[y][x] *= mat.data[y][x];
            }
        }
        return outMat;
    }

    rot(angle: 90 | 180 | 270): Mat {
        const outMat = this.clone();
        if (angle === 90) {
            for (let y = 0; y < this.data.length; y++) {
                for (let x = 0; x < this.data[y].length; x++) {
                    outMat.data[x][this.data.length - 1 - y] = this.data[y][x];
                }
            }
        } else if (angle === 180) {
            for (let y = 0; y < this.data.length; y++) {
                for (let x = 0; x < this.data[y].length; x++) {
                    outMat.data[this.data.length - 1 - y][
                        this.data[y].length - 1 - x
                    ] = this.data[y][x];
                }
            }
        } else if (angle === 270) {
            for (let y = 0; y < this.data.length; y++) {
                for (let x = 0; x < this.data[y].length; x++) {
                    outMat.data[this.data[y].length - 1 - x][y] =
                        this.data[y][x];
                }
            }
        }
        return outMat;
    }

    mulElOffs(mat: Mat, off: Vec2): Mat {
        const outMat = this.clone();
        for (let y = 0; y < mat.size().y; y++) {
            for (let x = 0; x < mat.size().x; x++) {
                const outX = x + off.x;
                const outY = y + off.y;
                if (
                    outX >= 0 &&
                    outX < outMat.size().x &&
                    outY >= 0 &&
                    outY < outMat.size().y
                ) {
                    outMat.data[outY][outX] *= mat.data[y][x];
                }
            }
        }
        return outMat;
    }

    setElOffs(mat: Mat, off: Vec2): Mat {
        const outMat = this.clone();
        for (let y = 0; y < mat.size().y; y++) {
            for (let x = 0; x < mat.size().x; x++) {
                const outX = x + off.x;
                const outY = y + off.y;
                if (
                    outX >= 0 &&
                    outX < outMat.size().x &&
                    outY >= 0 &&
                    outY < outMat.size().y
                ) {
                    outMat.data[outY][outX] = mat.data[y][x];
                }
            }
        }
        return outMat;
    }

    clone(): Mat {
        const d: number[][] = [];
        for (let y = 0; y < this.data.length; y++) {
            const row: number[] = [];
            for (let x = 0; x < this.data[y].length; x++) {
                row.push(this.data[y][x]);
            }
            d.push(row);
        }
        return mat(d);
    }
}

export function mat(size: Vec2, val: number): Mat;
export function mat(data: number[][]): Mat;
export function mat(arg1: Vec2 | number[][], arg2?: number): Mat {
    if (arg1 instanceof Vec2) {
        const size = arg1;
        const val = arg2 ?? 0;
        const data: number[][] = [];
        for (let y = 0; y < size.y; y++) {
            const row: number[] = [];
            for (let x = 0; x < size.x; x++) {
                row.push(val);
            }
            data.push(row);
        }
        return new Mat(data);
    } else {
        return new Mat(arg1);
    }
}
