// Cargo Section Component
// Exports makeCargoSection({ cargoBlockMass, THREE, rng }) => { mesh, length, width, height }
//
// Design:
// - A cargo section is composed of 1 or more segments (numSegments)
// - Each segment is a repeated unit along the Z axis
// - Each segment can be:
//   - a single box
//   - a single cylinder
//   - a radial arrangement of pods (boxes or spheres)
// - Each pod's size is determined by mass and random aspect ratios
// - Segments can be separated by a tunnel/gap
// - The function returns the full cargo section mesh and its bounding box

export function makeCargoSection({ cargoBlockMass, THREE, rng }) {
    // --- Decide how many segments in this cargo section ---
    const numSegments = Math.floor(rng.range(1, 6));
    const segmentMass = cargoBlockMass / numSegments;

    // --- Randomize shape and tunnel/gap options for this section ---
    const cargoShapeRand = rng.random();
    const aspectA = rng.range(0.2, 1.5);
    const aspectB = rng.range(0.2, 1.5);
    const aspectCyl = rng.range(0.3, 2.0);
    const tunnelChance = rng.random();

    // --- Output variables ---
    let segmentLength = 0; // Length of a single segment
    let cargoSectionWidth, cargoSectionHeight, cargoSectionDepth; // Bounding box of a segment
    let segmentMesh; // Mesh for a single segment
    let segmentPodCount = 1; // Number of pods in a segment (default 1)

    // --- Build a single segment mesh (to be cloned for each segment) ---
    if (cargoShapeRand < 0.2) {
        // Single box segment
        let podDepth = Math.cbrt(segmentMass / (aspectA * aspectB));
        podDepth = Math.max(0.5, Math.min(podDepth, 100));
        cargoSectionWidth = aspectA * podDepth;
        cargoSectionHeight = aspectB * podDepth;
        cargoSectionDepth = podDepth;
        const podGeom = new THREE.BoxGeometry(cargoSectionWidth, cargoSectionHeight, cargoSectionDepth);
        // Shift geometry so rear face is at z=0
        podGeom.translate(0, 0, cargoSectionDepth / 2);
        const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        segmentMesh = new THREE.Mesh(podGeom, podMat);
        segmentMesh.position.set(0, 0, 0);
    } else if (cargoShapeRand < 0.4) {
        // Single cylinder segment
        let podDepth = Math.cbrt(segmentMass / (Math.PI * aspectCyl * aspectCyl));
        podDepth = Math.max(0.5, Math.min(podDepth, 100));
        const podRadius = aspectCyl * podDepth;
        cargoSectionWidth = podRadius * 2;
        cargoSectionHeight = cargoSectionWidth;
        cargoSectionDepth = podDepth;
        const podGeom = new THREE.CylinderGeometry(podRadius, podRadius, cargoSectionDepth, 8);
        podGeom.rotateX(Math.PI / 2);
        // Shift geometry so rear face is at z=0
        podGeom.translate(0, 0, cargoSectionDepth / 2);
        const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        segmentMesh = new THREE.Mesh(podGeom, podMat);
        segmentMesh.position.set(0, 0, 0);
    } else if (cargoShapeRand <= 0.6) {
        // Radial distribution of pods (boxes)
        segmentPodCount = Math.floor(rng.range(2, 7));
        const podMass = segmentMass / segmentPodCount;
        const group = new THREE.Group();
        let maxX = 0, maxY = 0, maxZ = 0;
        let minX = 0, minY = 0, minZ = 0;
        const radius = rng.range(0.5, 2.0); // radius of the circle for pod placement
        const podAspectA = rng.range(0.3, 1.5);
        const podAspectB = rng.range(0.3, 1.5);
        for (let i = 0; i < segmentPodCount; i++) {
            let podDepth = Math.cbrt(podMass / (podAspectA * podAspectB));
            podDepth = Math.max(0.3, Math.min(podDepth, 100));
            const podWidth = podAspectA * podDepth;
            const podHeight = podAspectB * podDepth;
            // Start at 6 o'clock (down the Y axis), so offset angle by Math.PI/2
            const angle = (i / segmentPodCount) * Math.PI * 2 + Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const podGeom = new THREE.BoxGeometry(podWidth, podHeight, podDepth);
            podGeom.translate(0, 0, podDepth / 2); // rear face at z=0
            const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            const pod = new THREE.Mesh(podGeom, podMat);
            pod.position.set(x, y, 0);
            pod.rotation.z = angle; // Rotate so face points outward like a petal
            group.add(pod);
            // Track extents
            maxX = Math.max(maxX, x + podWidth / 2);
            minX = Math.min(minX, x - podWidth / 2);
            maxY = Math.max(maxY, y + podHeight / 2);
            minY = Math.min(minY, y - podHeight / 2);
            maxZ = Math.max(maxZ, podDepth);
        }
        segmentMesh = group;
        cargoSectionWidth = maxX - minX;
        cargoSectionHeight = maxY - minY;
        cargoSectionDepth = maxZ;
    } else if (cargoShapeRand <= 1) {
        // Radial distribution of pods (spheres)
        segmentPodCount = Math.floor(rng.range(2, 7));
        const podMass = segmentMass / segmentPodCount;
        const group = new THREE.Group();
        let maxX = 0, maxY = 0, maxZ = 0;
        let minX = 0, minY = 0, minZ = 0;
        let podRadius = Math.cbrt(3 * podMass / (4 * Math.PI));
        podRadius = Math.max(0.3, Math.min(podRadius, 100));
        const minRadius = podRadius / Math.sin(Math.PI / segmentPodCount);
        const gap = 0.05 * podRadius;
        const radius = minRadius + gap;
        for (let i = 0; i < segmentPodCount; i++) {
            // Start at 6 o'clock (down the Y axis), so offset angle by Math.PI/2
            const angle = (i / segmentPodCount) * Math.PI * 2 + Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const podGeom = new THREE.SphereGeometry(podRadius, 6, 4);
            // Rotate geometry so seam is at 6 o'clock (down Y axis)
            podGeom.rotateZ(-Math.PI / 2);
            podGeom.translate(0, 0, podRadius); // rear face at z=0 (approximate)
            const podMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            const pod = new THREE.Mesh(podGeom, podMat);
            pod.position.set(x, y, 0);
            pod.rotation.z = angle; // Align sphere's vertex pattern with central axis
            group.add(pod);
            // Track extents
            maxX = Math.max(maxX, x + podRadius);
            minX = Math.min(minX, x - podRadius);
            maxY = Math.max(maxY, y + podRadius);
            minY = Math.min(minY, y - podRadius);
            maxZ = Math.max(maxZ, 2 * podRadius);
        }
        segmentMesh = group;
        cargoSectionWidth = maxX - minX;
        cargoSectionHeight = maxY - minY;
        cargoSectionDepth = maxZ;
    }

    // --- Add optional leading edge gap with tunnel connector ---
    let segmentGap = 0;
    let hasTunnel = tunnelChance < 0.5;
    if (hasTunnel) {
        // Random gap between segments
        segmentGap = rng.range(0.1,1) * 0.5;
    }

    segmentLength = cargoSectionDepth;

    // --- Create the full cargo section mesh with repeated segments and gaps ---
    const cargoSection = new THREE.Group();
    let totalLength = 0;
    if (hasTunnel) {
        // Add gap before first segment
        totalLength += segmentGap;
    }

    // --- Optionally offset each segment for a bricklike pattern ---
    let segmentAngleOffset = 0;
    let segmentAngleOffsetDelta = 0;
    if (segmentPodCount > 1) {
        // 50% chance to rotate each segment by half the angle between pods
        if (rng.random() < 0.5) {
            segmentAngleOffsetDelta = (Math.PI / segmentPodCount);
        }
    }

    // --- Clone and position each segment along the Z axis ---
    for (let i = 0; i < numSegments; i++) {
        const clone = segmentMesh.clone(true);
        clone.position.set(0, 0, totalLength);
        clone.rotation.z += segmentAngleOffset;
        segmentAngleOffset += segmentAngleOffsetDelta;
        cargoSection.add(clone);
        totalLength += segmentLength;
        if (hasTunnel && i < numSegments - 1) {
            // Add gap between segments
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
