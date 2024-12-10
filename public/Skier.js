// Skier.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Skier {
    constructor(mapSize, mountainHeightFunc, gameManager, isOtherPlayer = false, username = '') {
        this.gameManager = gameManager;
        this.mapSize = mapSize;
        this.mountainHeight = mountainHeightFunc;
        this.isOtherPlayer = isOtherPlayer;
        this.username = username;

        this.speed = 0;
        this.maxSpeed = 50;
        this.defaultMaxSpeed = 50;
        this.minSpeed = 0;
        this.turningSpeed = 0.02;
        this.defaultTurningSpeed = 0.02;
        this.turning = 0;
        this.isJumping = false;
        this.verticalSpeed = 0;
        this.gravity = -0.05;  // Increased gravity effect
        this.consecutiveTricks = 0;
        this.trickRotation = new THREE.Vector3(0, 0, 0);

        this.jumpCharge = 0;
        this.maxJumpCharge = 0.5;

        this.trickName = '';

        // Load the GLB model
        this.loadModel();
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load(
            './models/skier.glb',
            (gltf) => {
                this.mesh = gltf.scene;
                this.mesh.scale.set(4, 4, 4);
                this.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Set initial position above the terrain
                const initialTerrainHeight = this.mountainHeight(0, 0);
                this.mesh.position.set(0, initialTerrainHeight + 2, -this.mapSize / 2 + 10);

                // Add username label for other players
                if (this.isOtherPlayer) {
                    this.addUsernameLabel();
                }

                // Initialize AnimationMixer if animations are present
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.mesh);
                    gltf.animations.forEach((clip) => {
                        this.mixer.clipAction(clip).play();
                    });
                }

                // Add the skier mesh to the scene
                this.gameManager.scene.add(this.mesh);
            },
            undefined,
            (error) => {
                console.error('An error occurred while loading the skier model:', error);
                this.modelFailedToLoad = true;
            }
        );
    }

    addUsernameLabel() {
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
        this.label.position.set(0, 8, 0);
        this.mesh.add(this.label);
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
        if (this.modelFailedToLoad) {
            return;
        }

        if (!this.mesh) return;

        if (this.isOtherPlayer) {
            return;
        }

        // Update animations if any
        if (this.mixer) {
            this.mixer.update(delta);
        }

        const acceleration = 0.5;
        const friction = 0.98;

        // Apply acceleration or deceleration based on input
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
            // Apply gravity with a stronger effect
            this.verticalSpeed += this.gravity * delta * 60;
            // Cap the maximum vertical speed to prevent excessive heights
            this.verticalSpeed = Math.max(this.verticalSpeed, -2);
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
                this.verticalSpeed = this.speed * 0.05;  // Reduced jump velocity
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
        }
    }

    updateLabel(camera) {
        if (this.label) {
            this.label.quaternion.copy(camera.quaternion);
        }
    }
}