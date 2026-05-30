import { mat, Mat } from './math/mat';
import { vec2 } from './math/vec2';
import { getQrCodewords } from './qr-error';
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

    getVersionBCH(): number {
        const generator = 0b1111100100101;
        let value = this.info.version << 12;

        while (value.toString(2).length >= generator.toString(2).length) {
            const shift = value.toString(2).length - generator.toString(2).length;
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
        if (this.info.version >= 7) {
            dataMask = dataMask
                .setElOffs(mat(vec2(3, 6), 1), vec2(this.info.size.x - 11, 0))
                .setElOffs(mat(vec2(6, 3), 1), vec2(0, this.info.size.y - 11));
        }
        return dataMask;
    }

    private getMaskBit(x: number, y: number): boolean {
        switch (this.mask) {
            case 0:
                return (x + y) % 2 === 0;
            case 1:
                return y % 2 === 0;
            case 2:
                return x % 3 === 0;
            case 3:
                return (x + y) % 3 === 0;
            case 4:
                return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
            case 5:
                return ((x * y) % 2) + ((x * y) % 3) === 0;
            case 6:
                return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            case 7:
                return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
            default:
                throw new Error(`Invalid QR mask pattern: ${this.mask}`);
        }
    }

    private applyMask(dataMask: Mat): void {
        for (let y = 0; y < this.info.size.y; y++) {
            for (let x = 0; x < this.info.size.x; x++) {
                if (dataMask.data[y][x] || !this.getMaskBit(x, y)) {
                    continue;
                }
                this.bits.data[y][x] ^= 1;
            }
        }
    }

    private fillData(dataBytes: number[], dataMask: Mat): void {
        const totalDataBits = dataBytes.length * 8;
        let bitIndex = 0;
        for (let right = this.info.size.x - 1; right >= 1; right -= 2) {
            if (right === 6) {
                right--;
            }

            const upward = Math.floor((this.info.size.x - right) / 2) % 2 === 0;
            for (let offset = 0; offset < this.info.size.y; offset++) {
                const y = upward ? this.info.size.y - 1 - offset : offset;
                for (let dx = 0; dx < 2; dx++) {
                    const x = right - dx;
                    if (dataMask.data[y][x]) {
                        continue;
                    }
                    let bit = 0;
                    if (bitIndex < totalDataBits) {
                        const byteIndex = Math.floor(bitIndex / 8);
                        const bitInByte = 7 - (bitIndex % 8);
                        bit = (dataBytes[byteIndex] >>> bitInByte) & 1;
                        bitIndex++;
                    }
                    this.bits.data[y][x] = bit;
                }
            }
        }

        if (bitIndex !== totalDataBits) {
            throw new Error(
                `QR data placement mismatch: placed ${bitIndex} bits, expected ${totalDataBits}`,
            );
        }
    }

    private generate(): void {
        console.log(this.info);
        const formatData =
            ((((this.info.ecLevel << 3) | this.mask) << 10) |
                this.getFormatBCH()) ^
            0b101010000010010;
        const versionData =
            this.info.version >= 7
                ? (this.info.version << 12) | this.getVersionBCH()
                : 0;
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
            );
        this.bits.data[markerSize.y][markerSize.x - 3] = errorFormatParts[0];
        this.bits.data[markerSize.y][markerSize.x - 1] = errorFormatParts[1];
        this.bits = this.bits.mulElOffs(
            mat([
                ...errorFormatParts
                    .slice(4, 10)
                    .reverse()
                    .map((e) => [e]),
                [1],
                ...errorFormatParts
                    .slice(2, 4)
                    .reverse()
                    .map((e) => [e]),
            ]),
            vec2(markerSize.x, 0),
        );
        this.bits.data[this.info.size.y - markerSize.y + 2][markerSize.x] =
            errorFormatParts[0];
        this.bits.data[this.info.size.y - markerSize.y + 1][markerSize.x] =
            errorFormatParts[1];
        this.bits = this.bits.mulElOffs(
            mat([errorFormatParts.slice(2, 10).map((e) => e)]),
            vec2(this.info.size.x - markerSize.x, markerSize.y),
        );
        if (this.info.version >= 7) {
            for (let i = 0; i < 18; i++) {
                const bit = (versionData >>> i) & 1;
                this.bits.data[Math.floor(i / 3)][this.info.size.x - 11 + (i % 3)] =
                    bit;
                this.bits.data[this.info.size.y - 11 + (i % 3)][Math.floor(i / 3)] =
                    bit;
            }
        }

        const dataMask = this.getDataMask();
        const dataBytes = getQrCodewords(this.dataBytes, this.info);
        this.fillData(dataBytes, dataMask);
        this.applyMask(dataMask);
        this.maskData = dataMask;
        // this.bits = dataMask;
    }
}
