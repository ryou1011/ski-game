import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';

export class PowerUpManager {
    constructor(scene, powerUpPool) {
        this.scene = scene;
        this.powerUpPool = powerUpPool;
    }

    spawn(position, type) {
        const powerUp = this.powerUpPool.pop();
        if (powerUp) {
            powerUp.position.copy(position);
            powerUp.rotation.y = Math.random() * Math.PI * 2;
            powerUp.material.color.set(type === 'speed' ? 0xff0000 : 0x00ff00);
            powerUp.visible = true;
            powerUp.type = type;
            return powerUp;
        }
        return null;
    }

    update() {
        // Additional updates if needed
    }

    collect(powerUp) {
        powerUp.visible = false;
        this.powerUpPool.push(powerUp);
    }
}
