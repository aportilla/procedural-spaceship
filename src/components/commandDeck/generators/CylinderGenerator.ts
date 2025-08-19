/**
 * CylinderGenerator.ts
 *
 * Generates cylindrical command deck components with optional tapering
 */

import { ICommandDeckGenerator, CommandDeckGeneratorParams, CommandDeckResult } from '../types';

export class CylinderCommandDeckGenerator implements ICommandDeckGenerator {
    getName(): string {
        return 'Cylinder Command Deck';
    }

    generate(params: CommandDeckGeneratorParams): CommandDeckResult {
        const { mass, THREE, rng } = params;

        // Randomly decide between tapered cone and straight cylinder
        const doTaper = rng.random() < 0.5; // 50% chance for taper

        // Generate shape parameters
        const aspectRatio = rng.range(1, 2); // Length to radius ratio
        const taperRatio = doTaper ? rng.range(0.1, 0.9) : 1; // Taper amount (1 = no taper)

        // Calculate cylinder dimensions from mass
        const { smallRadius, bigRadius, depth } = this.makeTaperedCylinderGeometry(
            mass,
            aspectRatio,
            taperRatio
        );

        // Determine polygon resolution based on size
        // const circumference = 2 * Math.PI * smallRadius;
        const polySegments = 6;

        // Create cylinder geometry (Three.js cylinder is vertical by default)
        const commandDeckDepth = depth;
        const commandDeckGeom = new THREE.CylinderGeometry(
            smallRadius,  // Top radius (front of ship)
            bigRadius,    // Bottom radius (rear attachment)
            depth,        // Height (along ship axis)
            polySegments  // Number of sides
        );

        // Orient cylinder along Z-axis (ship direction)
        commandDeckGeom.rotateX(Math.PI / 2);
        // twist so that a flat face is 'up'
        commandDeckGeom.rotateZ(Math.PI / 2);
        // Shift geometry so rear face is at z=0
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);

        const commandDeckMat = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            flatShading: true,
            shininess: 30
        });

        const cylMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        const commandDeckWidth = bigRadius * 2;
        const commandDeckHeight = commandDeckWidth; // Circular cross-section

        const mesh = new THREE.Group();
        mesh.add(cylMesh);

        // Add window details to the top face
        this.addWindows(mesh, bigRadius, smallRadius, commandDeckDepth, rng, THREE);

        return {
            mesh,
            length: commandDeckDepth,
            width: commandDeckWidth,
            height: commandDeckHeight
        };
    }

    /**
     * Calculates dimensions for a tapered cylinder (frustum) with specified volume
     */
    private makeTaperedCylinderGeometry(
        volume: number,
        aspectRatio: number,
        taperRatio: number = 0.5
    ): { smallRadius: number; bigRadius: number; depth: number } {
        const k = taperRatio;
        const shapeFactor = 1 + k + k * k;

        const bigRadius = Math.pow(
            (3 * volume) / (Math.PI * aspectRatio * shapeFactor),
            1/3
        );

        const smallRadius = bigRadius * taperRatio;
        const depth = bigRadius * aspectRatio;

        return { smallRadius, bigRadius, depth };
    }

    /**
     * Adds window details to the top flat face of the hexagonal cylinder
     */
    private addWindows(
        parentMesh: any,
        bigRadius: number,
        smallRadius: number,
        depth: number,
        rng: any,
        THREE: any
    ): void {
        // Fixed window height for consistent scale
        const windowHeight = 0.12;
        const windowThickness = 0.001; // Very thin for flat appearance

        // Create window material (dark to simulate viewport)
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });

        // Container for all window meshes
        const windowGroup = new THREE.Group();

        // Position windows along the depth (z-axis) - do this first to know the radius
        const depthPosition = 0.3 + rng.random() * 0.4; // Position between 30% and 70% of depth
        const zPos = depth * depthPosition;

        // Calculate the radius at this depth position (for tapered cylinders)
        const t = depthPosition;
        const radiusAtZ = bigRadius + (smallRadius - bigRadius) * t;

        // The top face of the 6-sided cylinder is flat
        // Calculate the width of the flat face at this Z position
        const flatFaceWidth = radiusAtZ; // Use radius at the window position, not bigRadius

        // Calculate available space for windows on the top face
        const availableSpaceForWindows = flatFaceWidth * 0.7; // Use 70% of the face width

        // Validate minimum space requirements
        if (availableSpaceForWindows < windowHeight) {
            console.info('Not enough space for windows');
            return; // Not enough space for windows
        }

        // Generate window parameters
        const aspectRatio = 0.5 + rng.random() * 1.5; // Aspect ratio: 0.5 to 2.0
        const windowFrameSpacing = 0.02 + rng.random() * 0.05; // Frame spacing between windows

        // Calculate ideal window width based on aspect ratio
        const idealWindowWidth = Math.min(windowHeight * aspectRatio, 0.2);

        // Calculate how many windows of this size could fit
        const windowWithSpacing = idealWindowWidth + windowFrameSpacing;
        const maxPossibleWindows = Math.floor((availableSpaceForWindows + windowFrameSpacing) / windowWithSpacing);

        // Scale window count based on available space
        // Small spaces get 2-3 windows, large spaces get up to 10
        const minWindows = 2;
        const maxDesiredWindows = Math.min(10, maxPossibleWindows);

        if (maxDesiredWindows < minWindows) {
            console.info('Not enough space for even one window');
            return;
        }

        // Choose window count within the valid range
        const windowCount = Math.floor(rng.random() * (maxDesiredWindows - minWindows + 1)) + minWindows;

        // Now recalculate window width to distribute evenly in available space
        const totalSpacingNeeded = (windowCount - 1) * windowFrameSpacing;
        const spaceForWindows = availableSpaceForWindows - totalSpacingNeeded;
        let windowWidth = spaceForWindows / windowCount;

        // Cap window width at the ideal size
        windowWidth = Math.min(windowWidth, idealWindowWidth);

        const windowSpacing = windowWidth + windowFrameSpacing;

        // The y position is at the top of the cylinder
        // Since it's a hexagon, the top face is at radius * cos(30°) = radius * sqrt(3)/2
        const yPos = radiusAtZ * Math.sqrt(3) / 2;

        // Create windows arranged horizontally on the top face
        for (let i = 0; i < windowCount; i++) {
            // Calculate horizontal offset
            const windowOffset = (i - (windowCount - 1) / 2) * windowSpacing;
            const xPos = windowOffset;

            // Create window geometry (flat on the top face)
            const windowGeom = new THREE.BoxGeometry(windowWidth, windowThickness, windowHeight);
            const window = new THREE.Mesh(windowGeom, windowMaterial);

            // Position on top face
            window.position.set(xPos, yPos, zPos);

            // If the cylinder is tapered, angle the window to match the taper
            if (smallRadius !== bigRadius) {
                const radiusDiff = smallRadius - bigRadius;
                const angle = Math.atan2(radiusDiff, depth);
                window.rotation.x = -angle;
            }

            windowGroup.add(window);
        }

        // Add all windows to parent mesh
        parentMesh.add(windowGroup);
    }
}