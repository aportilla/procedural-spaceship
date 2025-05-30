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

    // --- Layout selection logic (refactored for clarity) ---
    function pickLayout(thrusterCount, thrusterNozzelDiameter, rng) {
        // For large counts, try offset grid, then grid, then radial
        if (thrusterCount >= 7) {
            if (rng.random() < 0.5) {
                const offset = offsetGridThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
                if (offset) return { positions: offset, isRadial: false };
            }
            const grid = gridThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
            if (grid) return { positions: grid, isRadial: false };
            // Fallback
            return { positions: radialThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng), isRadial: true };
        }
        // For moderate counts, try grid, then radial
        if (thrusterCount > 3) {
            if (rng.random() < 0.5) {
                const grid = gridThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng);
                if (grid) return { positions: grid, isRadial: false };
            }
            // Fallback
            return { positions: radialThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng), isRadial: true };
        }
        // For small counts, always radial
        // console.info(`Using radial layout for small thruster count: ${thrusterCount}`);
        return { positions: radialThrusterLayout(thrusterCount, thrusterNozzelDiameter, rng), isRadial: true };
    }

    const { positions: thrusterPositions, isRadial } = pickLayout(thrusterCount, thrusterNozzelDiameter, rng);

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
