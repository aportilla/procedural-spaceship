import * as THREE from 'three';
import { randomSeed } from './randomseed.ts';
import { SeededRandom, generateShip, getInitialSeed } from './shipgen.ts';

// Scene setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0x404040));

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x4fc3f7, 0.5);
pointLight.position.set(-10, 5, -10);
scene.add(pointLight);

// Orbit controls - no grid helper here!
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let theta = 45 * Math.PI / 180; // Horizontal angle
let phi = 60 * Math.PI / 180;   // Vertical angle
let radius = 25;
const minRadius = 5, maxRadius = 50;

function updateCameraPosition() {
    camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
    camera.position.y = radius * Math.cos(phi);
    camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(0, 0, 0);
}

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

    theta += deltaX * 0.01;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.01));

    previousMouseX = e.clientX;
    previousMouseY = e.clientY;

    updateCameraPosition();
});

document.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius = Math.max(minRadius, Math.min(maxRadius, radius + e.deltaY * 0.01));
    updateCameraPosition();
});

// Set initial camera position
updateCameraPosition();

// --- THRUSTER-BASED SHIP GENERATION ---

let currentShip = { current: null };

const seedInput = document.getElementById('seedInput');
const generateBtn = document.getElementById('generateBtn');
const controlsContainer = document.getElementById('controls');
// Add previous/next buttons as a pill pair with glyphs
const prevBtn = document.createElement('button');
prevBtn.innerHTML = '&#8592;'; // Left arrow
prevBtn.id = 'prevSeedBtn';
const nextBtn = document.createElement('button');
nextBtn.innerHTML = '&#8594;'; // Right arrow
nextBtn.id = 'nextSeedBtn';

// Style the previous/next buttons as a pill pair
const pillGroup = document.createElement('div');
pillGroup.className = 'pill-group';
pillGroup.appendChild(prevBtn);
pillGroup.appendChild(nextBtn);

// Remove old floating controlsDiv if present
const oldControlsDiv = document.getElementById('controlsDiv');
if (oldControlsDiv && oldControlsDiv.parentNode) oldControlsDiv.parentNode.removeChild(oldControlsDiv);

// --- Move controls into the main seed input widget as a footer ---
let controlsFooter = document.getElementById('controlsFooter');
if (controlsFooter && controlsFooter.parentNode) controlsFooter.parentNode.removeChild(controlsFooter);
controlsFooter = document.createElement('div');
controlsFooter.id = 'controlsFooter';
controlsFooter.className = 'controls-footer';
controlsFooter.appendChild(pillGroup);
controlsFooter.appendChild(generateBtn);

// Insert footer after the seed input (and before #info)
const infoDiv = document.getElementById('info');
controlsContainer.insertBefore(controlsFooter, infoDiv);

// Seed history logic
let seedHistory = [];
let seedIndex = -1;

function setSeedAndGenerate(seed, addToHistory = true) {
    seedInput.value = seed;
    generateShip(seed, scene, THREE, currentShip);
    if (addToHistory) {
        // If not at the end, truncate forward history
        if (seedIndex < seedHistory.length - 1) {
            seedHistory = seedHistory.slice(0, seedIndex + 1);
        }
        seedHistory.push(seed);
        seedIndex = seedHistory.length - 1;
    }
    updateNavButtons();
}

function updateNavButtons() {
    prevBtn.disabled = seedIndex <= 0;
    nextBtn.disabled = seedIndex >= seedHistory.length - 1;
}

// Use getInitialSeed to get the seed from the URL or generate a new one
const initialSeed = getInitialSeed();
setSeedAndGenerate(initialSeed, true);

seedInput.addEventListener('input', () => {
    setSeedAndGenerate(seedInput.value || 'default', true);
});

generateBtn.addEventListener('click', () => {
    const newSeed = randomSeed();
    setSeedAndGenerate(newSeed, true);
});

prevBtn.addEventListener('click', () => {
    if (seedIndex > 0) {
        seedIndex--;
        setSeedAndGenerate(seedHistory[seedIndex], false);
    }
});

nextBtn.addEventListener('click', () => {
    if (seedIndex < seedHistory.length - 1) {
        seedIndex++;
        setSeedAndGenerate(seedHistory[seedIndex], false);
    }
});

function animate() {
    if (!isDragging && currentShip.current) {
        currentShip.current.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
