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
        
        // Add window details to side faces
        this.addWindows(mesh, deckWidth, deckHeight, commandDeckDepth, rng, THREE);

        return {
            mesh,
            length: commandDeckDepth,
            width: deckWidth,
            height: deckHeight
        };
    }

    /**
     * Adds window details to side faces of box-shaped command decks
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
        const windowHeight = 0.08 + rng.random() * 0.08; // Height: 0.08 to 0.16
        const windowDepth = 0.06 + rng.random() * 0.06; // Depth: 0.06 to 0.12 (thin in Z)
        const windowThickness = 0.001; // Very thin for flat appearance

        // Create window material (dark, non-reflective to simulate viewport)
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });

        // Container for all window meshes
        const windowGroup = new THREE.Group();

        // Calculate available space for windows
        const marginY = boxHeight * 0.25; // 25% margin from top and bottom
        const availableHeight = boxHeight - (marginY * 2);

        // Validate minimum space requirements
        if (availableHeight < windowHeight) {
            return; // Box too short for windows
        }

        // Calculate window spacing and count
        const windowFrameSpacing = 0.02 + rng.random() * 0.03; // Frame spacing between windows
        const windowWidth = windowHeight * (1.5 + rng.random() * 1.5); // Aspect ratio 1.5 to 3
        const windowSpacing = windowWidth + windowFrameSpacing;

        // Calculate how many windows can fit horizontally
        const maxWindows = Math.floor(availableHeight / windowSpacing);
        const minWindows = Math.max(2, Math.floor(maxWindows / 3)); // At least 2 windows or 1/3 of max
        const actualMaxWindows = Math.min(15, maxWindows); // Cap at 15 for performance

        if (actualMaxWindows < minWindows) {
            return; // Not enough space for minimum windows
        }

        // Determine final window count
        const windowCount = Math.floor(rng.random() * (actualMaxWindows - minWindows + 1)) + minWindows;

        // Position along z-axis (front-back) - closer to front for better view
        const zPosition = boxDepth * 0.8; // Position 80% toward the front

        // Create windows for both side faces (left and right)
        const sides = [
            { x: boxWidth / 2 + 0.001, rotation: 0 },      // Right side
            { x: -boxWidth / 2 - 0.001, rotation: Math.PI } // Left side
        ];

        sides.forEach(side => {
            const sideGroup = new THREE.Group();
            
            // Create and position individual windows in a horizontal row
            for (let i = 0; i < windowCount; i++) {
                // Distribute windows along the y-axis (vertical, but horizontal from crew perspective)
                const yOffset = (i - (windowCount - 1) / 2) * windowSpacing;

                const window = new THREE.Mesh(
                    new THREE.BoxGeometry(windowThickness, windowWidth, windowDepth),
                    windowMaterial
                );
                
                // Position on the side face
                window.position.set(side.x, yOffset, zPosition);
                window.rotation.y = side.rotation;
                sideGroup.add(window);
            }
            
            windowGroup.add(sideGroup);
        });

        parentMesh.add(windowGroup);
    }
}