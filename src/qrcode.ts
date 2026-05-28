import { mat, Mat } from './math/mat';
import { vec2, type Vec2 } from './math/vec2';

export class QRCode {
    data: string;
    dataBytes: Uint8Array;
    size: Vec2;
    bits: Mat;

    constructor(data: string, size: Vec2) {
        this.data = data;
        this.dataBytes = new TextEncoder().encode(data);
        this.size = size;
        this.bits = mat(size, 1);
        const marker = mat([
            [1, 1, 1, 1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0, 0, 1, 0],
            [1, 0, 1, 1, 1, 0, 1, 0],
            [1, 0, 1, 1, 1, 0, 1, 0],
            [1, 0, 1, 1, 1, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
        ]);
        const markerSize = marker.size();
        this.bits = this.bits.mulElOffs(marker, vec2(0, 0));
        this.bits = this.bits.mulElOffs(
            marker.rot(90),
            vec2(size.x - markerSize.x, 0),
        );
        this.bits = this.bits.mulElOffs(
            marker.rot(270),
            vec2(0, size.y - markerSize.y),
        );
        const stripLen = size.x - 2 * markerSize.x;
        let strip: number[] = [];
        for (let i = 0; i < stripLen; i++) {
            strip.push(i % 2 ? 0 : 1);
        }
        this.bits = this.bits.mulElOffs(
            mat([strip]),
            vec2(markerSize.x, markerSize.y - 2),
        );
        this.bits = this.bits.mulElOffs(
            mat(
                strip.map((e) => {
                    return [e];
                }),
            ),
            vec2(markerSize.x - 2, markerSize.y),
        );
    }
}
