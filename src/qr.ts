import { mat, Mat } from './math/mat';
import { idxToXy } from './math/transform';
import { vec2 } from './math/vec2';
import { getQrInfo, type QrEcLevel, type QrInfo } from './qr-info';

export class Qr {
    data: string;
    dataBytes: Uint8Array;
    bits: Mat = mat([]);
    mask: number;
    info: QrInfo;

    constructor(ecLevel: QrEcLevel, mask: number, data: string) {
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
        return dataMask;
    }

    private fillData(dataBytes: number[], dataMask: Mat): void {
        this.bits.data[this.info.size.y - 1][this.info.size.x - 1] = 0;
        this.bits.data[this.info.size.y - 1][this.info.size.x - 2] = 1;
        this.bits.data[this.info.size.y - 2][this.info.size.x - 1] = 0;
        this.bits.data[this.info.size.y - 2][this.info.size.x - 2] = 0;
        const bitsSize = this.bits.size();
        const dir = vec2(-1, -1);
        const pos = vec2(this.info.size.x - 1, this.info.size.y - 3);
        const maskSize = dataMask.size();
        for (let i = 0; i < dataBytes.length; i++) {
            const bits = dataBytes[i].toString(2).padStart(8, '0');
            let color = (i % 3) + 2;
            let yOffset = 0;
            while (dataMask.data[pos.y][pos.x]) {
                pos.y += dir.y;
                if (pos.y < 0) {
                    pos.y = maskSize.y - 1;
                    pos.x += dir.x;
                }
            }
            const bitsLen = dataBytes[i] === 0 ? 4 : 8;
            for (let idx = 0; idx < bitsLen; idx++) {
                const blockPos = idxToXy(idx, 2);
                const maskPos = vec2(
                    pos.x + blockPos.x * dir.x,
                    pos.y + blockPos.y * dir.y + yOffset,
                );
                if (
                    maskPos.y < 0 ||
                    maskPos.y >= maskSize.y ||
                    dataMask.data[maskPos.y][maskPos.x]
                ) {
                    if (dir.y === -1) {
                        maskPos.y += 1;
                    } else {
                        maskPos.y -= 1;
                    }
                    yOffset = 2 * dir.y;
                    dir.y *= -1;
                    maskPos.x -= 2;
                    pos.x = maskPos.x;
                    pos.y = maskPos.y;
                }
                if (
                    maskPos.x < 0 ||
                    maskPos.x >= bitsSize.x ||
                    maskPos.y < 0 ||
                    maskPos.y >= bitsSize.y
                ) {
                    return;
                    // throw new Error(
                    //     `Data position out of bounds: (${pos.x}, ${pos.y}), ${i}`,
                    // ); // Debugging line
                }
                this.bits.data[maskPos.y][maskPos.x] =
                    bits[idx] === '1' ? 1 : 0;
                // this.bits.data[maskPos.y][maskPos.x] = color;
                // this.bits.data[maskPos.y][maskPos.x] = 100 + idx;
                if (idx >= bits.length - 1) {
                    pos.x = maskPos.x + 1;
                    pos.y = maskPos.y + dir.y;
                }
            }
        }
    }

    private generate(): void {
        const formatData =
            (((this.info.ecLevel << 3) | this.mask) << 10) | this.getFormatBCH();
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
        const markerSize = marker.size();
        const stripLen = this.info.size.x - 2 * markerSize.x;
        let strip: number[] = [];
        for (let i = 0; i < stripLen; i++) {
            strip.push(i % 2 ? 0 : 1);
        }
        this.bits = this.bits
            .setElOffs(marker, vec2(0, 0))
            .setElOffs(marker.rot(90), vec2(this.info.size.x - markerSize.x, 0))
            .setElOffs(marker.rot(270), vec2(0, this.info.size.y - markerSize.y))
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
            );
        const dataMask = this.getDataMask();
        const dataBytes = [
            this.data.length,
            ...new TextEncoder().encode(this.data),
            0,
        ];
        this.fillData(dataBytes, dataMask);
        // this.bits = dataMask;
    }
}
