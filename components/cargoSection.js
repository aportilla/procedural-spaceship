// Cargo Section Component
// Exports makeCargoSection({ cargoBlockMass, THREE, rng }) => { mesh, length }

export function makeCargoSection({ cargoBlockMass, THREE, rng }) {
    const cargoShapeRand = rng.random();
    let cargoBlockGeom, cargoBlockMat, cargoBlockDepth, mesh, cargoWidth, cargoHeight;
    if (cargoShapeRand < 0.5) {
        // Box (aspect-ratio based)
        const aspectA = rng.range(0.2, 1.5);
        const aspectB = rng.range(0.2, 1.5);
        let d = Math.cbrt(cargoBlockMass / (aspectA * aspectB));
        d = Math.max(0.5, Math.min(d, 100));
        cargoWidth = aspectA * d;
        cargoHeight = aspectB * d;
        cargoBlockDepth = d;
        cargoBlockGeom = new THREE.BoxGeometry(cargoWidth, cargoHeight, cargoBlockDepth);
        cargoBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        mesh = new THREE.Mesh(cargoBlockGeom, cargoBlockMat);
        mesh.position.set(0, 0, cargoBlockDepth / 2);
    } else {
        // Cylinder (aspect-ratio based)
        const aspect = rng.range(0.3, 2.0);
        let d = Math.cbrt(cargoBlockMass / (Math.PI * aspect * aspect));
        d = Math.max(0.5, Math.min(d, 100));
        const cargoRadius = aspect * d;
        cargoWidth = cargoRadius * 2; // Diameter
        cargoHeight = cargoWidth;
        cargoBlockDepth = d;
        cargoBlockGeom = new THREE.CylinderGeometry(cargoRadius, cargoRadius, cargoBlockDepth, 8);
        cargoBlockGeom.rotateX(Math.PI / 2);
        cargoBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        mesh = new THREE.Mesh(cargoBlockGeom, cargoBlockMat);
        mesh.position.set(0, 0, cargoBlockDepth / 2);
    }


    // --- Add optional leading edge gap with tunnel connector ---

    if (rng.random() < 0.5) { // 50% chance to add a gap
        // @TODO - add a tunnel connector to the front of the cargo block
        // and add it to the mesh and update our cargoBlockDepth
        cargoBlockDepth += 1; // Increase depth for the tunnel

        // add a tunnel that is the FULL cargoBlockDepth
        // const tunnelRadius = 2; // Fixed radius for the tunnel

        // dynamic radius that is never larger than the minimum of the cargo block dimensions
        const cargoRadius = Math.min(cargoWidth / 2, cargoHeight / 2);

        // make tunnel radius a random fractino of the cargo radius
        // between 0.1 and 0.5 of the cargo radius
        const tunnelRadius = cargoRadius * rng.range(0.3, 0.6);

        const tunnelGeom = new THREE.CylinderGeometry(tunnelRadius, tunnelRadius, cargoBlockDepth, 4);
        tunnelGeom.rotateX(Math.PI / 2);
        const tunnelMat = new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true, shininess: 5 });
        const tunnelMesh = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnelMesh.position.set(0, 0, 0); // Position at the front
        mesh.add(tunnelMesh);


    }

    return { mesh, length: cargoBlockDepth };
}
