// Engine Block Component
// Exports makeEngineBlock({ isRadial, thrusterPositions, thrusterSize, engineBlockMass, THREE, rng }) => { mesh, length }

import { MakeEngineBlockParams, ComponentResult } from '../types';

export function makeEngineBlock({ isRadial, thrusterPositions, thrusterSize, engineBlockMass, THREE, rng }: MakeEngineBlockParams): ComponentResult {
    // 1. Find bounding box of thruster positions

    let boundingBoxPaddingScalar = rng.random() * 0.2 + 0.1; // Random padding between 10% and 30%

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pos of thrusterPositions) {
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.y > maxY) maxY = pos.y;
    }
    // console.info('thrusterSize',thrusterSize);
    const pad = (thrusterSize / 2) + boundingBoxPaddingScalar * (3 / thrusterPositions.length);
    // console.info('pad', pad);
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const width = maxX - minX;
    const height = maxY - minY;

    // console.info('width', width, 'height', height);
    let engineBlockGeom, engineBlockMat, engineBlockDepth, mesh;
    if (isRadial) {
        // Cylinder engine block
        let maxR = 0;
        for (const pos of thrusterPositions) {
            const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
            if (r > maxR) maxR = r;
        }
        const engineRadius = maxR + thrusterSize * 0.6;

        let forwardTaperAmount = 1;

        // 50% chance that forward taper is smaller than rear taper
        if (rng.random() < 0.5) {
            forwardTaperAmount = 0.75 + rng.random() * 0.25; // 75% to 100% of rear radius
        }

        const rearRadius = engineRadius + pad;
        const forwardRadius = rearRadius * forwardTaperAmount;
        const circumference = 2 * Math.PI * rearRadius;
        const polySegments = Math.max(4,Math.floor(circumference * 0.6));
        // D = 3V / [π(rA² + rA·rB + rB²)]
        engineBlockDepth = (3 * engineBlockMass) / (Math.PI * (forwardRadius * forwardRadius + forwardRadius * rearRadius + rearRadius * rearRadius));


        engineBlockGeom = new THREE.CylinderGeometry(forwardRadius, rearRadius, engineBlockDepth, polySegments);
        engineBlockGeom.rotateX(Math.PI / 2);
        // Shift geometry so rear face is at z=0
        engineBlockGeom.translate(0, 0, engineBlockDepth / 2);
        engineBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        mesh = new THREE.Mesh(engineBlockGeom, engineBlockMat);
        mesh.position.set(0, 0, 0);
    } else {
        // Box engine block
        const ENGINE_BLOCK_VOLUME_PER_MASS = 1;
        const desiredVolume = ENGINE_BLOCK_VOLUME_PER_MASS * engineBlockMass;
        engineBlockDepth = desiredVolume / (width * height);
        engineBlockGeom = new THREE.BoxGeometry(width, height, engineBlockDepth);
        // Shift geometry so rear face is at z=0
        engineBlockGeom.translate(0, 0, engineBlockDepth / 2);
        engineBlockMat = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true, shininess: 10 });
        mesh = new THREE.Mesh(engineBlockGeom, engineBlockMat);
        mesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, 0);
    }
    return {
        mesh,
        length: engineBlockDepth,
        width: width,
        height: height
    };
}
