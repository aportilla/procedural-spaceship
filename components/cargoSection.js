// Cargo Section Component
// Exports makeCargoSection({ cargoBlockMass, THREE, rng }) => { mesh, length, width, height }
//
// Systematic Design:
// 1. Choose segment count
// 2. Choose pod shape (box, cylinder, sphere)
// 3. Choose pods per segment
// 4. Generate pod geometry and layout (single or radial)
// 5. Stack segments along Z axis
//
// Each pod's size is determined by mass and random aspect ratios
// Segments can be separated by a tunnel/gap
// The function returns the full cargo section mesh and its bounding box

export function makeCargoSection({ cargoBlockMass, THREE, rng }) {
    // --- Pod creation factory ---
    function createPod({ mass, shape, rng, THREE }) {
        // Calculate pod dimensions
        let dimensions;
        if (shape === 'box') {
            const aspectA = rng.range(0.3, 1);
            const aspectB = rng.range(0.3, 1);
            let podDepth = Math.cbrt(mass / (aspectA * aspectB));
            podDepth = Math.max(0.3, Math.min(podDepth, 100));
            const podWidth = aspectA * podDepth;
            const podHeight = aspectB * podDepth;
            dimensions = { width: podWidth, height: podHeight, depth: podDepth, aspectA, aspectB };
        } else if (shape === 'cylinder') {
            const aspectCyl = rng.range(0.3, 0.9);
            let podDepth = Math.cbrt(mass / (Math.PI * aspectCyl * aspectCyl));
            podDepth = Math.max(0.3, Math.min(podDepth, 100));
            const podRadius = aspectCyl * podDepth;
            dimensions = { width: podRadius * 2, height: podRadius * 2, depth: podDepth, aspectCyl };
        } else if (shape === 'sphere') {
            let podRadius = Math.cbrt(3 * mass / (4 * Math.PI));
            podRadius = Math.max(0.3, Math.min(podRadius, 100));
            dimensions = { width: podRadius * 2, height: podRadius * 2, depth: 2 * podRadius, podRadius };
        }
        // Create pod mesh
        let podMesh;
        if (shape === 'box') {
            const { width, height, depth } = dimensions;
            const podGeom = new THREE.BoxGeometry(width, height, depth);
            podGeom.translate(0, 0, depth / 2);
            const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            podMesh = new THREE.Mesh(podGeom, podMat);
        } else if (shape === 'cylinder') {
            const { width, depth } = dimensions;
            const podRadius = width / 2;
            const podGeom = new THREE.CylinderGeometry(podRadius, podRadius, depth, 8);
            podGeom.rotateX(Math.PI / 2);
            podGeom.translate(0, 0, depth / 2);
            const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            podMesh = new THREE.Mesh(podGeom, podMat);
        } else if (shape === 'sphere') {
            const { podRadius } = dimensions;
            const podGeom = new THREE.SphereGeometry(podRadius, 6, 4);
            podGeom.rotateZ(-Math.PI / 2);
            podGeom.translate(0, 0, podRadius);
            const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            podMesh = new THREE.Mesh(podGeom, podMat);
        }
        return { mesh: podMesh, dimensions };
    }

    // --- Layout functions ---
    function layoutRadial({ podMesh, podsPerSegment, dimensions, THREE }) {
        const group = new THREE.Group();
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let podRadius = Math.max(dimensions.width, dimensions.height) / 2;
        let minRadius = podRadius / Math.sin(Math.PI / podsPerSegment);
        let gap = 0.05 * podRadius;
        let radius = podsPerSegment === 2 ? podRadius * 1.2 : minRadius + gap;
        for (let i = 0; i < podsPerSegment; i++) {
            const pod = podMesh.clone();
            const angle = (i / podsPerSegment) * Math.PI * 2 + Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            pod.position.set(x, y, 0);
            pod.rotation.z = angle;
            group.add(pod);
            maxX = Math.max(maxX, x + dimensions.width / 2);
            minX = Math.min(minX, x - dimensions.width / 2);
            maxY = Math.max(maxY, y + dimensions.height / 2);
            minY = Math.min(minY, y - dimensions.height / 2);
            maxZ = Math.max(maxZ, dimensions.depth);
        }
        return {
            mesh: group,
            width: maxX - minX,
            height: maxY - minY,
            depth: maxZ
        };
    }

    function layoutGrid({ podMesh, podsPerSegment, dimensions, THREE }) {
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
        const gap = 0.1 * Math.max(dimensions.width, dimensions.height);
        const totalWidth = cols * dimensions.width + (cols - 1) * gap;
        const totalHeight = rows * dimensions.height + (rows - 1) * gap;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        for (let i = 0; i < podsPerSegment; i++) {
            const pod = podMesh.clone();
            let row = Math.floor(i / cols);
            let col = i % cols;
            const x = -totalWidth / 2 + dimensions.width / 2 + col * (dimensions.width + gap);
            const y = -totalHeight / 2 + dimensions.height / 2 + row * (dimensions.height + gap);
            pod.position.set(x, y, 0);
            group.add(pod);
            maxX = Math.max(maxX, x + dimensions.width / 2);
            minX = Math.min(minX, x - dimensions.width / 2);
            maxY = Math.max(maxY, y + dimensions.height / 2);
            minY = Math.min(minY, y - dimensions.height / 2);
            maxZ = Math.max(maxZ, dimensions.depth);
        }
        return {
            mesh: group,
            width: maxX - minX,
            height: maxY - minY,
            depth: maxZ
        };
    }

    // --- Segment mesh builder ---
    function makeSegmentMesh({ segmentMass, podShape, podsPerSegment, rng, THREE }) {
        if (podsPerSegment === 1) {
            // Single pod on axis
            const { mesh: pod, dimensions } = createPod({ mass: segmentMass, shape: podShape, rng, THREE });
            pod.position.set(0, 0, 0);
            return {
                mesh: pod,
                width: dimensions.width,
                height: dimensions.height,
                depth: dimensions.depth
            };
        } else {
            // Randomly choose between radial and grid arrangement
            const arrangement = rng.random() < 0.5 ? 'radial' : 'grid';
            const podMass = segmentMass / podsPerSegment;
            const { mesh: podMesh, dimensions } = createPod({ mass: podMass, shape: podShape, rng, THREE });
            if (arrangement === 'radial') {
                return layoutRadial({ podMesh, podsPerSegment, dimensions, THREE });
            } else {
                return layoutGrid({ podMesh, podsPerSegment, dimensions, THREE });
            }
        }
    }

    // --- 1. Decide how many segments in this cargo section ---
    const numSegments = Math.floor(rng.range(1, 6));
    const segmentMass = cargoBlockMass / numSegments;

    // --- 2. Choose pod shape for this section ---
    // 0: box, 1: cylinder, 2: sphere
    const podShapeRand = rng.random();
    let podShape;
    if (podShapeRand < 0.33) podShape = 'box';
    else if (podShapeRand < 0.66) podShape = 'cylinder';
    else podShape = 'sphere';

    // --- 3. Choose pods per segment ---
    let podsPerSegment;
    if (rng.random() < 0.5) {
        podsPerSegment = 1;
    } else {
        podsPerSegment = Math.floor(rng.range(2, 10));
    }

    // --- 5. Add optional leading edge gap with tunnel connector ---
    const tunnelChance = rng.random();
    let segmentGap = 0;
    let hasTunnel = tunnelChance < 0.5;
    if (hasTunnel) {
        segmentGap = rng.range(0.1, 1) * 0.5;
    }

    // --- Build a single segment mesh (to be cloned for each segment) ---
    const segment = makeSegmentMesh({ segmentMass, podShape, podsPerSegment, rng, THREE });
    const segmentMesh = segment.mesh;
    const cargoSectionWidth = segment.width;
    const cargoSectionHeight = segment.height;
    const cargoSectionDepth = segment.depth;
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
    let isRadial = false;
    if (podsPerSegment > 1) {
        // Recompute arrangement type for this segment (must match makeSegmentMesh logic)
        const arrangement = segmentMesh.type === 'Group' && segmentMesh.children.length > 1 && segmentMesh.children[0].rotation && segmentMesh.children[0].rotation.z !== 0 ? 'radial' : 'grid';
        if (arrangement === 'radial') {
            isRadial = true;
            if (rng.random() < 0.5) {
                segmentAngleOffsetDelta = (Math.PI / podsPerSegment);
            }
        }
    }

    // --- Clone and position each segment along the Z axis ---
    for (let i = 0; i < numSegments; i++) {
        const clone = segmentMesh.clone(true);
        clone.position.set(0, 0, totalLength);
        if (isRadial) {
            clone.rotation.z += segmentAngleOffset;
            segmentAngleOffset += segmentAngleOffsetDelta;
        }
        cargoSection.add(clone);
        totalLength += segmentLength;
        if (hasTunnel && i < numSegments - 1) {
            totalLength += segmentGap;
        }
    }

    // --- Return the cargo section mesh and its bounding box ---
    return {
        mesh: cargoSection,
        length: totalLength,
        width: cargoSectionWidth,
        height: cargoSectionHeight
    };
}
