# 3D Skiing Game - Multiplayer with New Features

A 3D skiing game built with Three.js, featuring multiplayer support, procedurally generated terrains, and dynamic gameplay elements like power-ups, weather systems, and day-night cycles. This project also uses Firebase for real-time data synchronization.

---

## Goal for features
- **Multiplayer Support:** Play with friends in real time using WebSockets.
- **Dynamic Environment:** Procedurally generated terrains, trees, and ramps.
- **Power-Ups and Collectibles:** Speed boosts, coins, and equipment upgrades.
- **Weather System:** Simulated snow, rain, and other weather effects.
- **Day-Night Cycle:** Smooth transitions between day and night.
- **Achievements:** Unlock achievements for high scores, trick combos, and more.
- **Custom Minimap:** View your position relative to the terrain and other players.

---

# TO-DO Next 
1. Multiplayer support with Node.js websockets
 - Has already been started in skiing-game-server folder but doesn't work
2. Powerups, collectables, and achievements
- Refer to ## Goal for features
3. Improving gameplay
- Ramps currently launch you into the air
- Player clips under mountain texture
- Trick recognition is bad
- Balance the game physics/settings

---

## Installation

### Prerequisites
- Node.js (for running a WebSocket server)
- A web browser that supports WebGL
- Firebase project (for shared game data)

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/3d-skiing-game.git
   cd 3d-skiing-game
2. Download liveserver extension for VS
- Once downloaded right click on index.html and press "Open with Live Server"
- Open up the local host it gives in a chrome browser **Can't use firefox and may break in others**


# File Descriptions

## 1. `index.html`
**Purpose & Role:**  
`index.html` serves as the foundational HTML document and the primary entry point for the application. It establishes the base structure of the webpage and ensures that all core elements—such as the canvas for rendering WebGL content, UI overlays, and menu systems—are defined and accessible to JavaScript modules.

**Key Considerations:**
- **DOM Elements for the Game Interface:** The file contains fixed-position HTML elements that display game menus (main menu, pause menu, loading screens), UI statistics (score, speed, multipliers, timer), and other overlays (like the minimap canvas and weather overlay).
- **Import Maps & Script Loading:** An `<script type="importmap">` is often used here to define module resolution for Three.js and related libraries. Ensuring correct load order is crucial so that the DOM elements and scripts are ready when the game initializes.
- **Resource Coupling:** Although `index.html` itself does not contain game logic, any missing or incorrect DOM elements can lead to downstream errors in modules like `GameManager.js`.

---

## 2. `styles.css`
**Purpose & Role:**  
`styles.css` defines visual styling for UI elements, ensuring a coherent and user-friendly interface. While it does not contain logic, its aesthetic and layout rules directly impact the player’s experience.

**Key Considerations:**
- **UI Consistency:** Fonts, colors, and element positioning maintain visual consistency across menus, HUD elements, and textual overlays.
- **Responsiveness:** Though mainly a canvas-based game, CSS can handle scaling or repositioning of UI elements for different screen sizes.
- **Non-Functional Requirements:** Visual emphasis through text shadows, transitions, and opacity changes can make score pop-ups or trick messages more engaging.

---

## 3. `main.js`
**Purpose & Role:**  
`main.js` is typically the JavaScript entry point after `index.html`. It bootstraps the game logic by instantiating the game’s central manager, setting the stage for all initialization tasks that follow.

**Key Considerations:**
- **Instantiating the Game Manager:** Often creates a new `GameManager` instance, triggering asset loading, event listener setup, and rendering loops.
- **Global Setup:** May perform checks or set initial configuration (e.g., hooking into `window` resize events) before the main orchestrator (`GameManager`) takes over.
- **Scope & Responsibility:** While not logic-heavy, `main.js` ensures the proper sequence of events at startup, preventing undefined references or race conditions.

---

## 4. `GameManager.js`
**Purpose & Role:**  
`GameManager.js` acts as the core orchestrator and state manager of the application. It oversees scene management, game states, entity updates, and rendering loops.

**Key Considerations:**
- **Scene & Rendering Orchestration:** Sets up the Three.js scene, camera, lights, and renderer. Might handle terrain generation and other environment-level tasks.
- **Game State & Lifecycle:** Manages the transition between loading, main menu, gameplay, pause, and game-over states. Its `animate()` loop updates all game elements each frame.
- **Entity Management:** Coordinates with `Skier.js`, `PowerUpManager.js`, `SkiEquipmentManager.js`, `Ramp.js`, and others to ensure all entities update in sync.
- **User Input Integration:** Uses `InputManager.js` outputs and applies them to global states.
- **Complex Interdependencies:** Asynchronous model loading, multiplayer considerations, and performance constraints all converge here, making `GameManager.js` one of the most complex files.

---

## 5. `Skier.js`
**Purpose & Role:**  
`Skier.js` defines logic, properties, and behaviors of the player character model.

**Key Considerations:**
- **Model Loading & Animation:** Uses `GLTFLoader` to load the skier’s 3D model and possibly play animations. Once loaded, sets scale, orientation, and can attach UI labels (like the username).
- **Player Movement & Physics:** Updates skier position, rotation, and speed based on user input and environmental factors. Integrates jump mechanics, gravity, and collision with terrain or ramps.
- **Tricks & Feedback:** Manages trick detection (spins, flips) and triggers UI and scoring responses.
- **Asynchronous Complexity:** Must handle states where the model hasn’t loaded yet, ensuring no attempts to render or update non-existent meshes.

