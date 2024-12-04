class PowerUp {
    constructor(scene, position, type) {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: type === 'speed' ? 0xff0000 : 0x00ff00
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.type = type;
        this.collected = false;
        scene.add(this.mesh);
    }

    update() {
        this.mesh.rotation.y += 0.02;
        this.mesh.position.y = Math.sin(Date.now() * 0.002) * 0.2 + 2;
    }
}

class Ramp {
    constructor(scene, position, rotation) {
        const geometry = new THREE.BoxGeometry(5, 1, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.set(0, rotation, -Math.PI / 6); // Tilted upwards
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    }
}

class SkiEquipment {
    constructor(scene, position, type) {
        const geometry = new THREE.BoxGeometry(1, 0.2, 3);
        const material = new THREE.MeshBasicMaterial({ color: 0xff69b4 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.type = type; // e.g., 'speed', 'control'
        this.collected = false;
        scene.add(this.mesh);
    }

    update() {
        this.mesh.rotation.y += 0.02;
        this.mesh.position.y = Math.sin(Date.now() * 0.002) * 0.2 + 2;
    }
}

export { PowerUp, Ramp, SkiEquipment };
