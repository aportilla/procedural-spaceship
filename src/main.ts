/**
 * main.ts
 * 
 * Application entry point and orchestrator for the procedural spaceship generator.
 * Handles:
 * - Three.js scene setup and rendering
 * - User interaction (camera controls, UI)
 * - Seed management and history
 * - URL state synchronization
 * - Bridging between UI and the pure ship generation function
 */

import * as THREE from 'three';
import { generateShip } from './shipgen.ts';
import { getInitialSeed, randomSeed } from './utilities/seed.ts';

// ============================================================================
// THREE.JS SCENE SETUP
// ============================================================================

const scene = new THREE.Scene();

// Camera configuration
const camera = new THREE.PerspectiveCamera(
    75,                                     // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                    // Near clipping plane
    1000                                    // Far clipping plane
);

// Renderer configuration
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// ============================================================================
// LIGHTING SETUP
// ============================================================================

// Ambient light for overall illumination
scene.add(new THREE.AmbientLight(0x404040));

// Main directional light (sun-like)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Accent point light for visual interest
const pointLight = new THREE.PointLight(0x4fc3f7, 0.5);
pointLight.position.set(-10, 5, -10);
scene.add(pointLight);

// ============================================================================
// CAMERA ORBIT CONTROLS
// ============================================================================
// Manual orbit controls implementation (drag to rotate, scroll to zoom)

let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;

// Spherical coordinates for camera position
let theta = 45 * Math.PI / 180;  // Horizontal angle (azimuth)
let phi = 60 * Math.PI / 180;    // Vertical angle (elevation)
let radius = 25;                  // Distance from origin

// Zoom constraints
const minRadius = 5;
const maxRadius = 50;

/**
 * Updates camera position based on spherical coordinates.
 * Camera always looks at the origin where the ship is centered.
 */
function updateCameraPosition(): void {
    camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
    camera.position.y = radius * Math.cos(phi);
    camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(0, 0, 0);
}

// Mouse drag handling for rotation
document.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;

    // Update angles based on mouse movement
    theta += deltaX * 0.01;
    // Clamp vertical angle to prevent camera flipping
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.01));

    previousMouseX = e.clientX;
    previousMouseY = e.clientY;

    updateCameraPosition();
});

// Mouse wheel handling for zoom
document.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius = Math.max(minRadius, Math.min(maxRadius, radius + e.deltaY * 0.01));
    updateCameraPosition();
});

// Initialize camera position
updateCameraPosition();

// ============================================================================
// SHIP GENERATION STATE
// ============================================================================

/**
 * Reference to the current ship in the scene.
 * Wrapped in object to allow pass-by-reference to generateShip function.
 */
let currentShip: { current: THREE.Group | null } = { current: null };

// ============================================================================
// UI ELEMENT SETUP
// ============================================================================

// Get existing UI elements from HTML
const seedInput = document.getElementById('seedInput') as HTMLInputElement;
const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const controlsContainer = document.getElementById('controls') as HTMLDivElement;

// Create navigation buttons for seed history
const prevBtn = document.createElement('button');
prevBtn.innerHTML = '&#8592;'; // Left arrow glyph
prevBtn.id = 'prevSeedBtn';

const nextBtn = document.createElement('button');
nextBtn.innerHTML = '&#8594;'; // Right arrow glyph
nextBtn.id = 'nextSeedBtn';

// Group navigation buttons as a visual pill pair
const pillGroup = document.createElement('div');
pillGroup.className = 'pill-group';
pillGroup.appendChild(prevBtn);
pillGroup.appendChild(nextBtn);

// Clean up any old UI elements from previous versions
const oldControlsDiv = document.getElementById('controlsDiv');
if (oldControlsDiv?.parentNode) oldControlsDiv.parentNode.removeChild(oldControlsDiv);

// Create footer section for controls
let controlsFooter = document.getElementById('controlsFooter');
if (controlsFooter?.parentNode) controlsFooter.parentNode.removeChild(controlsFooter);
controlsFooter = document.createElement('div');
controlsFooter.id = 'controlsFooter';
controlsFooter.className = 'controls-footer';
controlsFooter.appendChild(pillGroup);
controlsFooter.appendChild(generateBtn);

// Insert controls footer into the UI
const infoDiv = document.getElementById('info');
if (infoDiv) controlsContainer.insertBefore(controlsFooter, infoDiv);

// ============================================================================
// SEED MANAGEMENT & HISTORY
// ============================================================================

// Track seed history for navigation
let seedHistory: string[] = [];
let seedIndex: number = -1;

/**
 * Main orchestration function that coordinates seed changes.
 * This is the bridge between UI interactions and the pure ship generation.
 * 
 * @param seed - The seed string for ship generation
 * @param addToHistory - Whether to add this seed to navigation history
 * 
 * Responsibilities:
 * 1. Update UI (seed input field)
 * 2. Sync URL for sharing/bookmarking
 * 3. Call pure ship generation function
 * 4. Manage navigation history
 */
function setSeedAndGenerate(seed: string, addToHistory: boolean = true): void {
    // Update UI
    seedInput.value = seed;
    
    // Sync URL with current seed (browser-specific concern handled here, not in shipgen)
    if (typeof window !== 'undefined' && window.history && window.location) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('seed') !== seed) {
            url.searchParams.set('seed', seed);
            window.history.replaceState({}, '', url);
        }
    }
    
    // Call the pure ship generation function
    generateShip(seed, scene, THREE, currentShip);
    
    // Manage history for navigation
    if (addToHistory) {
        // Truncate forward history if navigating from middle
        if (seedIndex < seedHistory.length - 1) {
            seedHistory = seedHistory.slice(0, seedIndex + 1);
        }
        seedHistory.push(seed);
        seedIndex = seedHistory.length - 1;
    }
    
    updateNavButtons();
}

/**
 * Updates navigation button states based on history position.
 */
function updateNavButtons(): void {
    prevBtn.disabled = seedIndex <= 0;
    nextBtn.disabled = seedIndex >= seedHistory.length - 1;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Get initial seed from URL params or generate a random one
const initialSeed = getInitialSeed();
setSeedAndGenerate(initialSeed, true);

// ============================================================================
// EVENT HANDLERS
// ============================================================================

// Handle manual seed input
seedInput.addEventListener('input', () => {
    setSeedAndGenerate(seedInput.value || 'default', true);
});

// Generate random seed button
generateBtn.addEventListener('click', () => {
    const newSeed = randomSeed();
    setSeedAndGenerate(newSeed, true);
});

// Navigate backward through seed history
prevBtn.addEventListener('click', () => {
    if (seedIndex > 0) {
        seedIndex--;
        setSeedAndGenerate(seedHistory[seedIndex], false);
    }
});

// Navigate forward through seed history
nextBtn.addEventListener('click', () => {
    if (seedIndex < seedHistory.length - 1) {
        seedIndex++;
        setSeedAndGenerate(seedHistory[seedIndex], false);
    }
});

// ============================================================================
// ANIMATION & RENDERING
// ============================================================================

/**
 * Main animation loop.
 * Auto-rotates ship when not being manually controlled.
 */
function animate(): void {
    // Auto-rotate ship when user isn't dragging camera
    if (!isDragging && currentShip.current) {
        currentShip.current.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}

// ============================================================================
// RESPONSIVE HANDLING
// ============================================================================

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
