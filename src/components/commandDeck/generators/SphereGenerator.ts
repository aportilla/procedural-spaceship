/**
 * SphereGenerator.ts
 * 
 * Generates spherical command deck components
 */

import { ICommandDeckGenerator, CommandDeckGeneratorParams, CommandDeckResult } from '../types';

export class SphereCommandDeckGenerator implements ICommandDeckGenerator {
    getName(): string {
        return 'Sphere Command Deck';
    }

    generate(params: CommandDeckGeneratorParams): CommandDeckResult {
        const { mass, THREE, rng } = params;
        
        // Calculate sphere radius from volume
        // Volume = (4/3)πr³, so r = ∛(3V/4π)
        const deckRadius = Math.cbrt((3 * mass) / (4 * Math.PI));

        // Adaptive polygon resolution based on size
        const circumference = 2 * Math.PI * deckRadius;
        const widthSegments = Math.max(4, Math.floor(circumference * 0.6));
        const heightSegments = Math.max(2, Math.round(widthSegments / 2));

        // Create sphere geometry
        const commandDeckDepth = deckRadius * 2;
        const sphereGeom = new THREE.SphereGeometry(
            deckRadius, 
            widthSegments, 
            heightSegments
        );
        
        // Shift geometry so rear face is at z=0
        sphereGeom.translate(0, 0, deckRadius);
        
        const mesh = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true, 
            shininess: 30 
        }));
        
        mesh.position.set(0, 0, 0);
        const commandDeckWidth = deckRadius * 2;
        const commandDeckHeight = deckRadius * 2;

        return {
            mesh,
            length: commandDeckDepth,
            width: commandDeckWidth,
            height: commandDeckHeight
        };
    }
}