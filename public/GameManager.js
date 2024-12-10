import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';
import { InputManager } from './InputManager.js';
import { ParticlePool } from './ParticlePool.js';
import { SimplexNoise } from './SimplexNoise.js';
import { Random } from './Random.js';
import { PowerUpManager } from './PowerUpManager.js';
import { SkiEquipmentManager } from './SkiEquipmentManager.js';
import { Ramp } from './Ramp.js';
import { WeatherSystem } from './WeatherSystem.js';
import { Skier } from './Skier.js';
import { BattlePass } from './Battlepass.js';

export class GameManager {
    constructor() {
        this.score = 0;
        this.coins = 0;
        this.highScores = JSON.parse(localStorage.getItem('skiHighScores')) || [];
        this.isPaused = false;
        this.isGameActive = false;
        this.trickMultiplier = 1;
        this.particles = [];
        this.powerUps = [];
        this.achievements = [];
        this.timeRemaining = 180;
        this.username = '';
        this.battlePass = new BattlePass(this);
        this.lastDistanceXP = 0; // For tracking distance-based XP

        // Initialize the scene
        this.scene = new THREE.Scene();
        this.setupSkybox();

        // Adjust fog settings for better skybox visibility
        this.scene.fog = new THREE.FogExp2(0xffffff, 0.0001); // Reduced density

        // Initialize the camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

        // Initialize the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing for smoother edges
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding; // Correct encoding for color textures
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Realistic dynamic range
        this.renderer.toneMappingExposure = 1.0; // Adjust exposure as needed for brightness
        this.renderer.shadowMap.enabled = false; // Enable if using shadows
        document.body.appendChild(this.renderer.domElement);

        // Initialize ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Adjust intensity as needed
        this.scene.add(this.ambientLight);

        // Initialize directional light (simulating sunlight)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionalLight.position.set(100, 200, 100); // Position as needed
        this.directionalLight.castShadow = false; // Enable shadows if desired
        this.scene.add(this.directionalLight);


        this.mapSize = 1000; // Increased map size

        // Camera control variables
        this.cameraOffsetAngle = 0;
        this.cameraTargetOffsetAngle = 0;

        // Multiplayer variables
        this.players = {};
        this.playerId = null;

        // Minimap variables
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapContext = this.minimapCanvas.getContext('2d');

        // Initialize game state variables
        this.terrainDataLoaded = false;

        // Weather system
        this.weatherSystem = new WeatherSystem(this.scene);

        // Day-Night cycle
        this.timeOfDay = 0; // 0 to 1, where 0 is midnight and 0.5 is noon

        // Initialize Input Manager
        this.inputManager = new InputManager(this);

        // Particle Pooling
        this.particlePool = new ParticlePool(this.scene, 500); // Pool size adjusted as needed

        // Initialize PowerUp and SkiEquipment Managers
        this.powerUpManager = new PowerUpManager(this.scene, []); // Initialize with empty pool
        this.skiEquipmentManager = new SkiEquipmentManager(this.scene, []); // Initialize with empty pool

        // Setup menu handlers and show main menu
        this.setupMenuHandlers();
        this.showMainMenu();

        // Start loading progress simulation
        this.simulateLoading();

        this.lastFrameTime = performance.now(); // For delta time calculations

        // Object Pooling for Coins
        const coinGeometry = new THREE.TorusGeometry(2, 0.5, 8, 16);
        const coinMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        this.coinPool = [];
        for (let i = 0; i < 200; i++) {
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);
            coin.visible = false;
            this.scene.add(coin);
            this.coinPool.push(coin);
        }

        // Object Pooling for PowerUps
        const powerUpGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        this.powerUpPool = [];
        for (let i = 0; i < 50; i++) {
            const powerUp = new THREE.Mesh(powerUpGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            powerUp.visible = false;
            this.scene.add(powerUp);
            this.powerUpPool.push(powerUp);
        }

        // Assign the powerUpPool to the manager
        this.powerUpManager.powerUpPool = this.powerUpPool;

        // Object Pooling for SkiEquipment
        const skiEquipmentGeometry = new THREE.BoxGeometry(1, 0.2, 3);
        this.skiEquipmentPool = [];
        for (let i = 0; i < 50; i++) {
            const equipment = new THREE.Mesh(skiEquipmentGeometry, new THREE.MeshBasicMaterial({ color: 0xff69b4 }));
            equipment.visible = false;
            this.scene.add(equipment);
            this.skiEquipmentPool.push(equipment);
        }

        // Assign the skiEquipmentPool to the manager
        this.skiEquipmentManager.skiEquipmentPool = this.skiEquipmentPool;
    }

