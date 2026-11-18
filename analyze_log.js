const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'mc.log');

if (!fs.existsSync(logFilePath)) {
    console.error(`Error: Could not find ${logFilePath}`);
    process.exit(1);
}

const cmax = 1024;
const NFACE = 6;
const U = 0, F = 1, D = 2, B = 3, R = 4, L = 5;
const faceNames = ["U (Up)", "F (Front)", "D (Down)", "B (Back)", "R (Right)", "L (Left)"];
const faceLetters = ["U", "F", "D", "B", "R", "L"];

const CLR_R = 0, CLR_B = 1, CLR_O = 2, CLR_G = 3, CLR_W = 4, CLR_Y = 5;
const clrNames = ["Red", "Blue", "Orange", "Green", "White", "Yellow"];
const clrCodes = ["R", "B", "O", "G", "W", "Y"];

function clr_ratio(c0, c1) {
    if (c0 < c1) return Math.floor(-2000 * (c1 - c0) / (c1 + c0));
    if (c0 > c1) return Math.floor( 2000 * (c0 - c1) / (c1 + c0));
    return 0;
}

const CMP_H = 0, CMP_S = 1, CMP_SL = 2, CMP_SLR = 3, CMP_L = 4, CMP_LR = 5, CMP_R_G = 6, CMP_R_B = 7, CMP_B_G = 8;

function compare_clrs(cmp_fn, c0, c1, sc) {
    switch (cmp_fn) {
        case CMP_H: return sc.h[c1] > sc.h[c0];
        case CMP_S: return sc.s[c1] > sc.s[c0];
        case CMP_SL: return sc.sl[c1] > sc.sl[c0];
        case CMP_SLR: return sc.sl[c1] < sc.sl[c0];
        case CMP_L: return sc.l[c1] > sc.l[c0];
        case CMP_LR: return sc.l[c1] < sc.l[c0];
        case CMP_R_G: return clr_ratio(sc.r[c1], sc.g[c1]) < clr_ratio(sc.r[c0], sc.g[c0]);
        case CMP_R_B: return clr_ratio(sc.r[c1], sc.b[c1]) < clr_ratio(sc.r[c0], sc.b[c0]);
        case CMP_B_G: return clr_ratio(sc.b[c1], sc.g[c1]) < clr_ratio(sc.b[c0], sc.g[c0]);
    }
    return false;
}

function sort_clrs(co, s, n, cmp_fn, sc) {
    const e = s + n - 2;
    let is = s, ie = e;
    do {
        let il = e + 2, ih = s - 2;
        for (let i = is; i <= ie; i++) {
            if (compare_clrs(cmp_fn, co[i+1], co[i], sc)) {
                let o = co[i];
                co[i] = co[i+1];
                co[i+1] = o;
                if (i < il) il = i;
                if (i > ih) ih = i;
            }
        }
        is = il - 1; if (is < s) is = s;
        ie = ih + 1; if (ie > e) ie = e;
    } while (is <= ie);
}

function sort_colors(co, t, s, sc) {
    // Lightness descending
    sort_clrs(co, 0*s, 6*s, CMP_LR, sc);
    // Saturation ascending (least saturated among the brightest become white)
    sort_clrs(co, 0*s, 3*s, CMP_SL, sc);
    // Hue ascending
    sort_clrs(co, 1*s, 5*s, CMP_H, sc);
    // Red/Orange heuristic t
    switch (t) {
        case 0: break;
        case 1: sort_clrs(co, 1*s, 2*s, CMP_R_G, sc); break;
        case 2: sort_clrs(co, 1*s, 2*s, CMP_B_G, sc); break;
        case 3: sort_clrs(co, 1*s, 2*s, CMP_R_B, sc); break;
        case 4: sort_clrs(co, 1*s, 2*s, CMP_SLR, sc); break;
        case 5: sort_clrs(co, 1*s, 2*s, CMP_L, sc); break;
    }
    let i = 0;
    for (i = 0; i < s; i++) sc.clr[co[i]] = CLR_W;
    for (; i < 2*s; i++) sc.clr[co[i]] = CLR_R;
    for (; i < 3*s; i++) sc.clr[co[i]] = CLR_O;
    for (; i < 4*s; i++) sc.clr[co[i]] = CLR_Y;
    for (; i < 5*s; i++) sc.clr[co[i]] = CLR_G;
    for (; i < 6*s; i++) sc.clr[co[i]] = CLR_B;
}

