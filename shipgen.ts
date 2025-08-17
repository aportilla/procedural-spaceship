// shipgen.js
// Ship generation logic for procedural-spaceship

import { makeThrusters } from './components/thrusters.ts';
import { makeEngineBlock } from './components/engineBlock.ts';
import { makeCargoSection } from './components/cargoSection.ts';
import { makeCommandDeck } from './components/commandDeck.ts';
import { SeededRandom } from './utilities/random.ts';
import { getInitialSeed } from './utilities/seed.ts';
import { addDebugLine } from './utilities/debug.ts';
// import { radialThrusterLayout, gridThrusterLayout, offsetGridThrusterLayout } from './components/thrusterLayouts.js';


// --- Ship and thruster constants ---
// const MIN_THRUSTER_COUNT = 1;
// const MAX_THRUSTER_COUNT = 33;
const SHIP_MAX_MASS = 1000;
const SHIP_MIN_MASS = 10;
// const MAX_THRUSTER_POWER = 250;
// const MIN_THRUSTER_POWER = 5;



// Main ship generation function
export function generateShip(seed: string, scene: any, THREE: any, currentShipRef: { current: any }): void {
    // Update the URL with the seed if needed
    if (typeof window !== 'undefined' && window.history && window.location) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('seed') !== seed) {
            url.searchParams.set('seed', seed);
            window.history.replaceState({}, '', url);
        }
    }

    // Remove previous ship
    if (currentShipRef.current) {
        scene.remove(currentShipRef.current);
        currentShipRef.current.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    let attachmentZ = 0;
    const rng = new SeededRandom(seed);
    const ship = new THREE.Group();

    // Pick ship mass randomly within range, bias towards smaller ships
    const shipMassScalar = Math.pow(rng.random(), 4);
    // console.info('shipMassScalar', shipMassScalar);
    const targetTotalShipMass = SHIP_MIN_MASS + shipMassScalar * (SHIP_MAX_MASS - SHIP_MIN_MASS);


    const maxCommandDeckMassRatio = 30 * (1 - (shipMassScalar/1.2)); // between 5% and 30% of total ship mass
    const commandDeckMassRatio = rng.range(5,maxCommandDeckMassRatio) / 100;
    const maxEngineBlockMassRatio = 30 * (1 - (shipMassScalar/1.2)); // between 5% and 30% of total ship mass
    const engineMassRatio = rng.range(5,maxEngineBlockMassRatio) / 100;
    const cargoMassRatio = 1 - (commandDeckMassRatio + engineMassRatio);
    const targetCargoMass = targetTotalShipMass * cargoMassRatio;

    // Create cargo section
    // @TOOD: give this an explicit target mass rather than the ship mass scalar...
    //        so we can make BIG ships with small cargo sections
    const cargoSection = makeCargoSection({
        shipMassScalar,
        targetCargoMass,
        THREE,
        rng
    });
    const cargoMass = cargoSection.mass;

    // const cargoMassRatio = cargoMass / targetTotalShipMass;
    // console.info('cargoMassRatio', cargoMassRatio);
    // Calculate mass ratios for ship sections


    // console.info('RATIOS', {
    //     cargoMassRatio,
    //     commandDeckMassRatio,
    //     engineMassRatio
    // });
    // console.info('commandDeckMassRatio', commandDeckMassRatio);

    const commandDeckMass = targetTotalShipMass * commandDeckMassRatio;
    const engineBlockMass = targetTotalShipMass * engineMassRatio;
    const totalShipMass = cargoMass + commandDeckMass + engineBlockMass;

    // Thruster section
    const thrusterSection = makeThrusters({
        totalShipMass,
        rng,
        THREE
    });
    thrusterSection.mesh.position.z = 0;
    ship.add(thrusterSection.mesh);
    attachmentZ = thrusterSection.length;
    const thrusterAttachmentPoint = attachmentZ;
    const isRadial = thrusterSection.isRadial || false;
    const thrusterPositions = thrusterSection.thrusterPositions || [];
    const thrusterSize = thrusterSection.thrusterSize || 1;

    // Engine block section
    const engineBlockSection = makeEngineBlock({
        isRadial,
        thrusterPositions,
        thrusterSize,
        engineBlockMass,
        THREE,
        rng
    });
    engineBlockSection.mesh.position.z = attachmentZ;
    attachmentZ += engineBlockSection.length;
    const cargoAttachmentPoint = attachmentZ;
    ship.add(engineBlockSection.mesh);

    // Cargo section
    cargoSection.mesh.position.z = attachmentZ;
    attachmentZ += cargoSection.length;
    const commandDeckAttachmentPoint = attachmentZ;
    ship.add(cargoSection.mesh);

    // Command deck section
    const commandDeckSection = makeCommandDeck({
        commandDeckMass,
        THREE,
        rng
    });
    commandDeckSection.mesh.position.z = attachmentZ;
    attachmentZ += commandDeckSection.length;
    ship.add(commandDeckSection.mesh);
    const endAttachmentPoint = attachmentZ;

    // Section dimensions
    // const engineBlockWidth = engineBlockSection.width;
    // const engineBlockHeight = engineBlockSection.height;
    // const cargoSectionWidth = cargoSection.width;
    // const cargoSectionHeight = cargoSection.height;
    // const commandDeckWidth = commandDeckSection.width;
    // const commandDeckHeight = commandDeckSection.height;
    // const smallestSectionWidth = Math.min(
    //     engineBlockWidth,
    //     cargoSectionWidth,
    //     commandDeckWidth
    // );
    // const smallestSectionHeight = Math.min(
    //     engineBlockHeight,
    //     cargoSectionHeight,
    //     commandDeckHeight
    // );

    // // Tunnel dimensions
    // const smallestDimension = Math.min(smallestSectionWidth, smallestSectionHeight);
    // const tunnelWidth = smallestDimension * rng.range(0.5, 0.9);
    // const tunnelLength = cargoSection.length + (commandDeckSection.length / 2) + (engineBlockSection.length / 2);
    // const cargoPodsPerSegment = cargoSection.podsPerSegment;
    // let tunnelFacets = Math.floor(rng.range(3, 6));
    // if (cargoPodsPerSegment > 3) {
    //     tunnelFacets = cargoPodsPerSegment;
    // }

    // // Tunnel geometry (cylinder)
    // const tunnelGeom = new THREE.CylinderGeometry(tunnelWidth / 2, tunnelWidth / 2, tunnelLength, tunnelFacets);
    // tunnelGeom.rotateX(Math.PI / 2);
    // tunnelGeom.translate(0, 0, -tunnelLength / 2);
    // const tunnelMat = new THREE.MeshPhongMaterial({ color: 0x666666, flatShading: true, shininess: 10 });
    // const tunnelMesh = new THREE.Mesh(tunnelGeom, tunnelMat);
    // tunnelMesh.position.z = attachmentZ - (commandDeckSection.length / 2);
    // ship.add(tunnelMesh);

    // Debug: Draw lines at each segment connection point
    addDebugLine(ship, thrusterAttachmentPoint, 0xff0000, THREE); // Red: after thrusters
    addDebugLine(ship, cargoAttachmentPoint, 0x00ff00, THREE);    // Green: after engine block
    addDebugLine(ship, commandDeckAttachmentPoint, 0x0000ff, THREE); // Blue: after cargo
    addDebugLine(ship, endAttachmentPoint, 0xffff00, THREE);      // Yellow: after command deck

    // Debug: Add a marker at the scene origin (0,0,0)
    // const originMarkerGeom = new THREE.SphereGeometry(0.2, 12, 8);
    // const originMarkerMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    // const originMarker = new THREE.Mesh(originMarkerGeom, originMarkerMat);
    // originMarker.position.set(0, 0, 0);
    // scene.add(originMarker);

    // Center the ship so its midpoint is at z=0
    ship.position.z = -endAttachmentPoint / 2;

    // Create a root group for rotation
    const shipRoot = new THREE.Group();
    shipRoot.add(ship);

    currentShipRef.current = shipRoot;
    scene.add(shipRoot);
}
