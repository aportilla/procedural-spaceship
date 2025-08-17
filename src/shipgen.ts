/**
 * shipgen.ts
 * 
 * Main ship generation module for procedural spaceship creation.
 * Handles the assembly of ship components (thrusters, engine block, cargo section, command deck)
 * using a seeded random number generator for reproducible results.
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Component generators - each creates a specific ship section
import { makeThrusters } from './components/thrusters.ts';
import { makeEngineBlock } from './components/engineBlock.ts';
import { makeCargoSection } from './components/cargoSection.ts';
import { makeCommandDeck } from './components/commandDeck.ts';

// Utilities
import { SeededRandom } from './utilities/random.ts';
import { addDebugLine } from './utilities/debug.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

// Ship mass constraints - determines overall ship size
const SHIP_MAX_MASS = 1000;  // Maximum total ship mass units
const SHIP_MIN_MASS = 10;    // Minimum total ship mass units



// ============================================================================
// MAIN SHIP GENERATION
// ============================================================================

/**
 * Generates a complete procedural spaceship from a given seed.
 * 
 * @param seed - Seed string for reproducible generation
 * @param scene - Three.js scene to add the ship to
 * @param THREE - Three.js library reference
 * @param currentShipRef - Reference to track current ship for cleanup
 * 
 * Ship assembly process:
 * 1. Clean up any existing ship
 * 2. Calculate mass distribution based on ship size
 * 3. Generate components from back to front:
 *    - Thrusters (propulsion)
 *    - Engine block (power generation)
 *    - Cargo section (storage/hull)
 *    - Command deck (control center)
 * 4. Position ship centered at origin
 */