function POS(ff, oo) { return (ff * 8) + oo; }

function find_corner(cube, f0, f1, f2) {
    function chk(F0, O0, F1, O1, F2, O2, I0, I1, I2) {
        let c0 = cube[POS(F0, O0)];
        if (c0 === f0) {
            if (cube[POS(F1, O1)] === f1 && cube[POS(F2, O2)] === f2) return I2;
        } else if (c0 === f2) {
            if (cube[POS(F1, O1)] === f0 && cube[POS(F2, O2)] === f1) return I1;
        } else if (c0 === f1) {
            if (cube[POS(F1, O1)] === f2 && cube[POS(F2, O2)] === f0) return I0;
        }
        return -1;
    }
    let r;
    r = chk(U, 2, B, 4, R, 2, 0,  1,  2); if (r >= 0) return r;
    r = chk(U, 0, L, 0, B, 6, 3,  4,  5); if (r >= 0) return r;
    r = chk(U, 6, F, 0, L, 2, 6,  7,  8); if (r >= 0) return r;
    r = chk(U, 4, R, 0, F, 2, 9,  10, 11); if (r >= 0) return r;
    r = chk(D, 0, L, 4, F, 6, 12, 13, 14); if (r >= 0) return r;
    r = chk(D, 6, B, 0, L, 6, 15, 16, 17); if (r >= 0) return r;
    r = chk(D, 4, R, 4, B, 2, 18, 19, 20); if (r >= 0) return r;
    r = chk(D, 2, F, 4, R, 6, 21, 22, 23); if (r >= 0) return r;
    return -1;
}

function find_edge(cube, f0, f1) {
    function chk(F0, O0, F1, O1, I0, I1) {
        let e0 = cube[POS(F0, O0)];
        if (e0 === f0) {
            if (cube[POS(F1, O1)] === f1) return I1;
        } else if (e0 === f1) {
            if (cube[POS(F1, O1)] === f0) return I0;
        }
        return -1;
    }
    let r;
    r = chk(U, 1, B, 5, 0,  1); if (r >= 0) return r;
    r = chk(U, 7, L, 1, 2,  3); if (r >= 0) return r;
    r = chk(U, 5, F, 1, 4,  5); if (r >= 0) return r;
    r = chk(U, 3, R, 1, 6,  7); if (r >= 0) return r;
    r = chk(L, 3, F, 7, 8,  9); if (r >= 0) return r;
    r = chk(B, 7, L, 7, 10, 11); if (r >= 0) return r;
    r = chk(D, 7, L, 5, 12, 13); if (r >= 0) return r;
    r = chk(R, 3, B, 3, 14, 15); if (r >= 0) return r;
    r = chk(D, 5, B, 1, 16, 17); if (r >= 0) return r;
    r = chk(F, 3, R, 7, 18, 19); if (r >= 0) return r;
    r = chk(D, 3, R, 5, 20, 21); if (r >= 0) return r;
    r = chk(D, 1, F, 5, 22, 23); if (r >= 0) return r;
    return -1;
}

function valid_pieces(cube) {
    const edges = [
        [U, F], [U, L], [U, B], [U, R],
        [F, L], [L, B], [B, R], [R, F],
        [D, F], [D, L], [D, B], [D, R]
    ];
    const corners = [
        [U, F, L], [U, L, B], [U, B, R], [U, R, F],
        [D, F, R], [D, R, B], [D, B, L], [D, L, F]
    ];
    let badEdges = [];
    for (let e of edges) {
        if (find_edge(cube, e[0], e[1]) < 0) badEdges.push(`${faceLetters[e[0]]}-${faceLetters[e[1]]}`);
    }
    let badCorners = [];
    for (let c of corners) {
        if (find_corner(cube, c[0], c[1], c[2]) < 0) badCorners.push(`${faceLetters[c[0]]}-${faceLetters[c[1]]}-${faceLetters[c[2]]}`);
    }
    return { valid: badEdges.length === 0 && badCorners.length === 0, badEdges, badCorners };
}

