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
    // Calculate thruster size based on available area and layout
    let thrusterSize = 0.7 * Math.min(blockWidth, blockHeight) / Math.ceil(Math.sqrt(thrusterCount));
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

    // Utility: Get optimal grid dimensions for a given count and aspect
    function getGridDimensions(count, width, height) {
        // Try to make grid as square as possible, but respect aspect
        let bestRows = 1, bestCols = count, bestScore = Infinity;
        for (let rows = 1; rows <= count; rows++) {
            const cols = Math.ceil(count / rows);
            const aspect = (width / cols) / (height / rows);
            const aspectScore = Math.abs(Math.log(aspect));
            if (aspectScore < bestScore) {
                bestScore = aspectScore;
                bestRows = rows;
                bestCols = cols;
            }
        }
        return { rows: bestRows, cols: bestCols };
    }

    // Utility: Get thruster positions procedurally
    function getThrusterPositions(count, width, height) {
        const aspect = width / height;
        if (aspect > 1.5 && count <= 6) {
            // Row
            return Array.from({length: count}, (_, i) => ({
                x: (i - (count - 1) / 2) * (width / count),
                y: 0
            }));
        } else if (aspect < 0.67 && count <= 6) {
            // Column
            return Array.from({length: count}, (_, i) => ({
                x: 0,
                y: (i - (count - 1) / 2) * (height / count)
            }));
        } else if (count === 1) {
            return [{x: 0, y: 0}];
        } else if (count === 2) {
            return [
                {x: -width/4, y: 0},
                {x: width/4, y: 0}
            ];
        } else if (count <= 5) {
            // Place in a regular polygon
            return Array.from({length: count}, (_, i) => {
                const angle = (i / count) * Math.PI * 2 - Math.PI/2;
                return {
                    x: Math.cos(angle) * width/3,
                    y: Math.sin(angle) * height/3
                };
            });
        } else {
            // Improved: Symmetric, staggered grid
            // Try odd row counts first for best symmetry
            let bestPattern = [count], bestScore = Infinity;
            for (let rows = 3; rows <= Math.min(count, 7); rows += 2) {
                let base = Math.floor(count / rows);
                let extra = count % rows;
                let pattern = Array(rows).fill(base);
                // Distribute extras: outermost rows get extras first for symmetry
                let left = 0, right = rows - 1;
                while (extra > 0) {
                    pattern[left]++;
                    extra--;
                    if (extra > 0) {
                        pattern[right]++;
                        extra--;
                    }
                    left++;
                    right--;
                }
                // Score: minimize max-min, maximize symmetry
                const minVal = Math.min(...pattern), maxVal = Math.max(...pattern);
                const symmetry = pattern.reduce((acc, val, i) => acc + Math.abs(val - pattern[pattern.length-1-i]), 0);
                const score = (maxVal-minVal)*10 + symmetry;
                if (score < bestScore) {
                    bestScore = score;
                    bestPattern = pattern;
                }
            }
            // If no good odd row found, fallback to even rows
            if (bestPattern.length === 1) {
                for (let rows = 2; rows <= Math.min(count, 8); rows += 2) {
                    let base = Math.floor(count / rows);
                    let extra = count % rows;
                    let pattern = Array(rows).fill(base);
                    let left = 0, right = rows - 1;
                    while (extra > 0) {
                        pattern[left]++;
                        extra--;
                        if (extra > 0) {
                            pattern[right]++;
                            extra--;
                        }
                        left++;
                        right--;
                    }
                    const minVal = Math.min(...pattern), maxVal = Math.max(...pattern);
                    const symmetry = pattern.reduce((acc, val, i) => acc + Math.abs(val - pattern[pattern.length-1-i]), 0);
                    const score = (maxVal-minVal)*10 + symmetry;
                    if (score < bestScore) {
                        bestScore = score;
                        bestPattern = pattern;
                    }
                }
            }
            // Place thrusters row by row, centering each row and using its own width
            const positions = [];
            const totalRows = bestPattern.length;
            for (let row = 0, placed = 0; row < totalRows; row++) {
                const thrustersInRow = bestPattern[row];
                const y = (row - (totalRows - 1) / 2) * (height / totalRows);
                for (let col = 0; col < thrustersInRow; col++, placed++) {
                    const x = (col - (thrustersInRow - 1) / 2) * (width / thrustersInRow);
                    positions.push({x, y});
                }
            }
            return positions;
        }
    }

    const thrusterPositions = getThrusterPositions(thrusterCount, blockWidth, blockHeight);
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
        let x = thrusterPositions[i].x, y = thrusterPositions[i].y;
        // Z offset: always flush with hull
        let z = -hullZOffset - (thrusterSize * 1.1);
        thrusterMesh.position.set(x, y, z);
        thrusterMesh.rotation.set(0, 0, 0);
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
