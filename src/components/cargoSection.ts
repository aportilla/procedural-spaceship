/**
 * cargoSection.ts
 *
 * Simple rectangular box cargo section generator with multiple segments
 */

import { MakeCargoSectionParams, CargoSectionResult } from '../types';

/**
 * Determine number of cargo sections based on mass
 * Uses a bell curve distribution centered based on mass scale
 */
function getNumberOfSections(mass: number, rng: any): number {
    const massScale = Math.min(1, mass / 1000); // Scale to 0-1 range

    // Map mass to a target mean for the distribution
    // Small masses (0) center around 3-4 sections
    // Large masses (1) center around 8-9 sections
    const targetMean = 3 + massScale * 6; // Ranges from 3 to 9

    // Generate a value using Box-Muller transform for normal distribution
    // This gives us a gaussian/bell curve
    const u1 = rng.random();
    const u2 = rng.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Scale the gaussian (std dev of ~2.5 gives good spread across 1-12 range)
    const stdDev = 2.5;
    const rawSections = targetMean + gaussian * stdDev;

    // Round and clamp to 1-12 range
    const sections = Math.round(rawSections);
    return Math.max(1, Math.min(12, sections));
}

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
    // Determine number of sections
    const numSections = getNumberOfSections(targetCargoMass, rng);
    const massPerSection = targetCargoMass / numSections;

    // Generate random aspect ratios for the box dimensions
    // Width and height will vary, depth is derived from volume
    const widthRatio = 0.5 + rng.random() * 1.5; // 0.5 to 2
    const heightRatio = 0.5 + rng.random() * 1.5; // 0.5 to 2
    const depthRatio = (1.5 + rng.random() * 2) / numSections; // Adjust for number of sections

    // Calculate dimensions from mass per section
    // Volume = widthRatio × heightRatio × depthRatio × base³
    const baseSize = Math.cbrt(massPerSection / (widthRatio * heightRatio * depthRatio));

    const width = widthRatio * baseSize;
    const height = heightRatio * baseSize;
    const sectionDepth = depthRatio * baseSize;

    // Gap between sections (proportional to section size)
    const gap = 0.05 * sectionDepth + rng.random() * 0.1 * sectionDepth; // 5-15% of section depth

    // Create material for cargo section
    const cargoMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        flatShading: true,
        shininess: 20
    });

    // Create the main group to hold all sections
    const cargoSection = new THREE.Group();

    // Create and position each section
    let currentZ = 0;
    for (let i = 0; i < numSections; i++) {
        // Create box geometry for this section
        const sectionGeometry = new THREE.BoxGeometry(width, height, sectionDepth);

        // Create mesh for this section
        const sectionMesh = new THREE.Mesh(sectionGeometry, cargoMaterial);

        // Position this section
        sectionMesh.position.set(0, 0, currentZ + sectionDepth / 2);
        cargoSection.add(sectionMesh);

        // Update position for next section
        currentZ += sectionDepth + (i < numSections - 1 ? gap : 0);
    }

    // Calculate total length including gaps
    const totalLength = sectionDepth * numSections + gap * (numSections - 1);

    // Add a spine through the middle if there are multiple sections
    if (numSections > 1) {
        // Spine dimensions - inset from edges
        const insetRatio = 0.01; // 1% inset from each edge
        const insetAmount = insetRatio * Math.max(width, height);
        const spineWidth = width - 2 * insetAmount;
        const spineHeight = height - 2 * insetAmount;
        const spineLength = totalLength - 2 * insetAmount;

        // Create spine geometry - extends full length of cargo section
        const spineGeometry = new THREE.BoxGeometry(spineWidth, spineHeight, spineLength);

        // Create spine material - slightly darker than cargo sections
        const spineMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            flatShading: true,
            shininess: 15
        });

        // Create spine mesh
        const spineMesh = new THREE.Mesh(spineGeometry, spineMaterial);

        // Position spine at center, extending full length
        spineMesh.position.set(0, 0, totalLength / 2);
        cargoSection.add(spineMesh);
    }

    // Return the cargo section with its properties
    return {
        mass: targetCargoMass,
        mesh: cargoSection,
        length: totalLength,
        width: width,
        height: height,
        layout: 'segmented-box',
        depth: totalLength,
        podsPerSegment: numSections
    };
}