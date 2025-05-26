// Command Deck Component
// Exports makeCommandDeck({ commandDeckMass, THREE, rng }) => { mesh, length }

export function makeCommandDeck({ commandDeckMass, THREE, rng }) {
    const commandDeckShapeRand = rng.random();
    let commandDeckGeom, commandDeckMat, commandDeckDepth;
    let mesh;
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
        // Shift geometry so rear face is at z=0
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);
        commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
        mesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        mesh.position.set(0, 0, 0);
    } else if (commandDeckShapeRand < 0.6) {
        // Cylinder (aspect-ratio based)
        const aspect = rng.range(0.3, 2.0);
        let d = Math.cbrt(commandDeckMass / (Math.PI * aspect * aspect));
        d = Math.max(0.3, Math.min(d, 50));
        const deckRadius = aspect * d;
        commandDeckDepth = d;
        commandDeckGeom = new THREE.CylinderGeometry(deckRadius, deckRadius, commandDeckDepth, 8);
        commandDeckGeom.rotateX(Math.PI / 2);
        // Shift geometry so rear face is at z=0
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);
        commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
        mesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        mesh.position.set(0, 0, 0);
    } else if (commandDeckShapeRand < 0.8) {

        const aspect = rng.range(0.2, 0.5);
        let d = Math.cbrt(commandDeckMass / (Math.PI * aspect * aspect));
        // d = Math.max(0.3, Math.min(d, 50));
        const deckRadius = aspect * d;
        const commandDeckWidth = d;
        // commandDeckDepth = d;
        commandDeckDepth = deckRadius * 2;
        commandDeckGeom = new THREE.CylinderGeometry(deckRadius, deckRadius, commandDeckWidth, 8);
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);

        // 50% chance of rotating the cylinder head vertically
        if (rng.random() < 0.5) {
            commandDeckGeom.rotateZ(Math.PI / 2);
        }

        commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
        // Create a cylinder head with flat sides
        const cylinderHeadMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        cylinderHeadMesh.rotation.z = Math.PI / 2; // rotate so axis is Y, flat faces left/right
        cylinderHeadMesh.position.set(0, 0, 0);

        const neckRadius = deckRadius * 0.75;
        const neckDepth = deckRadius * 0.5;

        const neckGeom = new THREE.CylinderGeometry(neckRadius, neckRadius, neckDepth, 8);
        neckGeom.rotateX(-Math.PI / 2);
        // Shift geometry so rear face is at z=0
        neckGeom.translate(0, 0, neckDepth/2);
        const neckMesh = new THREE.Mesh(neckGeom, new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 }));

        // cylMesh.position.set(0, 0, -deckRadius);
        mesh = new THREE.Group();
        mesh.add(cylinderHeadMesh);
        mesh.add(neckMesh);

    } else {
        // Sphere (reduced poly count)
        const deckRadius = Math.cbrt((3 * commandDeckMass) / (4 * Math.PI));
        commandDeckDepth = deckRadius * 2;
        const sphereGeom = new THREE.SphereGeometry(deckRadius, 6, 4);
        // Shift geometry so rear face is at z=0
        sphereGeom.translate(0, 0, deckRadius);
        const sphereMesh = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 }));
        sphereMesh.position.set(0, 0, 0);
        // Add a cylinder connector at the back
        const cylRadius = deckRadius * 0.35;
        const cylDepth = deckRadius;
        const cylGeom = new THREE.CylinderGeometry(cylRadius, cylRadius, cylDepth, 8);
        cylGeom.rotateX(-Math.PI / 2);
        // Shift geometry so rear face is at z=0
        cylGeom.translate(0, 0, cylDepth/2);
        const cylMesh = new THREE.Mesh(cylGeom, new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 }));
        // cylMesh.position.set(0, 0, -deckRadius);
        mesh = new THREE.Group();
        mesh.add(sphereMesh);
        mesh.add(cylMesh);
    }
    return { mesh, length: commandDeckDepth };
}
