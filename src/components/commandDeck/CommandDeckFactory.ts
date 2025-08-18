/**
 * CommandDeckFactory.ts
 *
 * Factory for creating command deck generators with weighted random selection
 */

import { ICommandDeckGenerator, CommandDeckShape, ShapeWeight } from './types';
import { BoxCommandDeckGenerator } from './generators/BoxGenerator';
import { CylinderCommandDeckGenerator } from './generators/CylinderGenerator';
import { TrapezoidCommandDeckGenerator } from './generators/TrapezoidGenerator';
import { SeededRandom } from '../../utilities/random';

export class CommandDeckFactory {
    private generators: Map<CommandDeckShape, ICommandDeckGenerator>;
    private shapeWeights: ShapeWeight[];

    // DEBUG: Force a specific command deck shape for testing
    // Set to null to use normal weighted random selection
    // Example: CommandDeckShape.Trapezoid
    private static DEBUG_FORCE_SHAPE: CommandDeckShape | null = CommandDeckShape.Cylinder;

    constructor() {
        // Initialize generator registry
        this.generators = new Map<CommandDeckShape, ICommandDeckGenerator>([
            [CommandDeckShape.Box, new BoxCommandDeckGenerator()],
            [CommandDeckShape.Cylinder, new CylinderCommandDeckGenerator()],
            [CommandDeckShape.Trapezoid, new TrapezoidCommandDeckGenerator()]
        ]);

        // Configure shape selection weights
        // Higher weight = more likely to be selected
        this.shapeWeights = [
            { shape: CommandDeckShape.Box, weight: 2 },
            { shape: CommandDeckShape.Cylinder, weight: 2 },
            { shape: CommandDeckShape.Trapezoid, weight: 2 }
        ];
    }

    /**
     * Get a generator for a specific shape type
     */
    getGenerator(shape: CommandDeckShape): ICommandDeckGenerator {
        const generator = this.generators.get(shape);
        if (!generator) {
            throw new Error(`No generator found for shape: ${shape}`);
        }
        return generator;
    }

    /**
     * Get a random generator based on weighted selection
     */
    getRandomGenerator(rng: SeededRandom): ICommandDeckGenerator {
        // Check for debug override
        if (CommandDeckFactory.DEBUG_FORCE_SHAPE !== null) {
            console.log(`DEBUG: Forcing command deck shape: ${CommandDeckFactory.DEBUG_FORCE_SHAPE}`);
            return this.getGenerator(CommandDeckFactory.DEBUG_FORCE_SHAPE);
        }

        const shape = this.selectWeightedShape(rng);
        return this.getGenerator(shape);
    }

    /**
     * Select a shape based on configured weights using cumulative distribution
     */
    private selectWeightedShape(rng: SeededRandom): CommandDeckShape {
        // Filter out zero-weight items and calculate total
        const activeWeights = this.shapeWeights.filter(sw => sw.weight > 0);

        if (activeWeights.length === 0) {
            throw new Error('No shapes with positive weights configured');
        }

        // Build cumulative weight array
        const cumulative: number[] = [];
        let total = 0;

        for (const shapeWeight of activeWeights) {
            total += shapeWeight.weight;
            cumulative.push(total);
        }

        // Generate random value and find corresponding shape
        const randomValue = rng.random() * total;

        // Binary search would be more efficient for large arrays, but we have few items
        const index = cumulative.findIndex(sum => randomValue < sum);

        // findIndex returns -1 only if randomValue >= all cumulative values
        // This should only happen due to floating point precision with the last element
        return activeWeights[index === -1 ? activeWeights.length - 1 : index].shape;
    }

    /**
     * Get all available shape types
     */
    getAvailableShapes(): CommandDeckShape[] {
        return Array.from(this.generators.keys());
    }

    /**
     * Update the weight for a specific shape
     */
    setShapeWeight(shape: CommandDeckShape, weight: number): void {
        const shapeWeight = this.shapeWeights.find(sw => sw.shape === shape);
        if (shapeWeight) {
            shapeWeight.weight = Math.max(0, weight); // Ensure non-negative
        }
    }

    /**
     * Get current weight configuration
     */
    getWeights(): ShapeWeight[] {
        return [...this.shapeWeights];
    }

    /**
     * DEBUG: Set a specific shape to force for all command deck generation
     * @param shape - The shape to force, or null to disable override
     */
    static setDebugForceShape(shape: CommandDeckShape | null): void {
        CommandDeckFactory.DEBUG_FORCE_SHAPE = shape;
        if (shape !== null) {
            console.log(`DEBUG: Command deck shape forced to: ${shape}`);
        } else {
            console.log('DEBUG: Command deck shape override disabled');
        }
    }

    /**
     * DEBUG: Get the currently forced shape (if any)
     */
    static getDebugForceShape(): CommandDeckShape | null {
        return CommandDeckFactory.DEBUG_FORCE_SHAPE;
    }
}