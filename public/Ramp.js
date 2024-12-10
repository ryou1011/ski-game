// Ramp.js
import * as THREE from 'three';

export class Ramp {
    constructor(scene, position, rotation) {
        const geometry = new THREE.BoxGeometry(5, 1, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        this.mesh = new THREE.Mesh(geometry, material);
        // Reduce the tilt angle from -Math.PI / 6 to a gentler slope
        this.mesh.rotation.set(0, rotation, -Math.PI / 12); // Changed from -Math.PI / 6
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    }
}
