class Particle {
    constructor(scene, position) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        this.lifetime = 1.0;
        scene.add(this.mesh);
    }

    update() {
        this.mesh.position.add(this.velocity);
        this.velocity.y -= 0.01;
        this.lifetime -= 0.02;
        this.mesh.material.opacity = this.lifetime;
        return this.lifetime > 0;
    }
}

export { Particle };
