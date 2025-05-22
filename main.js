// Scene setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0x404040));

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x4fc3f7, 0.5);
pointLight.position.set(-10, 5, -10);
scene.add(pointLight);

// Orbit controls - no grid helper here!
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let theta = 45 * Math.PI / 180; // Horizontal angle
let phi = 60 * Math.PI / 180;   // Vertical angle
let radius = 25;
const minRadius = 5, maxRadius = 50;

function updateCameraPosition() {
    camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
    camera.position.y = radius * Math.cos(phi);
    camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(0, 0, 0);
}

document.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;

    theta += deltaX * 0.01;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.01));

    previousMouseX = e.clientX;
    previousMouseY = e.clientY;

    updateCameraPosition();
});

document.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius = Math.max(minRadius, Math.min(maxRadius, radius + e.deltaY * 0.01));
    updateCameraPosition();
});

// Set initial camera position
updateCameraPosition();

// Seeded random number generator
class SeededRandom {
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

// Spaceship generator
let currentSpaceship = null;

function generateSpaceship(seed) {
    // Remove previous spaceship
    if (currentSpaceship) {
        scene.remove(currentSpaceship);
        currentSpaceship.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    const rng = new SeededRandom(seed);
    const spaceship = new THREE.Group();

    // Color palette
    // const primaryColor = new THREE.Color().setHSL(rng.random(), 0.7, 0.5);
    // const secondaryColor = new THREE.Color().setHSL(rng.random(), 0.3, 0.3);
    // const accentColor = new THREE.Color().setHSL(rng.random(), 0.8, 0.6);

    // Materials
    // const primaryMaterial = new THREE.MeshPhongMaterial({
    //     color: primaryColor,
    //     flatShading: true,
    //     shininess: 100
    // });
    // const secondaryMaterial = new THREE.MeshPhongMaterial({
    //     color: secondaryColor,
    //     flatShading: true,
    //     shininess: 50
    // });
    // const accentMaterial = new THREE.MeshPhongMaterial({
    //     color: accentColor,
    //     flatShading: true,
    //     emissive: accentColor,
    //     emissiveIntensity: 0.3
    // });

    // // Main hull
    // const hullType = rng.int(0, 3);
    // let hull;
    // switch(hullType) {
    //     case 0: // Box hull
    //         hull = new THREE.BoxGeometry(
    //             rng.range(3, 6),
    //             rng.range(1.5, 3),
    //             rng.range(6, 10)
    //         );
    //         break;
    //     case 1: // Cylinder hull
    //         hull = new THREE.CylinderGeometry(
    //             rng.range(1.5, 3),
    //             rng.range(2, 4),
    //             rng.range(6, 10),
    //             rng.int(6, 8),
    //             1,
    //             false
    //         );
    //         hull.rotateX(Math.PI / 2);
    //         break;
    //     case 2: // Cone hull
    //         hull = new THREE.ConeGeometry(
    //             rng.range(2, 4),
    //             rng.range(6, 10),
    //             rng.int(6, 8)
    //         );
    //         hull.rotateX(-Math.PI / 2);
    //         break;
    //     case 3: // Octahedron hull
    //         hull = new THREE.OctahedronGeometry(rng.range(3, 5));
    //         hull.scale(1, 0.6, 1.5);
    //         break;
    // }
    // const hullMesh = new THREE.Mesh(hull, primaryMaterial);
    // spaceship.add(hullMesh);

    // // Cockpit
    // const cockpitType = rng.int(0, 2);
    // let cockpit;
    // switch(cockpitType) {
    //     case 0:
    //         cockpit = new THREE.SphereGeometry(
    //             rng.range(1, 2),
    //             rng.int(6, 8),
    //             rng.int(4, 6)
    //         );
    //         break;
    //     case 1:
    //         cockpit = new THREE.BoxGeometry(
    //             rng.range(1.5, 2.5),
    //             rng.range(1, 1.5),
    //             rng.range(2, 3)
    //         );
    //         break;
    //     case 2:
    //         cockpit = new THREE.TetrahedronGeometry(rng.range(1.5, 2.5));
    //         break;
    // }
    // const cockpitMesh = new THREE.Mesh(cockpit, accentMaterial);
    // cockpitMesh.position.z = rng.range(3, 5);
    // cockpitMesh.position.y = rng.range(0, 1);
    // spaceship.add(cockpitMesh);

    // Engines
    // const engineCount = rng.int(1, 4);
    // for (let i = 0; i < engineCount; i++) {
    //     const engine = new THREE.CylinderGeometry(
    //         rng.range(0.5, 1),
    //         rng.range(0.3, 0.8),
    //         rng.range(2, 4),
    //         rng.int(6, 8)
    //     );
    //     const engineMesh = new THREE.Mesh(engine, secondaryMaterial);
    //
    //     if (engineCount === 1) {
    //         engineMesh.position.set(0, 0, -rng.range(4, 6));
    //     } else {
    //         const angle = (i / engineCount) * Math.PI * 2;
    //         engineMesh.position.set(
    //             Math.cos(angle) * rng.range(2, 3),
    //             Math.sin(angle) * rng.range(1, 2),
    //             -rng.range(4, 6)
    //         );
    //     }
    //
    //     engineMesh.rotation.x = Math.PI / 2;
    //     spaceship.add(engineMesh);
    //
    //     // Engine glow
    //     const glowGeometry = new THREE.ConeGeometry(
    //         rng.range(0.3, 0.6),
    //         rng.range(1, 2),
    //         rng.int(6, 8)
    //     );
    //     const glowMaterial = new THREE.MeshBasicMaterial({
    //         color: accentColor,
    //         transparent: true,
    //         opacity: 0.8
    //     });
    //     const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    //     glowMesh.position.copy(engineMesh.position);
    //     glowMesh.position.z -= 1;
    //     glowMesh.rotation.x = -Math.PI / 2;
    //     spaceship.add(glowMesh);
    // }

    // // Wings
    // if (rng.random() > 0.3) {
    //     const wingType = rng.int(0, 2);
    //     const wingCount = rng.random() > 0.5 ? 2 : 4;
    //     for (let i = 0; i < wingCount; i++) {
    //         let wing;
    //         switch(wingType) {
    //             case 0: // Triangle wings
    //                 wing = new THREE.BufferGeometry();
    //                 const vertices = new Float32Array([
    //                     0, 0, 0,
    //                     rng.range(3, 5), 0, 0,
    //                     rng.range(2, 4), 0, -rng.range(2, 4),
    //                     0, rng.range(0.2, 0.4), 0,
    //                     rng.range(3, 5), rng.range(0.2, 0.4), 0,
    //                     rng.range(2, 4), rng.range(0.2, 0.4), -rng.range(2, 4)
    //                 ]);
    //                 const indices = [
    //                     0, 1, 2,  // bottom
    //                     3, 5, 4,  // top
    //                     0, 3, 4, 0, 4, 1,  // sides
    //                     1, 4, 5, 1, 5, 2,
    //                     2, 5, 3, 2, 3, 0
    //                 ];
    //                 wing.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    //                 wing.setIndex(indices);
    //                 wing.computeVertexNormals();
    //                 break;
    //             case 1: // Box wings
    //                 wing = new THREE.BoxGeometry(
    //                     rng.range(3, 5),
    //                     rng.range(0.2, 0.4),
    //                     rng.range(2, 3)
    //                 );
    //                 break;
    //             case 2: // Swept wings
    //                 wing = new THREE.BoxGeometry(
    //                     rng.range(3, 5),
    //                     rng.range(0.2, 0.4),
    //                     rng.range(2, 3)
    //                 );
    //                 wing.scale(1, 1, 0.6);
    //                 break;
    //         }
    //         const wingMesh = new THREE.Mesh(wing, secondaryMaterial);
    //         const side = i % 2 === 0 ? 1 : -1;
    //         const fore = i < 2 ? 1 : -1;
    //         wingMesh.position.x = side * rng.range(3, 5);
    //         wingMesh.position.z = fore * rng.range(0, 2);
    //         wingMesh.rotation.z = side * rng.range(0, 0.3);
    //         spaceship.add(wingMesh);
    //     }
    // }

    // // Details
    // const detailCount = rng.int(3, 8);
    // for (let i = 0; i < detailCount; i++) {
    //     const detail = new THREE.BoxGeometry(
    //         rng.range(0.2, 0.5),
    //         rng.range(0.2, 0.5),
    //         rng.range(0.5, 1)
    //     );
    //     const detailMesh = new THREE.Mesh(detail, accentMaterial);
    //     const theta = rng.random() * Math.PI * 2;
    //     const radius = rng.range(1.5, 3);
    //     detailMesh.position.set(
    //         Math.cos(theta) * radius,
    //         Math.sin(theta) * radius * 0.5,
    //         rng.range(-3, 3)
    //     );
    //     spaceship.add(detailMesh);
    // }

    // --- ENGINE BLOCK ONLY ---
    // Engine block: a hull segment with random shape and color
    const hullShapes = [
        // Increase box size ranges for larger engine blocks
        () => new THREE.BoxGeometry(rng.range(3, 6), rng.range(2, 4), rng.range(3, 6)),
        // Increase cylinder size ranges for larger engine blocks
        () => {
            const cyl = new THREE.CylinderGeometry(rng.range(1.5, 2.5), rng.range(1.5, 2.5), rng.range(3, 6), rng.int(8, 16));
            cyl.rotateX(Math.PI / 2); // Orient horizontally
            return cyl;
        },
        // Increase sphere size range for larger engine blocks
        () => new THREE.SphereGeometry(rng.range(1.5, 2.5), rng.int(12, 18), rng.int(8, 12)),
        // CapsuleGeometry is not available in this version of three.js, so we comment it out:
        // () => new THREE.CapsuleGeometry(rng.range(1.2, 2), rng.range(2.5, 4), rng.int(6, 12), rng.int(12, 18)),
    ];
    const hullColor = new THREE.Color().setHSL(rng.random(), 0.7, 0.5);
    const hullMaterial = new THREE.MeshPhongMaterial({
        color: hullColor,
        flatShading: true,
        shininess: 80
    });
    const hullGeometry = hullShapes[rng.int(0, hullShapes.length - 1)]();
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    spaceship.add(hullMesh);

    // --- THRUSTERS ---
    // Calculate engine block back face width, height, and depth for thruster area and offset
    let blockWidth = 2, blockHeight = 1.2, blockDepth = 3; // defaults
    if (hullGeometry.type === 'BoxGeometry') {
        blockWidth = hullGeometry.parameters.width;
        blockHeight = hullGeometry.parameters.height;
        blockDepth = hullGeometry.parameters.depth;
    } else if (hullGeometry.type === 'CylinderGeometry') {
        blockWidth = hullGeometry.parameters.radiusTop * 2;
        blockHeight = hullGeometry.parameters.radiusTop * 2;
        blockDepth = hullGeometry.parameters.height;
    } else if (hullGeometry.type === 'SphereGeometry') {
        blockWidth = hullGeometry.parameters.radius * 2;
        blockHeight = hullGeometry.parameters.radius * 2;
        blockDepth = hullGeometry.parameters.radius * 2;
    }
    const attachmentArea = blockWidth * blockHeight;
    // Determine max thruster count based on area (1 per 1.2 units^2, up to 12)
    const maxThrusters = Math.min(12, Math.max(1, Math.floor(attachmentArea / 1.2)));
    const minThrusters = 1;
    const thrusterCount = rng.int(minThrusters, maxThrusters);
    // Choose thruster base style: box or cylinder (random per ship)
    const thrusterStyle = rng.random() > 0.5 ? 'box' : 'cylinder';
    const thrusterColor = new THREE.Color().setHSL(rng.random(), 0.5, 0.3);
    const thrusterMaterial = new THREE.MeshPhongMaterial({
        color: thrusterColor,
        flatShading: true,
        shininess: 30
    });
    // Choose layout: grid for wide/rectangular, radial for round, ring+center for 7, etc.
    let arrangementType;
    const isPerfectSquare = Number.isInteger(Math.sqrt(thrusterCount));
    const isEvenGrid = (n, m) => Number.isInteger(n) && Number.isInteger(m) && thrusterCount === n * m;
    if (blockWidth / blockHeight > 1.3) {
        // Wide: prefer row or grid
        if (thrusterCount <= 4) arrangementType = 'row';
        else if (isEvenGrid(2, thrusterCount / 2)) arrangementType = '2x' + (thrusterCount / 2) + 'grid';
        else if (isEvenGrid(3, thrusterCount / 3)) arrangementType = '3x' + (thrusterCount / 3) + 'grid';
        else arrangementType = 'row';
    } else if (blockHeight / blockWidth > 1.3) {
        // Tall: prefer column or grid
        if (thrusterCount <= 4) arrangementType = 'column';
        else if (isEvenGrid(thrusterCount / 2, 2)) arrangementType = (thrusterCount / 2) + 'x2grid';
        else if (isEvenGrid(thrusterCount / 3, 3)) arrangementType = (thrusterCount / 3) + 'x3grid';
        else arrangementType = 'column';
    } else {
        // Square/round: prefer radial or grid
        if ([1,2].includes(thrusterCount)) arrangementType = thrusterCount === 1 ? 'center' : 'bilateral';
        else if (thrusterCount === 3) arrangementType = rng.random() > 0.5 ? 'triangle' : 'row';
        else if (thrusterCount === 4) arrangementType = rng.random() > 0.5 ? 'square' : '2x2grid';
        else if (isPerfectSquare) arrangementType = Math.sqrt(thrusterCount) + 'x' + Math.sqrt(thrusterCount) + 'grid';
        else if ([5,7].includes(thrusterCount)) arrangementType = rng.random() > 0.5 ? 'ring+center' : 'polygon';
        else if ([6,8,9,10,12].includes(thrusterCount)) arrangementType = 'polygon';
        else arrangementType = 'polygon';
    }
    // Validate grid arrangement: only use if thrusterCount matches grid size
    if (arrangementType && arrangementType.endsWith('grid')) {
        const match = arrangementType.match(/(\d+)x(\d+)grid/);
        if (match) {
            const rows = parseInt(match[1], 10);
            const cols = parseInt(match[2], 10);
            if (thrusterCount !== rows * cols) {
                arrangementType = fallbackArrangement();
            }
        }
    }
    // Calculate thruster size based on available area and layout
    let thrusterSize = 0.7 * Math.min(blockWidth, blockHeight) / Math.ceil(Math.sqrt(thrusterCount));
    if (arrangementType === 'row' || arrangementType === 'column') {
        thrusterSize = 0.7 * (arrangementType === 'row' ? blockWidth / thrusterCount : blockHeight / thrusterCount);
    }
    if (thrusterSize < 0.2) thrusterSize = 0.2; // minimum size
    // Calculate hullZOffset for different hull types (needed for thruster Z placement)
    let hullZOffset = 0;
    if (hullGeometry.type === 'BoxGeometry') {
        hullZOffset = blockDepth / 2;
    } else if (hullGeometry.type === 'CylinderGeometry') {
        hullZOffset = blockDepth / 2;
    } else if (hullGeometry.type === 'SphereGeometry') {
        // For spheres, offset by a fraction of the depth (radius)
        hullZOffset = (blockDepth / 2) * 0.6;
    } else {
        hullZOffset = 1;
    }
    for (let i = 0; i < thrusterCount; i++) {
        // Choose geometry based on thrusterStyle
        let thrusterGeom;
        if (thrusterStyle === 'cylinder') {
            thrusterGeom = new THREE.CylinderGeometry(
                thrusterSize * 0.5, // radiusTop
                thrusterSize * 0.5, // radiusBottom
                thrusterSize * 2,   // height (length)
                16 // radial segments
            );
            // Orient so -Z is out the back, base at origin
            thrusterGeom.rotateX(Math.PI / 2);
            thrusterGeom.translate(0, 0, thrusterSize);
        } else {
            thrusterGeom = new THREE.BoxGeometry(thrusterSize, thrusterSize, thrusterSize * 2);
            thrusterGeom.translate(0, 0, thrusterSize);
        }
        const thrusterMesh = new THREE.Mesh(thrusterGeom, thrusterMaterial);
        // Placement logic
        let x = 0, y = 0, z, angle = 0;
        // Z offset: always flush with hull
        z = -hullZOffset - (thrusterSize * 1.1);
        // Placement by arrangement
        // console.info('arrangementType', arrangementType);
        switch (arrangementType) {
            case 'center':
                x = 0; y = 0;
                break;
            case 'bilateral':
                x = i === 0 ? -blockWidth/4 : blockWidth/4; y = 0;
                break;
            case 'triangle':
                angle = (i / 3) * Math.PI * 2 + Math.PI / 2;
                x = Math.cos(angle) * blockWidth/4;
                y = Math.sin(angle) * blockHeight/4;
                break;
            case 'square':
            case '2x2grid':
            case '2x3grid':
            case '2x4grid':
            case '2x5grid':
            case '3x2grid':
            case '3x3grid':
            case '3x4grid':
            case '4x2grid':
            case '4x3grid': {
                // Parse grid arrangementType like '2x5grid'
                const match = arrangementType.match(/(\d+)x(\d+)grid/);
                if (match) {
                    const cols = parseInt(match[2], 10);
                    const rows = parseInt(match[1], 10);
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    x = (col - (cols - 1) / 2) * (blockWidth / cols);
                    y = (row - (rows - 1) / 2) * (blockHeight / rows);
                }
                break;
            }
            case 'row':
                x = (i - (thrusterCount - 1) / 2) * (blockWidth / thrusterCount);
                y = 0;
                break;
            case 'column':
                x = 0;
                y = (i - (thrusterCount - 1) / 2) * (blockHeight / thrusterCount);
                break;
            case 'grid':
            default: {
                // General grid for any count
                const cols = Math.ceil(Math.sqrt(thrusterCount));
                const rows = Math.ceil(thrusterCount / cols);
                const col = i % cols;
                const row = Math.floor(i / cols);
                x = (col - (cols - 1) / 2) * (blockWidth / cols);
                y = (row - (rows - 1) / 2) * (blockHeight / rows);
                break;
            }
            case 'polygon': {
                angle = (i / thrusterCount) * Math.PI * 2;
                x = Math.cos(angle) * blockWidth/2.5;
                y = Math.sin(angle) * blockHeight/2.5;
                break;
            }
            case 'ring+center': {
                if (i === 0) {
                    x = 0; y = 0;
                } else {
                    angle = ((i - 1) / (thrusterCount - 1)) * Math.PI * 2;
                    x = Math.cos(angle) * blockWidth/3;
                    y = Math.sin(angle) * blockHeight/3;
                }
                break;
            }
        }
        thrusterMesh.position.set(x, y, z);
        thrusterMesh.rotation.set(0, 0, 0);
        // For radial arrangements, rotate base to match radial angle
        if ([
            'triangle','polygon','ring+center'
        ].includes(arrangementType) && i !== 0) {
            thrusterMesh.rotateZ(angle);
        }
        // Add a simple glow for the thruster as a child
        const glowGeom = new THREE.ConeGeometry(thrusterSize * 0.5, thrusterSize * 1.5, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.6
        });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        glowMesh.position.set(0, 0, -thrusterSize * 0.5);
        glowMesh.rotation.set(0, 0, 0);
        glowMesh.rotateX(Math.PI / 2);
        thrusterMesh.add(glowMesh);
        spaceship.add(thrusterMesh);
    }
    // --- END THRUSTERS ---

    currentSpaceship = spaceship;
    scene.add(spaceship);
}

// Utility to generate a random seed string
function randomSeed() {
    // Example: spaceship-8f3a2b
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = 'spaceship-';
    for (let i = 0; i < 6; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
}

const seedInput = document.getElementById('seedInput');
const generateBtn = document.getElementById('generateBtn');

// Generate a new spaceship as the user types
seedInput.addEventListener('input', () => {
    const seed = seedInput.value || 'default';
    generateSpaceship(seed);
});

// Always generate a new random seed and spaceship on button click
generateBtn.addEventListener('click', () => {
    const newSeed = randomSeed();
    seedInput.value = newSeed;
    generateSpaceship(newSeed);
});

// Animation loop
function animate() {
    // Gentle auto-rotation when not dragging
    if (!isDragging && currentSpaceship) {
        currentSpaceship.rotation.y += 0.005;
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Generate initial spaceship with a random seed on page load
const initialSeed = randomSeed();
seedInput.value = initialSeed;
generateSpaceship(initialSeed);
