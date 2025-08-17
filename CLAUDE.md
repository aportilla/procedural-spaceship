# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Procedural Spaceship Generator - A web-based 3D application that generates procedural spaceships using Three.js with seeded random generation for reproducible designs.

## Essential Commands

```bash
# Development
npm run dev          # Start dev server on port 3000
npm run build        # Type check and build for production
npm run typecheck    # Run TypeScript type checking only

# Testing (infrastructure configured, no tests exist yet)
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
```

## Architecture

### Core Flow
1. **main.ts** - Three.js setup, UI controls, camera management
2. **shipgen.ts** - Orchestrates ship assembly from components
3. **components/** - Individual ship part generators (pure functions)
4. **utilities/random.ts** - SeededRandom class for reproducible generation

### Key Design Patterns

**Component Assembly**: Ships are built back-to-front:
```
thrusters → engineBlock → cargoSection → commandDeck
```

**Seeded Generation**: All randomness uses SeededRandom for reproducibility:
```typescript
const random = new SeededRandom(seed);
// All component generators receive this random instance
```

**Mass-Based Scaling**: Ship dimensions calculated from mass distribution across components.

### Type System

All ship components and parameters are strongly typed through `types.ts`. Key interfaces:
- `ShipModel` - Complete ship with components and metadata
- `ShipParameters` - Generation parameters
- Component-specific interfaces (ThrusterLayout, EngineBlock, etc.)

## Development Guidelines

### Adding New Ship Components
1. Create component generator in `src/components/`
2. Add corresponding type in `src/types.ts`
3. Integrate in `shipgen.ts` assembly logic
4. Components should be pure functions taking parameters and returning Three.js meshes

### Three.js Patterns
- All geometries and materials should be properly disposed
- Use BufferGeometry for performance
- Group related meshes using THREE.Group
- Position components relative to ship's coordinate system

### Build Configuration
- Three.js is separated into its own chunk for caching
- Chunk size warning increased to 1000kb to accommodate Three.js
- TypeScript strict mode is enabled - all code must pass type checking