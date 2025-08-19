/**
 * cargoSection.ts
 *
 * Simple rectangular box cargo section generator
 */

import { MakeCargoSectionParams, CargoSectionResult } from '../types';

/**
 * Generates a simple rectangular box cargo section.
 *
 * @param params - Configuration object containing:
 *   - targetCargoMass: Target mass determining cargo section volume
 *   - THREE: Three.js library reference
 *   - rng: Seeded random number generator
 * @returns CargoSectionResult with mesh and dimensions
 */
export function makeCargoSection({ targetCargoMass, THREE, rng }: MakeCargoSectionParams): CargoSectionResult {
    // Generate random aspect ratios for the box dimensions
    // Width and height will vary, depth is derived from volume
    const widthRatio = 0.5 + rng.random() * 1.5; // 0.5 to 2
    const heightRatio = 0.5 + rng.random() * 1.5; // 0.5 to 2
    const depthRatio = 1.5 + rng.random() * 2; // 1.5 to 3.5 (makes cargo section longer)

    // Calculate dimensions from mass (assuming density = 1, so volume = mass)
    // Volume = width × height × depth
    // Volume = widthRatio × base × heightRatio × base × depthRatio × base
    // Volume = widthRatio × heightRatio × depthRatio × base³
    const baseSize = Math.cbrt(targetCargoMass / (widthRatio * heightRatio * depthRatio));

    const width = widthRatio * baseSize;
    const height = heightRatio * baseSize;
    const depth = depthRatio * baseSize;

    // Create box geometry
    const cargoGeometry = new THREE.BoxGeometry(width, height, depth);

    // Shift geometry so rear face is at z=0 (attachment point)
    cargoGeometry.translate(0, 0, depth / 2);

    // Create material for cargo section
    const cargoMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        flatShading: true,
        shininess: 20
    });

    // Create the mesh
    const cargoMesh = new THREE.Mesh(cargoGeometry, cargoMaterial);

    // Wrap in a group for consistency with other components
    const cargoSection = new THREE.Group();
    cargoSection.add(cargoMesh);

    // Return the cargo section with its properties
    return {
        mass: targetCargoMass,
        mesh: cargoSection,
        length: depth,
        width: width,
        height: height,
        layout: 'box',
        depth: depth,
        podsPerSegment: 1
    };
}