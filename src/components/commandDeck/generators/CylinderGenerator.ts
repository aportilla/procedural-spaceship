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
        const circumference = 2 * Math.PI * bigRadius;
        const polySegments = Math.max(4, Math.floor(circumference * 0.6));

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
}