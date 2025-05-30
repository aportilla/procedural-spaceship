// static definition
// of prefabricated modular cargo pods...
const prefabCargoPodVolume = [
    1,
    2,
    3,
    5,
    8,
    13,
    21,
    34,
    55,
    89,
    144
];

function getClosestPodMass(targetMass) {
    // console.info('targetMass:', targetMass);
    if (targetMass > 200) {
        return targetMass;
    }

    // choose a value from the prefabCargoPodVolume array
    // that is closest to the targetPodMass
    let podMass = prefabCargoPodVolume[0];
    for (let i = 1; i < prefabCargoPodVolume.length; i++) {
        if (Math.abs(prefabCargoPodVolume[i] - targetMass) < Math.abs(podMass - targetMass)) {
            podMass = prefabCargoPodVolume[i];
        }
    }
    return podMass;
}

// shipSizeScalar: number = 0...1
function howManySegmentsOfCargo(cargoMass, rng) {
    const shipSizeScalar = Math.min(1, cargoMass / 1000); // Scale cargo mass to a 0-1 range
    if (shipSizeScalar <= 0.2) {
        return Math.floor(rng.range(1, 3));
    } else if (shipSizeScalar <= 0.4) {
        return Math.floor(rng.range(2, 5));
    } else if (shipSizeScalar <= 0.6) {
        return Math.floor(rng.range(2, 7));
    } else if (shipSizeScalar <= 0.8) {
        return Math.floor(rng.range(2, 11));
    } else {
        return Math.floor(rng.range(2, 13));
    }
}

function howManyPodsPerSegment(cargoMass, rng) {
    const shipSizeScalar = Math.min(1, cargoMass / 1000); // Scale cargo mass to a 0-1 range
    let result = 1;
    if (shipSizeScalar <= 0.3) {
        result = Math.floor(rng.range(1, 2));
    } else if (shipSizeScalar <= 0.6) {
        result = Math.floor(rng.range(1, 4));
    } else if (shipSizeScalar <= 0.8) {
        result = Math.floor(rng.range(2, 8));
    } else {
        result = Math.floor(rng.range(2, 11));
    }

    return result;
}

// function totalTargetCargoMass(shipSizeScalar, rng) {
//     // returns a value between 10 and 1000
//     return 10 + rng.range(0, 900) * shipSizeScalar;
// }

function generateBoxDimensions(volume, bottomRatio, sideRatio) {

    const depth = Math.cbrt(volume * sideRatio / (bottomRatio * bottomRatio));
    const width = bottomRatio * depth;
    const height = width / sideRatio;

    return { width, depth, height };
}

function makeTaperedCylinderGeometry(volume, aspectRatio, taperRatio = 0.5) {
  // taperRatio = smallRadius / bigRadius (default 0.5)

  // From volume formula and aspect ratio constraint:
  // V = (π × AR × R³ / 3) × (1 + k + k²)
  // where R = bigRadius, k = taperRatio, AR = aspectRatio

  const k = taperRatio;
  const shapeFactor = 1 + k + k*k;

  const bigRadius = Math.pow(
    (3 * volume) / (Math.PI * aspectRatio * shapeFactor),
    1/3
  );

  const smallRadius = bigRadius * taperRatio;
  const depth = bigRadius * aspectRatio;

  return { smallRadius, bigRadius, depth };
}

// we use a fixed set of box shapes
// so that our large collection of cargo pods
// will have consistent dimensions across
// different ships and segments

// these are back-aspect,top-aspect tuples
const boxShapes = [
    [1/2.5, 8/9],
    [8/9, 1/2.5],
    [1,1],
    [1,1/2],
    [1/2, 1]
];

