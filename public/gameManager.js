import { SimplexNoise, Random } from './utility.js';
import { Skier } from './skier.js';
import { Terrain } from './terrain.js';
import { PowerUp, Ramp, SkiEquipment } from './powerUps.js';
import { WeatherSystem } from './weatherSystem.js';
import { Particle } from './particle.js';

class GameManager {
    constructor() {
        // Initialization code from your original GameManager constructor
        // Including all properties and methods
        // ...

        // Initialize properties
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

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Disabled antialiasing
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio); // Adjust for display
        this.renderer.setClearColor(0x87ceeb);
        this.renderer.shadowMap.enabled = false; // Disabled shadows
        document.body.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

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

        // Setup menu handlers and show main menu
        this.setupMenuHandlers();
        this.showMainMenu();

        // Start loading progress simulation
        this.simulateLoading();

        this.lastFrameTime = performance.now(); // For delta time calculations

        // Resize event
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.weatherSystem.weatherCanvas.width = window.innerWidth;
            this.weatherSystem.weatherCanvas.height = window.innerHeight;
        });
    }

    // Include all methods from your original GameManager class
    // startGame, initializeGameWithSeed, proceedAfterSeed, connectToWebSocket, addOtherPlayer, etc.

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
    }

    showPauseMenu() {
        this.isPaused = true;
        document.getElementById('pause-menu').style.display = 'block';
    }

    setupMenuHandlers() {
        document.getElementById('start-game').onclick = () => this.startGame();
        document.getElementById('resume').onclick = () => {
            this.isPaused = false;
            document.getElementById('pause-menu').style.display = 'none';
            this.animate();
        };
        document.getElementById('restart').onclick = () => this.startGame();
        document.getElementById('main-menu-button').onclick = () => this.showMainMenu();
        document.getElementById('menu-button').onclick = () => this.showPauseMenu();
        document.getElementById('restart-game').onclick = () => this.startGame();
        document.getElementById('game-over-menu').onclick = () => this.showMainMenu();
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

            // Clear scene
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }

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

            // Start animation loop
            this.animate();
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    // ... include all other methods as per your original code
}

window.gameManager = new GameManager();

export { GameManager };
