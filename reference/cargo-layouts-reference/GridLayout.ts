/**
 * GridLayout.ts
 * 
 * Layout strategy for arranging cargo pods in a rectangular grid pattern
 */

import { ICargoLayout, CargoLayoutParams, CargoLayoutResult } from '../types';

export class GridLayout implements ICargoLayout {
    getName(): string {
        return 'Grid';
    }

    arrange(params: CargoLayoutParams): CargoLayoutResult {
        const { podMesh, podsPerSegment, podDimensions, THREE } = params;
        
        const group = new THREE.Group();
        
        // Find the most compact (closest to square) grid configuration
        let bestRows = 1, bestCols = podsPerSegment, minDiff = podsPerSegment - 1;
        
        for (let rows = 1; rows <= Math.sqrt(podsPerSegment); rows++) {
            if (podsPerSegment % rows === 0) {
                const cols = podsPerSegment / rows;
                const diff = Math.abs(rows - cols);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestRows = rows;
                    bestCols = cols;
                }
            }
        }
        
        const rows = bestRows;
        const cols = bestCols;
        
        // Calculate spacing between pods
        const gap = 0.1 * Math.max(podDimensions.width, podDimensions.height);
        const totalWidth = cols * podDimensions.width + (cols - 1) * gap;
        const totalHeight = rows * podDimensions.height + (rows - 1) * gap;
        
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        
        // Place pods in grid
        for (let i = 0; i < podsPerSegment; i++) {
            const pod = podMesh.clone();
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = -totalWidth / 2 + podDimensions.width / 2 + col * (podDimensions.width + gap);
            const y = -totalHeight / 2 + podDimensions.height / 2 + row * (podDimensions.height + gap);
            
            pod.position.set(x, y, 0);
            group.add(pod);
            
            // Update bounding box
            maxX = Math.max(maxX, x + podDimensions.width / 2);
            minX = Math.min(minX, x - podDimensions.width / 2);
            maxY = Math.max(maxY, y + podDimensions.height / 2);
            minY = Math.min(minY, y - podDimensions.height / 2);
            maxZ = Math.max(maxZ, podDimensions.depth);
        }
        
        return {
            mesh: group,
            width: maxX - minX,
            height: maxY - minY,
            depth: maxZ,
            layout: 'grid'
        };
    }
}