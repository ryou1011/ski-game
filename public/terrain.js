class Terrain {
    constructor(scene, mapSize, mountainHeightFunc, simplex, random) {
        this.scene = scene;
        this.mapSize = mapSize;
        this.mountainHeight = mountainHeightFunc;
        this.simplex = simplex;
        this.random = random;
        this.createTerrain();
        this.createTrees();
        this.createRamps();
        this.createCoins();
        this.createSkiEquipment();
    }

    createTerrain() {
        try {
            const size = this.mapSize;
            const divisions = 128; // Reduced divisions

            const geometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
            geometry.rotateX(-Math.PI / 2);

            // Modify vertices using Simplex noise for mountainous terrain
            const positionAttribute = geometry.attributes.position;
            for (let i = 0; i < positionAttribute.count; i++) {
                const x = positionAttribute.getX(i);
                const z = positionAttribute.getZ(i);

                const y = this.mountainHeight(x, z);
                positionAttribute.setY(i, y);
            }
            geometry.computeVertexNormals();

            const material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Simplified material
            this.terrain = new THREE.Mesh(geometry, material);
            this.terrain.receiveShadow = false; // Disabled shadows
            this.scene.add(this.terrain);
        } catch (error) {
            console.error('Error creating terrain:', error);
        }
    }

    createTrees() {
        const treeCount = 500;
        const positions = [];

        for (let i = 0; i < treeCount; i++) {
            const x = (this.random.next() - 0.5) * this.mapSize;
            const z = (this.random.next() - 0.5) * this.mapSize;
            const y = this.mountainHeight(x, z);
            positions.push(new THREE.Vector3(x, y, z));
        }

        this.treesPositions = positions;

        const treeGeometry = new THREE.ConeGeometry(2, 8, 5);
        const treeMaterial = new THREE.MeshBasicMaterial({ color: 0x006400 });

        const instancedTrees = new THREE.InstancedMesh(treeGeometry, treeMaterial, treeCount);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < treeCount; i++) {
            dummy.position.copy(positions[i]);
            dummy.updateMatrix();
            instancedTrees.setMatrixAt(i, dummy.matrix);
        }

        this.scene.add(instancedTrees);
    }

    createRamps() {
        const rampCount = 50;
        this.ramps = [];

        for (let i = 0; i < rampCount; i++) {
            const x = (this.random.next() - 0.5) * this.mapSize;
            const z = (this.random.next() - 0.5) * this.mapSize;
            const y = this.mountainHeight(x, z);
            const rotation = this.random.next() * Math.PI * 2;
            const position = new THREE.Vector3(x, y + 0.5, z);
            const ramp = new Ramp(this.scene, position, rotation);
            this.ramps.push(ramp);
        }
    }

    createCoins() {
        this.coinsMeshes = [];
        const coinCount = 200;

        for (let i = 0; i < coinCount; i++) {
            const x = (this.random.next() - 0.5) * this.mapSize;
            const z = (this.random.next() - 0.5) * this.mapSize;
            const coin = this.addCoin(x, z);
            this.coinsMeshes.push(coin);
        }
    }

    addCoin(x, z) {
        const geometry = new THREE.TorusGeometry(2, 0.5, 8, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const coin = new THREE.Mesh(geometry, material);

        const y = this.mountainHeight(x, z);
        coin.position.set(x, y + 5, z);
        coin.rotation.x = Math.PI / 2;

        this.scene.add(coin);
        return coin;
    }

    createSkiEquipment() {
        this.skiEquipmentMeshes = [];
        const equipmentCount = 50;

        for (let i = 0; i < equipmentCount; i++) {
            const x = (this.random.next() - 0.5) * this.mapSize;
            const z = (this.random.next() - 0.5) * this.mapSize;
            const y = this.mountainHeight(x, z);
            const type = this.random.next() < 0.5 ? 'speed' : 'control';
            const equipment = new SkiEquipment(this.scene, new THREE.Vector3(x, y + 2, z), type);
            this.skiEquipmentMeshes.push(equipment);
        }
    }
}

export { Terrain };
