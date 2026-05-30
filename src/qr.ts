import { mat, Mat } from './math/mat';
import { idxToXy } from './math/transform';
import { vec2, type Vec2 } from './math/vec2';
import { getQrInfo, type QrEcLevel, type QrInfo } from './qr-info';

export class Qr {
    data: string;
    dataBytes: Uint8Array;
    bits: Mat = mat([]);
    mask: number;
    maskData: Mat;
    info: QrInfo;

    constructor(ecLevel: QrEcLevel, mask: number, data: string) {
        this.maskData = null as never;
        this.mask = mask;
        this.data = data;
        this.dataBytes = new TextEncoder().encode(data);
        this.info = getQrInfo(this.dataBytes.length, ecLevel);
        this.generate();
    }

    setData(data: string): void {
        this.data = data;
        this.dataBytes = new TextEncoder().encode(data);
        this.info = getQrInfo(this.dataBytes.length, this.info.ecLevelCode);
        this.generate();
    }

    getFormatBCH(): number {
        const generator = 0b10100110111;
        const data5 = (this.info.ecLevel << 3) | this.mask;
        let value = data5 << 10;
        function bitLen(n: number): number {
            return n.toString(2).length;
        }
        while (bitLen(value) >= bitLen(generator)) {
            const shift = bitLen(value) - bitLen(generator);
            value ^= generator << shift;
        }
        return value;
    }

    private getDataMask(): Mat {
        let dataMask = mat(this.info.size, 0);
        const markerMask = mat(vec2(8, 8), 1);
        const markerMaskSize = markerMask.size();
        const stripLen = this.info.size.x - 2 * markerMaskSize.x;
        const strip: number[] = new Array(stripLen).fill(1);
        dataMask = dataMask
            .setElOffs(markerMask, vec2(0, 0))
            .setElOffs(markerMask, vec2(this.info.size.x - markerMaskSize.x, 0))
            .setElOffs(markerMask, vec2(0, this.info.size.y - markerMaskSize.y))
            .setElOffs(
                mat([strip]),
                vec2(markerMaskSize.x, markerMaskSize.y - 2),
            )
            .setElOffs(
                mat(
                    strip.map((e) => {
                        return [e];
                    }),
                ),
                vec2(markerMaskSize.x - 2, markerMaskSize.y),
            )
            .setElOffs(
                mat([new Array(markerMaskSize.x).fill(1)]),
                vec2(0, markerMaskSize.y),
            )
            .setElOffs(
                mat([new Array(markerMaskSize.x).fill(1)]),
                vec2(this.info.size.x - markerMaskSize.x, markerMaskSize.y),
            )
            .setElOffs(
                mat(new Array(markerMaskSize.y + 1).fill(1).map((e) => [e])),
                vec2(markerMaskSize.x, 0),
            )
            .setElOffs(
                mat(new Array(markerMaskSize.y).fill(1).map((e) => [e])),
                vec2(markerMaskSize.x, this.info.size.y - markerMaskSize.y),
            );
        const aMarker = mat(vec2(5), 1);
        for (let i = 0; i < this.info.aMarkers.length; i++) {
            const pos = this.info.aMarkers[i];
            dataMask = dataMask.setElOffs(aMarker, pos);
        }
        return dataMask;
    }

    private fixTopOut(pos: Vec2, dir: Vec2): boolean {
        if (pos.y < 0) {
            pos.y = 0;
            pos.x -= 2;
            dir.y *= -1;
            return true;
        }
        return false;
    }

    private fixBottomOut(pos: Vec2, dir: Vec2): boolean {
        if (pos.y >= this.info.size.y) {
            pos.y = this.info.size.y - 1;
            pos.x -= 2;
            dir.y *= -1;
            return true;
        }
        return false;
    }

    private nextBitPos(pos: Vec2, dir: Vec2, dataMask: Mat): Vec2 {
        let newPos = vec2(pos.x, pos.y);
        if (this.fixTopOut(newPos, dir)) {
            return newPos;
        }
        if (this.fixBottomOut(newPos, dir)) {
            return newPos;
        }
        newPos.x += 1 * dir.x;
        if (newPos.x % 2 === 0) {
            newPos.x += 2;
            newPos.y += dir.y;
            if (this.fixTopOut(newPos, dir)) {
                return newPos;
            }
            if (this.fixBottomOut(newPos, dir)) {
                return newPos;
            }
        }
        return newPos;
    }

