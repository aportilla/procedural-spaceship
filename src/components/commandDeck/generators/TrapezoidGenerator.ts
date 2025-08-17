/**
 * TrapezoidGenerator.ts
 * 
 * Generates trapezoid-shaped command deck components
 * Has rectangular leading and trailing faces with same height but different widths
 * Forms a trapezoidal horizontal cross-section
 */

import { ICommandDeckGenerator, CommandDeckGeneratorParams, CommandDeckResult } from '../types';

export class TrapezoidCommandDeckGenerator implements ICommandDeckGenerator {
    getName(): string {
        return 'Trapezoid Command Deck';
    }

    generate(params: CommandDeckGeneratorParams): CommandDeckResult {
        const { mass, THREE, rng } = params;
        
        // 50% chance to taper inward (narrow front) vs outward (wide front)
        const taperOutward = rng.random() < 0.5;
        
        // Generate width ratio between front and back
        const widthRatio = 0.4 + (0.4 * rng.random()); // Narrow end is 40-80% of wide end
        
        // Generate aspect ratios
        const heightAspect = 0.5 + (1.5 * rng.random()); // Height multiplier: 0.5 to 2.0
        const wideWidthAspect = 1.0 + (2.0 * rng.random()); // Wide end width multiplier: 1.0 to 3.0
        
        // Calculate base dimension from mass
        // Approximate volume = depth × height × (frontWidth + backWidth) / 2
        const avgWidthAspect = wideWidthAspect * (1 + widthRatio) / 2;
        let d = Math.cbrt(mass / (heightAspect * avgWidthAspect));
        d = Math.max(0.3, Math.min(d, 50)); // Clamp to reasonable range
        
        const deckHeight = heightAspect * d;
        const wideWidth = wideWidthAspect * d;
        const narrowWidth = wideWidth * widthRatio;
        
        // Assign widths based on taper direction
        const frontWidth = taperOutward ? wideWidth : narrowWidth;
        const backWidth = taperOutward ? narrowWidth : wideWidth;
        const commandDeckDepth = d;

        // Create vertices for the trapezoid shape
        const vertices = new Float32Array([
            // Back face (narrower) - at z=0
            -backWidth/2, -deckHeight/2, 0,  // bottom left back
            backWidth/2, -deckHeight/2, 0,   // bottom right back
            backWidth/2, deckHeight/2, 0,    // top right back
            -backWidth/2, deckHeight/2, 0,   // top left back
            
            // Front face (wider) - at z=commandDeckDepth
            -frontWidth/2, -deckHeight/2, commandDeckDepth,  // bottom left front
            frontWidth/2, -deckHeight/2, commandDeckDepth,   // bottom right front
            frontWidth/2, deckHeight/2, commandDeckDepth,    // top right front
            -frontWidth/2, deckHeight/2, commandDeckDepth    // top left front
        ]);
        
        // Define the faces using indices (corrected winding order for outward normals)
        const indices = new Uint16Array([
            // Back face
            0, 2, 1,
            0, 3, 2,
            // Front face
            4, 5, 6,
            4, 6, 7,
            // Bottom face
            0, 5, 4,
            0, 1, 5,
            // Top face
            3, 7, 6,
            3, 6, 2,
            // Left face
            0, 4, 7,
            0, 7, 3,
            // Right face
            1, 2, 6,
            1, 6, 5
        ]);
        
        const commandDeckGeom = new THREE.BufferGeometry();
        commandDeckGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        commandDeckGeom.setIndex(new THREE.BufferAttribute(indices, 1));
        commandDeckGeom.computeVertexNormals();
        
        // Standard command deck material
        const commandDeckMat = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true, 
            shininess: 30 
        });
        
        const trapezoidMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);

        // Assemble trapezoid command deck
        const mesh = new THREE.Group();
        mesh.add(trapezoidMesh);
        
        // Add window details to front face
        this.addWindows(mesh, frontWidth, deckHeight, commandDeckDepth, rng, THREE);

        return {
            mesh,
            length: commandDeckDepth,
            width: frontWidth, // Use front width as the main width
            height: deckHeight
        };
    }
    
    /**
     * Adds window details to the front face of the trapezoid
     */
    private addWindows(
        parentMesh: any,
        frontWidth: number,
        height: number,
        depth: number,
        rng: any,
        THREE: any
    ): void {
        // Fixed window height for consistent scale across all ships
        const windowHeight = 0.12;
        const windowDepth = 0.001; // Very thin for flat appearance
        
        // Create window material (dark to simulate viewport)
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        
        // Container for all window meshes
        const windowGroup = new THREE.Group();
        
        // Calculate available space
        const margin = 0; // No margins for now
        const availableWidth = frontWidth - (margin * 2);
        const availableHeight = height - (margin * 2);
        
        // Validate minimum space requirements
        if (availableHeight < windowHeight) {
            return; // Trapezoid too short for windows
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
            return; // Not enough space for minimum windows
        }
        
        // Determine final window count
        const windowCount = Math.floor(rng.random() * (maxWindows - minWindows + 1)) + minWindows;
        
        // Random vertical positioning (±30% from center)
        const verticalOffset = height * (-0.3 + rng.random() * 0.6);
        
        // Create and position individual windows
        for (let i = 0; i < windowCount; i++) {
            // Center windows horizontally
            const xOffset = (i - (windowCount - 1) / 2) * windowSpacing;
            
            // Create window geometry
            const windowGeom = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
            const window = new THREE.Mesh(windowGeom, windowMaterial);
            
            // Position window on front face
            window.position.set(xOffset, verticalOffset, depth + 0.001);
            windowGroup.add(window);
        }
        
        // Add all windows to parent mesh
        parentMesh.add(windowGroup);
    }
}