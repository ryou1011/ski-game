import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';

export class Skier {
    constructor(mapSize, mountainHeightFunc, gameManager, isOtherPlayer = false, username = '') {
        this.gameManager = gameManager;

        const bodyGeometry = new THREE.BoxGeometry(1, 3, 1);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: isOtherPlayer ? 0xff0000 : 0x3366cc });
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);

        const skiGeometry = new THREE.BoxGeometry(0.5, 0.2, 4);
        const skiMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        this.leftSki = new THREE.Mesh(skiGeometry, skiMaterial);
        this.rightSki = new THREE.Mesh(skiGeometry, skiMaterial);

        this.leftSki.position.set(-0.6, -1.5, 0);
        this.rightSki.position.set(0.6, -1.5, 0);

        this.mesh.add(this.leftSki);
        this.mesh.add(this.rightSki);

        this.mapSize = mapSize;
        this.speed = 0;
        this.maxSpeed = 50;
        this.minSpeed = 0;
        this.turningSpeed = 0.02;
        this.turning = 0;
        this.isJumping = false;
        this.verticalSpeed = 0;
        this.gravity = -0.02;
        this.consecutiveTricks = 0;
        this.trickRotation = new THREE.Vector3(0, 0, 0);
        this.mountainHeight = mountainHeightFunc;

        this.isOtherPlayer = isOtherPlayer;
        this.username = username;

        // Set initial position above the terrain
        const initialTerrainHeight = this.mountainHeight(0, 0);
        this.mesh.position.set(0, initialTerrainHeight + 2, -this.mapSize / 2 + 10);

        this.jumpCharge = 0;
        this.maxJumpCharge = 0.5; // Maximum additional jump power

        this.trickName = '';

        if (isOtherPlayer) {
            // Add username label
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const context = canvas.getContext('2d');
            context.font = 'Bold 24px Arial';
            context.fillStyle = '#ffffff';
            context.textAlign = 'center';
            context.fillText(this.username, 128, 32);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
            this.label = new THREE.Sprite(spriteMaterial);
            this.label.scale.set(10, 2.5, 1);
            this.label.position.set(0, 4, 0);
            this.mesh.add(this.label);
        }
    }

    handleJump() {
        if (!this.isJumping) {
            // Perform jump with charged power
            this.isJumping = true;
            this.verticalSpeed = 0.3 + this.jumpCharge;
            this.jumpCharge = 0;
        }
    }

    update(delta) {
        if (this.isOtherPlayer) {
            // Other players are updated via network messages
            return;
        }

        const acceleration = 0.5;
        const friction = 0.98;

        // Apply acceleration or deceleration based on input without delta
        if (this.gameManager.inputManager.keysPressed['KeyW']) {
            this.speed = Math.min(this.speed + acceleration, this.maxSpeed);
        } else if (this.gameManager.inputManager.keysPressed['KeyS']) {
            this.speed = Math.max(this.speed - acceleration, this.minSpeed);
        } else {
            this.speed *= friction;
        }

        // Calculate new position using delta
        const moveDistance = this.speed * delta;
        const newX = this.mesh.position.x - moveDistance * Math.sin(this.mesh.rotation.y);
        const newZ = this.mesh.position.z - moveDistance * Math.cos(this.mesh.rotation.y);

        // Turning the skier
        if (this.gameManager.inputManager.keysPressed['KeyA']) {
            this.mesh.rotation.y += this.turningSpeed;
        }
        if (this.gameManager.inputManager.keysPressed['KeyD']) {
            this.mesh.rotation.y -= this.turningSpeed;
        }

        // Jump charging
        if (this.gameManager.inputManager.keysPressed['Space'] && !this.isJumping) {
            this.jumpCharge = Math.min(this.jumpCharge + 0.005, this.maxJumpCharge);
        }

        // Check boundaries
        if (Math.abs(newX) < this.mapSize / 2 && Math.abs(newZ) < this.mapSize / 2) {
            this.mesh.position.x = newX;
            this.mesh.position.z = newZ;
        } else {
            // Bounce off the boundaries
            this.mesh.rotation.y += Math.PI;
            this.speed *= 0.5;
        }

        if (this.isJumping) {
            this.verticalSpeed += this.gravity * delta * 60;
            this.mesh.position.y += this.verticalSpeed * delta * 60;

            // Rotate during tricks
            this.mesh.rotation.x += this.trickRotation.x * delta * 60;
            this.mesh.rotation.y += this.trickRotation.y * delta * 60;
            this.mesh.rotation.z += this.trickRotation.z * delta * 60;

            // Get terrain height at current position
            const terrainHeightAtPosition = this.mountainHeight(this.mesh.position.x, this.mesh.position.z);

            if (this.mesh.position.y <= terrainHeightAtPosition + 2) {
                this.mesh.position.y = terrainHeightAtPosition + 2;
                this.isJumping = false;
                this.verticalSpeed = 0;

                // Reset rotations
                this.mesh.rotation.x = 0;
                this.mesh.rotation.z = 0;

                // Show trick text if performed
                if (this.consecutiveTricks > 0) {
                    this.gameManager.showTrickText(`${this.trickName}!`);
                    this.gameManager.score += 500 * this.gameManager.trickMultiplier;
                    this.gameManager.trickMultiplier++;
                }

                this.consecutiveTricks = 0;
                this.trickRotation.set(0, 0, 0);
                this.trickName = '';
            }
        } else {
            // Ensure skier stays on terrain
            const terrainHeightAtPosition = this.mountainHeight(this.mesh.position.x, this.mesh.position.z);
            this.mesh.position.y = terrainHeightAtPosition + 2;

            // Check if on ramp
            const onRamp = this.gameManager.ramps.some(ramp => {
                const rampPos = ramp.mesh.position;
                const distanceSquared = this.mesh.position.distanceToSquared(rampPos);
                const collisionDistance = 5;
                return distanceSquared < collisionDistance * collisionDistance;
            });

            if (onRamp && this.speed > 0.1 && !this.isJumping) {
                this.isJumping = true;
                this.verticalSpeed = this.speed * 0.5;
            }
        }

        // Perform tricks
        if (this.isJumping) {
            if (this.gameManager.inputManager.keysPressed['KeyQ']) {
                // Backflip (rotation around X-axis)
                this.trickRotation.x = -Math.PI / 64;
                this.trickName = 'Backflip';
                this.consecutiveTricks++;
            }
            if (this.gameManager.inputManager.keysPressed['KeyE']) {
                // Spin (rotation around Y-axis)
                this.trickRotation.y = -Math.PI / 64;
                this.trickName = 'Spin';
                this.consecutiveTricks++;
            }
            if (this.gameManager.inputManager.keysPressed['KeyZ']) {
                // Barrel roll (rotation around Z-axis)
                this.trickRotation.z = -Math.PI / 64;
                this.trickName = 'Barrel Roll';
                this.consecutiveTricks++;
            }
        }

        // Add snow trail using particle pool
        if (this.speed > 0.1 && !this.isJumping) {
            const particleMesh = this.gameManager.particlePool.createParticle(
                new THREE.Vector3(
                    this.mesh.position.x,
                    this.mesh.position.y - 2,
                    this.mesh.position.z
                )
            );
            // No additional initialization needed as createParticle handles it
        }
    }

    updateLabel(camera) {
        if (this.label) {
            this.label.quaternion.copy(camera.quaternion);
        }
    }
}
