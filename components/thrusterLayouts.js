// components/thrusterLayouts.js
// Utility functions for arranging thrusters in various layouts

// Radial layout
function radialThrusterLayout(thrusterCount, thrusterSize, rng) {
    let positions = [];
    let enginesLeft = thrusterCount;
    let centerRadius = 0;

    const maxCenterCount = thrusterCount <= 4 ? thrusterCount : Math.floor(thrusterCount / 3);
    const minCenterCount = thrusterCount <= 4 ? thrusterCount : 0; // Put one or 2 center thruster if count <= 2
    const centerCount = rng.int(minCenterCount, maxCenterCount);

    enginesLeft -= centerCount;

    if (centerCount === 1) {
        positions.push({ x: 0, y: 0 });
    } else if (centerCount > 1) {
        const minCirc = (centerCount + 1.6) * thrusterSize;
        centerRadius = minCirc / (2 * Math.PI);
        for (let i = 0; i < centerCount; i++) {
            const angle = (i / centerCount) * Math.PI * 2 - Math.PI / 2;
            positions.push({
                x: Math.cos(angle) * centerRadius,
                y: Math.sin(angle) * centerRadius
            });
        }
    }
    let ring = 0;
    let baseRadius = centerRadius + thrusterSize * 1.15;
    while (enginesLeft > 0) {
        const ringCirc = 2 * Math.PI * baseRadius;
        let maxThisRing = Math.floor(ringCirc / (thrusterSize * 1.1));
        let thisRingCount = Math.min(maxThisRing, enginesLeft);
        if (enginesLeft - maxThisRing === 1) {
            thisRingCount -= 1;
        }
        for (let i = 0; i < thisRingCount; i++) {
            const angle = (i / thisRingCount) * Math.PI * 2 - Math.PI / 2 + ((ring % 2) ? Math.PI / thisRingCount : 0);
            positions.push({
                x: Math.cos(angle) * baseRadius,
                y: Math.sin(angle) * baseRadius
            });
        }
        enginesLeft -= thisRingCount;
        baseRadius += thrusterSize * 1.15;
        ring++;
    }
    return positions;
}

// Even grid configurations
function findEvenGridConfigurations(engines) {
    const configurations = [];
    for (let rows = 2; rows <= Math.sqrt(engines); rows++) {
        if (engines % rows === 0) {
            const cols = engines / rows;
            if (cols >= 2) {
                configurations.push([cols, rows]);
                if (rows !== cols) {
                    configurations.push([rows, cols]);
                }
            }
        }
    }
    return configurations;
}

// Grid layout
function gridThrusterLayout(thrusterCount, thrusterSize, rng) {
    const configs = findEvenGridConfigurations(thrusterCount);
    if (!configs.length) return null;
    const [cols, rows] = configs[rng.int(0, configs.length - 1)];
    let positions = [];
    let spacing = thrusterSize * 1.3;
    let startX = -((cols - 1) / 2) * spacing;
    let startY = -((rows - 1) / 2) * spacing;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            positions.push({
                x: startX + col * spacing,
                y: startY + row * spacing
            });
        }
    }
    return positions;
}

// Staggered (offset) row configurations
function findStaggeredConfigurations(engines) {
    const configs = [];
    const maxRows = Math.floor((2 * engines - 1) / 3);
    for (let n = 3; n <= maxRows; n += 2) {
        const numerator = 2 * engines - n - 1;
        const denominator = 2 * n;
        if (numerator >= 0 && numerator % denominator === 0) {
            const k = numerator / denominator;
            if (k > 0) {
                const config = [];
                for (let row = 1; row <= n; row++) {
                    config.push(row % 2 === 1 ? k + 1 : k);
                }
                configs.push(config);
            }
        }
    }
    return configs;
}

// Offset grid layout
function offsetGridThrusterLayout(thrusterCount, thrusterSize, rng) {
    const configs = findStaggeredConfigurations(thrusterCount);
    if (!configs.length) return null;
    const config = configs[rng.int(0, configs.length - 1)];
    const orientation = rng.random() < 0.5 ? 'vertical' : 'horizontal';
    let positions = [];
    let spacing = thrusterSize * 1.3;
    if (orientation === 'vertical') {
        let rows = config.length;
        let startY = -((rows - 1) / 2) * spacing;
        for (let row = 0; row < rows; row++) {
            let cols = config[row];
            let startX = -((cols - 1) / 2) * spacing;
            for (let col = 0; col < cols; col++) {
                positions.push({
                    x: startX + col * spacing,
                    y: startY + row * spacing
                });
            }
        }
    } else {
        let cols = config.length;
        let startX = -((cols - 1) / 2) * spacing;
        for (let col = 0; col < cols; col++) {
            let rows = config[col];
            let startY = -((rows - 1) / 2) * spacing;
            for (let row = 0; row < rows; row++) {
                positions.push({
                    x: startX + col * spacing,
                    y: startY + row * spacing
                });
            }
        }
    }
    return positions;
}

export {
    radialThrusterLayout,
    gridThrusterLayout,
    offsetGridThrusterLayout
};
