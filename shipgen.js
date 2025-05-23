// shipgen.js
// Ship generation logic for procedural-spaceship

// Seeded random number generator
export class SeededRandom {
    constructor(seed) {
        this.seed = this.hashCode(seed);
    }
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    range(min, max) {
        return min + this.random() * (max - min);
    }
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
}

// return an array of points in a radial layout
// for a given number of thrusters and thruster size..
function radialThrusterLayout(thrusterCount, thrusterSize, rng) {
    let positions = [];
    let enginesLeft = thrusterCount;
    let centerRadius = 0;
    const maxCenterCount = Math.floor(thrusterCount / 3);
    const centerCount = rng.int(0, maxCenterCount);
    enginesLeft -= centerCount;
    if (centerCount === 1) {
        positions.push({ x: 0, y: 0 });
    } else if (centerCount > 1) {
        // Use a radius that prevents overlap for any count
        // Circumference = centerCount * thrusterSize * 1.1
        // radius = C / (2π)
        const minCirc = centerCount * thrusterSize * 1.5;
        centerRadius = minCirc / (2 * Math.PI);
        for (let i = 0; i < centerCount; i++) {
            const angle = (i / centerCount) * Math.PI * 2;
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
            const angle = (i / thisRingCount) * Math.PI * 2 + ((ring % 2) ? Math.PI / thisRingCount : 0);
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


const findEvenGridConfigurations = (engines) => {
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
};

function gridThrusterLayout(thrusterCount, thrusterSize, rng) {
    // Use findEvenGridConfigurations to get all valid grid shapes
    const configs = findEvenGridConfigurations(thrusterCount);
    if (!configs.length) return null;
    // Pick a random valid grid
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

// Find all possible staggered (offset) row configurations for a given engine count
function findStaggeredConfigurations(engines) {
    const configs = [];
    const maxRows = Math.floor((2 * engines - 1) / 3);
    for (let n = 3; n <= maxRows; n += 2) {
        const numerator = 2 * engines - n - 1;
        const denominator = 2 * n;
        if (numerator >= 0 && numerator % denominator === 0) {
            const k = numerator / denominator;
            if (k > 0) {
                // Build row config: odd rows get k+1, even rows get k
                const config = [];
                for (let row = 1; row <= n; row++) {
                    config.push(row % 2 === 1 ? k + 1 : k);
                }
                // Only push the array of row counts
                configs.push(config);
            }
        }
    }
    return configs;
}

function offsetGridThrusterLayout(thrusterCount, thrusterSize, rng) {
    // Use the staggered configuration algorithm
    const configs = findStaggeredConfigurations(thrusterCount);
    if (!configs.length) return null;
    // Pick one config randomly
    const config = configs[rng.int(0, configs.length - 1)];
    // Now lay out the pattern
    let positions = [];
    let spacing = thrusterSize * 1.3;
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
    return positions;
}


const MIN_THRUSTER_COUNT = 1;
const MAX_THRUSTER_COUNT = 33;

const SHIP_MAX_MASS = 1000;
const SHIP_MIN_MASS = 25;

const MAX_THRUSTER_POWER = 250;
const MIN_THRUSTER_POWER = 5;

// const MAXIMUM_MIN_THRUSTER_POWER = SELECTED_SHIP_MASS / MAX_THRUSTER_COUNT;
// const MINIMUM_MAX_THRUSTER_POWER = SELECTED_SHIP_MASS / MIN_THRUSTER_COUNT;


// Main ship generation function
export function generateShip(seed, scene, THREE, currentShipRef) {
    // Remove previous ship
    if (currentShipRef.current) {
        scene.remove(currentShipRef.current);
        currentShipRef.current.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
    const rng = new SeededRandom(seed);
    const ship = new THREE.Group();

    // 1. Pick ship mass randomly within range
    const shipMass = rng.range(SHIP_MIN_MASS, SHIP_MAX_MASS);

    // 2. Pick thruster power within a dynamic range for this mass
    // The minimum possible power for a thruster is either the global min, or the power needed if we used the max number of thrusters
    const maximumMinThrusterPower = Math.max(MIN_THRUSTER_POWER, shipMass / MAX_THRUSTER_COUNT);
    // The maximum possible power for a thruster is either the global max, or the power needed if we used the min number of thrusters
    const minimumMaxThrusterPower = Math.min(MAX_THRUSTER_POWER, shipMass / MIN_THRUSTER_COUNT);
    // Now pick a thruster power in this range
    let thrusterPower = rng.range(maximumMinThrusterPower, minimumMaxThrusterPower);

    // 3. Calculate number of thrusters needed for this mass
    let thrusterCount = Math.ceil(shipMass / thrusterPower);
    thrusterCount = Math.max(MIN_THRUSTER_COUNT, Math.min(MAX_THRUSTER_COUNT, thrusterCount));
    // Recalculate thruster power to match the count exactly
    thrusterPower = shipMass / thrusterCount;

    // 4. Map thruster power to a visual thruster size (linearly or nonlinearly)
    // We'll use a simple linear mapping for now
    const minSize = 0.2, maxSize = 4;
    let thrusterSize = minSize + (maxSize - minSize) * ((thrusterPower - MIN_THRUSTER_POWER) / (MAX_THRUSTER_POWER - MIN_THRUSTER_POWER));
    thrusterSize = Math.max(minSize, Math.min(maxSize, thrusterSize));

    // 5. Arrange thrusters: center cluster, then dense rings
    const thrusterColor = new THREE.Color().setHSL(rng.random(), 0.5, 0.3);
    const thrusterMaterial = new THREE.MeshPhongMaterial({
        color: thrusterColor,
        flatShading: true,
        shininess: 30
    });

    // Try offset grid layout first, then grid, then radial
    let thrusterPositions;
    if (thrusterCount >= 7 && rng.random() < 0.5) {
        const offset = offsetGridThrusterLayout(thrusterCount, thrusterSize, rng);
        if (offset) {
            thrusterPositions = offset;
        } else {
            const grid = gridThrusterLayout(thrusterCount, thrusterSize, rng);
            if (grid) {
                thrusterPositions = grid;
            } else {
                thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
            }
        }
    } else if (thrusterCount > 3 && rng.random() < 0.5) {
        const grid = gridThrusterLayout(thrusterCount, thrusterSize, rng);
        if (grid) {
            thrusterPositions = grid;
        } else {
            thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
        }
    } else {
        thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
    }

    for (const pos of thrusterPositions) {
        const thrusterGeom = new THREE.CylinderGeometry(thrusterSize * 0.5, thrusterSize * 0.5, thrusterSize * 2, 16);
        thrusterGeom.rotateX(Math.PI / 2);
        thrusterGeom.translate(0, 0, thrusterSize);
        const thrusterMesh = new THREE.Mesh(thrusterGeom, thrusterMaterial);
        thrusterMesh.position.set(pos.x, pos.y, 0);
        const glowGeom = new THREE.ConeGeometry(thrusterSize * 0.5, thrusterSize * 1.5, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.6 });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        glowMesh.position.set(0, 0, -thrusterSize * 0.5);
        glowMesh.rotation.set(Math.PI / 2, 0, 0);
        thrusterMesh.add(glowMesh);
        ship.add(thrusterMesh);
    }
    currentShipRef.current = ship;
    scene.add(ship);
}
