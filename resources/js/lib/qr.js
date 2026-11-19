/**
 * Minimal ISO/IEC 18004 QR Code encoder (Byte mode, Error Correction Level M, Versions 1–6).
 * Supports up to 106 UTF-8 bytes without external dependencies.
 */

const VERSIONS_M = [
    { version: 1, size: 21, maxBytes: 14, dataPerBlock: 16, ecPerBlock: 10, blocks: 1, alignment: [] },
    { version: 2, size: 25, maxBytes: 26, dataPerBlock: 28, ecPerBlock: 16, blocks: 1, alignment: [6, 18] },
    { version: 3, size: 29, maxBytes: 42, dataPerBlock: 44, ecPerBlock: 26, blocks: 1, alignment: [6, 22] },
    { version: 4, size: 33, maxBytes: 62, dataPerBlock: 32, ecPerBlock: 18, blocks: 2, alignment: [6, 26] },
    { version: 5, size: 37, maxBytes: 84, dataPerBlock: 43, ecPerBlock: 24, blocks: 2, alignment: [6, 30] },
    { version: 6, size: 41, maxBytes: 106, dataPerBlock: 27, ecPerBlock: 16, blocks: 4, alignment: [6, 34] },
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) {
            x ^= 0x11d;
        }
    }
    for (let i = 255; i < 512; i++) {
        GF_EXP[i] = GF_EXP[i - 255];
    }
})();

function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildRsGenerator(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        const factor = GF_EXP[i];
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= poly[j];
            next[j + 1] ^= gfMul(poly[j], factor);
        }
        poly = next;
    }
    return poly;
}

function computeRsRemainder(data, ecLen) {
    const gen = buildRsGenerator(ecLen);
    const work = new Array(data.length + ecLen).fill(0);
    for (let i = 0; i < data.length; i++) {
        work[i] = data[i];
    }
    for (let i = 0; i < data.length; i++) {
        const coef = work[i];
        if (coef !== 0) {
            for (let j = 0; j < gen.length; j++) {
                work[i + j] ^= gfMul(gen[j], coef);
            }
        }
    }
    return work.slice(data.length);
}

function encodeFormatInfo(maskId) {
    // EC Level M indicator = 00
    const data = maskId & 0x7;
    let rem = data << 10;
    const poly = 0x537;
    for (let i = 14; i >= 10; i--) {
        if ((rem >> i) & 1) {
            rem ^= poly << (i - 10);
        }
    }
    return ((data << 10) | rem) ^ 0x5412;
}

function buildDataCodewords(bytes, totalDataBytes) {
    const bits = [];
    const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) {
            bits.push((val >> i) & 1);
        }
    };

    pushBits(0b0100, 4); // Byte mode
    pushBits(bytes.length, 8);
    for (const byte of bytes) {
        pushBits(byte, 8);
    }

    const totalBits = totalDataBytes * 8;
    const terminatorLen = Math.min(4, totalBits - bits.length);
    pushBits(0, terminatorLen);

    while (bits.length % 8 !== 0) {
        bits.push(0);
    }

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
            byte = (byte << 1) | bits[i + j];
        }
        codewords.push(byte);
    }

    const padBytes = [0xec, 0x11];
    let padIndex = 0;
    while (codewords.length < totalDataBytes) {
        codewords.push(padBytes[padIndex % 2]);
        padIndex++;
    }

    return codewords;
}

function buildFinalBytes(bytes, spec) {
    const totalData = spec.dataPerBlock * spec.blocks;
    const dataCodewords = buildDataCodewords(bytes, totalData);

    const dataBlocks = [];
    const ecBlocks = [];
    for (let b = 0; b < spec.blocks; b++) {
        const start = b * spec.dataPerBlock;
        const block = dataCodewords.slice(start, start + spec.dataPerBlock);
        dataBlocks.push(block);
        ecBlocks.push(computeRsRemainder(block, spec.ecPerBlock));
    }

    const output = [];
    for (let i = 0; i < spec.dataPerBlock; i++) {
        for (let b = 0; b < spec.blocks; b++) {
            output.push(dataBlocks[b][i]);
        }
    }
    for (let i = 0; i < spec.ecPerBlock; i++) {
        for (let b = 0; b < spec.blocks; b++) {
            output.push(ecBlocks[b][i]);
        }
    }

    return output;
}

function createBaseMatrix(spec) {
    const { size, alignment } = spec;
    const grid = Array.from({ length: size }, () => new Array(size).fill(0));
    const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

    const setModule = (r, c, dark) => {
        if (r < 0 || c < 0 || r >= size || c >= size) return;
        grid[r][c] = dark ? 1 : 0;
        reserved[r][c] = true;
    };

    const drawFinder = (top, left) => {
        for (let dr = -1; dr <= 7; dr++) {
            for (let dc = -1; dc <= 7; dc++) {
                const r = top + dr;
                const c = left + dc;
                if (r < 0 || c < 0 || r >= size || c >= size) continue;
                const inBorder = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
                const isRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
                const isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
                setModule(r, c, inBorder && (isRing || isCenter));
            }
        }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Alignment patterns
    for (const rCenter of alignment) {
        for (const cCenter of alignment) {
            if (reserved[rCenter][cCenter]) continue;
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    const isDark =
                        Math.abs(dr) === 2 ||
                        Math.abs(dc) === 2 ||
                        (dr === 0 && dc === 0);
                    setModule(rCenter + dr, cCenter + dc, isDark);
                }
            }
        }
    }

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
        const dark = i % 2 === 0;
        if (!reserved[6][i]) setModule(6, i, dark);
        if (!reserved[i][6]) setModule(i, 6, dark);
    }

    // Dark module
    setModule(size - 8, 8, true);

    // Reserve format info strips
    for (let i = 0; i <= 8; i++) {
        if (i !== 6) {
            reserved[8][i] = true;
            reserved[i][8] = true;
        }
    }
    for (let i = 0; i < 8; i++) {
        reserved[8][size - 1 - i] = true;
    }
    for (let i = 0; i < 7; i++) {
        reserved[size - 1 - i][8] = true;
    }

    return { grid, reserved };
}

