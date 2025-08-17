/**
 * HammerheadGenerator.ts
 * 
 * Generates hammerhead-style command decks (horizontal cylinder perpendicular to ship axis)
 */

import { ICommandDeckGenerator, CommandDeckGeneratorParams, CommandDeckResult } from '../types';

export class HammerheadCommandDeckGenerator implements ICommandDeckGenerator {
    getName(): string {
        return 'Hammerhead Command Deck';
    }

    generate(params: CommandDeckGeneratorParams): CommandDeckResult {
        const { mass, THREE, rng } = params;
        
        // Calculate dimensions from mass
        const aspect = 0.1 + rng.random(); // Radius to length ratio
        let d = Math.cbrt(mass / (Math.PI * aspect * aspect));
        const deckRadius = aspect * d;
        const cylinderLength = d;
        const cylinderDiameter = deckRadius * 2;

        // Determine polygon resolution
        const circumference = 2 * Math.PI * deckRadius;
        const polySegments = Math.max(4, Math.floor(circumference * 0.7));

        // Create cylinder geometry (vertical by default in Three.js)
        const commandDeckDepth = deckRadius * 2; // Depth is the diameter
        const commandDeckGeom = new THREE.CylinderGeometry(
            deckRadius, 
            deckRadius, 
            cylinderLength, 
            polySegments
        );
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);

        let commandDeckWidth, commandDeckHeight;

        // Randomly orient hammerhead vertically or horizontally
        if (rng.random() < 0.5) {
            // Vertical orientation (cylinder axis along Y)
            commandDeckGeom.rotateZ(Math.PI / 2);
            commandDeckWidth = cylinderDiameter;
            commandDeckHeight = cylinderLength;
        } else {
            // Horizontal orientation (cylinder axis along X)
            commandDeckWidth = cylinderLength;
            commandDeckHeight = cylinderDiameter;
        }

        const commandDeckMat = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true, 
            shininess: 30 
        });
        
        // Create hammerhead mesh
        const cylinderHeadMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        cylinderHeadMesh.rotation.z = Math.PI / 2; // Final orientation adjustment
        cylinderHeadMesh.position.set(0, 0, 0);

        const mesh = new THREE.Group();
        mesh.add(cylinderHeadMesh);

        return {
            mesh,
            length: commandDeckDepth,
            width: commandDeckWidth,
            height: commandDeckHeight
        };
    }
}