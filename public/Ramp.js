// Ramp.js
import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';

export class Ramp {
    constructor(scene, position, rotation) {
        const geometry = new THREE.BoxGeometry(5, 1, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.set(0, rotation, -Math.PI / 6); // Tilted upwards
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    }
}
