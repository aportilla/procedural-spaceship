/**
 * SingleLayout.ts
 * 
 * Layout strategy for a single cargo pod centered on the axis
 */

import { ICargoLayout, CargoLayoutParams, CargoLayoutResult } from '../types';

export class SingleLayout implements ICargoLayout {
    getName(): string {
        return 'Single';
    }

    arrange(params: CargoLayoutParams): CargoLayoutResult {
        const { podMesh, podDimensions } = params;
        
        // Single pod centered at origin
        podMesh.position.set(0, 0, 0);
        
        return {
            mesh: podMesh,
            width: podDimensions.width,
            height: podDimensions.height,
            depth: podDimensions.depth,
            layout: 'single'
        };
    }
}