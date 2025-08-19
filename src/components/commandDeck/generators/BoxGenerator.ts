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
        
        // Add window details to top face
        this.addWindows(mesh, deckWidth, deckHeight, commandDeckDepth, rng, THREE);

        return {
            mesh,
            length: commandDeckDepth,
            width: deckWidth,
            height: deckHeight
        };
    }

    /**
     * Adds window details to top face of box-shaped command decks
     */
    private addWindows(
        parentMesh: any, 
        boxWidth: number, 
        boxHeight: number, 
        boxDepth: number, 
        rng: any, 
        THREE: any
    ): void {
        // Individual window dimensions
        const windowWidth = 0.08 + rng.random() * 0.08; // Width: 0.08 to 0.16
        const windowDepth = 0.06 + rng.random() * 0.06; // Depth: 0.06 to 0.12
        const windowThickness = 0.001; // Very thin for flat appearance

        // Create window material (dark, non-reflective to simulate viewport)
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });

        // Container for all window meshes
        const windowGroup = new THREE.Group();

        // Calculate available space for windows on top face
        const marginX = boxWidth * 0.15; // 15% margin from sides
        const availableWidth = boxWidth - (marginX * 2);

        // Calculate window spacing
        const windowFrameSpacing = 0.02 + rng.random() * 0.03; // Frame spacing between windows
        const windowSpacingX = windowWidth + windowFrameSpacing;

        // Calculate how many windows can fit horizontally
        const maxWindows = Math.floor(availableWidth / windowSpacingX);
        const windowCount = Math.max(2, Math.min(10, maxWindows)); // Between 2-10 windows

        if (windowCount < 2) {
            return; // Not enough space for minimum windows
        }

        // Position on top face (y = boxHeight/2)
        const yPosition = boxHeight / 2 + 0.001; // Just above the top surface
        
        // Randomize position along depth - somewhere between 30% and 85% toward the front
        const zRatio = 0.3 + rng.random() * 0.55; // Random value between 0.3 and 0.85
        const zPosition = boxDepth * zRatio;

        // Create single row of windows on top face
        for (let i = 0; i < windowCount; i++) {
            // Calculate position for each window
            const xOffset = (i - (windowCount - 1) / 2) * windowSpacingX;

            const window = new THREE.Mesh(
                new THREE.BoxGeometry(windowWidth, windowThickness, windowDepth),
                windowMaterial
            );
            
            // Position on the top face
            window.position.set(xOffset, yPosition, zPosition);
            windowGroup.add(window);
        }

        parentMesh.add(windowGroup);
    }
}