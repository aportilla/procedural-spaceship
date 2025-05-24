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
    // The minimum possible power for a thruster is either the global min, or the power needed if we used the max number of thrusters
    const maximumMinThrusterPower = Math.max(MIN_THRUSTER_POWER, totalShipMass / MAX_THRUSTER_COUNT);
    // The maximum possible power for a thruster is either the global max, or the power needed if we used the min number of thrusters
    const minimumMaxThrusterPower = Math.min(MAX_THRUSTER_POWER, totalShipMass / MIN_THRUSTER_COUNT);
    // Now pick a thruster power in this range
    let thrusterPower = rng.range(maximumMinThrusterPower, minimumMaxThrusterPower);

    // 3. Calculate number of thrusters needed for this mass
    let thrusterCount = Math.ceil(totalShipMass / thrusterPower);
    // thrusterCount = Math.max(MIN_THRUSTER_COUNT, Math.min(MAX_THRUSTER_COUNT, thrusterCount));
    // Recalculate thruster power to match the count exactly
    thrusterPower = totalShipMass / thrusterCount;

    // 4. Map thruster power to a visual thruster size (area-based)
    // Area = k * thrusterPower; diameter = 2 * sqrt(area / PI)
    const THRUSTER_AREA_SCALE = 0.015; // tweak for visual scale
    const thrusterArea = THRUSTER_AREA_SCALE * thrusterPower;
    let thrusterSize = 2 * Math.sqrt(thrusterArea / Math.PI); // diameter

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

    // Track the current attachment point for stacking blocks
    let attachmentZ = 0; // Start at the back of the ship (thruster plane)

    // Place thrusters at z = 0 (already done)
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


    attachmentZ = thrusterSize * 2; // Move attachment point to the front face of the thrusters

    // ENGINE BLOCK: create a block that fits the thruster layout and sits just forward of the thrusters
    // Randomize engine block mass between 5% and 30% of total ship mass
    const engineBlockMass = Math.min(remainingMassToAlocateToStructures, totalShipMass * rng.range(0.05, 0.3));
    remainingMassToAlocateToStructures -= engineBlockMass;

    // 1. Find bounding box of thruster positions
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pos of thrusterPositions) {
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.y > maxY) maxY = pos.y;
    }

    // Add a little padding
    const pad = thrusterSize * 0.6;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const width = maxX - minX;
    const height = maxY - minY;

    // Set engine block depth so that its volume is proportional to ship mass
    // Volume = width * height * depth; so depth = (desiredVolume) / (width * height)
    // Let's set desiredVolume = k * totalShipMass, where k is a scaling constant
    const ENGINE_BLOCK_VOLUME_PER_MASS = 1; // tweak this constant for visual scale
    const desiredVolume = ENGINE_BLOCK_VOLUME_PER_MASS * engineBlockMass;
    let engineBlockDepth = desiredVolume / (width * height);

    // 2. Create the engine block geometry
    const engineBlockGeom = new THREE.BoxGeometry(width, height, engineBlockDepth);
    const engineBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
    const engineBlockMesh = new THREE.Mesh(engineBlockGeom, engineBlockMat);

    // 3. Position the block so its rear face is at the current attachmentZ (just in front of the thrusters)
    engineBlockMesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, attachmentZ + engineBlockDepth / 2);
    ship.add(engineBlockMesh);

    // 4. Move the attachment point forward for the next block
    attachmentZ += engineBlockDepth;
    // Now, attachmentZ is the z position for the next stacked block's rear face


    // CARGO BLOCK: create a block that fits the thruster layout and sits just forward of the engine block
    // Randomize cargo block mass between 5% and 95% of the remaining mass
    const maxCargoFrac = 0.95;
    const minCargoFrac = 0.05;
    const cargoFrac = rng.range(minCargoFrac, maxCargoFrac);
    const cargoBlockMass = Math.min(remainingMassToAlocateToStructures, remainingMassToAlocateToStructures * cargoFrac);
    remainingMassToAlocateToStructures -= cargoBlockMass;

    // the cargo block shape will not necessarily match the thruster layout
    // we'll use a random box shape OR cylinder shape
    const cargoShapeRand = rng.random();
    let cargoBlockGeom;
    let cargoBlockMat;
    let cargoBlockDepth;
    if (cargoShapeRand < 0.4) {
        // Box (aspect-ratio based)
        // Pick two random aspect ratios, then scale to match the required volume
        const aspectA = rng.range(0.05, 1.0); // width/height
        const aspectB = rng.range(0.05, 1.0); // height/depth
        // Let cargoBlockDepth = d, cargoWidth = w = aspectA * d, cargoHeight = h = aspectB * d
        // Volume = w * h * d = aspectA * aspectB * d^3 = cargoBlockMass
        // So d = cbrt(cargoBlockMass / (aspectA * aspectB))
        let d = Math.cbrt(cargoBlockMass / (aspectA * aspectB));
        d = Math.max(0.5, Math.min(d, 100));
        const cargoWidth = aspectA * d;
        const cargoHeight = aspectB * d;
        cargoBlockDepth = d;
        cargoBlockGeom = new THREE.BoxGeometry(cargoWidth, cargoHeight, cargoBlockDepth);
        cargoBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        // Place box cargo block
        const cargoBlockMesh = new THREE.Mesh(cargoBlockGeom, cargoBlockMat);
        cargoBlockMesh.position.set(0, 0, attachmentZ + cargoBlockDepth / 2);
        ship.add(cargoBlockMesh);
        attachmentZ += cargoBlockDepth;
    } else if (cargoShapeRand < 0.8) {
        // Cylinder (aspect-ratio based)
        // Pick a random aspect ratio for radius/depth
        const aspect = rng.range(0.01, 1.0); // radius/depth
        // Let cargoBlockDepth = d, cargoRadius = r = aspect * d
        // Volume = PI * r^2 * d = PI * aspect^2 * d^3 = cargoBlockMass
        // So d = cbrt(cargoBlockMass / (PI * aspect^2))
        let d = Math.cbrt(cargoBlockMass / (Math.PI * aspect * aspect));
        d = Math.max(0.5, Math.min(d, 100));
        const cargoRadius = aspect * d;
        cargoBlockDepth = d;
        cargoBlockGeom = new THREE.CylinderGeometry(cargoRadius, cargoRadius, cargoBlockDepth, 16);
        cargoBlockGeom.rotateX(Math.PI / 2);
        cargoBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        // Place cylinder cargo block
        const cargoBlockMesh = new THREE.Mesh(cargoBlockGeom, cargoBlockMat);
        cargoBlockMesh.position.set(0, 0, attachmentZ + cargoBlockDepth / 2);
        ship.add(cargoBlockMesh);
        attachmentZ += cargoBlockDepth;
    } else {
        // Spheres with flush-mount cylinders through the middle, arranged end-to-end
        const numSpheres = rng.int(1, 5);
        // Divide cargoBlockMass equally among spheres
        const sphereMass = cargoBlockMass / numSpheres;
        let sphereRadiusArr = [];
        let sphereDepthArr = [];
        let sphereMeshes = [];
        let totalLength = 0;
        for (let i = 0; i < numSpheres; i++) {
            // 1. Compute sphere radius from volume: V = (4/3) * PI * r^3 => r = cbrt(3 * mass / (4 * PI))
            const sphereRadius = Math.cbrt((3 * sphereMass) / (4 * Math.PI));
            const cylRadius = sphereRadius * 0.15; // 15% of sphere diameter
            const cylDepth = sphereRadius * 2;
            // 3. Create sphere and cylinder geometries
            const sphereGeom = new THREE.SphereGeometry(sphereRadius, 20, 16);
            const cylGeom = new THREE.CylinderGeometry(cylRadius, cylRadius, cylDepth * 1.05, 16);
            cylGeom.rotateX(Math.PI / 2);
            // 4. Merge the two geometries
            let mergedGeom;
            if (THREE.BufferGeometryUtils && THREE.BufferGeometryUtils.mergeBufferGeometries) {
                mergedGeom = THREE.BufferGeometryUtils.mergeBufferGeometries([sphereGeom, cylGeom]);
            } else {
                mergedGeom = new THREE.Group();
                mergedGeom.add(new THREE.Mesh(sphereGeom));
                mergedGeom.add(new THREE.Mesh(cylGeom));
            }
            const mesh = (mergedGeom instanceof THREE.Group)
                ? mergedGeom
                : new THREE.Mesh(mergedGeom, new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 }));
            // Store for later placement
            sphereRadiusArr.push(sphereRadius);
            sphereDepthArr.push(cylDepth);
            sphereMeshes.push(mesh);
            totalLength += cylDepth;
        }
        // Arrange spheres end-to-end along z, with the center of the first sphere at attachmentZ + its radius
        let sphereZ = attachmentZ + sphereRadiusArr[0];
        for (let i = 0; i < numSpheres; i++) {
            let mesh = sphereMeshes[i];
            mesh.position.set(0, 0, sphereZ);
            // If mesh is a group, set material for all children
            if (mesh instanceof THREE.Group) {
                mesh.children.forEach(child => child.material = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 }));
            }
            ship.add(mesh);
            // For next sphere, increment by half current + half next depth
            if (i < numSpheres - 1) {
                sphereZ += (sphereDepthArr[i] / 2) + (sphereDepthArr[i + 1] / 2);
            }
        }
        cargoBlockDepth = totalLength;
        // Move attachmentZ forward by totalLength (not totalLength + sphereRadiusArr[0])
        attachmentZ += totalLength;
    }

    // COMMAND DECK: create a section at the front, using all remaining mass
    const commandDeckMass = remainingMassToAlocateToStructures;
    // Pick a random shape: box, cylinder, or cone
    const commandDeckShapeRand = rng.random();
    let commandDeckGeom, commandDeckMat, commandDeckDepth;
    if (commandDeckShapeRand < 0.4) {
        // Box (aspect-ratio based)
        const aspectA = rng.range(0.5, 2.0);
        const aspectB = rng.range(0.5, 2.0);
        let d = Math.cbrt(commandDeckMass / (aspectA * aspectB));
        d = Math.max(0.3, Math.min(d, 50));
        const deckWidth = aspectA * d;
        const deckHeight = aspectB * d;
        commandDeckDepth = d;
        commandDeckGeom = new THREE.BoxGeometry(deckWidth, deckHeight, commandDeckDepth);
    } else if (commandDeckShapeRand < 0.8) {
        // Cylinder (aspect-ratio based)
        const aspect = rng.range(0.3, 2.0);
        let d = Math.cbrt(commandDeckMass / (Math.PI * aspect * aspect));
        d = Math.max(0.3, Math.min(d, 50));
        const deckRadius = aspect * d;
        commandDeckDepth = d;
        commandDeckGeom = new THREE.CylinderGeometry(deckRadius, deckRadius, commandDeckDepth, 16);
        commandDeckGeom.rotateX(Math.PI / 2);
    } else {
        // Sphere
        const deckRadius = Math.cbrt((3 * commandDeckMass) / (4 * Math.PI));
        commandDeckDepth = deckRadius * 2;
        commandDeckGeom = new THREE.SphereGeometry(deckRadius, 20, 16);
    }
    commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
    const commandDeckMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
    commandDeckMesh.position.set(0, 0, attachmentZ + commandDeckDepth / 2);
    ship.add(commandDeckMesh);
    attachmentZ += commandDeckDepth;

    currentShipRef.current = ship;
    scene.add(ship);
}
