// Engine Block Component
// Exports makeEngineBlock({ isRadial, thrusterPositions, thrusterSize, engineBlockMass, THREE, rng }) => { mesh, length }

export function makeEngineBlock({ isRadial, thrusterPositions, thrusterSize, engineBlockMass, THREE, rng }) {
    // 1. Find bounding box of thruster positions
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pos of thrusterPositions) {
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.y > maxY) maxY = pos.y;
    }
    const pad = thrusterSize * 0.6;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const width = maxX - minX;
    const height = maxY - minY;

    let engineBlockGeom, engineBlockMat, engineBlockDepth, mesh;
    if (isRadial) {
        // Cylinder engine block
        let maxR = 0;
        for (const pos of thrusterPositions) {
            const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
            if (r > maxR) maxR = r;
        }
        const engineRadius = maxR + thrusterSize * 0.6;
        engineBlockDepth = engineBlockMass / (Math.PI * engineRadius * engineRadius);
        engineBlockDepth = Math.max(0.5, Math.min(engineBlockDepth, 100));
        engineBlockGeom = new THREE.CylinderGeometry(engineRadius, engineRadius, engineBlockDepth, 8);
        engineBlockGeom.rotateX(Math.PI / 2);
        engineBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        mesh = new THREE.Mesh(engineBlockGeom, engineBlockMat);
        mesh.position.set(0, 0, engineBlockDepth / 2);
    } else {
        // Box engine block
        const ENGINE_BLOCK_VOLUME_PER_MASS = 1;
        const desiredVolume = ENGINE_BLOCK_VOLUME_PER_MASS * engineBlockMass;
        engineBlockDepth = desiredVolume / (width * height);
        engineBlockDepth = Math.max(0.5, Math.min(engineBlockDepth, 100));
        engineBlockGeom = new THREE.BoxGeometry(width, height, engineBlockDepth);
        engineBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        mesh = new THREE.Mesh(engineBlockGeom, engineBlockMat);
        mesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, engineBlockDepth / 2);
    }
    return { mesh, length: engineBlockDepth };
}
