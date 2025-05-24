// shipgen.js
// Ship generation logic for procedural-spaceship

import { makeThrusters } from './components/thrusters.js';
import { makeEngineBlock } from './components/engineBlock.js';
import { makeCargoSection } from './components/cargoSection.js';
import { makeCommandDeck } from './components/commandDeck.js';


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
        // const minCirc = centerCount * thrusterSize * 1.8;
        const minCirc = (centerCount + 1.6) * thrusterSize;
        centerRadius = minCirc / (2 * Math.PI);
        for (let i = 0; i < centerCount; i++) {
            // Place first at 12 o'clock (angle = -Math.PI/2)
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
            // Place first at 12 o'clock (angle = -Math.PI/2)
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

    // we'll layout this staggered grid in in EITHER a VERTICAL or HORIZONTAL orientation
    // Pick a random orientation
    const orientation = rng.random() < 0.5 ? 'vertical' : 'horizontal';

    let positions = [];
    let spacing = thrusterSize * 1.3;

    if (orientation === 'vertical') {
        // Treat config as row counts (current behavior)
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
        // Treat config as column counts (horizontal orientation)
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
    // --- Seed URL param logic ---
    if (typeof window !== 'undefined' && window.history && window.location) {
        const url = new URL(window.location.href);
        // Only update the URL if the seed is not already set
        if (url.searchParams.get('seed') !== seed) {
            url.searchParams.set('seed', seed);
            window.history.replaceState({}, '', url);
        }
    }

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
    const totalShipMass = rng.range(SHIP_MIN_MASS, SHIP_MAX_MASS);
    let remainingMassToAlocateToStructures = totalShipMass;

    // 2. Pick thruster power within a dynamic range for this mass
    const maximumMinThrusterPower = Math.max(MIN_THRUSTER_POWER, totalShipMass / MAX_THRUSTER_COUNT);
    const minimumMaxThrusterPower = Math.min(MAX_THRUSTER_POWER, totalShipMass / MIN_THRUSTER_COUNT);
    let thrusterPower = rng.range(maximumMinThrusterPower, minimumMaxThrusterPower);

    // 3. Calculate number of thrusters needed for this mass
    let thrusterCount = Math.ceil(totalShipMass / thrusterPower);
    thrusterPower = totalShipMass / thrusterCount;

    // 4. Map thruster power to a visual thruster size (area-based)
    const THRUSTER_AREA_SCALE = 0.015; // tweak for visual scale
    const thrusterArea = THRUSTER_AREA_SCALE * thrusterPower;
    let thrusterSize = 2 * Math.sqrt(thrusterArea / Math.PI); // diameter

    // 5. Arrange thrusters
    const thrusterColor = new THREE.Color().setHSL(rng.random(), 0.5, 0.3);
    const thrusterMaterial = new THREE.MeshPhongMaterial({
        color: thrusterColor,
        flatShading: true,
        shininess: 30
    });

    let isRadial = false;
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
                isRadial = true;
                thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
            }
        }
    } else if (thrusterCount > 3 && rng.random() < 0.5) {
        const grid = gridThrusterLayout(thrusterCount, thrusterSize, rng);
        if (grid) {
            thrusterPositions = grid;
        } else {
            isRadial = true;
            thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
        }
    } else {
        isRadial = true;
        thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
    }

    let attachmentZ = 0;
    const thrusterDepth = thrusterSize / 3;
    // --- Modular Thruster Section ---
    const thrusterSection = makeThrusters({
        thrusterPositions,
        thrusterSize,
        thrusterDepth,
        thrusterMaterial,
        THREE
    });
    thrusterSection.mesh.position.z = 0;
    ship.add(thrusterSection.mesh);
    attachmentZ = thrusterSection.length;
    const thrusterAttachmentPoint = attachmentZ; // Save thruster attachment point

    // --- Modular Engine Block ---
    const engineBlockMass = Math.min(remainingMassToAlocateToStructures, totalShipMass * rng.range(0.05, 0.3));
    remainingMassToAlocateToStructures -= engineBlockMass;
    const engineBlockSection = makeEngineBlock({
        isRadial,
        thrusterPositions,
        thrusterSize,
        engineBlockMass,
        THREE,
        rng
    });
    // Place so the BACK of the engine block is at attachmentZ
    engineBlockSection.mesh.position.z = attachmentZ + engineBlockSection.length / 2;
    attachmentZ += engineBlockSection.length;
    const cargoAttachmentPoint = attachmentZ; // Update cargo attachment point
    ship.add(engineBlockSection.mesh);

    // --- Modular Cargo Section ---
    const maxCargoFrac = 0.95;
    const minCargoFrac = 0.05;
    const cargoFrac = rng.range(minCargoFrac, maxCargoFrac);
    const cargoBlockMass = Math.min(remainingMassToAlocateToStructures, remainingMassToAlocateToStructures * cargoFrac);
    remainingMassToAlocateToStructures -= cargoBlockMass;
    const cargoSection = makeCargoSection({
        cargoBlockMass,
        THREE,
        rng
    });
    cargoSection.mesh.position.z = attachmentZ + cargoSection.length / 2;
    attachmentZ += cargoSection.length;
    const commandDeckAttachmentPoint = attachmentZ; // Update command deck attachment point
    ship.add(cargoSection.mesh);

    // --- Modular Command Deck ---
    const commandDeckMass = remainingMassToAlocateToStructures;
    const commandDeckSection = makeCommandDeck({
        commandDeckMass,
        THREE,
        rng
    });
    commandDeckSection.mesh.position.z = attachmentZ + commandDeckSection.length / 2;
    attachmentZ += commandDeckSection.length;
    ship.add(commandDeckSection.mesh);
    const endAttachmentPoint = attachmentZ;
    // --- DEBUG: Draw lines at each segment connection point ---
    function addDebugLine(z, color = 0xff0000) {
        const mat = new THREE.LineBasicMaterial({ color });
        const points = [
            new THREE.Vector3(-10, 0, z),
            new THREE.Vector3(10, 0, z),
            new THREE.Vector3(0, -10, z),
            new THREE.Vector3(0, 10, z)
        ];
        for (let i = 0; i < points.length; i += 2) {
            const geom = new THREE.BufferGeometry().setFromPoints([points[i], points[i+1]]);
            const line = new THREE.Line(geom, mat);
            ship.add(line);
        }
    }
    // --- DEBUG: Draw lines at each segment connection point ---
    // After thrusters
    addDebugLine(thrusterAttachmentPoint, 0xff0000); // Red: after thrusters
    // After engine block
    addDebugLine(cargoAttachmentPoint, 0x00ff00); // Green: after engine block
    // After cargo section
    addDebugLine(commandDeckAttachmentPoint, 0x0000ff); // Blue: after cargo
    // After command deck
    addDebugLine(endAttachmentPoint, 0xffff00); // Yellow: after command deck

    // --- DEBUG: Add a marker at the scene origin (0,0,0) ---
    const originMarkerGeom = new THREE.SphereGeometry(0.2, 12, 8);
    const originMarkerMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const originMarker = new THREE.Mesh(originMarkerGeom, originMarkerMat);
    originMarker.position.set(0, 0, 0);
    scene.add(originMarker);

    // Center the ship so its midpoint is at z=0
    ship.position.z = -endAttachmentPoint / 2;

    // Create a root group for rotation
    const shipRoot = new THREE.Group();
    shipRoot.add(ship);

    currentShipRef.current = shipRoot;
    scene.add(shipRoot);
    // (Remove: currentShipRef.current = ship; scene.add(ship);)
}

// --- Helper: Get seed from URL or generate new one ---
export function getInitialSeed() {
    if (typeof window !== 'undefined' && window.location) {
        const url = new URL(window.location.href);
        const urlSeed = url.searchParams.get('seed');
        if (urlSeed && urlSeed.length > 0) {
            return urlSeed;
        }
    }
    // If no seed in URL, generate a random one
    return Math.random().toString(36).slice(2, 10);
}
