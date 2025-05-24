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
        commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
        mesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        mesh.position.set(0, 0, commandDeckDepth / 2);
    } else if (commandDeckShapeRand < 0.8) {
        // Cylinder (aspect-ratio based)
        const aspect = rng.range(0.3, 2.0);
        let d = Math.cbrt(commandDeckMass / (Math.PI * aspect * aspect));
        d = Math.max(0.3, Math.min(d, 50));
        const deckRadius = aspect * d;
        commandDeckDepth = d;
        commandDeckGeom = new THREE.CylinderGeometry(deckRadius, deckRadius, commandDeckDepth, 8);
        commandDeckGeom.rotateX(Math.PI / 2);
        commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
        mesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        mesh.position.set(0, 0, commandDeckDepth / 2);
    } else {
        // Sphere (reduced poly count)
        const deckRadius = Math.cbrt((3 * commandDeckMass) / (4 * Math.PI));
        commandDeckDepth = deckRadius * 2;
        const sphereGeom = new THREE.SphereGeometry(deckRadius, 6, 4);
        const sphereMesh = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 }));
        // Place the sphere so its CENTER is at z=commandDeckDepth/2 (for correct stacking)
        sphereMesh.position.set(0, 0, 0);
        // Add a cylinder connector at the back
        const cylRadius = deckRadius * 0.35;
        const cylDepth = deckRadius;
        const cylGeom = new THREE.CylinderGeometry(cylRadius, cylRadius, cylDepth, 8);
        cylGeom.rotateX(Math.PI / 2);
        const cylMesh = new THREE.Mesh(cylGeom, new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 }));
        // Place the cylinder so its FRONT is at z=0 (so it connects to the back of the sphere)
        cylMesh.position.set(0, 0, -cylDepth / 2);
        mesh = new THREE.Group();
        mesh.add(sphereMesh);
        mesh.add(cylMesh);
    }
    return { mesh, length: commandDeckDepth };
}
