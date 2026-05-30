import { vec2, type Vec2 } from './math/vec2';

export type QrEcLevel = 'L' | 'M' | 'Q' | 'H';
export type QrMode = 'numeric' | 'alphanumeric' | 'byte' | 'kanji';

export const ECC_CODEWORDS_PER_BLOCK: Record<QrEcLevel, number[]> = {
    L: [
        -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28,
        30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30,
        30, 30, 30, 30, 30,
    ],
    M: [
        -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28,
        26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
        28, 28, 28, 28, 28,
    ],
    Q: [
        -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28,
        28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30,
        30, 30, 30, 30, 30,
    ],
    H: [
        -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28,
        28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
        30, 30, 30, 30, 30,
    ],
};

export const NUM_ERROR_CORRECTION_BLOCKS: Record<QrEcLevel, number[]> = {
    L: [
        -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9,
        10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
    ],
    M: [
        -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16,
        17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45,
        47, 49,
    ],
    Q: [
        -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20,
        23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62,
        65, 68,
    ],
    H: [
        -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25,
        25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70,
        74, 77, 81,
    ],
};

export const CHAR_COUNT_BITS: Record<QrMode, [number, number, number]> = {
    numeric: [10, 12, 14],
    alphanumeric: [9, 11, 13],
    byte: [8, 16, 16],
    kanji: [8, 10, 12],
};

const ALIGNMENT_PATTERN_POSITIONS: number[][] = [
    [],
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170],
];

export interface QrInfo {
    dataLenBytes: number;
    version: number;
    size: Vec2;
    aMarkers: Vec2[];
    ecLevelCode: QrEcLevel;
    ecLevel: number;
    modeCode: QrMode;
    mode: number;
    dataCodewords: number;
    dataBits: number;
    maxChars: number;
}

function getNumRawDataModules(version: number): number {
    let result = (16 * version + 128) * version + 64;
    if (version >= 2) {
        const numAlign = Math.floor(version / 7) + 2;
        result -= (25 * numAlign - 10) * numAlign - 55;
        if (version >= 7) {
            result -= 36;
        }
    }
    return result;
}

function getNumDataCodewords(version: number, ecLevel: QrEcLevel): number {
    return (
        Math.floor(getNumRawDataModules(version) / 8) -
        ECC_CODEWORDS_PER_BLOCK[ecLevel][version] *
            NUM_ERROR_CORRECTION_BLOCKS[ecLevel][version]
    );
}

function getCharCountBits(version: number, mode: QrMode): number {
    const rangeIndex = Math.floor((version + 7) / 17);
    return CHAR_COUNT_BITS[mode][rangeIndex];
}

function getAlignmentPatternPositions(version: number): number[] {
    return ALIGNMENT_PATTERN_POSITIONS[version];
}

function getAlignmentMarkers(version: number): Vec2[] {
    const positions = getAlignmentPatternPositions(version);
    const lastIndex = positions.length - 1;
    const markers: Vec2[] = [];
    for (let yIndex = 0; yIndex < positions.length; yIndex++) {
        for (let xIndex = 0; xIndex < positions.length; xIndex++) {
            if (
                (xIndex === 0 && yIndex === 0) ||
                (xIndex === lastIndex && yIndex === 0) ||
                (xIndex === 0 && yIndex === lastIndex)
            ) {
                continue;
            }
            markers.push(vec2(positions[xIndex] - 2, positions[yIndex] - 2));
        }
    }
    return markers;
}

function ecLevelValue(ecLevel: QrEcLevel): number {
    switch (ecLevel) {
        case 'L':
            return 0b01;
        case 'M':
            return 0b00;
        case 'Q':
            return 0b11;
        case 'H':
            return 0b10;
    }
}

// function ecLevelFromValue(value: number): QrEcLevel {
//     switch (value) {
//         case 0b11:
//             return 'L';
//         case 0b10:
//             return 'M';
//         case 0b01:
//             return 'Q';
//         case 0b00:
//             return 'H';
//         default:
//             throw new Error(`Invalid error correction level value: ${value}`);
//     }
// }

export function getQrInfo(dataLenBytes: number, ecLevel: QrEcLevel): QrInfo {
    if (!Number.isInteger(dataLenBytes) || dataLenBytes < 0) {
        throw new Error('dataLengthBytes must be a non-negative integer');
    }
    for (let version = 1; version <= 40; version++) {
        const dataCodewords = getNumDataCodewords(version, ecLevel);
        const dataBits = dataCodewords * 8;
        const usableBits = dataBits - 4 - getCharCountBits(version, 'byte');
        const maxChars = Math.floor(usableBits / 8);
        if (dataLenBytes <= maxChars) {
            return {
                dataLenBytes,
                version,
                size: vec2(version * 4 + 17),
                aMarkers: getAlignmentMarkers(version),
                ecLevelCode: ecLevel,
                ecLevel: ecLevelValue(ecLevel),
                modeCode: 'byte',
                mode: 0b0100,
                dataCodewords,
                dataBits,
                maxChars,
            };
        }
    }
    throw new Error('data too long to fit in a version 40 QR code');
}
