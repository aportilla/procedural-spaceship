/**
 * commandDeck.ts
 * 
 * Generates the command deck (bridge/cockpit) section of procedural spaceships.
 * The command deck is the front-most component containing the control center.
 * 
 * Supports multiple geometry types:
 * - Box: Rectangular command module with optional windows
 * - Cylinder: Tapered or straight cylindrical bridge
 * - Hammerhead: Horizontal cylinder perpendicular to ship axis
 * - Sphere: Spherical command module
 * 
 * @module commandDeck
 */

import { MakeCommandDeckParams, ComponentResult } from '../types';

/**
 * Calculates dimensions for a tapered cylinder (frustum) with specified volume.
 * 
 * Uses the frustum volume formula to derive dimensions that maintain
 * the desired volume while respecting aspect and taper ratios.
 * 
 * @param volume - Target volume in cubic units
 * @param aspectRatio - Ratio of depth to radius (depth = radius * aspectRatio)
 * @param taperRatio - Ratio of small to large radius (0-1, default 0.5)
 * @returns Object containing smallRadius, bigRadius, and depth
 * 
 * Volume formula derivation:
 * V = (π × h / 3) × (R² + r² + R×r) where R=bigRadius, r=smallRadius, h=depth
 * With constraints: r = k×R (taper), h = AR×R (aspect)
 * Simplified: V = (π × AR × R³ / 3) × (1 + k + k²)
 */
function makeTaperedCylinderGeometry(volume: number, aspectRatio: number, taperRatio: number = 0.5): { smallRadius: number; bigRadius: number; depth: number } {
  const k = taperRatio;
  const shapeFactor = 1 + k + k*k;

  const bigRadius = Math.pow(
    (3 * volume) / (Math.PI * aspectRatio * shapeFactor),
    1/3
  );

  const smallRadius = bigRadius * taperRatio;
  const depth = bigRadius * aspectRatio;

  return { smallRadius, bigRadius, depth };
}


/**
 * Adds window details to box-shaped command decks.
 * 
 * Creates a row of dark rectangular windows on the front face of the command deck.
 * Windows are procedurally placed based on available space and random parameters.
 * 
 * @param parentMesh - Parent mesh to attach windows to
 * @param boxWidth - Width of the command deck box
 * @param boxHeight - Height of the command deck box  
 * @param boxDepth - Depth of the command deck box
 * @param rng - Seeded random number generator
 * @param THREE - Three.js library reference
 * 
 * TODO: Refactoring opportunity - Extract window generation to separate module
 * for reuse across different component types
 */
