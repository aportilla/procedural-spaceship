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
        
        // 50% chance to rotate trapezoid sideways (taper on top/bottom vs left/right)
        const rotateSideways = rng.random() < 0.5;
        
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
        
        // Assign dimensions based on rotation and taper direction
        let frontWidth: number, backWidth: number, frontHeight: number, backHeight: number;
        
        if (rotateSideways) {
            // Trapezoid rotated 90 degrees - taper on top/bottom
            frontWidth = wideWidthAspect * d;
            backWidth = frontWidth; // Width stays constant
            
            // Heights vary for sideways rotation
            const wideHeight = heightAspect * d;
            const narrowHeight = wideHeight * widthRatio;
            
            frontHeight = taperOutward ? wideHeight : narrowHeight;
            backHeight = taperOutward ? narrowHeight : wideHeight;
        } else {
            // Normal orientation - taper on left/right
            frontWidth = taperOutward ? wideWidth : narrowWidth;
            backWidth = taperOutward ? narrowWidth : wideWidth;
            frontHeight = deckHeight;
            backHeight = deckHeight;
        }
        
        const commandDeckDepth = d;

        // Create vertices for the trapezoid shape
        const vertices = new Float32Array([
            // Back face - at z=0
            -backWidth/2, -backHeight/2, 0,  // bottom left back
            backWidth/2, -backHeight/2, 0,   // bottom right back
            backWidth/2, backHeight/2, 0,    // top right back
            -backWidth/2, backHeight/2, 0,   // top left back
            
            // Front face - at z=commandDeckDepth
            -frontWidth/2, -frontHeight/2, commandDeckDepth,  // bottom left front
            frontWidth/2, -frontHeight/2, commandDeckDepth,   // bottom right front
            frontWidth/2, frontHeight/2, commandDeckDepth,    // top right front
            -frontWidth/2, frontHeight/2, commandDeckDepth    // top left front
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
        
        // Add window details to side face
        // Pass all dimensions and rotation state for proper window placement
        this.addWindows(mesh, {
            frontWidth,
            backWidth,
            frontHeight,
            backHeight,
            depth: commandDeckDepth,
            rotateSideways,
            rng,
            THREE
        });

        return {
            mesh,
            length: commandDeckDepth,
            width: Math.max(frontWidth, backWidth), // Use the wider dimension
            height: Math.max(frontHeight, backHeight) // Use the taller dimension
        };
    }
    
    /**
     * Adds window details to a side face of the trapezoid
     */
    private addWindows(
        parentMesh: any,
        params: {
            frontWidth: number,
            backWidth: number,
            frontHeight: number,
            backHeight: number,
            depth: number,
            rotateSideways: boolean,
            rng: any,
            THREE: any
        }
    ): void {
        const { frontWidth, backWidth, frontHeight, backHeight, depth, rotateSideways, rng, THREE } = params;
        
        // Fixed window height for consistent scale across all ships
        const windowHeight = 0.12;
        const windowThickness = 0.001; // Very thin for flat appearance
        
        // Create window material (dark to simulate viewport)
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        
        // Container for all window meshes
        const windowGroup = new THREE.Group();
        
        // Always place windows on the top face
        const useLeftSide = false;
        const useRightSide = false;
        const useTopSide = true;
        const useBottomSide = false;
        
        // Determine if the chosen face is tapered
        let isTaperedFace: boolean;
        let faceWidth: number;
        let faceHeight: number;
        
        if (rotateSideways) {
            // When rotated sideways: top/bottom are tapered, left/right are flat
            if (useTopSide || useBottomSide) {
                isTaperedFace = true;
                faceWidth = Math.max(frontWidth, backWidth); // Width varies along depth
                faceHeight = Math.max(frontHeight, backHeight); // For reference
            } else {
                isTaperedFace = false;
                faceWidth = frontWidth; // Constant width
                faceHeight = Math.max(frontHeight, backHeight); // Height may vary along depth
            }
        } else {
            // Normal orientation: left/right are tapered, top/bottom are flat
            if (useLeftSide || useRightSide) {
                isTaperedFace = true;
                faceWidth = Math.max(frontWidth, backWidth); // Width varies along depth
                faceHeight = frontHeight; // Constant height
            } else {
                isTaperedFace = false;
                faceWidth = Math.max(frontWidth, backWidth); // Width may vary along depth
                faceHeight = frontHeight; // Constant height
            }
        }
        
        // Calculate available space for windows based on chosen face
        let availableSpaceForWindows: number;
        if (useLeftSide || useRightSide) {
            availableSpaceForWindows = faceHeight * 0.6; // Vertical space on side faces
        } else {
            availableSpaceForWindows = faceWidth * 0.6; // Horizontal space on top/bottom faces
        }
        
        // Validate minimum space requirements
        if (availableSpaceForWindows < windowHeight) {
            return; // Not enough space for windows
        }
        
        // Generate window dimensions
        const aspectRatio = 0.5 + rng.random() * 1.5; // Aspect ratio: 0.5 to 2.0
        const windowFrameSpacing = 0.02 + rng.random() * 0.05; // Frame spacing between windows
        const windowWidth = Math.min(
            windowHeight * aspectRatio,
            0.2 // Limit individual window size
        );
        
        // Position windows at a single depth location (choose a random position front-to-back)
        const depthPosition = 0.3 + rng.random() * 0.4; // Position between 30% and 70% of depth
        const zPos = depth * depthPosition;
        
        // Calculate window spacing and arrangement
        let windowSpacing: number;
        let maxWindows: number;
        
        if (useLeftSide || useRightSide) {
            // Vertical arrangement on side faces
            windowSpacing = windowHeight + windowFrameSpacing;
            maxWindows = Math.floor(availableSpaceForWindows / windowSpacing);
        } else {
            // Horizontal arrangement on top/bottom faces
            windowSpacing = windowWidth + windowFrameSpacing;
            maxWindows = Math.floor(availableSpaceForWindows / windowSpacing);
        }
        
        const minWindows = Math.max(3, Math.ceil(maxWindows / 4));
        const windowCount = Math.min(10, Math.floor(rng.random() * (maxWindows - minWindows + 1)) + minWindows);
        
        if (maxWindows < minWindows) {
            return; // Not enough space for windows
        }
        
        // Create windows
        for (let i = 0; i < windowCount; i++) {
            // Calculate offset based on face orientation
            const windowOffset = (i - (windowCount - 1) / 2) * windowSpacing;
            
            let xPos: number;
            let yPos: number;
            let windowGeom: any;
            
            // Calculate dimensions at the fixed depth position
            const t = depthPosition;
            const widthAtZ = backWidth + (frontWidth - backWidth) * t;
            const heightAtZ = backHeight + (frontHeight - backHeight) * t;
            
            if (useLeftSide || useRightSide) {
                // Side faces - windows arranged vertically
                yPos = windowOffset; // Vertical position varies
                
                if (isTaperedFace) {
                    // Tapered side (normal orientation)
                    xPos = useLeftSide ? -widthAtZ / 2 : widthAtZ / 2;
                    windowGeom = new THREE.BoxGeometry(windowThickness, windowHeight, windowWidth);
                    
                    const window = new THREE.Mesh(windowGeom, windowMaterial);
                    window.position.set(xPos, yPos, zPos);
                    
                    // Rotate to match surface angle
                    // The angle depends on which side is wider (taper direction)
                    const widthDiff = frontWidth - backWidth;
                    const angle = Math.atan2(widthDiff, 2 * depth);
                    // Left side: positive angle if front is wider, negative if back is wider
                    // Right side: opposite of left
                    window.rotation.y = useLeftSide ? -angle : angle;
                    
                    windowGroup.add(window);
                } else {
                    // Flat side (rotated sideways)
                    xPos = useLeftSide ? -frontWidth / 2 : frontWidth / 2;
                    
                    // Constrain Y if height varies
                    if (rotateSideways && frontHeight !== backHeight) {
                        yPos = Math.max(-heightAtZ/2 + windowHeight/2, 
                                       Math.min(heightAtZ/2 - windowHeight/2, windowOffset));
                    }
                    
                    windowGeom = new THREE.BoxGeometry(windowThickness, windowHeight, windowWidth);
                    const window = new THREE.Mesh(windowGeom, windowMaterial);
                    window.position.set(xPos, yPos, zPos);
                    
                    windowGroup.add(window);
                }
            } else {
                // Top/bottom faces - windows arranged horizontally
                xPos = windowOffset; // Horizontal position varies
                
                if (isTaperedFace) {
                    // Tapered top/bottom (rotated sideways)
                    yPos = useTopSide ? heightAtZ / 2 : -heightAtZ / 2;
                    windowGeom = new THREE.BoxGeometry(windowWidth, windowThickness, windowHeight);
                    
                    const window = new THREE.Mesh(windowGeom, windowMaterial);
                    window.position.set(xPos, yPos, zPos);
                    
                    // Rotate to match surface angle
                    // The angle depends on which side is taller (taper direction)
                    const heightDiff = frontHeight - backHeight;
                    const angle = Math.atan2(heightDiff, 2 * depth);
                    // Top side: positive angle if front is taller, negative if back is taller
                    // Bottom side: opposite of top
                    window.rotation.x = useTopSide ? -angle : angle;
                    
                    windowGroup.add(window);
                } else {
                    // Flat top/bottom (normal orientation)
                    yPos = useTopSide ? frontHeight / 2 : -frontHeight / 2;
                    
                    // Constrain X if width varies
                    if (!rotateSideways && frontWidth !== backWidth) {
                        xPos = Math.max(-widthAtZ/2 + windowWidth/2, 
                                       Math.min(widthAtZ/2 - windowWidth/2, windowOffset));
                    }
                    
                    windowGeom = new THREE.BoxGeometry(windowWidth, windowThickness, windowHeight);
                    const window = new THREE.Mesh(windowGeom, windowMaterial);
                    window.position.set(xPos, yPos, zPos);
                    
                    windowGroup.add(window);
                }
            }
        }
        
        // Add all windows to parent mesh
        parentMesh.add(windowGroup);
    }
}