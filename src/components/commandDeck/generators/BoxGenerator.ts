/**
 * BoxGenerator.ts
 * 
 * Generates box-shaped command deck components with optional window details
 */

import { ICommandDeckGenerator, CommandDeckGeneratorParams, CommandDeckResult } from '../types';

export class BoxCommandDeckGenerator implements ICommandDeckGenerator {
    getName(): string {
        return 'Box Command Deck';
    }

    generate(params: CommandDeckGeneratorParams): CommandDeckResult {
        const { mass, THREE, rng } = params;
        
        // Generate random aspect ratios for width and height
        const aspectA = 0.1 + (3 * rng.random()); // Width multiplier: 0.1 to 3.1
        const aspectB = 0.1 + (3 * rng.random()); // Height multiplier: 0.1 to 3.1
        
        // Calculate base dimension from mass (assuming density = 1)
        // Volume = width × height × depth = aspectA×d × aspectB×d × d = aspectA×aspectB×d³
        let d = Math.cbrt(mass / (aspectA * aspectB));
        d = Math.max(0.3, Math.min(d, 50)); // Clamp to reasonable range
        
        const deckWidth = aspectA * d;
        const deckHeight = aspectB * d;
        const commandDeckDepth = d;

        // Create box geometry
        const commandDeckGeom = new THREE.BoxGeometry(deckWidth, deckHeight, commandDeckDepth);
        // Shift geometry so rear face is at z=0 (attachment point)
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);
        
        // Standard command deck material
        const commandDeckMat = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true, 
            shininess: 30 
        });
        
        const boxMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);

        // Assemble box command deck with details
        const mesh = new THREE.Group();
        mesh.add(boxMesh);
        
        // Add window details to front face
        this.addWindows(mesh, deckWidth, deckHeight, commandDeckDepth, rng, THREE);

        return {
            mesh,
            length: commandDeckDepth,
            width: deckWidth,
            height: deckHeight
        };
    }

    /**
     * Adds window details to box-shaped command decks
     */
    private addWindows(
        parentMesh: any, 
        boxWidth: number, 
        boxHeight: number, 
        boxDepth: number, 
        rng: any, 
        THREE: any
    ): void {
        // Window dimensions - larger height for better visibility
        const windowHeight = 0.12;
        const windowDepth = 0.001; // Very thin for flat appearance

        // Create window material (dark, non-reflective to simulate viewport)
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });

        // Container for all window meshes
        const windowGroup = new THREE.Group();

        // Calculate available space (currently no margins)
        const margin = 0; // TODO: Consider adding configurable margins
        const availableWidth = boxWidth - (margin * 2);
        const availableHeight = boxHeight - (margin * 2);

        // Validate minimum space requirements
        if (availableHeight < windowHeight) {
            return; // Box too short for windows
        }

        // Generate random window dimensions
        const aspectRatio = 0.5 + rng.random() * 1.5; // Aspect ratio: 0.5 to 2.0
        const windowFrameWidth = 0.02 + rng.random() * 0.05; // Frame spacing between windows
        const windowWidth = Math.min(
            availableWidth - (windowFrameWidth * 2),
            windowHeight * aspectRatio
        );
        const windowSpacing = windowWidth + windowFrameWidth;

        // Calculate window count constraints
        const maxRectangles = Math.floor(availableWidth / windowSpacing);
        const minWindows = Math.ceil(maxRectangles / 4); // At least 1/4 of max capacity
        const maxWindows = Math.min(21, maxRectangles); // Cap at 21 for performance

        if (maxWindows < minWindows) {
            console.warn('Not enough space for minimum windows');
            return;
        }

        // Determine final window count
        const windowCount = Math.floor(rng.random() * (maxWindows - minWindows + 1)) + minWindows;

        // Random vertical positioning (±30% from center)
        const verticalOffset = boxHeight * (-0.3 + rng.random() * 0.6);

        // Create and position individual windows
        for (let i = 0; i < windowCount; i++) {
            // Center windows horizontally
            const xOffset = (i - (windowCount - 1) / 2) * windowSpacing;

            const window = new THREE.Mesh(
                new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
                windowMaterial
            );
            
            // Position slightly in front of the box face to prevent z-fighting
            window.position.set(xOffset, verticalOffset, boxDepth + 0.001);
            windowGroup.add(window);
        }

        parentMesh.add(windowGroup);
    }
}