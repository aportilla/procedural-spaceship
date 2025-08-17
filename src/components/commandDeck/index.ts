/**
 * index.ts
 * 
 * Barrel export for command deck module
 */

export { CommandDeckFactory } from './CommandDeckFactory';
export { CommandDeckShape } from './types';
export type { 
    ICommandDeckGenerator, 
    CommandDeckGeneratorParams, 
    CommandDeckResult,
    ShapeWeight 
} from './types';

// Export individual generators for direct usage if needed
export { BoxCommandDeckGenerator } from './generators/BoxGenerator';
export { CylinderCommandDeckGenerator } from './generators/CylinderGenerator';
export { HammerheadCommandDeckGenerator } from './generators/HammerheadGenerator';
export { SphereCommandDeckGenerator } from './generators/SphereGenerator';