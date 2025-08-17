// Common types used across the project
import * as THREE from 'three';
import { SeededRandom } from './utilities/random';

export interface ComponentResult {
    mesh: THREE.Group | THREE.Mesh;
    length: number;
    width?: number;
    height?: number;
    isRadial?: boolean;
    thrusterPositions?: ThrusterPosition[];
    thrusterSize?: number;
}

export interface ThrusterPosition {
    x: number;
    y: number;
}

export interface CargoSectionResult extends ComponentResult {
    layout: string;
    depth: number;
    mass: number;
    podsPerSegment?: number;
}

export interface PodDimensions {
    width: number;
    height: number;
    depth: number;
    aspectA?: number;
    aspectB?: number;
    aspectCyl?: number;
    podRadius?: number;
    maxRadius?: number;
    endRadius?: number;
}

export interface MakeThrustersParams {
    totalShipMass: number;
    rng: SeededRandom;
    THREE: typeof import('three');
}

export interface MakeEngineBlockParams {
    isRadial: boolean;
    thrusterPositions: ThrusterPosition[];
    thrusterSize: number;
    engineBlockMass: number;
    THREE: typeof import('three');
    rng: SeededRandom;
}

export interface MakeCargoSectionParams {
    targetCargoMass: number;
    shipMassScalar?: number;
    THREE: typeof import('three');
    rng: SeededRandom;
}

export interface MakeCommandDeckParams {
    commandDeckMass: number;
    THREE: typeof import('three');
    rng: SeededRandom;
}