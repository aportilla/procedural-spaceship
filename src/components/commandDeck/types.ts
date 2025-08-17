/**
 * types.ts
 * 
 * Type definitions for command deck generation system
 */

import { SeededRandom } from '../../utilities/random';

/**
 * Parameters required for generating any command deck shape
 */
export interface CommandDeckGeneratorParams {
    mass: number;
    THREE: any;
    rng: SeededRandom;
}

/**
 * Result returned by all command deck generators
 */
export interface CommandDeckResult {
    mesh: any;
    length: number;
    width: number;
    height: number;
}

/**
 * Interface that all command deck shape generators must implement
 */
export interface ICommandDeckGenerator {
    /**
     * Generate a command deck mesh with the specified parameters
     */
    generate(params: CommandDeckGeneratorParams): CommandDeckResult;
    
    /**
     * Get the name of this generator for debugging/logging
     */
    getName(): string;
}

/**
 * Shape type enumeration for type safety
 */
export enum CommandDeckShape {
    Box = 'box',
    Cylinder = 'cylinder',
    HammerheadCylinder = 'hammerheadCylinder',
    Sphere = 'sphere'
}

/**
 * Configuration for shape selection weights
 */
export interface ShapeWeight {
    shape: CommandDeckShape;
    weight: number;
}