export function generateShip(seed: string, scene: any, THREE: any, currentShipRef: { current: any }): void {
    // ========================================================================
    // CLEANUP
    // ========================================================================
    // Remove and dispose of the previous ship to prevent memory leaks
    if (currentShipRef.current) {
        scene.remove(currentShipRef.current);
        // Properly dispose of Three.js resources
        currentShipRef.current.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    // Track Z position for component placement (ship builds along Z-axis)
    let attachmentZ = 0;
    
    // Initialize seeded random number generator for reproducible generation
    const rng = new SeededRandom(seed);
    
    // Container for all ship components
    const ship = new THREE.Group();

    // ========================================================================
    // MASS CALCULATION
    // ========================================================================
    
    // Generate ship size with bias towards smaller vessels
    // Using power of 4 creates exponential distribution favoring small ships
    // Result: 0 = smallest possible ship, 1 = largest possible ship
    const shipMassScalar = Math.pow(rng.random(), 4);
    
    // Calculate actual ship mass from scalar
    const targetTotalShipMass = SHIP_MIN_MASS + shipMassScalar * (SHIP_MAX_MASS - SHIP_MIN_MASS);


    // ========================================================================
    // MASS DISTRIBUTION
    // ========================================================================
    
    // Smaller ships have proportionally larger command decks and engines
    // This creates more realistic proportions across ship sizes
    
    // Command deck: 5-30% of mass (larger % for smaller ships)
    const maxCommandDeckMassRatio = 30 * (1 - (shipMassScalar/1.2));
    const commandDeckMassRatio = rng.range(5, maxCommandDeckMassRatio) / 100;
    
    // Engine block: 5-30% of mass (larger % for smaller ships)
    const maxEngineBlockMassRatio = 30 * (1 - (shipMassScalar/1.2));
    const engineMassRatio = rng.range(5, maxEngineBlockMassRatio) / 100;
    
    // Cargo takes remaining mass after command deck and engines
    const cargoMassRatio = 1 - (commandDeckMassRatio + engineMassRatio);
    const targetCargoMass = targetTotalShipMass * cargoMassRatio;

    // ========================================================================
    // PRE-GENERATION SETUP
    // ========================================================================
    
    // Generate cargo section first to get actual mass
    // (may differ slightly from target due to component constraints)
    const cargoSection = makeCargoSection({
        shipMassScalar,
        targetCargoMass,
        THREE,
        rng
    });
    const cargoMass = cargoSection.mass;
    
    // Calculate final component masses
    const commandDeckMass = targetTotalShipMass * commandDeckMassRatio;
    const engineBlockMass = targetTotalShipMass * engineMassRatio;
    const totalShipMass = cargoMass + commandDeckMass + engineBlockMass;

    // ========================================================================
    // COMPONENT ASSEMBLY
    // ========================================================================
    
    // ------------------------------------------------------------------------
    // 1. THRUSTERS (Rear of ship, Z=0)
    // ------------------------------------------------------------------------
    // Generate propulsion system based on total ship mass
    const thrusterSection = makeThrusters({
        totalShipMass,
        rng,
        THREE
    });
    
    // Position at origin (rear of ship)
    thrusterSection.mesh.position.z = 0;
    ship.add(thrusterSection.mesh);
    
    // Track attachment point and thruster configuration for engine block
    attachmentZ = thrusterSection.length;
    const thrusterAttachmentPoint = attachmentZ;
    const isRadial = thrusterSection.isRadial || false;
    const thrusterPositions = thrusterSection.thrusterPositions || [];
    const thrusterSize = thrusterSection.thrusterSize || 1;

    // ------------------------------------------------------------------------
    // 2. ENGINE BLOCK (Connects thrusters to cargo)
    // ------------------------------------------------------------------------
    // Generate power generation/distribution system
    // Adapts to thruster configuration for visual coherence
    const engineBlockSection = makeEngineBlock({
        isRadial,           // Match thruster layout style
        thrusterPositions,  // Align with thruster placement
        thrusterSize,       // Scale appropriately
        engineBlockMass,
        THREE,
        rng
    });
    
    // Attach directly after thrusters
    engineBlockSection.mesh.position.z = attachmentZ;
    attachmentZ += engineBlockSection.length;
    const cargoAttachmentPoint = attachmentZ;
    ship.add(engineBlockSection.mesh);

    // ------------------------------------------------------------------------
    // 3. CARGO SECTION (Main hull/storage)
    // ------------------------------------------------------------------------
    // Already generated above for mass calculation
    // Now position in the ship assembly
    cargoSection.mesh.position.z = attachmentZ;
    attachmentZ += cargoSection.length;
    const commandDeckAttachmentPoint = attachmentZ;
    ship.add(cargoSection.mesh);

    // ------------------------------------------------------------------------
    // 4. COMMAND DECK (Front of ship, control center)
    // ------------------------------------------------------------------------
    // Generate bridge/cockpit section
    const commandDeckSection = makeCommandDeck({
        commandDeckMass,
        THREE,
        rng
    });
    
    // Attach at front of ship
    commandDeckSection.mesh.position.z = attachmentZ;
    attachmentZ += commandDeckSection.length;
    ship.add(commandDeckSection.mesh);
    
    // Mark final ship length
    const endAttachmentPoint = attachmentZ;

    // ========================================================================
    // DEBUG VISUALIZATION
    // ========================================================================
    // Visual markers showing component boundaries for development
    addDebugLine(ship, thrusterAttachmentPoint, 0xff0000, THREE);      // Red: thruster/engine boundary
    addDebugLine(ship, cargoAttachmentPoint, 0x00ff00, THREE);         // Green: engine/cargo boundary
    addDebugLine(ship, commandDeckAttachmentPoint, 0x0000ff, THREE);   // Blue: cargo/command boundary
    addDebugLine(ship, endAttachmentPoint, 0xffff00, THREE);           // Yellow: ship front

    // ========================================================================
    // FINAL POSITIONING
    // ========================================================================
    
    // Center ship along Z-axis (midpoint at origin for balanced rotation)
    ship.position.z = -endAttachmentPoint / 2;
    
    // Wrap in root group for clean transformations
    const shipRoot = new THREE.Group();
    shipRoot.add(ship);
    
    // Store reference and add to scene
    currentShipRef.current = shipRoot;
    scene.add(shipRoot);
}
