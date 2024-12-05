// SkiEquipmentManager.js
import * as THREE from 'three';

export class SkiEquipmentManager {
    constructor(scene, skiEquipmentPool) {
        this.scene = scene;
        this.skiEquipmentPool = skiEquipmentPool;
    }

    spawn(position, type) {
        const equipment = this.skiEquipmentPool.pop();
        if (equipment) {
            equipment.position.copy(position);
            equipment.rotation.y = Math.random() * Math.PI * 2;
            equipment.material.color.set(type === 'speed' ? 0xff0000 : 0x00ff00);
            equipment.visible = true;
            equipment.type = type;
            return equipment;
        }
        return null;
    }

    update() {
        // Additional updates if needed
    }

    collect(equipment) {
        equipment.visible = false;
        this.skiEquipmentPool.push(equipment);
    }
}