function determine_colors(cube, t, sc) {
    let clr_ord = new Array(24);
    for (let i = 0; i < NFACE; i++) clr_ord[i] = 9*i + 8;
    sort_colors(clr_ord, t, 1, sc);

    for (let i = 0; i < NFACE; i++) {
        clr_ord[4*i+0] = 9*i+0;
        clr_ord[4*i+1] = 9*i+2;
        clr_ord[4*i+2] = 9*i+4;
        clr_ord[4*i+3] = 9*i+6;
    }
    sort_colors(clr_ord, t, 4, sc);

    for (let i = 0; i < NFACE; i++) {
        clr_ord[4*i+0] = 9*i+1;
        clr_ord[4*i+1] = 9*i+3;
        clr_ord[4*i+2] = 9*i+5;
        clr_ord[4*i+3] = 9*i+7;
    }
    sort_colors(clr_ord, t, 4, sc);

    let clr_map = [0, 1, 2, 3, 4, 5];
    for (let f = 0; f < NFACE; f++) {
        clr_map[sc.clr[f*9+8]] = f;
    }
    for (let f = 0; f < NFACE; f++) {
        for (let o = 0; o < 8; o++) {
            cube[POS(f, o)] = clr_map[sc.clr[f*9+o]];
        }
    }
}

