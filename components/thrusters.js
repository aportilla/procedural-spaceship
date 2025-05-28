import { radialThrusterLayout, gridThrusterLayout, offsetGridThrusterLayout } from './thrusterLayouts.js';

// Returns { mesh, length } for the thruster section
export function makeThrusters({ shipMassScalar, totalShipMass, rng, THREE }) {
    // --- Ship and thruster constants (moved inside) ---
    const MIN_THRUSTER_COUNT = 1;
    const MAX_THRUSTER_COUNT = 33;
    const MAX_THRUSTER_POWER = 250;
    const MIN_THRUSTER_POWER = 5;
    // --- Calculate thruster power and count ---
    const maximumMinThrusterPower = Math.max(MIN_THRUSTER_POWER, totalShipMass / MAX_THRUSTER_COUNT);
    const minimumMaxThrusterPower = Math.min(MAX_THRUSTER_POWER, totalShipMass / MIN_THRUSTER_COUNT);
    let thrusterPower = rng.range(maximumMinThrusterPower, minimumMaxThrusterPower);
    let thrusterCount = Math.ceil(totalShipMass / thrusterPower);
    thrusterPower = totalShipMass / thrusterCount;

    // --- Map thruster power to a visual thruster size (area-based) ---
    const THRUSTER_AREA_SCALE = 0.015; // tweak for visual scale
    const thrusterArea = THRUSTER_AREA_SCALE * thrusterPower;
    let thrusterSize = 2 * Math.sqrt(thrusterArea / Math.PI); // diameter

    // --- Thruster color/material ---
    const thrusterColor = new THREE.Color().setHSL(rng.random(), 0.5, 0.3);
    const thrusterMaterial = new THREE.MeshPhongMaterial({
        color: thrusterColor,
        flatShading: true,
        shininess: 30
    });

    // --- Layout selection logic moved from shipgen.js ---
    let thrusterPositions;
    let isRadial = false;
    if (thrusterCount >= 7 && rng.random() < 0.5) {
        const offset = offsetGridThrusterLayout(thrusterCount, thrusterSize, rng);
        if (offset) {
            thrusterPositions = offset;
        } else {
            const grid = gridThrusterLayout(thrusterCount, thrusterSize, rng);
            if (grid) {
                thrusterPositions = grid;
            } else {
                isRadial = true;
                thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
            }
        }
    } else if (thrusterCount > 3 && rng.random() < 0.5) {
        const grid = gridThrusterLayout(thrusterCount, thrusterSize, rng);
        if (grid) {
            thrusterPositions = grid;
        } else {
            isRadial = true;
            thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
        }
    } else {
        isRadial = true;
        thrusterPositions = radialThrusterLayout(thrusterCount, thrusterSize, rng);
    }

    const thrusterDepth = thrusterSize / rng.range(0.5, 4); // Depth based on size, more variation
    const group = new THREE.Group();
    for (const pos of thrusterPositions) {
        const thrusterGeom = new THREE.CylinderGeometry(thrusterSize * 0.5, thrusterSize * 0.5, thrusterDepth, 4);
        thrusterGeom.rotateX(Math.PI / 2);
        thrusterGeom.translate(0, 0, thrusterDepth/2);
        const thrusterMesh = new THREE.Mesh(thrusterGeom, thrusterMaterial);
        thrusterMesh.position.set(pos.x, pos.y, 0);
        // Add glow
        const glowGeom = new THREE.ConeGeometry(thrusterSize * 0.5, thrusterSize * 1.5, 4);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.6 });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        glowMesh.position.set(0, 0, -thrusterSize/2);
        glowMesh.rotation.set(Math.PI / 2, 0, 0);
        thrusterMesh.add(glowMesh);
        group.add(thrusterMesh);
    }
    return { mesh: group, length: thrusterDepth, isRadial, thrusterPositions, thrusterSize };
}