// --- Pod creation factory ---
function createPod({ mass, shape, rng, THREE }) {
    // Calculate pod dimensions
    let dimensions;
    let podGeom;
    switch (shape) {
        case 'barrel': {

            const podVolume = mass;
            const aspectRatio = rng.range(1,2); // Random aspect ratio for the barrel
            const taperRatio = rng.range(0.4,0.8); // Random taper for the barrel
            const { smallRadius, bigRadius, depth } = makeTaperedCylinderGeometry(podVolume,aspectRatio,taperRatio);
            const circumference = 2 * Math.PI * bigRadius;
            const polySegments = Math.max(4,Math.floor(circumference * 0.6));
            // Top cone
            const topGeom = new THREE.CylinderGeometry(smallRadius, bigRadius, depth, polySegments);
            // Bottom cone
            const bottomGeom = new THREE.CylinderGeometry(bigRadius, smallRadius, depth, polySegments);

            topGeom.rotateX(Math.PI / 2);
            topGeom.translate(0, 0, depth * 1.5);
            bottomGeom.rotateX(Math.PI / 2);
            bottomGeom.translate(0, 0, depth / 2);

            // Create meshes for each side
            const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            const topMesh = new THREE.Mesh(topGeom, podMat);
            const bottomMesh = new THREE.Mesh(bottomGeom, podMat);

            // add a half height cylinder crosswise across the middle of hte barrel for entry
            const randomPortSize = rng.range(0.1, 0.5) * bigRadius;
            const crossGeom = new THREE.CylinderGeometry(randomPortSize, randomPortSize, bigRadius * 2, polySegments);
            crossGeom.translate(0, 0, depth);
            const crossMesh = new THREE.Mesh(crossGeom, podMat);
            crossMesh.rotateZ(Math.PI / 2);


            // Group both sides
            const group = new THREE.Group();
            group.add(topMesh);
            group.add(bottomMesh);
            group.add(crossMesh);
            group.position.z = depth;
            dimensions = { width: bigRadius * 2, height: bigRadius * 2, depth: depth * 2, maxRadius: bigRadius, endRadius: smallRadius };
            return { mesh: group, dimensions };
        }
        case 'box': {

            // choose a random box shape from the predefined set
            const [aspectA,aspectB] = boxShapes[Math.floor(rng.range(0, boxShapes.length))];


            // const aspectA = 1/2.5; // top face of box
            // const aspectB = 8/9; // back face of box
            const { width, depth, height } = generateBoxDimensions(mass, aspectA, aspectB);

            dimensions = { width, height, depth, aspectA, aspectB };
            podGeom = new THREE.BoxGeometry(width, height, depth);
            podGeom.translate(0, 0, depth / 2);
            break;
        }
        case 'cylinder': {
            const aspectCyl = rng.range(0.3, 0.9);
            let podDepth = Math.cbrt(mass / (Math.PI * aspectCyl * aspectCyl));
            const podRadius = aspectCyl * podDepth;
            dimensions = { width: podRadius * 2, height: podRadius * 2, depth: podDepth, aspectCyl };
            podGeom = new THREE.CylinderGeometry(podRadius, podRadius, podDepth, 8);
            podGeom.rotateX(Math.PI / 2);
            podGeom.translate(0, 0, podDepth / 2);
            break;
        }
        case 'sphere': {
            let podRadius = Math.cbrt(3 * mass / (4 * Math.PI));
            dimensions = { width: podRadius * 2, height: podRadius * 2, depth: 2 * podRadius, podRadius };
            const circumference = 2 * Math.PI * podRadius;
            const widthSegments = Math.max(4,Math.floor(circumference * 0.6));
            const heightSegments = Math.max(2,Math.round(widthSegments / 2));
            podGeom = new THREE.SphereGeometry(podRadius, widthSegments, heightSegments);
            podGeom.rotateY(Math.PI / 2);
            podGeom.rotateX(Math.PI / 2);
            // rotate z by the angle of the facet size..
            // podGeom.rotateZ(Math.PI / widthSegments);
            podGeom.translate(0, 0, podRadius);
            break;
        }
        default:
            throw new Error('Unknown pod shape: ' + shape);
    }
    const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
    const podMesh = new THREE.Mesh(podGeom, podMat);
    return { mesh: podMesh, dimensions };
}