---

## 6. `InputManager.js`
**Purpose & Role:**  
`InputManager.js` isolates all user input handling, capturing events and maintaining a clean interface for querying input states.

**Key Considerations:**
- **Centralized Input State:** Aggregates key presses (and potentially other input forms) so other modules can easily check if certain keys are down without duplicating event logic.
- **Event Handling & Debouncing:** Attaches keydown/keyup listeners, may include logic to prevent jittery input handling.
- **Scalability & Extensibility:** By isolating input logic, future expansions (e.g., gamepad input) can be integrated with minimal impact on other code.

---

## 7. `ParticlePool.js`
**Purpose & Role:**  
`ParticlePool.js` manages a pool of reusable particle objects for effects like snow trails, dust, or collision impacts.

**Key Considerations:**
- **Object Pooling Technique:** Reduces overhead by reusing particle instances instead of continuously creating and destroying them.
- **Particle Lifecycle Management:** Activates particles when needed, updates them (position, opacity), and returns them to the pool when they fade out.
- **Performance & Visual Effects:** Improves frame rates and ensures smooth rendering by minimizing garbage collection load.

---

## 8. `SimplexNoise.js`
**Purpose & Role:**  
`SimplexNoise.js` implements a noise function used for procedural generation tasks, such as terrain height maps or environmental variations.

**Key Considerations:**
- **Terrain Generation & Variation:** Smooth, natural-looking variations in terrain or other game elements.
- **Mathematical Complexity:** Provides deterministic outputs for reproducible worlds if seeded.
- **General Utility:** Though often used for terrain, it can extend to weather patterns, vegetation placement, or any scenario needing coherent randomness.

---

## 9. `Random.js`
**Purpose & Role:**  
`Random.js` provides a seeded pseudo-random number generator utility.

**Key Considerations:**
- **Shared Seed & Reproducibility:** Ensures the same procedural generation outcomes across sessions, especially critical in multiplayer where all players must see the same world.
- **Gameplay Variation:** Powers unpredictable but controlled events like power-up placement, equipment spawn timing, or terrain feature distribution.
- **Modularity:** Encapsulating random logic separately allows easy swapping or tuning of randomness parameters.

---

## 10. `PowerUpManager.js`
**Purpose & Role:**  
`PowerUpManager.js` governs creation, animation, and collection logic of power-ups (speed boosts, point bonuses, etc.).

**Key Considerations:**
- **Spawning & Positioning:** Uses randomness and possibly noise-based generation to place power-ups in plausible locations.
- **Visual Differentiation & Animation:** Rotations or bobbing animations make power-ups visible and appealing.
- **Collection Logic:** Integrates with collision checks and modifies the skier’s abilities or scores upon collection.

---

## 11. `SkiEquipmentManager.js`
**Purpose & Role:**  
`SkiEquipmentManager.js` handles items that modify the skier’s attributes (e.g., better turning, higher jumps).

**Key Considerations:**
- **Spawn & Distribution:** Similar to `PowerUpManager.js`, but focused on equipment that changes skier stats rather than one-off power-ups.
- **Visual & Gameplay Distinction:** Ensures equipment items stand out from power-ups, both visually and functionally.
- **Integration with Skier State:** On collection, modifies skier properties (`maxSpeed`, `turningSpeed`), strengthening the ties between modules.

---

## 12. `Ramp.js`
**Purpose & Role:**  
`Ramp.js` defines static structures like ramps that alter skier movement when traversed.

**Key Considerations:**
- **3D Geometry Management:** Creates geometric shapes (e.g., an inclined plane) placed in the scene.
- **Integration with Skier Mechanics:** On intersecting a ramp, `Skier.js` may trigger jump logic or trick opportunities.
- **Performance:** Typically simple geometry for minimal overhead, as many ramps might populate the scene.

---

## 13. `WeatherSystem.js`
**Purpose & Role:**  
`WeatherSystem.js` handles visual weather phenomena (e.g., snowfall) using a separate 2D canvas overlay.

**Key Considerations:**
- **Canvas-Based Effects:** Renders weather independently of the main 3D scene, allowing layered effects at low overhead.
- **Particle Simulation & Culling:** Spawns, moves, and removes weather particles (snowflakes), ensuring continuous atmospheric conditions.
- **Atmospheric Immersion:** Adjusting density, speed, and opacity of weather effects can influence the player’s perception of speed, difficulty, or ambiance.

---

## Interdependencies & Complexity
Most modules revolve around `GameManager.js` as the central hub. `GameManager` updates entities from `Skier.js`, spawns items from `PowerUpManager.js` and `SkiEquipmentManager.js`, uses noise functions from `SimplexNoise.js`, and random values from `Random.js`. Asynchronous model loading in `Skier.js` and others requires careful null checks in `GameManager.js`. `InputManager.js` feeds user input states into `GameManager.js`, which updates the camera and skier accordingly. Visual aspects blend via `index.html` and `styles.css` for UI, with overlay effects from `WeatherSystem.js`.

