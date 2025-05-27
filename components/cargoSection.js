// Cargo Section Component
// Exports makeCargoSection({ cargoBlockMass, THREE, rng }) => { mesh, length }

export function makeCargoSection({ cargoBlockMass, THREE, rng }) {

    // Decide how many repeating sections (1-5)
    const numSections = Math.floor(rng.range(1, 6));
    const sectionMass = cargoBlockMass / numSections;

    // Use a fixed random seed for all sections so they are identical
    const cargoShapeRand = rng.random();
    const aspectA = rng.range(0.2, 1.5);
    const aspectB = rng.range(0.2, 1.5);
    const aspectCyl = rng.range(0.3, 2.0);
    const tunnelChance = rng.random();

    let sectionLength = 0;
    let cargoWidth, cargoHeight, cargoBlockDepth;
    let sectionMesh;
    let sectionPodCount = 1; // Default to 1 pod per section

    // Build a single section mesh (to be cloned)
    if (cargoShapeRand < 0.2) {
        // Box (aspect-ratio based)
        let d = Math.cbrt(sectionMass / (aspectA * aspectB));
        d = Math.max(0.5, Math.min(d, 100));
        cargoWidth = aspectA * d;
        cargoHeight = aspectB * d;
        cargoBlockDepth = d;
        const cargoBlockGeom = new THREE.BoxGeometry(cargoWidth, cargoHeight, cargoBlockDepth);
        // Shift geometry so rear face is at z=0
        cargoBlockGeom.translate(0, 0, cargoBlockDepth / 2);
        const cargoBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        sectionMesh = new THREE.Mesh(cargoBlockGeom, cargoBlockMat);
        sectionMesh.position.set(0, 0, 0);
    } else if (cargoShapeRand < 0.4) {
        // Cylinder (aspect-ratio based)
        let d = Math.cbrt(sectionMass / (Math.PI * aspectCyl * aspectCyl));
        d = Math.max(0.5, Math.min(d, 100));
        const cargoRadius = aspectCyl * d;
        cargoWidth = cargoRadius * 2;
        cargoHeight = cargoWidth;
        cargoBlockDepth = d;
        const cargoBlockGeom = new THREE.CylinderGeometry(cargoRadius, cargoRadius, cargoBlockDepth, 8);
        cargoBlockGeom.rotateX(Math.PI / 2);
        // Shift geometry so rear face is at z=0
        cargoBlockGeom.translate(0, 0, cargoBlockDepth / 2);
        const cargoBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        sectionMesh = new THREE.Mesh(cargoBlockGeom, cargoBlockMat);
        sectionMesh.position.set(0, 0, 0);
    } else if (cargoShapeRand <= 0.6) {
        // Radial distribution of boxes..
        // we'll split our 'section mass' into 2 to 6 seperate boxes
        // that we'll distribute radially around the center
        // and that will be this ONE section.
        sectionPodCount = Math.floor(rng.range(2, 7));
        const boxMass = sectionMass / sectionPodCount;
        const group = new THREE.Group();
        let maxX = 0, maxY = 0, maxZ = 0;
        let minX = 0, minY = 0, minZ = 0;
        const radius = rng.range(0.5, 2.0); // radius of the circle for box placement

        // Random aspect ratios for the repeated box
        const aspectA = rng.range(0.3, 1.5);
        const aspectB = rng.range(0.3, 1.5);
        for (let i = 0; i < sectionPodCount; i++) {
            let d = Math.cbrt(boxMass / (aspectA * aspectB));
            d = Math.max(0.3, Math.min(d, 100));
            const w = aspectA * d;
            const h = aspectB * d;
            const boxDepth = d;
            // Start at 6 o'clock (down the Y axis), so offset angle by Math.PI/2
            const angle = (i / sectionPodCount) * Math.PI * 2 + Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const boxGeom = new THREE.BoxGeometry(w, h, boxDepth);
            boxGeom.translate(0, 0, boxDepth / 2); // rear face at z=0
            const boxMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            const mesh = new THREE.Mesh(boxGeom, boxMat);
            mesh.position.set(x, y, 0);
            mesh.rotation.z = angle; // Rotate so face points outward like a petal
            group.add(mesh);
            // Track extents
            maxX = Math.max(maxX, x + w / 2);
            minX = Math.min(minX, x - w / 2);
            maxY = Math.max(maxY, y + h / 2);
            minY = Math.min(minY, y - h / 2);
            maxZ = Math.max(maxZ, boxDepth);
        }
        sectionMesh = group;
        cargoWidth = maxX - minX;
        cargoHeight = maxY - minY;
        cargoBlockDepth = maxZ;
    } else if (cargoShapeRand <= 1) {
        // same as the radial box case above, but with spheres instead
        sectionPodCount = Math.floor(rng.range(2, 7));
        const sphereMass = sectionMass / sectionPodCount;
        const group = new THREE.Group();
        let maxX = 0, maxY = 0, maxZ = 0;
        let minX = 0, minY = 0, minZ = 0;
        // Compute sphere radius from mass
        let r = Math.cbrt(3 * sphereMass / (4 * Math.PI));
        r = Math.max(0.3, Math.min(r, 100));
        // Calculate minimum radius to prevent intersection
        const minRadius = r / Math.sin(Math.PI / sectionPodCount);
        // Optionally add a small gap
        const gap = 0.05 * r;
        const radius = minRadius + gap;
        for (let i = 0; i < sectionPodCount; i++) {
            // Start at 6 o'clock (down the Y axis), so offset angle by Math.PI/2
            const angle = (i / sectionPodCount) * Math.PI * 2 + Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const sphereGeom = new THREE.SphereGeometry(r, 6, 4);
            // Rotate geometry so seam is at 6 o'clock (down Y axis)
            sphereGeom.rotateZ(-Math.PI / 2);
            sphereGeom.translate(0, 0, r); // rear face at z=0 (approximate)
            const sphereMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
            const mesh = new THREE.Mesh(sphereGeom, sphereMat);
            mesh.position.set(x, y, 0);
            mesh.rotation.z = angle; // Align sphere's vertex pattern with central axis
            group.add(mesh);
            // Track extents
            maxX = Math.max(maxX, x + r);
            minX = Math.min(minX, x - r);
            maxY = Math.max(maxY, y + r);
            minY = Math.min(minY, y - r);
            maxZ = Math.max(maxZ, 2 * r);
        }
        sectionMesh = group;
        cargoWidth = maxX - minX;
        cargoHeight = maxY - minY;
        cargoBlockDepth = maxZ;
    }

    // --- Add optional leading edge gap with tunnel connector ---
    let sectionGap = 0;
    let hasTunnel = tunnelChance < 0.5;
    if (hasTunnel) {
        // Procedurally random gap between 0.5 and 2.0 units
        sectionGap = rng.range(0.1,1) * 0.5;
    }

    sectionLength = cargoBlockDepth;

    // --- Create the full cargo mesh with repeated sections and gaps ---
    const group = new THREE.Group();
    let totalLength = 0;
    if (hasTunnel) {
        // Add gap before first section
        totalLength += sectionGap;
    }

    let sectionAngleOffset = 0;
    let sectionAngleOffsetDelta = 0;

    if (sectionPodCount > 1) {
        // 50% chance to rotate each section
        // by half the angle between the section
        // pods, so that there's a bricklike pattern
        if (rng.random() < 0.5) {
            sectionAngleOffsetDelta = (Math.PI / sectionPodCount);
        }
    }


    for (let i = 0; i < numSections; i++) {
        const clone = sectionMesh.clone(true);
        clone.position.set(0, 0, totalLength);

        clone.rotation.z += sectionAngleOffset;
        sectionAngleOffset += sectionAngleOffsetDelta;

        group.add(clone);
        totalLength += sectionLength;
        if (hasTunnel && i < numSections - 1) {
            // Add gap between sections
            totalLength += sectionGap;
        }
    }

    return {
        mesh: group,
        length: totalLength,
        width: cargoWidth,
        height: cargoHeight
    };
}
