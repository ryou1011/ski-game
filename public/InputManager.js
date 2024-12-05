export class InputManager {
    constructor(gameManager) {
        if (InputManager.instance) {
            return InputManager.instance;
        }
        this.gameManager = gameManager;
        this.keysPressed = {};
        this.init();
        InputManager.instance = this;
    }

    init() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        document.addEventListener('keyup', (event) => this.onKeyUp(event), false);
    }

    onKeyDown(event) {
        this.keysPressed[event.code] = true;

        switch (event.code) {
            case 'Escape':
                this.gameManager.showPauseMenu();
                break;
            // Handle camera rotation keys
            case 'ArrowLeft':
                this.gameManager.cameraTargetOffsetAngle -= 0.1;
                break;
            case 'ArrowRight':
                this.gameManager.cameraTargetOffsetAngle += 0.1;
                break;
            default:
                break;
        }
    }

    onKeyUp(event) {
        this.keysPressed[event.code] = false;

        switch (event.code) {
            case 'Space':
                this.gameManager.skier.handleJump();
                break;
            // Handle camera rotation keys
            case 'ArrowLeft':
            case 'ArrowRight':
                // Reset camera target angle to zero to reorient behind the skier
                this.gameManager.cameraTargetOffsetAngle = 0;
                break;
            default:
                break;
        }
    }
}