function addWindows(parentMesh: any, boxWidth: number, boxHeight: number, boxDepth: number, rng: any, THREE: any): void {
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


/**
 * Available command deck geometry types.
 * Weighted array - duplicates increase probability of selection.
 * 
 * TODO: Refactoring opportunity - Replace array with proper weighted selection system
 * Could use object with shape types and weights for clearer configuration:
 * { box: 0.33, cylinder: 0.33, hammerheadCylinder: 0.17, sphere: 0.17 }
 */
const commandDeckShapes = ['box','box','cylinder', 'cylinder', 'hammerheadCylinder', 'sphere'];

/**
 * Generates a command deck component for the spaceship.
 * 
 * The command deck serves as the ship's bridge/cockpit and is positioned
 * at the front of the vessel. Shape selection is randomized from available types.
 * 
 * @param params - Configuration object containing:
 *   - commandDeckMass: Target mass determining overall size
 *   - THREE: Three.js library reference
 *   - rng: Seeded random number generator
 * @returns ComponentResult with mesh, length, width, and height
 * 
 * TODO: Major refactoring opportunities:
 * 1. Replace if-else chain with strategy pattern or factory pattern
 * 2. Extract each shape generator into separate functions/classes
 * 3. Create shape configuration system with parameters per shape type
 * 4. Add more shape variations (pyramids, domes, hybrid shapes)
 * 5. Implement detail generators (antennas, sensors, viewports)
 */
export function makeCommandDeck({ commandDeckMass, THREE, rng }: MakeCommandDeckParams): ComponentResult {
    // Random shape selection from weighted array
    const commandDeckShape = commandDeckShapes[Math.floor(rng.random() * commandDeckShapes.length)];

    // Initialize shape properties
    let commandDeckGeom, commandDeckMat, commandDeckDepth: number = 0;
    let mesh: any = null, commandDeckWidth = 0, commandDeckHeight = 0;
    
    // TODO: Replace this if-else chain with a shape factory pattern
    // Example: const shapeGenerator = ShapeFactory.getGenerator(commandDeckShape);
    //          return shapeGenerator.generate(commandDeckMass, THREE, rng);
    if (commandDeckShape === 'box') {
        // ====================================================================
        // BOX COMMAND DECK
        // Rectangular command module with variable aspect ratios
        // ====================================================================
        
        // Generate random aspect ratios for width and height
        const aspectA = 0.1 + (3 * rng.random()); // Width multiplier: 0.1 to 3.1
        const aspectB = 0.1 + (3 * rng.random()); // Height multiplier: 0.1 to 3.1
        
        // Calculate base dimension from mass (assuming density = 1)
        // Volume = width × height × depth = aspectA×d × aspectB×d × d = aspectA×aspectB×d³
        let d = Math.cbrt(commandDeckMass / (aspectA * aspectB));
        d = Math.max(0.3, Math.min(d, 50)); // Clamp to reasonable range
        
        const deckWidth = aspectA * d;
        const deckHeight = aspectB * d;
        commandDeckDepth = d;
        // Create box geometry
        commandDeckGeom = new THREE.BoxGeometry(deckWidth, deckHeight, commandDeckDepth);
        // Shift geometry so rear face is at z=0 (attachment point)
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);
        
        // Standard command deck material
        commandDeckMat = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true, 
            shininess: 30 
        });
        
        const boxMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        commandDeckWidth = deckWidth;
        commandDeckHeight = deckHeight;

        // Assemble box command deck with details
        mesh = new THREE.Group();
        mesh.add(boxMesh);
        
        // Add window details to front face
        addWindows(mesh, deckWidth, deckHeight, commandDeckDepth, rng, THREE);
        
        // TODO: Add more detail options:
        // - Communication arrays
        // - Sensor pods
        // - Docking ports (commented code above)
        // - Bridge superstructure

    } else if (commandDeckShape === 'cylinder') {
        // ====================================================================
        // CYLINDRICAL COMMAND DECK
        // Traditional cylindrical or tapered cone bridge
        // ====================================================================
        
        // Randomly decide between tapered cone and straight cylinder
        const doTaper = rng.random() < 0.5; // 50% chance for taper
        
        // Generate shape parameters
        const aspectRatio = rng.range(1, 2); // Length to radius ratio
        const taperRatio = doTaper ? rng.range(0.1, 0.9) : 1; // Taper amount (1 = no taper)

        // Calculate cylinder dimensions from mass
        const { smallRadius, bigRadius, depth } = makeTaperedCylinderGeometry(
            commandDeckMass,
            aspectRatio,
            taperRatio
        );
        
        // Determine polygon resolution based on size
        const circumference = 2 * Math.PI * bigRadius;
        const polySegments = Math.max(4, Math.floor(circumference * 0.6));

        // Create cylinder geometry (Three.js cylinder is vertical by default)
        commandDeckDepth = depth;
        commandDeckGeom = new THREE.CylinderGeometry(
            smallRadius,  // Top radius (front of ship)
            bigRadius,    // Bottom radius (rear attachment)
            depth,        // Height (along ship axis)
            polySegments  // Number of sides
        );
        
        // Orient cylinder along Z-axis (ship direction)
        commandDeckGeom.rotateX(Math.PI / 2);
        // Shift geometry so rear face is at z=0
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);
        
        commandDeckMat = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true, 
            shininess: 30 
        });
        
        const cylMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        commandDeckWidth = bigRadius * 2;
        commandDeckHeight = commandDeckWidth; // Circular cross-section

        mesh = new THREE.Group();
        mesh.add(cylMesh);
        
        // TODO: Add cylinder-specific details:
        // - Viewport ring around circumference
        // - Sensor arrays on cone tip
        // - Radiator fins


    } else if (commandDeckShape === 'hammerheadCylinder') {
        // ====================================================================
        // HAMMERHEAD COMMAND DECK
        // Horizontal cylinder perpendicular to ship axis (T-shaped profile)
        // ====================================================================
        
        // Calculate dimensions from mass
        const aspect = 0.1 + rng.random(); // Radius to length ratio
        let d = Math.cbrt(commandDeckMass / (Math.PI * aspect * aspect));
        const deckRadius = aspect * d;
        const cylinderLength = d;
        const cylinderDiameter = deckRadius * 2;

        // Determine polygon resolution
        const circumference = 2 * Math.PI * deckRadius;
        const polySegments = Math.max(4, Math.floor(circumference * 0.7));

        // Create cylinder geometry (vertical by default in Three.js)
        commandDeckDepth = deckRadius * 2; // Depth is the diameter
        commandDeckGeom = new THREE.CylinderGeometry(
            deckRadius, 
            deckRadius, 
            cylinderLength, 
            polySegments
        );
        commandDeckGeom.translate(0, 0, commandDeckDepth / 2);

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

        commandDeckMat = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true, 
            shininess: 30 
        });
        
        // Create hammerhead mesh
        const cylinderHeadMesh = new THREE.Mesh(commandDeckGeom, commandDeckMat);
        cylinderHeadMesh.rotation.z = Math.PI / 2; // Final orientation adjustment
        cylinderHeadMesh.position.set(0, 0, 0);

        mesh = new THREE.Group();
        mesh.add(cylinderHeadMesh);
        
        // TODO: Potential additions:
        // - Neck connector to main hull (commented code above)
        // - Wing-mounted sensor pods
        // - Observation domes on cylinder ends
        // - Communication spine along top

    } else if (commandDeckShape === 'sphere') {
        // ====================================================================
        // SPHERICAL COMMAND DECK
        // Globe-shaped command center with 360° visibility
        // ====================================================================
        
        // Calculate sphere radius from volume
        // Volume = (4/3)πr³, so r = ∛(3V/4π)
        const deckRadius = Math.cbrt((3 * commandDeckMass) / (4 * Math.PI));

        // Adaptive polygon resolution based on size
        const circumference = 2 * Math.PI * deckRadius;
        const widthSegments = Math.max(4, Math.floor(circumference * 0.6));
        const heightSegments = Math.max(2, Math.round(widthSegments / 2));

        // Create sphere geometry
        commandDeckDepth = deckRadius * 2;
        const sphereGeom = new THREE.SphereGeometry(
            deckRadius, 
            widthSegments, 
            heightSegments
        );
        
        // Shift geometry so rear face is at z=0
        sphereGeom.translate(0, 0, deckRadius);
        
        mesh = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true, 
            shininess: 30 
        }));
        
        mesh.position.set(0, 0, 0);
        commandDeckWidth = commandDeckHeight = deckRadius * 2;
        
        // TODO: Sphere-specific details:
        // - Geodesic panel lines
        // - Sensor rings at equator
        // - Polar communication arrays
        // - Viewport bands
    }
    // Return standardized component result
    return {
        mesh,
        length: commandDeckDepth,
        width: commandDeckWidth,
        height: commandDeckHeight
    };
}

/**
 * REFACTORING ROADMAP:
 * 
 * 1. IMMEDIATE: Extract shape generators
 *    - Create CommandDeckFactory with shape registry
 *    - Move each shape to separate class/module
 *    - Implement ICommandDeckGenerator interface
 * 
 * 2. SHORT TERM: Improve configuration
 *    - Create shape parameter configs
 *    - Add shape weight/probability system
 *    - Implement detail level settings
 * 
 * 3. MEDIUM TERM: Add variety
 *    - Hybrid shapes (box+sphere, cylinder+wings)
 *    - Asymmetric designs
 *    - Multi-part command sections
 * 
 * 4. LONG TERM: Detail systems
 *    - Modular detail attachment system
 *    - Context-aware details (match ship style)
 *    - Procedural surface greebling
 */
