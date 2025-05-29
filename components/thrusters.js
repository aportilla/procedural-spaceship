import { radialThrusterLayout, gridThrusterLayout, offsetGridThrusterLayout } from './thrusterLayouts.js';

// Returns { mesh, length } for the thruster section
export function makeThrusters({ totalShipMass, rng, THREE }) {
    // --- Ship and thruster constants (moved inside) ---
    const MIN_THRUSTER_COUNT = 1;
    const MAX_THRUSTER_COUNT = 33;
    const MAX_THRUSTER_POWER = 250;
    const MIN_THRUSTER_POWER = 5;

    // --- Calculate thruster power and count ---
    const minThrusterPower = Math.max(MIN_THRUSTER_POWER, totalShipMass / MAX_THRUSTER_COUNT);
    const maxThrusterPower = Math.min(MAX_THRUSTER_POWER, totalShipMass / MIN_THRUSTER_COUNT);

    // choose a random single thruster power within the valid range
    let thrusterPower = rng.range(minThrusterPower, maxThrusterPower);

    // exactly how many thrusters with this power do we need for our ship mass?
    let thrusterCount = Math.round(totalShipMass / thrusterPower);

    // --- Map thruster power to a visual thruster size (area-based) ---
    const THRUSTER_AREA_SCALE = 0.015; // tweak for visual scale
    const thrusterArea = THRUSTER_AREA_SCALE * thrusterPower;
    let thrusterNozzelDiameter = 2 * Math.sqrt(thrusterArea / Math.PI); // diameter

    // --- Thruster color/material ---
    const thrusterColor = new THREE.Color().setHSL(rng.random(), 0.5, 0.3);
    const thrusterMaterial = new THREE.MeshPhongMaterial({
        color: thrusterColor,
        flatShading: true,
        shininess: 30
    });

    // --- Layout selection logic
    let thrusterPositions;
    let isRadial = false;
    // If we have a lot of thrusters (7 or more), and randomly decide to, try offset grid layout first for more visual interest
    if (thrusterCount >= 7 && rng.random() < 0.5) {
        const offset = offsetGridThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
        if (offset) {
            // Use offset grid if possible (preferred for large thruster counts)
            thrusterPositions = offset;
        } else {
            // If offset grid fails, try regular grid layout
            const grid = gridThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
            if (grid) {
                // Use grid if possible
                thrusterPositions = grid;
            } else {
                // Fallback: use radial layout if grid layouts are not possible
                isRadial = true;
                thrusterPositions = radialThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
            }
        }
    // For moderate thruster counts (>3), sometimes try grid layout for variety
    } else if (thrusterCount > 3 && rng.random() < 0.5) {
        const grid = gridThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
        if (grid) {
            // Use grid if possible
            thrusterPositions = grid;
        } else {
            // Fallback: use radial layout if grid is not possible
            isRadial = true;
            thrusterPositions = radialThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
        }
    } else {
        // For small thruster counts (<=3) or if random chooses, always use radial layout
        isRadial = true;
        thrusterPositions = radialThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
    }

    const thrusterDepth = thrusterNozzelDiameter / rng.range(0.5, 4); // Depth based on size, more variation
    const group = new THREE.Group();
    for (const pos of thrusterPositions) {
        const thrusterGeom = new THREE.CylinderGeometry(thrusterNozzelDiameter * 0.5, thrusterNozzelDiameter * 0.5, thrusterDepth, 4);
        thrusterGeom.rotateX(Math.PI / 2);
        thrusterGeom.translate(0, 0, thrusterDepth/2);
        const thrusterMesh = new THREE.Mesh(thrusterGeom, thrusterMaterial);
        thrusterMesh.position.set(pos.x, pos.y, 0);
        // Add glow
        const glowGeom = new THREE.ConeGeometry(thrusterNozzelDiameter * 0.5, thrusterNozzelDiameter * 1.5, 4);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.6 });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        glowMesh.position.set(0, 0, -thrusterNozzelDiameter/2);
        glowMesh.rotation.set(Math.PI / 2, 0, 0);
        thrusterMesh.add(glowMesh);
        group.add(thrusterMesh);
    }
    return { mesh: group, length: thrusterDepth, isRadial, thrusterPositions, thrusterSize: thrusterNozzelDiameter };
}