// --- Layout functions ---
function layoutRadial({ podMesh, podsPerSegment, podDimensions, THREE, rng, doRotation }) {
    const group = new THREE.Group();
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let podRadius = Math.max(podDimensions.width, podDimensions.height) / 2;
    const podDepth = podDimensions.depth;
    // console.info('podDimensions', podDimensions);
    let minRadius = podRadius / Math.sin(Math.PI / podsPerSegment);
    let gap = 0.05 * podRadius;
    let radius = podsPerSegment === 2 ? podRadius * 1.2 : minRadius + gap;
    const randomConst = rng.random();
    // podMesh.rotateZ(-Math.PI / 2);

    const needsConnectors = radius > podRadius;

    for (let i = 0; i < podsPerSegment; i++) {
        const pod = podMesh.clone();
        const angle = (i / podsPerSegment) * Math.PI * 2 + Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        pod.position.set(x, y, 0);
        if (doRotation) {
            pod.rotation.z = angle;
        }
        group.add(pod);

        // if the pod has been placed more than its own radius distance away from the center
        // then we should add a thin cylinder oriented to connect the center of the pod to the center of the axis...
        if (needsConnectors) {

            const widthOfConnector = 0.3 + (podRadius / 2) * randomConst;
            const cylinderGeom = new THREE.CylinderGeometry(widthOfConnector, widthOfConnector, radius, 4);
            const cylinderMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            const cylinderMesh = new THREE.Mesh(cylinderGeom, cylinderMat);
            cylinderMesh.position.set(x / 2, y / 2, podDimensions.depth / 2);
            cylinderMesh.rotateZ(angle + Math.PI / 2);
            group.add(cylinderMesh);

        }


        maxX = Math.max(maxX, x + podDimensions.width / 2);
        minX = Math.min(minX, x - podDimensions.width / 2);
        maxY = Math.max(maxY, y + podDimensions.height / 2);
        minY = Math.min(minY, y - podDimensions.height / 2);
        maxZ = Math.max(maxZ, podDimensions.depth);
    }

    if (needsConnectors) {

        const widthOfConnector = 0.3 + (podRadius / 2) * randomConst;
        const cylinderGeom2 = new THREE.CylinderGeometry(widthOfConnector, widthOfConnector, podDepth, 4);
        const cylinderMat2 = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        const cylinderMesh2 = new THREE.Mesh(cylinderGeom2, cylinderMat2);
        cylinderMesh2.position.set(0,0,podDepth/2);
        cylinderMesh2.rotateX(Math.PI / 2);
        group.add(cylinderMesh2);

    }

    return {
        mesh: group,
        width: maxX - minX,
        height: maxY - minY,
        depth: maxZ,
        layout: 'radial'
    };
}

function layoutGrid({ podMesh, podsPerSegment, podDimensions, THREE }) {
    const group = new THREE.Group();
    // Find the most compact (closest to square) grid
    let bestRows = 1, bestCols = podsPerSegment, minDiff = podsPerSegment - 1;
    for (let rows = 1; rows <= Math.sqrt(podsPerSegment); rows++) {
        if (podsPerSegment % rows === 0) {
            let cols = podsPerSegment / rows;
            let diff = Math.abs(rows - cols);
            if (diff < minDiff) {
                minDiff = diff;
                bestRows = rows;
                bestCols = cols;
            }
        }
    }
    let rows = bestRows;
    let cols = bestCols;
    const gap = 0.1 * Math.max(podDimensions.width, podDimensions.height);
    const totalWidth = cols * podDimensions.width + (cols - 1) * gap;
    const totalHeight = rows * podDimensions.height + (rows - 1) * gap;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    for (let i = 0; i < podsPerSegment; i++) {
        const pod = podMesh.clone();
        let row = Math.floor(i / cols);
        let col = i % cols;
        const x = -totalWidth / 2 + podDimensions.width / 2 + col * (podDimensions.width + gap);
        const y = -totalHeight / 2 + podDimensions.height / 2 + row * (podDimensions.height + gap);
        pod.position.set(x, y, 0);
        group.add(pod);
        maxX = Math.max(maxX, x + podDimensions.width / 2);
        minX = Math.min(minX, x - podDimensions.width / 2);
        maxY = Math.max(maxY, y + podDimensions.height / 2);
        minY = Math.min(minY, y - podDimensions.height / 2);
        maxZ = Math.max(maxZ, podDimensions.depth);
    }
    return {
        mesh: group,
        width: maxX - minX,
        height: maxY - minY,
        depth: maxZ,
        layout: 'grid'
    };
}

