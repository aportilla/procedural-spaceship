/**
 * commandDeck.ts
 *
 * Main entry point for command deck generation.
 * Uses factory pattern to delegate to specific shape generators.
 *
 * @module commandDeck
 */

import { MakeCommandDeckParams, ComponentResult } from '../types';
import { CommandDeckFactory } from './commandDeck/CommandDeckFactory';
import type { CommandDeckGeneratorParams } from './commandDeck/types';

// Singleton factory instance
let factory: CommandDeckFactory | null = null;

/**
 * Get or create the command deck factory instance
 */
function getFactory(): CommandDeckFactory {
    if (!factory) {
        factory = new CommandDeckFactory();
    }
    return factory;
}

/**
 * Generates a command deck component for the spaceship.
 *
 * The command deck serves as the ship's bridge/cockpit and is positioned
 * at the front of the vessel. Shape selection is randomized with weighted probabilities.
 *
 * @param params - Configuration object containing:
 *   - commandDeckMass: Target mass determining overall size
 *   - THREE: Three.js library reference
 *   - rng: Seeded random number generator
 * @returns ComponentResult with mesh, length, width, and height
 */
export function makeCommandDeck({ commandDeckMass, THREE, rng }: MakeCommandDeckParams): ComponentResult {
    const factory = getFactory();

    // Select a random generator based on weighted probabilities
    const generator = factory.getRandomGenerator(rng);

    // Prepare parameters for the generator
    const generatorParams: CommandDeckGeneratorParams = {
        mass: commandDeckMass,
        THREE,
        rng
    };

    // Generate and return the command deck
    const result = generator.generate(generatorParams);

    // Log which generator was used (for debugging)
    // console.log(`Generated command deck using: ${generator.getName()}`);

    return result;
}