function placeDataModules(grid, reserved, finalBytes) {
    const size = grid.length;
    let bitIdx = 0;
    const totalBits = finalBytes.length * 8;
    let upward = true;

    for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
        if (rightCol === 6) {
            rightCol--;
        }
        for (let step = 0; step < size; step++) {
            const row = upward ? size - 1 - step : step;
            for (let offset = 0; offset < 2; offset++) {
                const col = rightCol - offset;
                if (reserved[row][col]) continue;
                let dark = 0;
                if (bitIdx < totalBits) {
                    const byte = finalBytes[bitIdx >> 3];
                    dark = (byte >> (7 - (bitIdx & 7))) & 1;
                    bitIdx++;
                }
                grid[row][col] = dark;
            }
        }
        upward = !upward;
    }
}

function maskPredicate(maskId, r, c) {
    switch (maskId) {
        case 0:
            return (r + c) % 2 === 0;
        case 1:
            return r % 2 === 0;
        case 2:
            return c % 3 === 0;
        case 3:
            return (r + c) % 3 === 0;
        case 4:
            return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
        case 5:
            return ((r * c) % 2) + ((r * c) % 3) === 0;
        case 6:
            return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
        case 7:
            return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
        default:
            return false;
    }
}

function applyMaskAndFormat(baseGrid, reserved, maskId) {
    const size = baseGrid.length;
    const grid = baseGrid.map((row, r) =>
        row.map((val, c) => (reserved[r][c] ? val : val ^ (maskPredicate(maskId, r, c) ? 1 : 0)))
    );

    const fmt = encodeFormatInfo(maskId);
    const getBit = (idx) => (fmt >> idx) & 1;

    // Top-left format strip
    for (let i = 0; i <= 5; i++) grid[8][i] = getBit(14 - i);
    grid[8][7] = getBit(8);
    grid[8][8] = getBit(7);
    grid[7][8] = getBit(6);
    for (let i = 0; i <= 5; i++) grid[5 - i][8] = getBit(5 - i);

    // Top-right & bottom-left format strip
    for (let i = 0; i < 8; i++) grid[8][size - 8 + i] = getBit(7 - i);
    for (let i = 0; i < 7; i++) grid[size - 1 - i][8] = getBit(14 - i);

    return grid;
}

function penaltyScore(grid) {
    const size = grid.length;
    let score = 0;

    // Rule 1: horizontal & vertical runs >= 5
    for (let r = 0; r < size; r++) {
        let runH = 1;
        let runV = 1;
        for (let i = 1; i < size; i++) {
            if (grid[r][i] === grid[r][i - 1]) {
                runH++;
            } else {
                if (runH >= 5) score += 3 + (runH - 5);
                runH = 1;
            }
            if (grid[i][r] === grid[i - 1][r]) {
                runV++;
            } else {
                if (runV >= 5) score += 3 + (runV - 5);
                runV = 1;
            }
        }
        if (runH >= 5) score += 3 + (runH - 5);
        if (runV >= 5) score += 3 + (runV - 5);
    }

    // Rule 2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
            const v = grid[r][c];
            if (grid[r][c + 1] === v && grid[r + 1][c] === v && grid[r + 1][c + 1] === v) {
                score += 3;
            }
        }
    }

    // Rule 3: finder-like patterns
    const p1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const p2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c <= size - 11; c++) {
            let matchH1 = true;
            let matchH2 = true;
            let matchV1 = true;
            let matchV2 = true;
            for (let k = 0; k < 11; k++) {
                if (grid[r][c + k] !== p1[k]) matchH1 = false;
                if (grid[r][c + k] !== p2[k]) matchH2 = false;
                if (grid[c + k][r] !== p1[k]) matchV1 = false;
                if (grid[c + k][r] !== p2[k]) matchV2 = false;
            }
            if (matchH1 || matchH2) score += 40;
            if (matchV1 || matchV2) score += 40;
        }
    }

    // Rule 4: dark ratio deviation from 50%
    let darkCount = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c]) darkCount++;
        }
    }
    const percent = (darkCount * 100) / (size * size);
    const prev5 = Math.floor(percent / 5) * 5;
    const next5 = Math.ceil(percent / 5) * 5;
    score += Math.min(Math.abs(prev5 - 50), Math.abs(next5 - 50)) * 2;

    return score;
}

/**
 * Generates a QR Code boolean matrix (`size` x `size`) for the given text.
 */
export function generateQrMatrix(text) {
    const bytes = new TextEncoder().encode(String(text || ''));
    const spec = VERSIONS_M.find((v) => bytes.length <= v.maxBytes);
    if (!spec) {
        throw new Error(`QR text length (${bytes.length}) exceeds supported max (106 bytes).`);
    }

    const finalBytes = buildFinalBytes(bytes, spec);
    const { grid: baseGrid, reserved } = createBaseMatrix(spec);
    placeDataModules(baseGrid, reserved, finalBytes);

    let bestGrid = null;
    let bestScore = Infinity;

    for (let maskId = 0; maskId < 8; maskId++) {
        const candidate = applyMaskAndFormat(baseGrid, reserved, maskId);
        const score = penaltyScore(candidate);
        if (score < bestScore) {
            bestScore = score;
            bestGrid = candidate;
        }
    }

    return {
        size: spec.size,
        modules: bestGrid,
    };
}