    simulateLoading() {
        const progress = document.getElementById('loading-progress');
        let width = 0;
        const interval = setInterval(() => {
            width += 2;
            progress.style.width = `${width}%`;
            if (width >= 100) {
                clearInterval(interval);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('main-menu').style.display = 'block';
            }
        }, 50);
    }

    showMainMenu() {
        this.hideMenus();
        document.getElementById('main-menu').style.display = 'block';
    }

    hideMenus() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('finish-game').style.display = 'none';
    }

    showPauseMenu() {
        this.isPaused = true;
        document.getElementById('pause-menu').style.display = 'block';
    }

    setupMenuHandlers() {
        // Main Menu Buttons
        document.getElementById('start-game').onclick = () => this.startGame();
        document.getElementById('view-battle-pass').onclick = () => this.showBattlePassMenu();
        document.getElementById('leaderboard').onclick = () => this.showLeaderboard();
        document.getElementById('settings').onclick = () => this.showSettings();
    
        // Pause Menu Buttons
        document.getElementById('resume').onclick = () => {
            this.isPaused = false;
            document.getElementById('pause-menu').style.display = 'none';
            this.animate();
        };
        document.getElementById('restart').onclick = () => this.startGame();
        document.getElementById('main-menu-button').onclick = () => this.showMainMenu();
        document.getElementById('settings-pause').onclick = () => this.showSettings();
    
        // Game Over Menu Buttons
        document.getElementById('restart-game').onclick = () => this.startGame();
        document.getElementById('game-over-menu').onclick = () => this.showMainMenu();
    
        // In-Game Menu Button
        document.getElementById('menu-button').onclick = () => this.showPauseMenu();
    
        // Finish Game Button
        document.getElementById('finish-game').onclick = () => {
            if (this.isGameActive) {
                this.gameOver();
            }
        };
    
        // Battle Pass Menu Buttons
        document.getElementById('close-battle-pass').onclick = () => {
            document.getElementById('battle-pass-menu').style.display = 'none';
        };
    
        document.getElementById('upgrade-pass').onclick = () => {
            if (this.battlePass) {
                this.battlePass.upgradeToPremium();
            }
        };
    
        // Add keyboard event for ESC key to pause
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.isGameActive) {
                this.showPauseMenu();
            }
        });
    }
    
    showBattlePassMenu() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('battle-pass-menu').style.display = 'block';
        // Update battle pass display
        if (this.battlePass) {
            this.battlePass.updateUI();
        }
    }
    
    showLeaderboard() {
        // Fetch and display leaderboard data from Firebase
        firebase.database().ref('gameStats')
            .orderByChild('score')
            .limitToLast(10)
            .once('value')
            .then((snapshot) => {
                const leaderboardData = [];
                snapshot.forEach((child) => {
                    leaderboardData.unshift(child.val());
                });
                this.displayLeaderboard(leaderboardData);
            });
    }
    
    displayLeaderboard(data) {
        const leaderboardMenu = document.createElement('div');
        leaderboardMenu.className = 'menu';
        leaderboardMenu.innerHTML = `
            <h2>Leaderboard</h2>
            <div class="leaderboard-container">
                ${data.map((entry, index) => `
                    <div class="leaderboard-entry">
                        <span class="rank">#${index + 1}</span>
                        <span class="username">${entry.username}</span>
                        <span class="score">${entry.score}</span>
                    </div>
                `).join('')}
            </div>
            <button id="close-leaderboard">Close</button>
        `;
        document.body.appendChild(leaderboardMenu);
    
        document.getElementById('close-leaderboard').onclick = () => {
            document.body.removeChild(leaderboardMenu);
        };
    }
    
    showSettings() {
        // Create and display settings menu
        const settingsMenu = document.createElement('div');
        settingsMenu.className = 'menu';
        settingsMenu.innerHTML = `
            <h2>Settings</h2>
            <div class="settings-container">
                <div class="setting">
                    <label for="music-volume">Music Volume</label>
                    <input type="range" id="music-volume" min="0" max="100" value="50">
                </div>
                <div class="setting">
                    <label for="sfx-volume">SFX Volume</label>
                    <input type="range" id="sfx-volume" min="0" max="100" value="50">
                </div>
                <div class="setting">
                    <label for="graphics-quality">Graphics Quality</label>
                    <select id="graphics-quality">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>
            <button id="save-settings">Save</button>
            <button id="close-settings">Close</button>
        `;
        document.body.appendChild(settingsMenu);
    
        document.getElementById('save-settings').onclick = () => {
            this.saveSettings();
            document.body.removeChild(settingsMenu);
        };
    
        document.getElementById('close-settings').onclick = () => {
            document.body.removeChild(settingsMenu);
        };
    }
    
    saveSettings() {
        const musicVolume = document.getElementById('music-volume').value;
        const sfxVolume = document.getElementById('sfx-volume').value;
        const graphicsQuality = document.getElementById('graphics-quality').value;
    
        // Save settings to localStorage
        localStorage.setItem('gameSettings', JSON.stringify({
            musicVolume,
            sfxVolume,
            graphicsQuality
        }));
    
        // Apply settings
        this.applySettings({
            musicVolume,
            sfxVolume,
            graphicsQuality
        });
    }
    
    applySettings(settings) {
        // Apply graphics quality
        switch (settings.graphicsQuality) {
            case 'low':
                this.renderer.setPixelRatio(1);
                break;
            case 'medium':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                break;
            case 'high':
                this.renderer.setPixelRatio(window.devicePixelRatio * 1.5);
                break;
        }
    
        // Apply volume settings if audio is implemented
        // this.audio.setMusicVolume(settings.musicVolume / 100);
        // this.audio.setSFXVolume(settings.sfxVolume / 100);
    }

    startGame() {
        try {
            // Get the username from the input
            const usernameInput = document.getElementById('username-input');
            this.username = usernameInput.value.trim() || 'Player';
    
            // Clear previous game data
            this.hideMenus();
            this.isGameActive = false;
            this.isPaused = false;
            this.score = 0;
            this.coins = 0;
            this.timeRemaining = 180;
            this.trickMultiplier = 1;
            this.particles = [];
            this.powerUps = [];
            this.achievements = [];
            this.coinsMeshes = [];
            this.ramps = [];
            this.treesPositions = [];
    
            // Reset camera angles
            this.cameraOffsetAngle = 0;
            this.cameraTargetOffsetAngle = 0;
    
            // Clear scene except lights and skybox
            const objectsToRemove = [];
            this.scene.traverse((child) => {
                if (child !== this.ambientLight && child !== this.directionalLight && child !== this.scene.background) {
                    objectsToRemove.push(child);
                }
            });
            objectsToRemove.forEach(obj => this.scene.remove(obj));
    
            // Re-add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
    
            // Initialize game after loading shared seed and terrain
            this.initializeGameWithSeed();
    
            // Update UI
            document.getElementById('score').textContent = `Score: ${this.score}`;
            document.getElementById('coins').textContent = `Coins: ${this.coins}`;
            document.getElementById('speed').textContent = `Speed: 0`;
            document.getElementById('trick-multiplier').textContent = `Trick Multiplier: 1x`;
            document.getElementById('timer').textContent = `Time: ${this.timeRemaining}s`;
            document.getElementById('finish-game').style.display = 'block';
    
            // Initialize or show battle pass display
            if (this.battlePass) {
                // Create simplified battle pass display for in-game
                const roundedCurrentXP = Math.round(this.battlePass.currentXP);
                const roundedRequiredXP = Math.round(this.battlePass.getRequiredXP(this.battlePass.currentTier));
                
                const battlePassContainer = document.createElement('div');
                battlePassContainer.className = 'battle-pass-container';
                battlePassContainer.innerHTML = `
                    <div class="battle-pass-header">
                        <div class="pass-type">${this.battlePass.isPremium ? 'PREMIUM PASS' : 'FREE PASS'}</div>
                    </div>
                    <div id="current-tier">Tier ${this.battlePass.currentTier}</div>
                    <div class="battle-pass-progress-bar">
                        <div id="battle-pass-progress"></div>
                    </div>
                    <div id="current-xp">${roundedCurrentXP}/${roundedRequiredXP} XP</div>
                `;
                document.body.appendChild(battlePassContainer);
                this.battlePass.updateUI(); // Update the progress bar initially
            }
    
            // Start game timer
            clearInterval(this.gameTimer);
            this.gameTimer = setInterval(() => {
                if (!this.isPaused && this.isGameActive) {
                    this.timeRemaining--;
                    this.updateTimer();
    
                    if (this.timeRemaining <= 0) {
                        this.gameOver();
                    }
                }
            }, 1000);
    
            // Reset multiplayer data
            this.players = {};
            this.playerId = null;
    
            // Reconnect to the WebSocket server
            if (this.socket) {
                this.socket.close();
            }
            this.connectToWebSocket();
    
            // Now the game is ready to start
            this.isGameActive = true;
    
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    initializeGameWithSeed() {
        // Fetch shared seed from Firebase
        firebase.database().ref('sharedSeed').once('value').then((snapshot) => {
            const seed = snapshot.val();
            if (seed !== null) {
                this.sharedSeed = seed;
                this.proceedAfterSeed();
            } else {
                // Generate and store a new seed
                this.sharedSeed = Math.floor(Math.random() * 1000000).toString();
                firebase.database().ref('sharedSeed').set(this.sharedSeed, (error) => {
                    if (error) {
                        console.error('Error storing shared seed:', error);
                    } else {
                        this.proceedAfterSeed();
                    }
                });
            }
        });
    }

    proceedAfterSeed() {
        // Initialize the noise function with the shared seed
        this.simplex = new SimplexNoise(parseFloat(this.sharedSeed));

        // Initialize the shared random number generator
        this.random = new Random(parseInt(this.sharedSeed));

        // Proceed with creating the terrain and other game elements
        this.createTerrain();
        this.createTrees();
        this.createRamps();
        this.createCoins();
        this.createSkiEquipment();

        // Create skier
        this.skier = new Skier(this.mapSize, this.mountainHeight.bind(this), this, false, this.username);

        // Start animation loop
        this.animate();
    }

    connectToWebSocket() {
        this.socket = new WebSocket('ws://localhost:8080');

        this.socket.addEventListener('open', () => {
            console.log('Connected to WebSocket server');
            // Send username to the server
            this.socket.send(JSON.stringify({ type: 'init', username: this.username }));
        });

        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'init':
                    // Receive player ID from the server
                    this.playerId = data.id;
                    break;
                case 'player_joined':
                    if (data.id !== this.playerId) {
                        // Add new player
                        this.addOtherPlayer(data.id, data.username);
                    }
                    break;
                case 'update':
                    // Update other player's position
                    if (data.id !== this.playerId && this.players[data.id]) {
                        this.players[data.id].mesh.position.set(data.position.x, data.position.y, data.position.z);
                        this.players[data.id].mesh.rotation.y = data.position.rotationY;
                    }
                    break;
                case 'player_left':
                    // Remove player
                    if (this.players[data.id]) {
                        this.scene.remove(this.players[data.id].mesh);
                        delete this.players[data.id];
                    }
                    break;
                default:
                    break;
            }
        });

        this.socket.addEventListener('close', () => {
            console.log('Disconnected from WebSocket server');
        });
    }

    addOtherPlayer(id, username) {
        const otherSkier = new Skier(this.mapSize, this.mountainHeight.bind(this), this, true, username);
        this.players[id] = otherSkier;

    }

    createTerrain() {
        try {
            const size = this.mapSize;
            const divisions = 256; // Reduced subdivisions for better performance

            // Create the terrain geometry
            const geometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
            geometry.rotateX(-Math.PI / 2);

            // Apply procedural displacement using mountainHeight function
            const positionAttribute = geometry.attributes.position;
            for (let i = 0; i < positionAttribute.count; i++) {
                const x = positionAttribute.getX(i);
                const z = positionAttribute.getZ(i);

                const y = this.mountainHeight(x, z);
                positionAttribute.setY(i, y);
            }
            geometry.computeVertexNormals();

            // Load the textures
            const textureLoader = new THREE.TextureLoader();
            const texturePath = './textures/snow_texture/'; // Ensure this path is correct relative to your HTML/JS file

            // Define texture filenames
            const textureFiles = {
                color: 'Snow009A_1K-JPG_Color.jpg',               // Diffuse/Color Map
                normal: 'Snow009A_1K-JPG_NormalGL.jpg',     // Normal Map
                roughness: 'Snow009A_1K-JPG_Roughness.jpg', // Roughness Map
                ao: 'Snow009A_1K-JPG_AmbientOcclusion.jpg', // Ambient Occlusion Map
                displacement: 'snow_02_disp_4k.jpg'         // Displacement Map
            };

            // Load all textures and store them in an object
            const textures = {};
            for (const [key, fileName] of Object.entries(textureFiles)) {
                const texture = textureLoader.load(`${texturePath}${fileName}`);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(50, 50); // Adjust repetition as needed

                // Set appropriate encoding
                if (key === 'color') {
                    texture.encoding = THREE.sRGBEncoding;
                } else {
                    texture.encoding = THREE.LinearEncoding;
                }

                textures[key] = texture;
            }

            // Create the material with all maps
            const material = new THREE.MeshStandardMaterial({
                map: textures.color,                   // Diffuse/Color Map
                normalMap: textures.normal,            // Normal Map
                displacementMap: textures.displacement,// Displacement Map
                displacementScale: 1.0,                // Displacement Scale
                roughnessMap: textures.roughness,      // Roughness Map
                aoMap: textures.ao,                    // Ambient Occlusion Map
                roughness: 0.9,                        // Base roughness
                metalness: 0.0,                        // Snow is non-metallic
            });

            // Assign uv2 for AO map
            geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));

            // Create the terrain mesh and add it to the scene
            this.terrain = new THREE.Mesh(geometry, material);
            this.scene.add(this.terrain);
        } catch (error) {
            console.error('Error creating terrain:', error);
        }
    }

    mountainHeight(x, z) {
        const scale = 0.005;
        const heightScale = 100;
        const noiseValue = this.simplex.noise2D(x * scale, z * scale);
        return noiseValue * heightScale;
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

        // Use InstancedMesh for better performance
        const instancedTrees = new THREE.InstancedMesh(treeGeometry, treeMaterial, treeCount);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < treeCount; i++) {
            dummy.position.copy(positions[i]);
            dummy.updateMatrix();
            instancedTrees.setMatrixAt(i, dummy.matrix);
        }

        this.scene.add(instancedTrees);
    }

    setupSkybox() {
        const loader = new THREE.CubeTextureLoader();
        const skyboxImages = [
            'px.png', // Positive X
            'nx.png', // Negative X
            'py.png', // Positive Y
            'ny.png', // Negative Y
            'pz.png', // Positive Z
            'nz.png'  // Negative Z
        ];

        const skyboxTexture = loader.setPath('./textures/skybox/').load(skyboxImages);
        this.scene.background = skyboxTexture;
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
        for (let i = 0; i < 200; i++) {
            const coin = this.coinPool.pop();
            if (coin) {
                const x = (this.random.next() - 0.5) * this.mapSize;
                const z = (this.random.next() - 0.5) * this.mapSize;
                const y = this.mountainHeight(x, z);
                coin.position.set(x, y + 5, z);
                coin.rotation.x = Math.PI / 2;
                coin.visible = true;
                this.coinsMeshes.push(coin);
            }
        }
    }

    createSkiEquipment() {
        this.skiEquipmentMeshes = [];
        for (let i = 0; i < 50; i++) {
            const equipment = this.skiEquipmentPool.pop();
            if (equipment) {
                const x = (this.random.next() - 0.5) * this.mapSize;
                const z = (this.random.next() - 0.5) * this.mapSize;
                const y = this.mountainHeight(x, z);
                const type = this.random.next() < 0.5 ? 'speed' : 'control';
                equipment.position.set(x, y + 2, z);
                equipment.rotation.y = this.random.next() * Math.PI * 2;
                equipment.material.color.set(type === 'speed' ? 0xff0000 : 0x00ff00);
                equipment.visible = true;
                equipment.type = type;
                this.skiEquipmentMeshes.push(equipment);
            }
        }
    }

    updateTimer() {
        document.getElementById('timer').textContent = `Time: ${this.timeRemaining}s`;
    }

    gameOver() {
        this.isGameActive = false;
        clearInterval(this.gameTimer);
     
        // Calculate final XP based on performance metrics
        const baseScoreXP = Math.floor(this.score / 100);  // 1 XP per 100 points
        const coinBonus = this.coins * 10;                 // 10 XP per coin
        const timeBonus = Math.max(0, this.timeRemaining) * 2;  // 2 XP per second remaining
        const trickBonus = this.trickMultiplier * 100;    // XP based on trick multiplier
        const distanceBonus = Math.floor(
            Math.sqrt(
                Math.pow(this.skier.mesh.position.x, 2) +
                Math.pow(this.skier.mesh.position.z, 2)
            ) / 10
        ); // Distance traveled bonus
     
        const finalXP = baseScoreXP + coinBonus + timeBonus + trickBonus + distanceBonus;
     
        // Award XP through battle pass
        if (this.battlePass) {
            this.battlePass.addXP(finalXP);
        }
     
        // Remove in-game battle pass display
        const battlePassContainer = document.querySelector('.battle-pass-container');
        if (battlePassContainer) {
            battlePassContainer.remove();
        }
     
        // Generate achievement list
        const achievementsList = this.achievements.map(achievement => {
            switch (achievement) {
                case 'score_10000':
                    return 'Score Master (10,000 points)';
                case 'coins_50':
                    return 'Coin Collector (50 coins)';
                case 'tricks_5':
                    return 'Trick Master (5 consecutive tricks)';
                default:
                    return achievement;
            }
        }).join('<br>');
     
        // Update UI with detailed stats
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('final-score').textContent = `Final Score: ${this.score}`;
        document.getElementById('final-stats').innerHTML = `
            <div class="stats-container">
                <h3>Game Statistics</h3>
                <div class="stat-row">Coins Collected: ${this.coins}</div>
                <div class="stat-row">Time Remaining: ${this.timeRemaining}s</div>
                <div class="stat-row">Final Trick Multiplier: ${this.trickMultiplier}x</div>
                <div class="stat-row">Distance Traveled: ${Math.floor(distanceBonus * 10)}m</div>
                
                <h3>XP Breakdown</h3>
                <div class="stat-row">Base Score XP: ${baseScoreXP}</div>
                <div class="stat-row">Coin Bonus: ${coinBonus}</div>
                <div class="stat-row">Time Bonus: ${timeBonus}</div>
                <div class="stat-row">Trick Bonus: ${trickBonus}</div>
                <div class="stat-row">Distance Bonus: ${distanceBonus}</div>
                <div class="stat-row total-xp">Total XP Earned: ${finalXP}</div>
                
                ${this.achievements.length > 0 ? `
                    <h3>Achievements Earned</h3>
                    <div class="achievements-list">${achievementsList}</div>
                ` : ''}
            </div>
        `;
     
        // Update high scores
        this.updateHighScores();
     
        // Clean up multiplayer
        if (this.socket) {
            this.socket.close();
        }
     
        // Reset game objects
        this.resetGameObjects();
     
        // Hide game UI elements
        document.getElementById('finish-game').style.display = 'none';
     
        // Add CSS animation class for smooth transition
        const gameOver = document.getElementById('game-over');
        gameOver.classList.add('fade-in');
        
        // Play game over sound if implemented
        // this.playGameOverSound();
     
        // Save final stats to Firebase if needed
        this.saveFinalStats(finalXP);
     }
     
     resetGameObjects() {
        // Reset player state
        if (this.skier) {
            this.skier.maxSpeed = this.skier.defaultMaxSpeed;
            this.skier.turningSpeed = this.skier.defaultTurningSpeed;
        }
     
        // Clear power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.visible = false;
            this.powerUpPool.push(powerUp);
        });
        this.powerUps = [];
     
        // Reset any active particles
        this.particlePool.reset();
     }
     
     saveFinalStats(finalXP) {
        if (!this.username) return;
     
        const gameStats = {
            username: this.username,
            score: this.score,
            coins: this.coins,
            xpEarned: finalXP,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            achievements: this.achievements
        };
     
        // Save to Firebase
        firebase.database().ref('gameStats').push(gameStats);
     }
    
    resetGameObjects() {
        // Reset player state
        if (this.skier) {
            this.skier.maxSpeed = this.skier.defaultMaxSpeed;
            this.skier.turningSpeed = this.skier.defaultTurningSpeed;
        }
    
        // Clear power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.visible = false;
            this.powerUpPool.push(powerUp);
        });
        this.powerUps = [];
    
        // Reset any active particles
        this.particlePool.reset();
    }
    
    saveFinalStats(finalXP) {
        if (!this.username) return;
    
        const gameStats = {
            username: this.username,
            score: this.score,
            coins: this.coins,
            xpEarned: finalXP,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            achievements: this.achievements
        };
    
        // Save to Firebase
        firebase.database().ref('gameStats').push(gameStats);
    }

    updateHighScores() {
        this.highScores.push({ score: this.score, coins: this.coins });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 5);
        localStorage.setItem('skiHighScores', JSON.stringify(this.highScores));
    }

    updateCamera() {
        const desiredOffsetAngle = this.cameraTargetOffsetAngle;
        this.cameraOffsetAngle += (desiredOffsetAngle - this.cameraOffsetAngle) * 0.1; // Smooth interpolation

        const distance = 30; // Adjust this value as needed for desired distance
        const height = 10;   // Adjust this value as needed for desired height

        const skierPosition = this.skier.mesh.position;
        const skierRotation = this.skier.mesh.rotation.y;

        const cameraAngle = skierRotation + this.cameraOffsetAngle;

        const cameraX = skierPosition.x + distance * Math.sin(cameraAngle);
        const cameraZ = skierPosition.z + distance * Math.cos(cameraAngle);
        let cameraY = skierPosition.y + height;

        // Prevent camera from clipping into the ground
        const terrainHeightAtCameraPosition = this.mountainHeight(cameraX, cameraZ);
        const minCameraHeightAboveGround = 2; // Minimum height above the terrain
        cameraY = Math.max(cameraY, terrainHeightAtCameraPosition + minCameraHeightAboveGround);

        this.camera.position.lerp(new THREE.Vector3(cameraX, cameraY, cameraZ), 0.1);
        this.camera.lookAt(skierPosition);
    }

    addPowerUp() {
        const x = this.random.next() * (this.mapSize * 1.5) - this.mapSize * 0.75;
        const z = this.random.next() * (this.mapSize * 1.5) - this.mapSize * 0.75;
        const y = this.mountainHeight(x, z);
        const type = this.random.next() < 0.5 ? 'speed' : 'points';

        const powerUp = this.powerUpManager.spawn(new THREE.Vector3(x, y + 2, z), type);
        if (powerUp) {
            this.powerUps.push(powerUp);
        }
    }

    showTrickText(text) {
        const trickText = document.getElementById('trick-text');
        trickText.textContent = text;
        trickText.style.opacity = '1';

        setTimeout(() => {
            trickText.style.opacity = '0';
        }, 1000);
    }

    animate() {
        if (!this.isGameActive || this.isPaused) return;

        // Ensure the animation loop continues
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        let delta = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        // Cap delta to prevent large time steps
        if (delta > 1 / 30) delta = 1 / 30;

        // Proceed with updating game elements
        this.updateGameElements(delta);
    }

    updateGameElements(delta) {
        // Update skier
        this.skier.update(delta);

        // Update particles using object pooling
        this.particlePool.update(delta);

        // Update power-ups
        this.powerUps.forEach((powerUp, index) => {
            if (powerUp.visible) {
                powerUp.rotation.y += 0.02;

                const distanceSquared = this.skier.mesh.position.distanceToSquared(powerUp.position);
                const collisionDistance = 5;
                if (distanceSquared < collisionDistance * collisionDistance) {
                    this.powerUpManager.collect(powerUp);
                    this.powerUps.splice(index, 1);

                    if (powerUp.type === 'speed') {
                        this.skier.maxSpeed *= 1.5;
                        setTimeout(() => {
                            this.skier.maxSpeed /= 1.5;
                        }, 5000);
                        this.showTrickText('Speed Boost!');
                    } else {
                        this.score += 500;
                        this.showTrickText('+500 Points!');
                    }
                }
            }
        });

        // Update coins rotation and check collection
        this.coinsMeshes.forEach((coin, index) => {
            if (coin.visible) {
                coin.rotation.y += 0.02;

                const distanceSquared = this.skier.mesh.position.distanceToSquared(coin.position);
                const collisionDistance = 5;
                if (distanceSquared < collisionDistance * collisionDistance) {
                    coin.visible = false;
                    this.coins++;
                    document.getElementById('coins').textContent = `Coins: ${this.coins}`;
                    this.score += 100;

                    // Utilize particle pool instead of creating new particles
                    this.particlePool.createParticle(coin.position);
                }
            }
        });

        // Update ski equipment and check collection
        this.skiEquipmentMeshes.forEach((equipment, index) => {
            if (equipment.visible) {
                equipment.rotation.y += 0.02;

                const distanceSquared = this.skier.mesh.position.distanceToSquared(equipment.position);
                const collisionDistance = 5;
                if (distanceSquared < collisionDistance * collisionDistance) {
                    this.skiEquipmentManager.collect(equipment);
                    this.skiEquipmentMeshes.splice(index, 1);

                    if (equipment.type === 'speed') {
                        this.skier.maxSpeed += 0.5;
                        this.showTrickText('New Skis: Speed Increased!');
                    } else if (equipment.type === 'control') {
                        this.skier.turningSpeed += 0.01;
                        this.showTrickText('New Poles: Control Improved!');
                    }
                }
            }
        });

        // Randomly spawn power-ups
        if (this.random.next() < 0.001) {
            this.addPowerUp();
        }

        this.sendPlayerUpdate(); // Send position to server
        this.updateCamera();

        // Update other players
        Object.values(this.players).forEach(player => {
            player.updateLabel(this.camera);
        });

        // Update minimap
        this.updateMinimap();

        // Update weather system
        this.weatherSystem.update();

        // Update day-night cycle
        this.updateDayNightCycle(delta);

        // Update UI
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('speed').textContent = `Speed: ${Math.round(this.skier.speed * 100)}`;
        document.getElementById('trick-multiplier').textContent = `Trick Multiplier: ${this.trickMultiplier}x`;

        // Check achievements
        this.checkAchievements();

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    updateDayNightCycle(delta) {
        // Update the time of day
        this.timeOfDay += delta * 0.01; // Adjust speed as needed
        if (this.timeOfDay > 1) this.timeOfDay = 0;

        // Calculate ambient light intensity based on time of day
        const baseIntensity = 1.2; // Current ambient light intensity
        const intensityVariation = 0.6; // Variation amplitude

        // Sinusoidal calculation: intensity varies between (base - variation) and (base + variation)
        const newIntensity = baseIntensity + intensityVariation * Math.sin(this.timeOfDay * Math.PI * 2);

        // Clamp the intensity to a minimum value to prevent complete darkness
        this.ambientLight.intensity = Math.max(newIntensity, 0.2);

        // Optionally, adjust directional light intensity based on time of day
        if (this.directionalLight) {
            this.directionalLight.intensity = Math.max(newIntensity * 0.8, 0.1);
        }

        // Adjust fog color based on time of day for better visual effects
        const color = new THREE.Color();
        color.setHSL(0.6, 1, 0.5 * Math.sin(this.timeOfDay * Math.PI * 2) + 0.5);
        this.scene.fog.color = color;
        this.renderer.setClearColor(color);
    }

    sendPlayerUpdate() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // Throttle updates to every 50ms
            const now = Date.now();
            if (!this.lastNetworkUpdate || now - this.lastNetworkUpdate > 50) {
                const position = {
                    x: this.skier.mesh.position.x,
                    y: this.skier.mesh.position.y,
                    z: this.skier.mesh.position.z,
                    rotationY: this.skier.mesh.rotation.y
                };
                this.socket.send(JSON.stringify({ type: 'update', position }));
                this.lastNetworkUpdate = now;
            }
        }
    }

    checkAchievements() {
        if (this.score >= 10000 && !this.achievements.includes('score_10000')) {
            this.achievements.push('score_10000');
            this.showAchievement('Score Master - Reach 10,000 points');
        }

        if (this.coins >= 50 && !this.achievements.includes('coins_50')) {
            this.achievements.push('coins_50');
            this.showAchievement('Coin Collector - Collect 50 coins');
        }

        if (this.skier.consecutiveTricks >= 5 && !this.achievements.includes('tricks_5')) {
            this.achievements.push('tricks_5');
            this.showAchievement('Trick Master - 5 consecutive tricks');
        }
    }

    showAchievement(text) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement';
        achievement.textContent = `Achievement: ${text}`;
        document.body.appendChild(achievement);

        // Animate in
        setTimeout(() => {
            achievement.style.transform = 'translateX(0)';
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            achievement.style.transform = 'translateX(200%)';
            setTimeout(() => achievement.remove(), 500);
        }, 3000);
    }

    updateMinimap() {
        const ctx = this.minimapContext;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, width, height);

        const scale = width / this.mapSize;

        // Draw player
        ctx.fillStyle = '#0000ff';
        const playerX = (this.skier.mesh.position.x + this.mapSize / 2) * scale;
        const playerZ = (this.skier.mesh.position.z + this.mapSize / 2) * scale;
        ctx.fillRect(playerX - 2, playerZ - 2, 4, 4);

        // Draw other players
        ctx.fillStyle = '#ff0000';
        Object.values(this.players).forEach(player => {
            const x = (player.mesh.position.x + this.mapSize / 2) * scale;
            const z = (player.mesh.position.z + this.mapSize / 2) * scale;
            ctx.fillRect(x - 2, z - 2, 4, 4);
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.weatherSystem.weatherCanvas.width = window.innerWidth;
        this.weatherSystem.weatherCanvas.height = window.innerHeight;
    }
}