    private fillData(dataBytes: number[], dataMask: Mat): void {
        this.bits.data[this.info.size.y - 1][this.info.size.x - 1] = 0;
        this.bits.data[this.info.size.y - 1][this.info.size.x - 2] = 1;
        this.bits.data[this.info.size.y - 2][this.info.size.x - 1] = 0;
        this.bits.data[this.info.size.y - 2][this.info.size.x - 2] = 0;
        const dir = vec2(-1, -1);
        const pos = vec2(this.info.size.x - 1, this.info.size.y - 3);
        for (let i = 0; i < dataBytes.length; i++) {
            const bits = dataBytes[i].toString(2).padStart(8, '0');
            // let color = (i % 3) + 2;
            const bitsLen = dataBytes[i] === 0 ? 4 : 8;
            let idx = 0;
            let loop = -1;
            while (idx < bitsLen) {
                loop++;
                if (
                    pos.x < 0 ||
                    pos.x >= this.info.size.x ||
                    pos.y < 0 ||
                    pos.y >= this.info.size.y
                ) {
                    console.log(
                        'Data position out of bounds or masked:',
                        pos,
                        i,
                        idx,
                    );
                    return;
                }
                this.bits.data[pos.y][pos.x] =
                    bits[bits.length - 1 - idx] === '1' ? 1 : 0;
                // this.bits.data[pos.y][pos.x] = color;
                let newPos = this.nextBitPos(pos, dir, dataMask);
                while (dataMask.data[newPos.y][newPos.x]) {
                    newPos = this.nextBitPos(newPos, dir, dataMask);
                }
                pos.x = newPos.x;
                pos.y = newPos.y;
                idx++;
            }
            // pos.x += 2;
            // pos.y += dir.y;
        }
    }

    private generate(): void {
        console.log(this.info);
        const formatData =
            (((this.info.ecLevel << 3) | this.mask) << 10) |
            this.getFormatBCH();
        const formatDataStr = formatData
            .toString(2)
            .padStart(15, '0')
            .split('');
        console.log('format data:', formatData.toString(2).padStart(15, '0'));
        this.bits = mat(this.info.size, 1);
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
        const aMarker = mat([
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
        ]);
        const markerSize = marker.size();
        const stripLen = this.info.size.x - 2 * markerSize.x;
        let strip: number[] = [];
        for (let i = 0; i < stripLen; i++) {
            strip.push(i % 2 ? 0 : 1);
        }
        for (let i = 0; i < this.info.aMarkers.length; i++) {
            const pos = this.info.aMarkers[i];
            this.bits = this.bits.setElOffs(aMarker, pos);
        }
        const errorFormatParts = formatDataStr
            .slice(5)
            .map((e) => (e === '1' ? 1 : 0));
        this.bits = this.bits
            .setElOffs(marker, vec2(0, 0))
            .setElOffs(marker.rot(90), vec2(this.info.size.x - markerSize.x, 0))
            .setElOffs(
                marker.rot(270),
                vec2(0, this.info.size.y - markerSize.y),
            )
            .setElOffs(mat([strip]), vec2(markerSize.x, markerSize.y - 2))
            .setElOffs(
                mat(
                    strip.map((e) => {
                        return [e];
                    }),
                ),
                vec2(markerSize.x - 2, markerSize.y),
            )
            .setElOffs(
                mat([
                    formatDataStr.slice(0, 2).map((e) => (e === '1' ? 1 : 0)),
                ]),
                vec2(0, markerSize.y),
            )
            .setElOffs(
                mat(
                    formatDataStr
                        .slice(0, 2)
                        .reverse()
                        .map((e) => (e === '1' ? [1] : [0])),
                ),
                vec2(markerSize.x, this.info.size.y - 2),
            )
            .setElOffs(
                mat([
                    formatDataStr.slice(2, 5).map((e) => (e === '1' ? 1 : 0)),
                ]),
                vec2(2, markerSize.y),
            )
            .setElOffs(
                mat(
                    formatDataStr
                        .slice(2, 5)
                        .reverse()
                        .map((e) => (e === '1' ? [1] : [0])),
                ),
                vec2(markerSize.x, this.info.size.y - 5),
            )
            .mulElOffs(
                mat([
                    ...errorFormatParts.slice(0, 6).map((e) => [e]),
                    [1],
                    ...errorFormatParts.slice(6, 8).map((e) => [e]),
                ]),
                vec2(markerSize.x, 0),
            )
            .mulElOffs(
                mat([
                    errorFormatParts
                        .slice(0, 8)
                        .reverse()
                        .map((e) => e),
                ]),
                vec2(this.info.size.x - markerSize.x, markerSize.y),
            );
        this.bits.data[markerSize.y][markerSize.x - 1] = errorFormatParts[8];
        this.bits.data[markerSize.y][markerSize.x - 3] = errorFormatParts[9];
        this.bits.data[this.info.size.y - markerSize.y + 1][markerSize.x] =
            errorFormatParts[8];
        this.bits.data[this.info.size.y - markerSize.y + 2][markerSize.x] =
            errorFormatParts[9];

        const dataMask = this.getDataMask();
        const dataBytes = [
            this.data.length,
            ...new TextEncoder().encode(this.data),
            0,
        ];
        this.fillData(dataBytes, dataMask);
        this.maskData = dataMask;
        // this.bits = dataMask;
    }
}
