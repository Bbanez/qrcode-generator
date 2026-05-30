import {
    ECC_CODEWORDS_PER_BLOCK,
    NUM_ERROR_CORRECTION_BLOCKS,
    type QrInfo,
} from './qr-info';

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

let value = 1;
for (let i = 0; i < 255; i++) {
    GF_EXP[i] = value;
    GF_LOG[value] = i;
    value <<= 1;
    if (value & 0x100) {
        value ^= 0x11d;
    }
}
for (let i = 255; i < GF_EXP.length; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
}

function gfMultiply(x: number, y: number): number {
    if (x === 0 || y === 0) {
        return 0;
    }
    return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function getByteCharCountBits(version: number): number {
    if (version <= 9) {
        return 8;
    }
    return 16;
}

function appendBits(value: number, bitCount: number, bits: number[]): void {
    for (let i = bitCount - 1; i >= 0; i--) {
        bits.push((value >>> i) & 1);
    }
}

function getDataCodewords(data: Uint8Array, info: QrInfo): number[] {
    const capacityBits = info.dataCodewords * 8;
    const bits: number[] = [];
    appendBits(info.mode, 4, bits);
    appendBits(data.length, getByteCharCountBits(info.version), bits);
    for (let i = 0; i < data.length; i++) {
        appendBits(data[i], 8, bits);
    }
    if (bits.length > capacityBits) {
        throw new Error('data does not fit selected QR version');
    }
    appendBits(0, Math.min(4, capacityBits - bits.length), bits);
    while (bits.length % 8 !== 0) {
        bits.push(0);
    }
    const dataCodewords: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        let codeword = 0;
        for (let j = 0; j < 8; j++) {
            codeword = (codeword << 1) | bits[i + j];
        }
        dataCodewords.push(codeword);
    }
    const padCodewords = [0xec, 0x11];
    while (dataCodewords.length < info.dataCodewords) {
        dataCodewords.push(padCodewords[dataCodewords.length % 2]);
    }
    return dataCodewords;
}

function makeGenerator(degree: number): Uint8Array {
    const result = new Uint8Array(degree);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
        for (let j = 0; j < result.length; j++) {
            result[j] = gfMultiply(result[j], root);
            if (j + 1 < result.length) {
                result[j] ^= result[j + 1];
            }
        }
        root = gfMultiply(root, 0x02);
    }
    return result;
}

function getErrorCorrectionCodewords(
    data: number[],
    generator: Uint8Array,
): number[] {
    const result = new Uint8Array(generator.length);
    for (let i = 0; i < data.length; i++) {
        const factor = data[i] ^ result[0];
        result.copyWithin(0, 1);
        result[result.length - 1] = 0;
        for (let j = 0; j < generator.length; j++) {
            result[j] ^= gfMultiply(generator[j], factor);
        }
    }
    return Array.from(result);
}

export function getQrCodewords(data: Uint8Array, info: QrInfo): number[] {
    const dataCodewords = getDataCodewords(data, info);
    const eccLen = ECC_CODEWORDS_PER_BLOCK[info.ecLevelCode][info.version];
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[info.ecLevelCode][info.version];
    const rawCodewords = info.dataCodewords + eccLen * numBlocks;
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockDataLen = Math.floor(rawCodewords / numBlocks) - eccLen;
    const generator = makeGenerator(eccLen);
    const dataBlocks: number[][] = [];
    const ecBlocks: number[][] = [];
    let offset = 0;
    for (let blockIndex = 0; blockIndex < numBlocks; blockIndex++) {
        const dataLen =
            shortBlockDataLen + (blockIndex < numShortBlocks ? 0 : 1);
        const block = dataCodewords.slice(offset, offset + dataLen);
        offset += dataLen;
        dataBlocks.push(block);
        ecBlocks.push(getErrorCorrectionCodewords(block, generator));
    }
    const interleaved: number[] = [];
    const maxDataLen = shortBlockDataLen + (numShortBlocks < numBlocks ? 1 : 0);
    for (let i = 0; i < maxDataLen; i++) {
        for (let blockIndex = 0; blockIndex < dataBlocks.length; blockIndex++) {
            if (i < dataBlocks[blockIndex].length) {
                interleaved.push(dataBlocks[blockIndex][i]);
            }
        }
    }
    for (let i = 0; i < eccLen; i++) {
        for (let blockIndex = 0; blockIndex < ecBlocks.length; blockIndex++) {
            interleaved.push(ecBlocks[blockIndex][i]);
        }
    }
    return interleaved;
}
