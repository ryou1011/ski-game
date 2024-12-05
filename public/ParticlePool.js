import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';

export class ParticlePool {
    constructor(scene, poolSize) {
        this.scene = scene;
        this.pool = [];
        this.activeParticles = [];
        // Shared geometry and material for particles
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
        for (let i = 0; i < poolSize; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            this.scene.add(mesh);
            this.pool.push(mesh);
        }
    }

    createParticle(position) {
        const mesh = this.pool.pop();
        if (mesh) {
            mesh.position.copy(position);
            mesh.material.opacity = 1.0;
            mesh.visible = true;
            this.activeParticles.push(mesh);
            return mesh;
        }
        return null;
    }

    update(delta) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const mesh = this.activeParticles[i];
            mesh.position.y += -0.01 * delta * 60;
            mesh.material.opacity -= 0.02 * delta * 60;
            if (mesh.material.opacity <= 0) {
                mesh.visible = false;
                this.pool.push(mesh);
                this.activeParticles.splice(i, 1);
            }
        }
    }
}
