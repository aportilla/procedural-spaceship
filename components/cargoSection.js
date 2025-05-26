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
    const tunnelFrac = rng.range(0.3, 0.6);

    let sectionLength = 0;
    let cargoWidth, cargoHeight, cargoBlockDepth;
    let sectionMesh;

    // Build a single section mesh (to be cloned)
    if (cargoShapeRand < 0.5) {
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
    } else {
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
    for (let i = 0; i < numSections; i++) {
        const clone = sectionMesh.clone(true);
        clone.position.set(0, 0, totalLength);
        group.add(clone);
        totalLength += sectionLength;
        if (hasTunnel && i < numSections - 1) {
            // Add gap between sections
            totalLength += sectionGap;
        }
    }
    if (hasTunnel) {
        // Add gap after last section
        totalLength += sectionGap;
        // dynamic radius that is never larger than the minimum of the cargo block dimensions
        const cargoRadius = Math.min(cargoWidth / 2, cargoHeight / 2);
        const tunnelRadius = cargoRadius * tunnelFrac;
        // Tunnel geometry, rear face at z=0
        const tunnelGeom = new THREE.CylinderGeometry(tunnelRadius, tunnelRadius, totalLength, 4);
        tunnelGeom.rotateX(Math.PI / 2);
        tunnelGeom.translate(0, 0, totalLength / 2);
        const tunnelMat = new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true, shininess: 5 });
        const tunnelMesh = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnelMesh.position.set(0, 0, 0);
        group.add(tunnelMesh);
    }

    return { mesh: group, length: totalLength };
}
