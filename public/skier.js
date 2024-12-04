class Skier {
    constructor(mapSize, mountainHeightFunc, isOtherPlayer = false, username = '') {
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
        this.maxSpeed = 1.5;
        this.minSpeed = 0;
        this.turningSpeed = 0.02;
        this.turning = 0;
        this.isJumping = false;
        this.verticalSpeed = 0;
        this.gravity = -0.01;
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

        if (!isOtherPlayer) {
            this.initInput();
        } else {
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

    initInput() {
        this.keysPressed = {};
        if (!this.eventListenersAdded) {
            document.addEventListener('keydown', (event) => this.onKeyDown(event), false);
            document.addEventListener('keyup', (event) => this.onKeyUp(event), false);
            this.eventListenersAdded = true;
        }
    }

    onKeyDown(event) {
        this.keysPressed[event.code] = true;

        switch (event.code) {
            case 'Escape':
                window.gameManager.showPauseMenu();
                break;
            // Handle camera rotation keys
            case 'ArrowLeft':
                window.gameManager.cameraTargetOffsetAngle -= 0.1;
                break;
            case 'ArrowRight':
                window.gameManager.cameraTargetOffsetAngle += 0.1;
                break;
            default:
                break;
        }
    }

    onKeyUp(event) {
        this.keysPressed[event.code] = false;

        switch (event.code) {
            case 'Space':
                if (!this.isJumping) {
                    // Perform jump with charged power
                    this.isJumping = true;
                    this.verticalSpeed = 0.3 + this.jumpCharge;
                    this.jumpCharge = 0;
                }
                break;
            // Handle camera rotation keys
            case 'ArrowLeft':
            case 'ArrowRight':
                // Reset camera target angle to zero to reorient behind the skier
                window.gameManager.cameraTargetOffsetAngle = 0;
                break;
            default:
                break;
        }
    }

    update(delta) {
        if (this.isOtherPlayer) {
            // Other players are updated via network messages
            return;
        }

        const acceleration = 0.5;
        const friction = 0.98;

        // Apply acceleration or deceleration based on input
        if (this.keysPressed['KeyW']) {
            this.speed = Math.min(this.speed + acceleration * delta, this.maxSpeed);
        } else if (this.keysPressed['KeyS']) {
            this.speed = Math.max(this.speed - acceleration * delta, this.minSpeed);
        } else {
            this.speed *= friction;
        }

        // Turning the skier
        if (this.keysPressed['KeyA']) {
            this.mesh.rotation.y += this.turningSpeed;
        }
        if (this.keysPressed['KeyD']) {
            this.mesh.rotation.y -= this.turningSpeed;
        }

        // Jump charging
        if (this.keysPressed['Space'] && !this.isJumping) {
            this.jumpCharge = Math.min(this.jumpCharge + 0.005, this.maxJumpCharge);
        }

        // Calculate new position
        const moveDistance = this.speed * delta;
        const newX = this.mesh.position.x - moveDistance * Math.sin(this.mesh.rotation.y);
        const newZ = this.mesh.position.z - moveDistance * Math.cos(this.mesh.rotation.y);

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
                    window.gameManager.showTrickText(`${this.trickName}!`);
                    window.gameManager.score += 500 * window.gameManager.trickMultiplier;
                    window.gameManager.trickMultiplier++;
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
            const onRamp = window.gameManager.ramps.some(ramp => {
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
            if (this.keysPressed['KeyQ']) {
                // Backflip (rotation around X-axis)
                this.trickRotation.x = -Math.PI / 64;
                this.trickName = 'Backflip';
                this.consecutiveTricks++;
            }
            if (this.keysPressed['KeyE']) {
                // Spin (rotation around Y-axis)
                this.trickRotation.y = -Math.PI / 64;
                this.trickName = 'Spin';
                this.consecutiveTricks++;
            }
            if (this.keysPressed['KeyZ']) {
                // Barrel roll (rotation around Z-axis)
                this.trickRotation.z = -Math.PI / 64;
                this.trickName = 'Barrel Roll';
                this.consecutiveTricks++;
            }
        }

        // Add snow trail
        if (this.speed > 0.1 && !this.isJumping) {
            const particle = new Particle(
                window.gameManager.scene,
                new THREE.Vector3(
                    this.mesh.position.x,
                    this.mesh.position.y - 2,
                    this.mesh.position.z
                )
            );
            window.gameManager.particles.push(particle);
        }
    }

    updateLabel(camera) {
        if (this.label) {
            this.label.quaternion.copy(camera.quaternion);
        }
    }
}

export { Skier };