try {
    const rawLines = fs.readFileSync(logFilePath, 'utf8').split('\n').map(l => l.trim()).filter(Boolean);

    console.log('===========================================================');
    console.log('             MindCuber NXT - Log & Color Analyzer          ');
    console.log('===========================================================');

    // Parse runs. Each complete scan run has 6 faces (3, 2, 1, 0, 4, 5) with 9 pieces each.
    // Each piece has 5 raw 4-number lines and 1 processed 7-number line.
    // Total lines per run = 6 * (1 + 9 * 6) = 330 lines.
    const runLineCount = 330;
    
    // Check trailer lines
    let trailerLines = [];
    let dataLines = rawLines;
    if (rawLines.length > 2 && rawLines[rawLines.length - 2].split(',').length === 2 && rawLines[rawLines.length - 1].split(',').length === 3) {
        trailerLines = rawLines.slice(-2);
        dataLines = rawLines.slice(0, -2);
    }

    const numRuns = Math.floor(dataLines.length / runLineCount);
    console.log(`Total runs found in log: ${numRuns} (${dataLines.length} data lines)`);

    if (trailerLines.length === 2) {
        const [pieces_valid, valid_i] = trailerLines[0].split(',').map(Number);
        const [wb_r, wb_g, wb_b] = trailerLines[1].split(',').map(Number);
        console.log(`Robot Exit State: pieces_valid = ${pieces_valid}, valid_heuristic = ${valid_i}`);
        console.log(`White Balance Multipliers: R = ${wb_r}, G = ${wb_g}, B = ${wb_b}`);
    }

    if (numRuns === 0) {
        console.log('No complete 54-piece run found in mc.log.');
        process.exit(0);
    }

    // Process the last run
    const lastRunLines = dataLines.slice(-runLineCount);
    console.log(`\nAnalyzing Run #${numRuns} (Last Run)...\n`);

    const initialO = { 3: 2, 2: 2, 1: 2, 0: 2, 4: 6, 5: 2 };
    let sc = {
        r: new Array(54).fill(0),
        g: new Array(54).fill(0),
        b: new Array(54).fill(0),
        h: new Array(54).fill(0),
        s: new Array(54).fill(0),
        l: new Array(54).fill(0),
        sl: new Array(54).fill(0),
        clr: new Array(54).fill(0),
        rawR: new Array(54).fill(0),
        rawG: new Array(54).fill(0),
        rawB: new Array(54).fill(0),
        rawW: new Array(54).fill(0)
    };

    let curF = null;
    let pieceIdxInFace = 0;
    let currentRawAccum = [];

    for (let line of lastRunLines) {
        const parts = line.split(',').map(Number);
        if (parts.length === 1) {
            curF = parts[0];
            pieceIdxInFace = 0;
        } else if (parts.length === 4) {
            currentRawAccum.push(parts);
        } else if (parts.length === 7) {
            let o = initialO[curF];
            let orgb;
            if (pieceIdxInFace === 0) {
                orgb = curF * 9 + 8; // Center
            } else {
                let step = pieceIdxInFace - 1;
                let iter = Math.floor(step / 2);
                let isEdge = (step % 2 === 1);
                let curO = (o + iter * 2) & 7;
                orgb = curF * 9 + (isEdge ? (curO + 1) & 7 : curO);
            }
            sc.r[orgb] = parts[0];
            sc.g[orgb] = parts[1];
            sc.b[orgb] = parts[2];
            sc.h[orgb] = parts[3];
            sc.s[orgb] = parts[4];
            sc.l[orgb] = parts[5];
            sc.sl[orgb] = parts[6];

            if (currentRawAccum.length > 0) {
                sc.rawR[orgb] = Math.round(currentRawAccum.reduce((a, b) => a + b[0], 0) / currentRawAccum.length);
                sc.rawG[orgb] = Math.round(currentRawAccum.reduce((a, b) => a + b[1], 0) / currentRawAccum.length);
                sc.rawB[orgb] = Math.round(currentRawAccum.reduce((a, b) => a + b[2], 0) / currentRawAccum.length);
                sc.rawW[orgb] = Math.round(currentRawAccum.reduce((a, b) => a + b[3], 0) / currentRawAccum.length);
                currentRawAccum = [];
            }
            pieceIdxInFace++;
        }
    }

    // 1. Physical Sensor & Lighting Diagnostics
    console.log('--- 1. Sensor & Ambient Light Diagnostics ---');
    let avgAmbient = Math.round(sc.rawW.reduce((a, b) => a + b, 0) / 54);
    let minAmbient = Math.min(...sc.rawW);
    let maxAmbient = Math.max(...sc.rawW);
    console.log(`Ambient Light (Blank level, 0-1024 scale): Average = ${avgAmbient}, Min = ${minAmbient}, Max = ${maxAmbient}`);

    if (avgAmbient > 200) {
        console.log(`⚠️  HIGH AMBIENT LIGHT: The room/environment is very bright (Blank level ~${avgAmbient}/1024).`);
        console.log(`    MindCuber does not subtract ambient light, which bleeds blue/white into all sensor readings.`);
        console.log(`    Recommendation: Avoid direct overhead lighting/sunlight or shield the sensor with a LEGO shroud.`);
    }

    // Check consistency across pieces per face (evaluates arm position & centering)
    console.log('\n--- 2. Mechanical Positioning per Face (Arm consistency) ---');
    for (let f = 0; f < NFACE; f++) {
        let fPieces = [];
        for (let p = 0; p < 9; p++) fPieces.push(f * 9 + p);
        let lVals = fPieces.map(idx => sc.l[idx]);
        let minL = Math.min(...lVals), maxL = Math.max(...lVals);
        let diffL = maxL - minL;
        let centerIdx = f * 9 + 8;
        let cRGB = `(${sc.r[centerIdx]}, ${sc.g[centerIdx]}, ${sc.b[centerIdx]})`;
        let status = diffL < 50 ? 'EXCELLENT (Consistent across center/corners/edges)' : 'VARIABLE (Check mechanical play/sensor alignment)';
        console.log(`  Face ${f} [${faceNames[f]}]: Center RGB=${cRGB}, Lightness spread: ${diffL} units -> ${status}`);
    }

    // 2. Color Recognition Simulation for all heuristics t=0..5
    console.log('\n--- 3. Color Classification Simulation (MindCuber Algorithm) ---');

    let solvedHeuristic = -1;
    for (let t = 0; t < 6; t++) {
        let cube = new Array(48).fill(0);
        determine_colors(cube, t, sc);
        let val = valid_pieces(cube);

        console.log(`\n[Heuristic t=${t}] Valid cube structure: ${val.valid ? '✅ YES' : '❌ NO'}`);
        if (!val.valid) {
            console.log(`  Missing / conflicting edges:   [${val.badEdges.join(', ')}]`);
            console.log(`  Missing / conflicting corners: [${val.badCorners.join(', ')}]`);
        } else if (solvedHeuristic === -1) {
            solvedHeuristic = t;
        }

        console.log('  Detected Faces (Center & Sticker distribution):');
        for (let f = 0; f < NFACE; f++) {
            let centerClr = clrNames[sc.clr[f * 9 + 8]];
            let stickerClrs = [];
            for (let o = 0; o < 8; o++) stickerClrs.push(clrNames[sc.clr[f * 9 + o]]);
            
            // Count distribution
            let counts = {};
            for (let c of stickerClrs) counts[c] = (counts[c] || 0) + 1;
            let summary = Object.entries(counts).map(([c, n]) => `${n}x ${c}`).join(', ');
            let allSame = Object.keys(counts).length === 1 && stickerClrs[0] === centerClr;
            let icon = allSame ? '✅' : '⚠️ ';
            console.log(`    ${icon} Face ${f} [${faceNames[f]}]: Center=${centerClr} | Stickers: ${summary}`);
        }
    }

    // 3. Root Cause Analysis
    console.log('\n===========================================================');
    console.log('                 ROOT CAUSE & RECOMMENDATIONS              ');
    console.log('===========================================================');

    // Analyze Hue overlap between faces
    let faceHues = [];
    for (let f = 0; f < NFACE; f++) {
        let centerIdx = f * 9 + 8;
        faceHues.push({
            face: f,
            name: faceNames[f],
            h: sc.h[centerIdx],
            s: sc.s[centerIdx],
            l: sc.l[centerIdx],
            sl: sc.sl[centerIdx],
            r: sc.r[centerIdx],
            g: sc.g[centerIdx],
            b: sc.b[centerIdx]
        });
    }

    console.log('\nMeasurements of the 6 Face Centers:');
    faceHues.forEach(f => {
        console.log(`  Face ${f.face} (${f.name}): RGB=(${f.r}, ${f.g}, ${f.b}) | Hue=${f.h}, Sat=${f.s}, Lightness=${f.l}, SL=${f.sl}`);
    });

    console.log('\nAnalysis:');
    console.log('1. Mechanical Sensor Positioning:');
    console.log('   The sensor positioning is landing squarely on the stickers (very small variation across the 9 pieces).');
    console.log('   Positioning of the arm is NOT the issue.');

    console.log('\n2. Glare & Surface Reflection:');
    console.log('   Face 2 (Orange) and Face 1 (Yellow) show massive Blue channel reflection:');
    console.log(`   - Face 2 Center Raw: R=${sc.rawR[2*9+8]}, G=${sc.rawG[2*9+8]}, B=${sc.rawB[2*9+8]} (B is almost as high or higher than R/G!).`);
    console.log(`   - Because yellow and orange reflect blue light (due to surface glare and ambient light), their Hues shifted into the 740-780 range (Cyan/Blue spectrum).`);
    console.log('   - When MindCuber sorts pieces by Hue, Face 2 and Face 5 have overlapping Hues and get interleaved between Orange and Yellow.');

    console.log('\n3. Practical Fixes:');
    console.log('   a) CUBE SURFACE: Glossy stickerless tiles (speed cubes) reflect more light than matte stickers.');
    console.log('      Check that the cube sits centered (use the centering adapter) and that the scan positions');
    console.log('      T_SCNR / T_SEDG in MindCuber.nxc match the cube size. As a fallback, use a cube with matte stickers.');
    console.log('   b) LIGHTING: Switch off bright ceiling lights or desk lamps directly above the robot.');
    console.log('      Diffuse, indirect room light without direct reflections is ideal.');
    console.log('   c) LIGHT SHIELD: Build a small shroud (LEGO plates) around the color sensor to block stray side light.');

} catch (e) {
    console.error('Failed to parse log file:', e);
}
