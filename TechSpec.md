FIGMA : https://www.figma.com/board/eAffxzeJBNH588hnOs6XNV/Untitled?node-id=0-1&t=TSkCfvUGktPEEAmh-1

# Technical Specification for Skiing Game

## Technology Stack
- **Core Engine:** Unity (3D implementation) or Phaser (Web-based 2D version)
- **Programming Language:** C# (Unity) or JavaScript/TypeScript (Phaser)
- **Rendering Library:** Three.js for web-based 3D graphics
- **Backend Services:** Firebase (for data storage, user authentication)
- **Deployment Platform:** Web browser, with options for mobile apps in future iterations

---

## Architecture and Components

### 1. **Game Manager**
Manages the overall game state, including levels, player data, score tracking, and user navigation.

- **Variables:**
  - `currentLevel: int` - Tracks the current level of the player.
  - `score: int` - Player’s score for performing tricks and completing challenges.
  - `lives: int` - Number of lives remaining.
  - `player: Skier` - Instance of the skier character.
  - `challenges: List<Challenge>` - Array of active challenges for the level.
  - `isPaused: boolean` - Boolean value to indicate if the game is paused.
  - `timer: double` - Countdown timer for specific timed challenges.
  - `gameTime: double` - The total time elapsed in the game.
  - `unlockedMaps: List<Map>` - List of maps unlocked by the player.
  - `gearInventory: List<Gear>` - Player’s unlocked gear and equipment.

- **Methods:**
  - `initializeGame()` - Sets up a new game by initializing score, lives, and loading `currentLevel`.
  - `startLevel()` - Begins a level by resetting player and map to initial state.
  - `pauseGame()` - Freezes all game activity and shows the pause menu.
  - `resumeGame()` - Resumes game from pause.
  - `endLevel()` - Completes the current level, updates progress, and unlocks new maps or gear if criteria are met.
  - `updateScore(int points)` - Adds `points` to the current `score`.
  - `checkGameOver()` - Ends the game if `lives` are 0 and presents game-over options.
  - `resetGame()` - Resets the game state for a fresh start.
  - `togglePause()` - Toggles the pause state of the game.
  - `tickGamePlay(double deltaTime)` - Main game loop that updates skier and checks interactions based on `deltaTime`.
  - `navigateMenu(String menuOption)` - Handles navigation between different menus, like "Play," "Customization," and "Leaderboards".

---

### 2. **Skier**
Handles skier movement, trick performance, and physics interactions.

- **Variables:**
  - `position: Point3D` - The skier’s current position in 3D space.
  - `speed: float` - The skier’s speed, affected by slope and snow friction.
  - `direction: Vector3` - The skier’s movement direction in 3D.
  - `currentTrick: Trick` - Trick being performed, if any.
  - `comboMultiplier: float` - Score multiplier for chaining tricks.
  - `equipment: Gear` - Currently equipped skis or gear affecting performance.

- **Methods:**
  - `move(Vector3 direction)` - Moves skier in the specified direction, checks for collisions, and applies gravity.
  - `jump()` - Initiates a jump, enabling trick performance.
  - `performTrick(Trick trick)` - Executes a trick, updating `score` based on difficulty.
  - `landTrick()` - Checks if skier successfully lands a trick, applying multipliers if successful.
  - `resetPosition(Point3D startPosition)` - Resets the skier’s position to the specified `startPosition` for a new level or after a fall.
  - `equipGear(Gear newGear)` - Equips new gear and updates skier stats accordingly.

---

### 3. **Map Manager**
Manages map layout, obstacles, dynamic terrain, and weather conditions.

- **Variables:**
  - `currentMap: Map` - Current map data, including terrain and obstacle positions.
  - `obstacles: List<Obstacle>` - List of obstacles (e.g., rocks, trees, rails) present in the map.
  - `terrainType: enum` - Enum indicating snow type (e.g., powder, ice, slush) affecting movement.
  - `weatherCondition: enum` - Enum for dynamic weather (e.g., clear, snowy, foggy).
  - `unlockedChallenges: List<Challenge>` - Challenges specific to the current map.

- **Methods:**
  - `loadMap(int level)` - Loads and initializes map data for the specified level.
  - `checkCollision(Point3D position)` - Checks if the skier has collided with an obstacle.
  - `generateObstacle()` - Randomly generates obstacles based on difficulty level.
  - `applyTerrainEffect(Skier skier)` - Adjusts skier’s speed and control based on terrain.
  - `updateWeatherConditions()` - Dynamically changes weather during gameplay to increase immersion.

---

### 4. **Physics Engine**
Handles physics calculations for gravity, friction, and collisions to create realistic skiing mechanics.

- **Methods:**
  - `applyGravity(Skier skier)` - Applies gravity to the skier, affecting speed and jump height.
  - `calculateFriction(Skier skier, Terrain terrain)` - Calculates the impact of friction on skier’s speed based on the terrain type.
  - `detectCollision(GameObject obj1, GameObject obj2)` - Detects and handles collisions between game objects.
  - `simulateSnowResistance(Skier skier, Terrain terrain)` - Simulates resistance based on snow type and skier speed.

---

## User Flow

1. **Main Menu:**
   - Options for “Play,” “Customization,” “Leaderboards,” and “Settings.”
   - **Play:** Leads to map selection and game mode choices (e.g., time trial, freestyle).
   - **Customization:** Allows players to equip new gear and customize skier appearance.
   - **Leaderboards:** Displays global and local rankings for scores and times.
   - **Settings:** Provides options for game preferences and audio adjustments.

2. **Play Mode:**
   - Players select a map and game mode.
   - Players can earn points by performing tricks and racing against time.
   - Progression is tracked, and new maps or gear are unlocked based on performance.

3. **Customization:**
   - Players can choose from unlocked skis and gear.
   - Equipment stats are displayed, showing the impact on speed, control, and trick ability.

4. **Progression:**
   - Earn points and experience by completing challenges and missions.
   - Unlock new maps and gear by achieving high scores or completing skill-based objectives.

---

## Core Gameplay Mechanics

- **Skill-Based Gameplay:**
  - Perform tricks like grabs, flips, and spins to earn points.
  - Chain tricks together for combo multipliers.
  - Compete in time trials to race down courses with speed and precision.

- **Scoring System:**
  - Points are awarded based on the complexity of tricks and combos.
  - Leaderboards track both the highest scores and fastest times globally and locally.

- **Adaptive Difficulty:**
  - Levels increase in difficulty, requiring players to improve skills to progress.
  - Courses feature varied terrain and weather to challenge players.

---

## Interactive Elements

- **Controls:**
  - Responsive controls for skier movement, jumping, and trick execution.
  - Tutorial levels to introduce basic and advanced mechanics.

- **Feedback:**
  - On-screen prompts display combo multipliers and trick names.
  - Real-time updates for score, time, and upcoming terrain changes.

---

## Challenges and Events

- **Daily Challenges:** Specific tasks that provide bonus points and rewards.
- **Skill Missions:** Focused objectives for mastering particular tricks or combinations.
- **Dynamic Events:** Weather and terrain changes that require adaptation.

---