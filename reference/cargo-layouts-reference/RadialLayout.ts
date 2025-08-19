/**
 * RadialLayout.ts
 * 
 * Layout strategy for arranging cargo pods in a radial pattern around the central axis
 */

import { ICargoLayout, CargoLayoutParams, CargoLayoutResult } from '../types';

export class RadialLayout implements ICargoLayout {
    getName(): string {
        return 'Radial';
    }

    arrange(params: CargoLayoutParams): CargoLayoutResult {
        const { podMesh, podsPerSegment, podDimensions, THREE, rng, doRotation } = params;
        
        const group = new THREE.Group();
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        
        const podRadius = Math.max(podDimensions.width, podDimensions.height) / 2;
        const podDepth = podDimensions.depth;
        
        // Calculate minimum radius to avoid overlap
        const minRadius = podRadius / Math.sin(Math.PI / podsPerSegment);
        const gap = 0.05 * podRadius;
        const radius = podsPerSegment === 2 ? podRadius * 1.2 : minRadius + gap;
        
        const randomConst = rng.random();
        const needsConnectors = radius > podRadius;
        
        // Place pods in radial pattern
        for (let i = 0; i < podsPerSegment; i++) {
            const pod = podMesh.clone();
            const angle = (i / podsPerSegment) * Math.PI * 2 + Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            pod.position.set(x, y, 0);
            
            if (doRotation) {
                pod.rotation.z = angle;
            }
            
            group.add(pod);
            
            // Add connector struts if pods are separated from center
            if (needsConnectors) {
                const connectorWidth = 0.3 + (podRadius / 2) * randomConst;
                const connectorGeom = new THREE.CylinderGeometry(
                    connectorWidth, 
                    connectorWidth, 
                    radius, 
                    4
                );
                const connectorMat = new THREE.MeshPhongMaterial({ 
                    color: 0x888888, 
                    flatShading: true, 
                    shininess: 10 
                });
                const connectorMesh = new THREE.Mesh(connectorGeom, connectorMat);
                
                connectorMesh.position.set(x / 2, y / 2, podDimensions.depth / 2);
                connectorMesh.rotateZ(angle + Math.PI / 2);
                
                group.add(connectorMesh);
            }
            
            // Update bounding box
            maxX = Math.max(maxX, x + podDimensions.width / 2);
            minX = Math.min(minX, x - podDimensions.width / 2);
            maxY = Math.max(maxY, y + podDimensions.height / 2);
            minY = Math.min(minY, y - podDimensions.height / 2);
            maxZ = Math.max(maxZ, podDimensions.depth);
        }
        
        // Add central axial connector if needed
        if (needsConnectors) {
            const connectorWidth = 0.3 + (podRadius / 2) * randomConst;
            const axialGeom = new THREE.CylinderGeometry(
                connectorWidth, 
                connectorWidth, 
                podDepth, 
                4
            );
            const axialMat = new THREE.MeshPhongMaterial({ 
                color: 0x888888, 
                flatShading: true, 
                shininess: 10 
            });
            const axialMesh = new THREE.Mesh(axialGeom, axialMat);
            
            axialMesh.position.set(0, 0, podDepth / 2);
            axialMesh.rotateX(Math.PI / 2);
            
            group.add(axialMesh);
        }
        
        return {
            mesh: group,
            width: maxX - minX,
            height: maxY - minY,
            depth: maxZ,
            layout: 'radial'
        };
    }
}