// --- Segment mesh builder ---
function makeSegmentMesh({ podMesh, podDimensions, podsPerSegment, rng, THRE, doRotation }) {
    if (podsPerSegment === 1) {
        // Single pod on axis
        // const { mesh: pod, dimensions } = createPod({ mass: segmentMass, shape: podShape, rng, THREE });
        podMesh.position.set(0, 0, 0);
        return {
            mesh: podMesh,
            width: podDimensions.width,
            height: podDimensions.height,
            depth: podDimensions.depth,
            layout: 'single'
        };
    } else {
        // Randomly choose between radial and grid arrangement
        const arrangement = rng.random() < 0.5 ? 'radial' : 'grid';
        // const podMass = segmentMass / podsPerSegment;
        // const { mesh: podMesh, dimensions } = createPod({ mass: podMass, shape: podShape, rng, THREE });
        if (arrangement === 'radial') {
            return layoutRadial({ podMesh, podsPerSegment, podDimensions, THREE, rng, doRotation });
        } else {
            return layoutGrid({ podMesh, podsPerSegment, podDimensions, THREE });
        }
    }
}


const podShapes = ['box','box','cylinder','cylinder','sphere', 'barrel'];
function getPodShape(rng) {
    // Randomly choose a pod shape
    const index = Math.floor(rng.random() * podShapes.length);
    return podShapes[index];
}

export function makeCargoSection({ targetCargoMass, THREE, rng }) {


    // refactor:
    // step 1: choose a pod size based on our scalar ship size...
    const segmentCount = howManySegmentsOfCargo(targetCargoMass, rng);
    const podsPerSegment = howManyPodsPerSegment(targetCargoMass, rng);
    // const targetCargoMass = totalTargetCargoMass(shipMassScalar, rng);
    const targetSegmentMass = targetCargoMass / segmentCount;
    const targetPodMass = targetSegmentMass / podsPerSegment;
    const podMass = getClosestPodMass(targetPodMass);
    const podShape = getPodShape(rng);
    const totalCargoMass = podMass * podsPerSegment * segmentCount;
    const doRotation = rng.random() < 0.5; // 50% chance to rotate pods in segments
    const { mesh: podMesh, dimensions: podDimensions } = createPod({ mass: podMass, shape: podShape, rng, THREE })

    // --- Add optional leading edge gap with tunnel connector ---
    // const tunnelChance = rng.random();
    let segmentGap = 0;
    let hasTunnel = true; // @TODO remove has tunnel conditions and always use tunnel
    if (hasTunnel) {
        segmentGap = 0.01 + rng.random() / 20;
    }

    // --- Build a single segment mesh (to be cloned for each segment) ---
    const segment = makeSegmentMesh({ podMesh, podDimensions, podsPerSegment, rng, THREE, doRotation });
    const segmentMesh = segment.mesh;
    const cargoSectionWidth = segment.width;
    const cargoSectionHeight = segment.height;
    const cargoSectionDepth = segment.depth;
    const cargoSectionLayout = segment.layout;
    const segmentLength = cargoSectionDepth;

    // --- Create the full cargo section mesh with repeated segments and gaps ---
    const cargoSection = new THREE.Group();
    let totalLength = 0;
    if (hasTunnel) {
        totalLength += segmentGap;
    }

    // Optionally offset each segment for a bricklike pattern (radial only)
    let segmentAngleOffset = 0;
    let segmentAngleOffsetDelta = 0;
    // Only apply offset for radial arrangement
    if (cargoSectionLayout === 'radial') {
        if (doRotation) {
            segmentAngleOffsetDelta = (Math.PI / podsPerSegment);
        }
    }

    // --- Clone and position each segment along the Z axis ---
    //     inserting a gap if needed for tunnel connections
    for (let i = 0; i < segmentCount; i++) {
        const clone = segmentMesh.clone(true);
        clone.position.set(0, 0, totalLength);
        if (cargoSectionLayout === 'radial') {
            clone.rotation.z += segmentAngleOffset;
            segmentAngleOffset += segmentAngleOffsetDelta;
        }
        cargoSection.add(clone);
        totalLength += segmentLength;
        if (hasTunnel && i < segmentCount) {
            totalLength += segmentGap;
        }
    }


    // --- Return the cargo section mesh and its bounding box ---
    return {
        mass: totalCargoMass,
        mesh: cargoSection,
        length: totalLength,
        width: cargoSectionWidth,
        height: cargoSectionHeight,
        podsPerSegment: podsPerSegment
    };
}
