// Command Deck Component
// Exports makeCommandDeck({ commandDeckMass, THREE, rng }) => { mesh, length }


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



const commandDeckShapes = ['box','box','cylinder', 'cylinder', 'hammerheadCylinder', 'sphere'];
// const commandDeckShapes = ['cylinder'];

export function makeCommandDeck({ commandDeckMass, THREE, rng }) {
    // const commandDeckShapeRand = rng.random();
    // const commandDeckShapeRand = 0.3; // debug: always hammerhead cylinder

    // choose shape from array
    const commandDeckShape = commandDeckShapes[Math.floor(rng.random() * commandDeckShapes.length)];

    let commandDeckGeom, commandDeckMat, commandDeckDepth;
    let mesh, commandDeckWidth = 0, commandDeckHeight = 0;
    if (commandDeckShape === 'box') {
        // Box (aspect-ratio based)
        const aspectA = 0.1 + (3 * rng.random()); // Aspect ratio between 0.5 and 2.0
        const aspectB = 0.1 + (3 * rng.random()); // Aspect ratio between 0.5 and 2.0
        let d = Math.cbrt(commandDeckMass / (aspectA * aspectB));
        d = Math.max(0.3, Math.min(d, 50));
        const deckWidth = aspectA * d;
        const deckHeight = aspectB * d;
        commandDeckDepth = d;
        commandDeckGeom = new THREE.BoxGeometry(deckWidth, deckHeight, commandDeckDepth);
        // Shift geometry so rear face is at z=0
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);
        commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
        const boxMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        // boxMesh.position.set(0, 0, 0);
        commandDeckWidth = deckWidth;
        commandDeckHeight = deckHeight;

        mesh = new THREE.Group();
        mesh.add(boxMesh);


        const randomPortSize = rng.range(0.05, 0.1);
        const bridgeWidth = Math.max(0.3,rng.range(0.2, 0.5) * deckWidth);
        const crossGeom = new THREE.CylinderGeometry(randomPortSize, randomPortSize, bridgeWidth, 4);
        crossGeom.translate(0, 0, commandDeckDepth);
        const crossMesh = new THREE.Mesh(crossGeom, commandDeckMat);
        crossMesh.rotateZ(Math.PI / 2);
            // crossMesh.position.y = deckHeight * 0.5;

        mesh.add(crossMesh);

    } else if (commandDeckShape === 'cylinder') {

        const doTaper = rng.random() < 0.5; // 50% chance to use taper


        const aspectRatio = rng.range(1,2); // Random aspect ratio for the barrel
        const taperRatio = doTaper ? rng.range(0.1,0.9) : 1; // Random taper for the barrel

        const { smallRadius, bigRadius, depth } = makeTaperedCylinderGeometry(commandDeckMass,aspectRatio,taperRatio);
        const circumference = 2 * Math.PI * bigRadius;
        const polySegments = Math.max(4,Math.floor(circumference * 0.6));



        // // Cylinder (aspect-ratio based)
        // const aspect = 0.1 + (2 * rng.random());
        // let d = Math.cbrt(commandDeckMass / (Math.PI * aspect * aspect));
        // d = Math.max(0.3, Math.min(d, 50));
        // const deckRadius = aspect * d;

        // const circumference = 2 * Math.PI * deckRadius;
        // const polySegments = Math.max(4,Math.floor(circumference * 0.6));

        commandDeckDepth = depth;
        commandDeckGeom = new THREE.CylinderGeometry(smallRadius, bigRadius, depth, polySegments);
        commandDeckGeom.rotateX(Math.PI / 2);
        // Shift geometry so rear face is at z=0
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);
        commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
        const cylMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        // mesh.position.set(0, 0, 0);
        commandDeckWidth = bigRadius * 2;
        commandDeckHeight = commandDeckWidth; // For cylinders, width and height are the same

        mesh = new THREE.Group();
        mesh.add(cylMesh);


    } else if (commandDeckShape === 'hammerheadCylinder') {

        // Hammerhead Cylinder
        const aspect = 0.1 + rng.random();
        let d = Math.cbrt(commandDeckMass / (Math.PI * aspect * aspect));
        // d = Math.max(0.3, Math.min(d, 50));
        const deckRadius = aspect * d;
        const cylinderLength = d;
        const cylinderDiameter = deckRadius * 2; // For cylinders, width and height are the same

        const circumference = 2 * Math.PI * deckRadius;
        const polySegments = Math.max(4,Math.floor(circumference * 0.7));

        // commandDeckDepth = d;
        commandDeckDepth = deckRadius * 2;
        commandDeckGeom = new THREE.CylinderGeometry(deckRadius, deckRadius, cylinderLength, polySegments);
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);

        // 50% chance of rotating the cylinder head vertically
        if (rng.random() < 0.5) {
            // vertical cylinder
            commandDeckGeom.rotateZ(Math.PI / 2);
            commandDeckWidth = cylinderDiameter; // Width is now the diameter
            commandDeckHeight = cylinderLength; // Height is the length of the cylinder
        } else {
            // horizontal cylinder
            commandDeckWidth = cylinderLength; // Width is the diameter
            commandDeckHeight = cylinderDiameter; // Height is the length of the cylinder
        }

        commandDeckMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 });
        // Create a cylinder head with flat sides
        const cylinderHeadMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        cylinderHeadMesh.rotation.z = Math.PI / 2; // rotate so axis is Y, flat faces left/right
        cylinderHeadMesh.position.set(0, 0, 0);

        // const neckRadius = deckRadius * 0.75;
        // const neckDepth = deckRadius * 0.5;

        // const neckGeom = new THREE.CylinderGeometry(neckRadius, neckRadius, neckDepth, 8);
        // neckGeom.rotateX(-Math.PI / 2);
        // // Shift geometry so rear face is at z=0
        // neckGeom.translate(0, 0, neckDepth/2);
        // const neckMesh = new THREE.Mesh(neckGeom, new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 }));

        // cylMesh.position.set(0, 0, -deckRadius);
        mesh = new THREE.Group();
        mesh.add(cylinderHeadMesh);
        // mesh.add(neckMesh);

    } else if (commandDeckShape === 'sphere') {
        // Sphere (reduced poly count)
        const deckRadius = Math.cbrt((3 * commandDeckMass) / (4 * Math.PI));

        const circumference = 2 * Math.PI * deckRadius;
        const widthSegments = Math.max(4,Math.floor(circumference * 0.6));
        const heightSegments = Math.max(2,Math.round(widthSegments / 2));

        commandDeckDepth = deckRadius * 2;
        const sphereGeom = new THREE.SphereGeometry(deckRadius, widthSegments, heightSegments);
        // Shift geometry so rear face is at z=0
        sphereGeom.translate(0, 0, deckRadius);
        mesh = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, shininess: 30 }));
        mesh.position.set(0, 0, 0);
        commandDeckWidth = commandDeckHeight = deckRadius * 2;
    }
    return {
        mesh,
        length: commandDeckDepth,
        width: commandDeckWidth,
        height: commandDeckHeight
    };
}
