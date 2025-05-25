// /components/thrusters.js
// Returns { mesh, length } for the thruster section
export function makeThrusters({ thrusterPositions, thrusterSize, thrusterDepth, thrusterMaterial, THREE }) {
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
    return { mesh: group, length: thrusterDepth };
}
