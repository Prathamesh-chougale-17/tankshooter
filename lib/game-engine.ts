interface Vector2 {
  x: number;
  y: number;
}

interface Tank {
  id: string;
  name: string;
  position: Vector2;
  rotation: number;
  health: number;
  maxHealth: number;
  score: number;
  level: number;
  kills: number;
  tankClass: string;
  color: string;
}

interface Bullet {
  id: string;
  position: Vector2;
  velocity: Vector2;
  damage: number;
  ownerId: string;
  size: number;
  color: string;
}

interface Obstacle {
  id: string;
  position: Vector2;
  size: Vector2;
  type: string;
}

interface PowerUp {
  id: string;
  position: Vector2;
  type: string;
  value: number;
}

interface PlayerStats {
  score: number;
  level: number;
  kills: number;
  health: number;
  maxHealth: number;
}

interface GameState {
  tanks: Map<string, Tank>;
  bullets: Bullet[];
  obstacles: Obstacle[];
  powerUps: PowerUp[];
}

interface GameOptions {
  playerName: string;
  tankClass: string;
  gameMode: string;
  onStatsUpdate: (stats: PlayerStats) => void;
  onGameOver: (gameOverData: GameOverData) => void;
}

interface GameOverData {
  finalScore: number;
  finalLevel: number;
  totalKills: number;
  survivalTime: number;
  cause: string;
  killedBy?: string;
}

interface Bot extends Tank {
  target: Vector2 | null;
  lastShot: number;
  moveDirection: Vector2;
  changeDirectionTime: number;
  aggroRange: number;
  shootRange: number;
  difficulty: "easy" | "medium" | "hard";
}

interface ServerMessage {
  type: string;
  [key: string]: unknown;
}

class AIBot {
  private bot: Bot;
  private gameState: GameState;

  constructor(bot: Bot, gameState: GameState) {
    this.bot = bot;
    this.gameState = gameState;
  }

  update(deltaTime: number) {
    this.updateMovement(deltaTime);
    this.updateTargeting();
    this.updateShooting(deltaTime);
  }

  private updateMovement(deltaTime: number) {
    const speed = this.getDifficultySpeed();
    const moveDistance = speed * (deltaTime / 1000);

    // Change direction periodically or when hitting boundaries
    if (
      Date.now() > this.bot.changeDirectionTime ||
      this.shouldAvoidBoundary()
    ) {
      this.chooseNewDirection();
    }

    // Move towards target if aggressive, otherwise wander
    if (this.bot.target && this.isInAggroRange()) {
      this.moveTowardsTarget(moveDistance);
    } else {
      this.wanderMovement(moveDistance);
    }
  }

  private getDifficultySpeed(): number {
    switch (this.bot.difficulty) {
      case "easy":
        return 120;
      case "medium":
        return 160;
      case "hard":
        return 200;
      default:
        return 140;
    }
  }

  private shouldAvoidBoundary(): boolean {
    const boundary = 1500;
    return (
      Math.abs(this.bot.position.x) > boundary ||
      Math.abs(this.bot.position.y) > boundary
    );
  }

