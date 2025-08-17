export function addDebugLine(ship: any, z: number, color: number = 0xff0000, THREE: any): void {
    const mat = new THREE.LineBasicMaterial({ color });
    const points = [
        new THREE.Vector3(-10, 0, z),
        new THREE.Vector3(10, 0, z),
        new THREE.Vector3(0, -10, z),
        new THREE.Vector3(0, 10, z)
    ];
    for (let i = 0; i < points.length; i += 2) {
        const geom = new THREE.BufferGeometry().setFromPoints([points[i], points[i+1]]);
        const line = new THREE.Line(geom, mat);
        ship.add(line);
    }
}