/**
 * cargoSection.ts
 *
 * Simple rectangular box cargo section generator with multiple segments
 */

import { MakeCargoSectionParams, CargoSectionResult } from '../types';

/**
 * Determine number of cargo sections based on mass
 * Uses a weighted probability distribution that favors lower numbers for smaller masses
 */
function getNumberOfSections(mass: number, rng: any): number {
    const massScale = Math.min(1, mass / 1000); // Scale to 0-1 range

    // Generate a random value with bias towards lower numbers
    // Using a power function to create the bias
    const randomValue = rng.random();

    // The exponent controls the bias - higher values create stronger bias towards low numbers
    // We vary the exponent based on mass - smaller masses have stronger bias
    const biasFactor = 2.5 - (massScale * 1.5); // Ranges from 2.5 (small mass) to 1.0 (large mass)
    const biasedRandom = Math.pow(randomValue, biasFactor);

    // Map the biased random value to 1-12 sections
    const sections = Math.floor(1 + biasedRandom * 11);

    // Ensure we always have at least 1 section and at most 12
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
        const spineWidth = width * (1 - 2 * insetRatio);
        const spineHeight = height * (1 - 2 * insetRatio);

        // Create spine geometry - extends full length of cargo section
        const spineGeometry = new THREE.BoxGeometry(spineWidth, spineHeight, totalLength);

        // Create spine material - slightly darker than cargo sections
        const spineMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
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