  private chooseNewDirection() {
    // If near boundary, move towards center
    if (this.shouldAvoidBoundary()) {
      const angle = Math.atan2(-this.bot.position.y, -this.bot.position.x);
      this.bot.moveDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };
    } else {
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      this.bot.moveDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };
    }

    this.bot.changeDirectionTime = Date.now() + 2000 + Math.random() * 3000;
  }

  private moveTowardsTarget(moveDistance: number) {
    if (!this.bot.target) return;

    const dx = this.bot.target.x - this.bot.position.x;
    const dy = this.bot.target.y - this.bot.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Move towards target but maintain some distance
      const minDistance = 150;
      if (distance > minDistance) {
        this.bot.position.x += (dx / distance) * moveDistance;
        this.bot.position.y += (dy / distance) * moveDistance;
      } else {
        // Circle around target
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        this.bot.position.x += Math.cos(angle) * moveDistance * 0.5;
        this.bot.position.y += Math.sin(angle) * moveDistance * 0.5;
      }
    }
  }

  private wanderMovement(moveDistance: number) {
    this.bot.position.x += this.bot.moveDirection.x * moveDistance;
    this.bot.position.y += this.bot.moveDirection.y * moveDistance;
  }

  private updateTargeting() {
    let closestPlayer: Tank | null = null;
    let closestDistance = this.bot.aggroRange;

    // Find closest human player
    for (const tank of this.gameState.tanks.values()) {
      if (tank.id === this.bot.id || tank.id.startsWith("bot_")) continue;

      const distance = this.getDistance(this.bot.position, tank.position);
      if (distance < closestDistance) {
        closestPlayer = tank;
        closestDistance = distance;
      }
    }

    if (closestPlayer) {
      this.bot.target = closestPlayer.position;
      // Aim at target
      const dx = closestPlayer.position.x - this.bot.position.x;
      const dy = closestPlayer.position.y - this.bot.position.y;
      this.bot.rotation = Math.atan2(dy, dx);
    } else {
      this.bot.target = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private updateShooting(deltaTime: number) {
    const now = Date.now();
    const shootCooldown = this.getDifficultyShootCooldown();
    // If auto-fire is enabled, shoot at target if in range
    if (this.bot.target && this.isInAggroRange()) {
      // Aim at target
      const dx = this.bot.target.x - this.bot.position.x;
      const dy = this.bot.target.y - this.bot.position.y;
      this.bot.rotation = Math.atan2(dy, dx);
    }

    if (
      this.bot.target &&
      this.isInShootRange() &&
      now - this.bot.lastShot > shootCooldown
    ) {
      this.shoot();
      this.bot.lastShot = now;
    }
  }

  private getDifficultyShootCooldown(): number {
    switch (this.bot.difficulty) {
      case "easy":
        return 800;
      case "medium":
        return 600;
      case "hard":
        return 400;
      default:
        return 600;
    }
  }

  private isInAggroRange(): boolean {
    if (!this.bot.target) return false;
    return (
      this.getDistance(this.bot.position, this.bot.target) <=
      this.bot.aggroRange
    );
  }

  private isInShootRange(): boolean {
    if (!this.bot.target) return false;
    return (
      this.getDistance(this.bot.position, this.bot.target) <=
      this.bot.shootRange
    );
  }

  private getDistance(pos1: Vector2, pos2: Vector2): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private shoot() {
    const bulletSpeed = 600;
    const bulletSize = 6;

    const bullet: Bullet = {
      id: Math.random().toString(36).substr(2, 9),
      position: { ...this.bot.position },
      velocity: {
        x: Math.cos(this.bot.rotation) * bulletSpeed,
        y: Math.sin(this.bot.rotation) * bulletSpeed,
      },
      damage: 30,
      ownerId: this.bot.id,
      size: bulletSize,
      color: this.bot.color,
    };

    this.gameState.bullets.push(bullet);
  }
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private playerId: string;
  private options: GameOptions;
  private keys: Set<string> = new Set();
  private mouse: Vector2 = { x: 0, y: 0 };
  private camera: Vector2 = { x: 0, y: 0 };
  private isRunning = false;
  private isGameOver = false;
  private lastTime = 0;
  private autoFire = false;
  private bots: Map<string, AIBot> = new Map();
  private lastBotSpawn = 0;
  private lastPlayerShot = 0;
  private healthRegenCooldown = 3000;
  private botSpawnTimer = 0;
  private botSpawnInterval = 2000;
  private maxBots = 15;
  private gameStartTime = 0;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, options: GameOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.options = options;
    this.playerId = Math.random().toString(36).substr(2, 9);

    this.gameState = {
      tanks: new Map(),
      bullets: [],
      obstacles: [],
      powerUps: [],
    };

    this.setupEventListeners();
    this.initializePlayer();
  }

  private setupEventListeners() {
    // Keyboard events
    window.addEventListener("keydown", (e) => {
      if (this.isGameOver) return; // Prevent input when game is over

      this.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e") {
        this.autoFire = !this.autoFire;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (this.isGameOver) return; // Prevent input when game is over

      this.keys.delete(e.key.toLowerCase());
    });

    // Mouse events
    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isGameOver) return; // Prevent input when game is over

      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener("mousedown", (e) => {
      if (this.isGameOver) return; // Prevent input when game is over

      if (e.button === 0) {
        this.shoot();
      }
    });

    // Prevent context menu
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  private initializePlayer() {
    const player: Tank = {
      id: this.playerId,
      name: this.options.playerName,
      position: { x: 0, y: 0 }, // Start at center
      rotation: 0,
      health: 1000,
      maxHealth: 1000,
      score: 0,
      level: 1,
      kills: 0,
      tankClass: this.options.tankClass,
      color: this.getTankColor(this.options.tankClass),
    };

    this.gameState.tanks.set(this.playerId, player);
    this.updateStats(player);
  }

  private spawnBot(difficulty: "easy" | "medium" | "hard" = "medium") {
    if (this.isGameOver) return; // Don't spawn bots if game is over

    const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
    const botNames = [
      "Alpha",
      "Beta",
      "Gamma",
      "Delta",
      "Epsilon",
      "Zeta",
      "Eta",
      "Theta",
      "Hunter",
      "Stalker",
      "Predator",
      "Warrior",
      "Guardian",
      "Sentinel",
    ];

    // Spawn bot away from player
    const player = this.gameState.tanks.get(this.playerId);
    const spawnDistance = 400 + Math.random() * 600;
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnX =
      (player?.position.x || 0) + Math.cos(spawnAngle) * spawnDistance;
    const spawnY =
      (player?.position.y || 0) + Math.sin(spawnAngle) * spawnDistance;

    const bot: Bot = {
      id: botId,
      name: botNames[Math.floor(Math.random() * botNames.length)],
      position: { x: spawnX, y: spawnY },
      rotation: Math.random() * Math.PI * 2,
      health: difficulty === "easy" ? 200 : difficulty === "medium" ? 300 : 400,
      maxHealth:
        difficulty === "easy" ? 200 : difficulty === "medium" ? 300 : 400,
      score: Math.floor(Math.random() * 5000),
      level: Math.floor(Math.random() * 20) + 1,
      kills: Math.floor(Math.random() * 10),
      tankClass: ["basic", "twin", "sniper"][Math.floor(Math.random() * 3)],
      color: this.getBotColor(difficulty),
      target: null,
      lastShot: 0,
      moveDirection: { x: 0, y: 0 },
      changeDirectionTime: Date.now(),
      aggroRange:
        difficulty === "easy" ? 350 : difficulty === "medium" ? 450 : 600,
      shootRange:
        difficulty === "easy" ? 300 : difficulty === "medium" ? 400 : 550,
      difficulty,
    };

    this.gameState.tanks.set(botId, bot);
    this.bots.set(botId, new AIBot(bot, this.gameState));
  }

  private getBotColor(difficulty: "easy" | "medium" | "hard"): string {
    switch (difficulty) {
      case "easy":
        return "#90EE90";
      case "medium":
        return "#FFA500";
      case "hard":
        return "#FF6B6B";
      default:
        return "#FFA500";
    }
  }

  private getTankColor(tankClass: string): string {
    const colors = {
      basic: "#4A90E2",
      twin: "#7ED321",
      sniper: "#F5A623",
      "machine-gun": "#D0021B",
    };
    return colors[tankClass as keyof typeof colors] || "#4A90E2";
  }

  private updateStats(player: Tank) {
    this.options.onStatsUpdate({
      score: player.score,
      level: player.level,
      kills: player.kills,
      health: Math.max(0, player.health), // Ensure health doesn't go below 0
      maxHealth: player.maxHealth,
    });
  }

  private triggerGameOver(killedBy?: string) {
    if (this.isGameOver) return; // Prevent multiple game over triggers

    this.isGameOver = true;
    this.isRunning = false;

    const player = this.gameState.tanks.get(this.playerId);
    const survivalTime = Date.now() - this.gameStartTime;

    const gameOverData: GameOverData = {
      finalScore: player?.score || 0,
      finalLevel: player?.level || 1,
      totalKills: player?.kills || 0,
      survivalTime: Math.floor(survivalTime / 1000), // Convert to seconds
      cause: killedBy ? "Destroyed by enemy" : "Unknown",
      killedBy: killedBy,
    };

    // Clear all inputs
    this.keys.clear();
    this.autoFire = false;

    // Stop all bots
    this.bots.clear();

    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Trigger game over callback
    this.options.onGameOver(gameOverData);
  }

  public stop() {
    this.isRunning = false;
    this.isGameOver = false;

    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear all game state
    this.gameState.tanks.clear();
    this.gameState.bullets = [];
    this.bots.clear();

    // Clear input state
    this.keys.clear();
    this.autoFire = false;

    // Reset timers
    this.lastTime = 0;
    this.lastPlayerShot = 0;
    this.lastBotSpawn = 0;
    this.botSpawnTimer = 0;
  }

  public restart() {
    // Stop current game completely
    this.stop();

    // Reset all flags
    this.isGameOver = false;
    this.isRunning = false;

    // Generate new player ID to ensure fresh start
    this.playerId = Math.random().toString(36).substr(2, 9);

    // Clear and reinitialize game state
    this.gameState = {
      tanks: new Map(),
      bullets: [],
      obstacles: [],
      powerUps: [],
    };

    // Reinitialize player at center
    this.initializePlayer();

    // Ensure canvas is properly sized
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Reset camera to center on player (player is at 0,0)
    this.camera = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };

    // Reset mouse position to center of canvas
    this.mouse = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };

    // Clear canvas completely
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Start the game fresh
    this.start();

    // Ensure camera is centered after everything is initialized
    requestAnimationFrame(() => {
      const player = this.gameState.tanks.get(this.playerId);
      if (player) {
        this.camera.x = -player.position.x + this.canvas.width / 2;
        this.camera.y = -player.position.y + this.canvas.height / 2;
      }
    });
  }

  public start() {
    if (this.isRunning) return; // Prevent multiple starts

    this.isRunning = true;
    this.isGameOver = false;
    this.gameStartTime = Date.now();
    this.botSpawnTimer = Date.now();
    this.lastTime = 0; // Reset time tracking

    // Ensure player is properly initialized and visible
    const player = this.gameState.tanks.get(this.playerId);
    if (player) {
      // Reset player position to center
      player.position = { x: 0, y: 0 };
      player.health = player.maxHealth;
      this.updateStats(player);
    }

    // Reset camera to follow player
    // Force immediate camera update to center on player without interpolation
    const currentPlayer = this.gameState.tanks.get(this.playerId);
    if (currentPlayer) {
      this.camera.x = -currentPlayer.position.x + this.canvas.width / 2;
      this.camera.y = -currentPlayer.position.y + this.canvas.height / 2;
    }

    // Spawn initial wave of bots
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (this.isRunning && !this.isGameOver) {
          const difficulty = this.getDynamicDifficulty();
          this.spawnBot(difficulty);
        }
      }, i * 500);
    }

    // Start game loop
    this.gameLoop(performance.now());
  }

  private gameLoop(currentTime: number) {
    if (!this.isRunning || this.isGameOver) {
      this.animationFrameId = null;
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame((time) =>
      this.gameLoop(time)
    );
  }

  private update(deltaTime: number) {
    if (this.isGameOver) return;

    this.updatePlayer(deltaTime);
    this.updateBots(deltaTime);
    this.updateBullets(deltaTime);
    this.updateCollisions();
    this.updateCamera();
    this.spawnBotsIfNeeded();

    if (this.autoFire && !this.isGameOver) {
      this.shoot();
    }
  }

  private updateBots(deltaTime: number) {
    if (this.isGameOver) return;

    for (const [botId, aiBot] of this.bots) {
      const bot = this.gameState.tanks.get(botId) as Bot;
      if (bot && bot.health > 0) {
        aiBot.update(deltaTime);

        // Bot health regeneration
        if (bot.health < bot.maxHealth) {
          bot.health = Math.min(bot.maxHealth, bot.health + 0.3);
        }
      } else if (bot) {
        // Remove dead bot
        this.gameState.tanks.delete(botId);
        this.bots.delete(botId);
      }
    }
  }

  private updateCollisions() {
    if (this.isGameOver) return;

    const player = this.gameState.tanks.get(this.playerId);
    if (!player) return;

    // Check bullet collisions
    this.gameState.bullets = this.gameState.bullets.filter((bullet) => {
      for (const [tankId, tank] of this.gameState.tanks) {
        if (tankId === bullet.ownerId) continue;

        const distance = Math.sqrt(
          Math.pow(bullet.position.x - tank.position.x, 2) +
            Math.pow(bullet.position.y - tank.position.y, 2)
        );

        if (distance < 20 + bullet.size) {
          // Hit!
          tank.health -= bullet.damage;

          if (tank.health <= 0) {
            // Tank destroyed
            const shooter = this.gameState.tanks.get(bullet.ownerId);

            if (tankId === this.playerId) {
              // Player was killed - trigger game over
              const killerName = shooter?.name || "Unknown Enemy";
              this.triggerGameOver(killerName);
              return false; // Remove bullet
            }

            if (shooter) {
              shooter.kills++;
              shooter.score += tank.id.startsWith("bot_") ? 200 : 500;
              if (shooter.id === this.playerId) {
                this.updateStats(shooter);
              }
            }

            // Respawn bot if it was a bot
            if (tankId.startsWith("bot_")) {
              this.gameState.tanks.delete(tankId);
              this.bots.delete(tankId);
              // Immediate respawn for continuous action
              setTimeout(() => {
                if (!this.isGameOver) {
                  this.spawnBot(this.getDynamicDifficulty());
                }
              }, 1000);
            }
          } else {
            // Update player stats if player was hit but not killed
            if (tankId === this.playerId) {
              this.updateStats(tank);
            }
          }

          return false; // Remove bullet
        }
      }
      return true; // Keep bullet
    });
  }

  private spawnBotsIfNeeded() {
    if (this.isGameOver) return;

    const now = Date.now();

    // Continuous bot spawning
    if (
      now - this.botSpawnTimer > this.botSpawnInterval &&
      this.bots.size < this.maxBots
    ) {
      const difficulty = this.getDynamicDifficulty();
      this.spawnBot(difficulty);
      this.botSpawnTimer = now;

      // Slightly randomize next spawn time
      this.botSpawnInterval = 1500 + Math.random() * 1000;
    }
  }

  private getDynamicDifficulty(): "easy" | "medium" | "hard" {
    const player = this.gameState.tanks.get(this.playerId);
    if (!player) return "easy";

    // Scale difficulty based on player score and level
    const scoreThreshold = player.score / 1000;
    const levelThreshold = player.level;

    if (scoreThreshold > 20 || levelThreshold > 15) {
      return Math.random() < 0.5 ? "hard" : "medium";
    } else if (scoreThreshold > 10 || levelThreshold > 8) {
      return Math.random() < 0.3
        ? "hard"
        : Math.random() < 0.6
        ? "medium"
        : "easy";
    } else {
      return Math.random() < 0.2 ? "medium" : "easy";
    }
  }

  private updatePlayer(deltaTime: number) {
    if (this.isGameOver) return;

    const player = this.gameState.tanks.get(this.playerId);
    if (!player) return;

    const speed = 200;
    const moveDistance = speed * (deltaTime / 1000);

    // Movement
    if (this.keys.has("w") || this.keys.has("arrowup")) {
      player.position.y -= moveDistance;
    }
    if (this.keys.has("s") || this.keys.has("arrowdown")) {
      player.position.y += moveDistance;
    }
    if (this.keys.has("a") || this.keys.has("arrowleft")) {
      player.position.x -= moveDistance;
    }
    if (this.keys.has("d") || this.keys.has("arrowright")) {
      player.position.x += moveDistance;
    }

    // Rotation (aim towards mouse)
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    player.rotation = Math.atan2(
      this.mouse.y - centerY,
      this.mouse.x - centerX
    );

    // Health regeneration - only when not shooting
    const now = Date.now();
    const timeSinceLastShot = now - this.lastPlayerShot;

    if (
      player.health < player.maxHealth &&
      timeSinceLastShot > this.healthRegenCooldown
    ) {
      player.health = Math.min(player.maxHealth, player.health + 3);
    }

    this.updateStats(player);
  }

  private updateBullets(deltaTime: number) {
    if (this.isGameOver) return;

    this.gameState.bullets = this.gameState.bullets.filter((bullet) => {
      bullet.position.x += bullet.velocity.x * (deltaTime / 1000);
      bullet.position.y += bullet.velocity.y * (deltaTime / 1000);

      // Remove bullets that are too far from any player
      const maxDistance = 2000;
      let shouldKeep = false;

      for (const tank of this.gameState.tanks.values()) {
        const distance = Math.sqrt(
          Math.pow(bullet.position.x - tank.position.x, 2) +
            Math.pow(bullet.position.y - tank.position.y, 2)
        );
        if (distance < maxDistance) {
          shouldKeep = true;
          break;
        }
      }

      return shouldKeep;
    });
  }

  private updateCamera() {
    const player = this.gameState.tanks.get(this.playerId);
    if (!player) return;

    // Smooth camera follow - center player on screen
    const targetX = -player.position.x + this.canvas.width / 2;
    const targetY = -player.position.y + this.canvas.height / 2;

    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;
  }

  private shoot() {
    if (this.isGameOver) return;

    const player = this.gameState.tanks.get(this.playerId);
    if (!player) return;

    // Track when player shoots for health regen
    this.lastPlayerShot = Date.now();

    const bulletSpeed = 800;
    const bulletSize = 8;

    const bullet: Bullet = {
      id: Math.random().toString(36).substr(2, 9),
      position: { ...player.position },
      velocity: {
        x: Math.cos(player.rotation) * bulletSpeed,
        y: Math.sin(player.rotation) * bulletSpeed,
      },
      damage: 50,
      ownerId: player.id,
      size: bulletSize,
      color: player.color,
    };

    this.gameState.bullets.push(bullet);
  }

  private render() {
    // Clear canvas completely
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fill with background color
    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context for camera transform
    this.ctx.save();
    this.ctx.translate(this.camera.x, this.camera.y);

    // Draw grid
    this.drawGrid();

    // Draw game objects
    this.drawTanks();
    this.drawBullets();

    // Restore context
    this.ctx.restore();

    // Draw game over overlay if needed
    if (this.isGameOver) {
      this.drawGameOverOverlay();
    }
  }

  private drawGameOverOverlay() {
    // Semi-transparent overlay
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game Over text
    this.ctx.fillStyle = "#FF4444";
    this.ctx.font = "bold 72px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "GAME OVER",
      this.canvas.width / 2,
      this.canvas.height / 2 - 100
    );

    // Additional info
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "24px Arial";
    this.ctx.fillText(
      "Your tank has been destroyed!",
      this.canvas.width / 2,
      this.canvas.height / 2 - 40
    );

    this.ctx.font = "18px Arial";
    this.ctx.fillStyle = "#CCCCCC";
    this.ctx.fillText(
      "Press ESC or click Menu to return to main screen",
      this.canvas.width / 2,
      this.canvas.height / 2 + 60
    );
  }

  private drawGrid() {
    const gridSize = 50;
    const startX = Math.floor(-this.camera.x / gridSize) * gridSize;
    const startY = Math.floor(-this.camera.y / gridSize) * gridSize;
    const endX = startX + this.canvas.width + gridSize;
    const endY = startY + this.canvas.height + gridSize;

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;

    for (let x = startX; x < endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  private drawTanks() {
    for (const tank of this.gameState.tanks.values()) {
      this.drawTank(tank);
    }
  }

  private drawTank(tank: Tank) {
    const size = 40;

    this.ctx.save();
    this.ctx.translate(tank.position.x, tank.position.y);

    // Draw tank body
    this.ctx.fillStyle = tank.color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw tank outline
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw cannon
    this.ctx.rotate(tank.rotation);
    this.ctx.fillStyle = tank.color;
    this.ctx.fillRect(0, -4, size * 0.8, 8);
    this.ctx.strokeRect(0, -4, size * 0.8, 8);

    this.ctx.restore();

    // Draw name and health bar
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "12px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(tank.name, tank.position.x, tank.position.y - size);

    // Health bar
    const barWidth = 40;
    const barHeight = 4;
    const healthPercent = tank.health / tank.maxHealth;

    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(
      tank.position.x - barWidth / 2,
      tank.position.y + size / 2 + 5,
      barWidth,
      barHeight
    );

    this.ctx.fillStyle =
      healthPercent > 0.5
        ? "#4CAF50"
        : healthPercent > 0.25
        ? "#FFC107"
        : "#F44336";
    this.ctx.fillRect(
      tank.position.x - barWidth / 2,
      tank.position.y + size / 2 + 5,
      barWidth * healthPercent,
      barHeight
    );
  }

  private drawBullets() {
    for (const bullet of this.gameState.bullets) {
      this.ctx.fillStyle = bullet.color;
      this.ctx.beginPath();
      this.ctx.arc(
        bullet.position.x,
        bullet.position.y,
        bullet.size,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }

  public handleResize() {
    // Update canvas size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Update mouse position to center if not set
    if (this.mouse.x === 0 && this.mouse.y === 0) {
      this.mouse = {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
      };
    }

    // Recenter camera on player after resize
    const player = this.gameState.tanks.get(this.playerId);
    if (player) {
      this.camera.x = -player.position.x + this.canvas.width / 2;
      this.camera.y = -player.position.y + this.canvas.height / 2;
    }
  }

  public handleServerMessage(data: ServerMessage) {
    // Handle messages from WebSocket server
    switch (data.type) {
      case "player-update":
        // Update other players
        break;
      case "bullet-update":
        // Update bullets
        break;
      case "chat":
        // Handle chat messages
        break;
    }
  }

  public upgradePlayer(upgradeType: string) {
    if (this.isGameOver) return;

    const player = this.gameState.tanks.get(this.playerId);
    if (!player) return;

    // Apply upgrade based on type
    switch (upgradeType) {
      case "max-health":
        player.maxHealth += 100;
        player.health = player.maxHealth;
        break;
      case "damage":
        // Increase damage stats
        break;
      // Add more upgrade types
    }

    this.updateStats(player);
  }

  public getPlayerId() {
    return this.playerId;
  }

  public getGameState() {
    return this.gameState;
  }

  public get gameOver() {
    return this.isGameOver;
  }
}
