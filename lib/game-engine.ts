import { getSoundManager } from "./sound-manager";

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
  isRegenerating: boolean;
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
  sendMessage?: (message: { type: string; [key: string]: unknown }) => void;
  enableBots?: boolean;
  // Competition mode settings
  isCompetitionMode?: boolean;
  competitionDuration?: number; // Duration in seconds (default 180 - 3 minutes)
}

interface GameOverData {
  finalScore: number;
  finalLevel: number;
  totalKills: number;
  survivalTime: number;
  cause: string;
  killedBy?: string;
  // Competition mode fields
  winner?: string;
  timeUp?: boolean;
  isCompetitionMode?: boolean;
  prizeAmount?: number;
  entryFee?: number;
  playerQualified?: boolean;
  playerWon?: boolean;
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
  private worldBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };

  constructor(
    bot: Bot,
    gameState: GameState,
    worldBounds: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
      width: number;
      height: number;
    }
  ) {
    this.bot = bot;
    this.gameState = gameState;
    this.worldBounds = worldBounds;
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
    const margin = 100; // Stay 100 units away from boundary
    return (
      this.bot.position.x <= this.worldBounds.minX + margin ||
      this.bot.position.x >= this.worldBounds.maxX - margin ||
      this.bot.position.y <= this.worldBounds.minY + margin ||
      this.bot.position.y >= this.worldBounds.maxY - margin
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
      let newX: number, newY: number;

      if (distance > minDistance) {
        newX = this.bot.position.x + (dx / distance) * moveDistance;
        newY = this.bot.position.y + (dy / distance) * moveDistance;
      } else {
        // Circle around target
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        newX = this.bot.position.x + Math.cos(angle) * moveDistance * 0.5;
        newY = this.bot.position.y + Math.sin(angle) * moveDistance * 0.5;
      }

      // Check boundaries before moving
      if (newX >= this.worldBounds.minX && newX <= this.worldBounds.maxX) {
        this.bot.position.x = newX;
      }

      if (newY >= this.worldBounds.minY && newY <= this.worldBounds.maxY) {
        this.bot.position.y = newY;
      }

      // Ensure bot stays within bounds
      this.bot.position.x = Math.max(
        this.worldBounds.minX,
        Math.min(this.worldBounds.maxX, this.bot.position.x)
      );
      this.bot.position.y = Math.max(
        this.worldBounds.minY,
        Math.min(this.worldBounds.maxY, this.bot.position.y)
      );
    }
  }

  private wanderMovement(moveDistance: number) {
    const newX = this.bot.position.x + this.bot.moveDirection.x * moveDistance;
    const newY = this.bot.position.y + this.bot.moveDirection.y * moveDistance;

    // Check boundaries and adjust position
    if (newX >= this.worldBounds.minX && newX <= this.worldBounds.maxX) {
      this.bot.position.x = newX;
    } else {
      // Reverse X direction when hitting boundary
      this.bot.moveDirection.x *= -1;
    }

    if (newY >= this.worldBounds.minY && newY <= this.worldBounds.maxY) {
      this.bot.position.y = newY;
    } else {
      // Reverse Y direction when hitting boundary
      this.bot.moveDirection.y *= -1;
    }

    // Ensure bot stays within bounds
    this.bot.position.x = Math.max(
      this.worldBounds.minX,
      Math.min(this.worldBounds.maxX, this.bot.position.x)
    );
    this.bot.position.y = Math.max(
      this.worldBounds.minY,
      Math.min(this.worldBounds.maxY, this.bot.position.y)
    );
  }

  private updateTargeting() {
    let closestPlayer: Tank | null = null;
    let closestDistance = this.bot.aggroRange;

    // Determine if this is a competition mode bot by checking the id and competitionMode flag
    // We need a workaround since GameState doesn't have isCompetitionMode
    // Check if the bot ID follows the competition bot naming pattern instead
    const isCompetitionBot =
      this.bot.id.startsWith("bot_") && this.bot.difficulty === "hard";

    // Find closest target (human player or other bots in competition mode)
    for (const tank of this.gameState.tanks.values()) {
      // Skip self
      if (tank.id === this.bot.id) continue;

      // In competition mode, bots can target other bots too
      // In regular mode, bots only target human players
      if (!isCompetitionBot && tank.id.startsWith("bot_")) continue;

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
  private enableBots: boolean;
  private sendMessage:
    | ((message: { type: string; [key: string]: unknown }) => void)
    | null = null;
  private lastMultiplayerUpdate = 0;
  private multiplayerUpdateInterval = 50; // Send updates every 50ms (20 FPS)
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
  private lastFireTime = 0; // Add fire rate limiting
  private fireRate = 300; // Milliseconds between shots (3.33 shots per second)
  private healthRegenCooldown = 3000;
  private botSpawnTimer = 0;
  private botSpawnInterval = 2000;
  private maxBots = 15;
  private gameStartTime = 0;
  private animationFrameId: number | null = null;

  // Competition mode properties
  private isCompetitionMode = false;
  private competitionDuration = 180; // 3 minutes in seconds
  private competitionStartTime = 0;
  private competitionKillTimes: Map<string, number> = new Map(); // Track time of first kill for each player
  private competitionBotsSpawned = false;
  private competitionStandardHealth = 400;
  private competitionStandardRegenRate = 10; // Health regenerated per second
  private competitionParticipants: Map<string, Tank> = new Map(); // Track all original participants

  // World boundaries
  private worldBounds = {
    minX: -2000,
    maxX: 2000,
    minY: -2000,
    maxY: 2000,
    width: 4000,
    height: 4000,
  };

  constructor(canvas: HTMLCanvasElement, options: GameOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.options = options;
    this.enableBots = options.enableBots !== false; // Default to true unless explicitly disabled
    this.sendMessage = options.sendMessage || null;
    this.playerId = Math.random().toString(36).substr(2, 9);

    // Initialize competition mode if enabled
    this.isCompetitionMode = options.isCompetitionMode || false;
    if (this.isCompetitionMode) {
      this.competitionDuration = options.competitionDuration || 180; // Default to 3 minutes
      this.maxBots = 7; // Fix the number of bots to 7 for competition mode
    }

    this.gameState = {
      tanks: new Map(),
      bullets: [],
      obstacles: [],
      powerUps: [],
    };

    this.setupEventListeners();
    this.initializePlayer();

    // Send join message to server
    if (this.sendMessage) {
      this.sendMessage({
        type: "join",
        playerId: this.playerId,
        playerName: this.options.playerName,
        tankClass: this.options.tankClass,
        gameMode: this.options.gameMode,
      });
    }
  }

  private sendToServer(message: { type: string; [key: string]: unknown }) {
    if (this.sendMessage) {
      this.sendMessage(message);
    }
  }

  private sendPlayerUpdate() {
    const player = this.gameState.tanks.get(this.playerId);
    if (player) {
      this.sendToServer({
        type: "playerUpdate",
        playerId: this.playerId,
        position: player.position,
        rotation: player.rotation,
        health: player.health,
        score: player.score,
        level: player.level,
        kills: player.kills,
      });
    }
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
      // Use standardized health/stats for competition mode, otherwise normal values
      health: this.isCompetitionMode ? this.competitionStandardHealth : 1000,
      maxHealth: this.isCompetitionMode ? this.competitionStandardHealth : 1000,
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

    // Spawn bot within world boundaries
    const player = this.gameState.tanks.get(this.playerId);
    let spawnX: number, spawnY: number;

    if (player) {
      // Try to spawn away from player but within bounds
      const spawnDistance = 400 + Math.random() * 600;
      const spawnAngle = Math.random() * Math.PI * 2;
      spawnX = player.position.x + Math.cos(spawnAngle) * spawnDistance;
      spawnY = player.position.y + Math.sin(spawnAngle) * spawnDistance;
    } else {
      // Random spawn
      spawnX = this.worldBounds.minX + Math.random() * this.worldBounds.width;
      spawnY = this.worldBounds.minY + Math.random() * this.worldBounds.height;
    }

    // Ensure spawn is within bounds
    spawnX = Math.max(
      this.worldBounds.minX,
      Math.min(this.worldBounds.maxX, spawnX)
    );
    spawnY = Math.max(
      this.worldBounds.minY,
      Math.min(this.worldBounds.maxY, spawnY)
    );

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
    this.bots.set(botId, new AIBot(bot, this.gameState, this.worldBounds));
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
    const now = Date.now();
    const timeSinceLastShot = now - this.lastPlayerShot;

    // Check if health is regenerating
    const isRegenerating =
      player.health < player.maxHealth &&
      player.health > 0 &&
      timeSinceLastShot > this.healthRegenCooldown;

    // Calculate level based on score (every 1000 points = 1 level)
    const newLevel = Math.floor(player.score / 1000) + 1;

    // Update level without changing health
    if (newLevel > player.level) {
      player.level = newLevel;
      // Play level up sound effect
      const soundMgr = getSoundManager();
      soundMgr?.playSound("levelUp");
    }

    this.options.onStatsUpdate({
      score: player.score,
      level: player.level,
      kills: player.kills,
      health: Math.max(0, player.health), // Ensure health doesn't go below 0
      maxHealth: player.maxHealth,
      isRegenerating,
    });
  }

  private triggerGameOver(killedBy?: string) {
    if (this.isGameOver) return; // Prevent multiple game over triggers

    // Play game over sound effect
    const soundMgr = getSoundManager();
    soundMgr?.playSound("gameOver");

    // In competition mode, check if this should trigger competition end
    if (this.isCompetitionMode) {
      // Update the participant record with final stats before removal
      const player = this.gameState.tanks.get(this.playerId);
      if (player) {
        this.competitionParticipants.set(this.playerId, { ...player });
      }

      // Remove the player's tank from the game state
      this.gameState.tanks.delete(this.playerId);

      // Set player as eliminated but don't end the game yet - let the competition continue
      this.isGameOver = true; // Player is out of the game
      // Keep the game running for spectating (isRunning stays true)

      // Clear player inputs but keep the game running
      this.keys.clear();
      this.autoFire = false;

      console.log(
        "Player eliminated but competition continues - spectating mode activated"
      );

      // Create player elimination game over data
      const survivalTime = Date.now() - this.gameStartTime;
      const gameOverData: GameOverData = {
        finalScore: player?.score || 0,
        finalLevel: player?.level || 1,
        totalKills: player?.kills || 0,
        survivalTime: Math.floor(survivalTime / 1000),
        cause: killedBy
          ? `Destroyed by ${killedBy}! You can spectate the remaining competition.`
          : "You were eliminated from the competition. You can spectate the remaining competition.",
        killedBy: killedBy,
        isCompetitionMode: true,
        timeUp: false,
        prizeAmount: 1.0,
        entryFee: 0.5,
        playerQualified: false, // Player was eliminated, so cannot win prize
      };

      // Trigger the callback for player elimination
      this.options.onGameOver(gameOverData);
      return;
    }

    // Non-competition mode - original logic
    this.isGameOver = true;
    this.isRunning = false;

    const player = this.gameState.tanks.get(this.playerId);
    const survivalTime = Date.now() - this.gameStartTime;

    const gameOverData: GameOverData = {
      finalScore: player?.score || 0,
      finalLevel: player?.level || 1,
      totalKills: player?.kills || 0,
      survivalTime: Math.floor(survivalTime / 1000),
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

  private checkCompetitionEndCondition() {
    if (!this.isCompetitionMode || this.isGameOver) return;

    // Count alive participants
    const aliveTanks = Array.from(this.gameState.tanks.values());
    const aliveCount = aliveTanks.length;

    // If only one or no tanks remain, end the competition
    if (aliveCount <= 1) {
      let winner = "No winner";
      let highestKills = 0;
      let tieWinnerTime = Infinity;

      // Determine winner from all original participants (alive or dead)
      for (const [id, participant] of this.competitionParticipants) {
        if (participant.kills > highestKills) {
          highestKills = participant.kills;
          winner = participant.name;
          tieWinnerTime = this.competitionKillTimes.get(id) || Infinity;
        }
        // Tiebreaker: first to reach the kill count
        else if (participant.kills === highestKills && highestKills > 0) {
          const participantTime = this.competitionKillTimes.get(id) || Infinity;
          if (participantTime < tieWinnerTime) {
            winner = participant.name;
            tieWinnerTime = participantTime;
          }
        }
      }

      // If there's exactly one alive tank, they are the winner (even with 0 kills)
      if (aliveCount === 1) {
        const lastSurvivor = aliveTanks[0];
        // Only declare them winner if they have kills, or if no one has kills
        if (lastSurvivor.kills >= highestKills) {
          winner = lastSurvivor.name;
        }
      }

      console.log(
        `Competition ended: Winner is ${winner} with ${highestKills} kills`
      );

      // Trigger game over with competition end
      this.triggerCompetitionEnd(winner, false);
    }
  }

  private triggerCompetitionEnd(winner: string, timeUp: boolean) {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.isRunning = false;

    const player = this.gameState.tanks.get(this.playerId);
    const survivalTime = Date.now() - this.gameStartTime;

    // Find highest kills for prize qualification check
    let highestKills = 0;
    for (const participant of this.competitionParticipants.values()) {
      if (participant.kills > highestKills) {
        highestKills = participant.kills;
      }
    }

    const playerKills = player?.kills || 0;
    const playerName = this.options.playerName;

    // Player qualifies if they are the winner AND have at least 1 kill
    const playerQualified = winner === playerName && playerKills >= 1;
    const playerWon = winner === playerName;

    const gameOverData: GameOverData = {
      finalScore: player?.score || 0,
      finalLevel: player?.level || 1,
      totalKills: playerKills,
      survivalTime: Math.floor(survivalTime / 1000),
      cause: timeUp
        ? "Time's up! Competition ended."
        : `Competition ended! Winner: ${winner}`,
      isCompetitionMode: true,
      winner: winner,
      timeUp: timeUp,
      prizeAmount: 1.0,
      entryFee: 0.5,
      playerQualified: playerQualified,
      playerWon: playerWon,
    };

    // Stop all game activity
    this.bots.clear();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear inputs
    this.keys.clear();
    this.autoFire = false;

    // Trigger game over callback
    this.options.onGameOver(gameOverData);
  }

  public stop() {
    this.isRunning = false;
    this.isGameOver = false;

    // Send leave message to server
    this.sendToServer({
      type: "leave",
      playerId: this.playerId,
    });

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

    // Reset timers
    this.lastPlayerShot = 0;
    this.lastFireTime = 0;
    this.lastBotSpawn = 0;
    this.botSpawnTimer = 0;

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

    // Rejoin the multiplayer server
    this.sendToServer({
      type: "join",
      playerId: this.playerId,
      playerName: this.options.playerName,
      tankClass: this.options.tankClass,
      gameMode: this.options.gameMode,
    });

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

    // Start background music
    const soundMgr = getSoundManager();
    soundMgr?.playBackgroundMusic();

    // Competition mode initialization
    if (this.isCompetitionMode) {
      this.competitionStartTime = Date.now();
      this.competitionKillTimes.clear();

      // Standardize player stats for fair competition
      const player = this.gameState.tanks.get(this.playerId);
      if (player) {
        player.health = this.competitionStandardHealth;
        player.maxHealth = this.competitionStandardHealth;
        player.score = 0;
        player.level = 1;
        player.kills = 0;
      }

      // Initialize competition bots
      this.initializeCompetitionBots();
    }

    // Ensure player is properly initialized and visible
    const player = this.gameState.tanks.get(this.playerId);
    if (player) {
      // Reset player position to center
      player.position = { x: 0, y: 0 };
      if (!this.isCompetitionMode) {
        player.health = player.maxHealth;
      }
      this.updateStats(player);
    }

    // Reset camera to follow player
    // Force immediate camera update to center on player without interpolation
    const currentPlayer = this.gameState.tanks.get(this.playerId);
    if (currentPlayer) {
      this.camera.x = -currentPlayer.position.x + this.canvas.width / 2;
      this.camera.y = -currentPlayer.position.y + this.canvas.height / 2;
    }

    // Spawn initial wave of bots (only in non-competition mode)
    if (!this.isCompetitionMode) {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (this.isRunning && !this.isGameOver) {
            const difficulty = this.getDynamicDifficulty();
            this.spawnBot(difficulty);
          }
        }, i * 500);
      }
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

    // Check for competition end condition (only one participant left alive)
    if (this.isCompetitionMode) {
      this.checkCompetitionEndCondition();
    }

    // Send multiplayer updates
    this.sendMultiplayerUpdates();

    if (this.autoFire && !this.isGameOver) {
      this.shoot();
    }
  }

  private sendMultiplayerUpdates() {
    const now = Date.now();
    if (now - this.lastMultiplayerUpdate > this.multiplayerUpdateInterval) {
      this.sendPlayerUpdate();
      this.lastMultiplayerUpdate = now;
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

          // Play hit sound effect
          const soundMgr = getSoundManager();
          soundMgr?.playSound("hit");

          if (tank.health <= 0) {
            // Tank destroyed - play explosion sound
            soundMgr?.playSound("explosion");

            const shooter = this.gameState.tanks.get(bullet.ownerId);

            // Track kill time for competition mode
            if (this.isCompetitionMode && shooter) {
              if (!this.competitionKillTimes.has(shooter.id)) {
                this.competitionKillTimes.set(
                  shooter.id,
                  Date.now() - this.competitionStartTime
                );
              }
            }

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

            // Respawn bot if it was a bot (only in non-competition mode)
            if (tankId.startsWith("bot_")) {
              // In competition mode, update the participant record with final stats before removal
              if (this.isCompetitionMode) {
                this.competitionParticipants.set(tankId, { ...tank });
              }

              this.gameState.tanks.delete(tankId);
              this.bots.delete(tankId);

              // In competition mode, bots that die stay dead
              if (!this.isCompetitionMode) {
                // Normal mode respawn
                setTimeout(() => {
                  if (!this.isGameOver) {
                    this.spawnBot(this.getDynamicDifficulty());
                  }
                }, 1000);
              }
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
    if (this.isGameOver || !this.enableBots) return;

    // In competition mode, bots are only spawned once at the start
    // No respawning - dead bots stay dead
    if (this.isCompetitionMode) {
      // Initialize competition bots if not already done
      if (!this.competitionBotsSpawned) {
        this.initializeCompetitionBots();
      }
      // Do not respawn bots in competition mode
      return;
    }

    // Regular mode bot spawning logic
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

    // Movement with boundary checking
    if (this.keys.has("w") || this.keys.has("arrowup")) {
      const newY = player.position.y - moveDistance;
      if (newY >= this.worldBounds.minY) {
        player.position.y = newY;
      }
    }
    if (this.keys.has("s") || this.keys.has("arrowdown")) {
      const newY = player.position.y + moveDistance;
      if (newY <= this.worldBounds.maxY) {
        player.position.y = newY;
      }
    }
    if (this.keys.has("a") || this.keys.has("arrowleft")) {
      const newX = player.position.x - moveDistance;
      if (newX >= this.worldBounds.minX) {
        player.position.x = newX;
      }
    }
    if (this.keys.has("d") || this.keys.has("arrowright")) {
      const newX = player.position.x + moveDistance;
      if (newX <= this.worldBounds.maxX) {
        player.position.x = newX;
      }
    }

    // Enforce boundaries (in case of multiplayer updates or other position changes)
    player.position.x = Math.max(
      this.worldBounds.minX,
      Math.min(this.worldBounds.maxX, player.position.x)
    );
    player.position.y = Math.max(
      this.worldBounds.minY,
      Math.min(this.worldBounds.maxY, player.position.y)
    );

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

    // Update stats after health regeneration
    this.updateStats(player);
  }

  private updateBullets(deltaTime: number) {
    if (this.isGameOver) return;

    this.gameState.bullets = this.gameState.bullets.filter((bullet) => {
      bullet.position.x += bullet.velocity.x * (deltaTime / 1000);
      bullet.position.y += bullet.velocity.y * (deltaTime / 1000);

      // Remove bullets that are outside world boundaries
      return (
        bullet.position.x >= this.worldBounds.minX &&
        bullet.position.x <= this.worldBounds.maxX &&
        bullet.position.y >= this.worldBounds.minY &&
        bullet.position.y <= this.worldBounds.maxY
      );
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

    // Check fire rate limiting
    const now = Date.now();
    if (now - this.lastFireTime < this.fireRate) {
      return; // Too soon to fire again
    }

    // Track when player shoots for health regen and fire rate
    this.lastPlayerShot = now;
    this.lastFireTime = now;

    const bulletSpeed = 800;
    const bulletSize = 8;

    // Calculate bullet damage based on player level
    const baseDamage = 50;
    const damagePerLevel = 10;
    const bulletDamage = baseDamage + (player.level - 1) * damagePerLevel;

    const bullet: Bullet = {
      id: Math.random().toString(36).substr(2, 9),
      position: { ...player.position },
      velocity: {
        x: Math.cos(player.rotation) * bulletSpeed,
        y: Math.sin(player.rotation) * bulletSpeed,
      },
      damage: bulletDamage,
      ownerId: player.id,
      size: bulletSize,
      color: player.color,
    };

    this.gameState.bullets.push(bullet);

    // Play shoot sound effect
    const soundMgr = getSoundManager();
    soundMgr?.playSound("shoot");

    // Send bullet to server for multiplayer sync
    this.sendToServer({
      type: "shoot",
      playerId: this.playerId,
      position: bullet.position,
      velocity: bullet.velocity,
      damage: bullet.damage,
      size: bullet.size,
      color: bullet.color,
    });
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

    // Draw world boundaries
    this.drawWorldBoundaries();

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

  private drawWorldBoundaries() {
    // Draw world boundary as red border
    this.ctx.strokeStyle = "#FF0000";
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([10, 5]); // Dashed line
    this.ctx.strokeRect(
      this.worldBounds.minX,
      this.worldBounds.minY,
      this.worldBounds.width,
      this.worldBounds.height
    );
    this.ctx.setLineDash([]); // Reset line dash
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
      case "playerJoined":
        if (data.player && typeof data.player === "object") {
          const player = data.player as Tank;
          if (player.id !== this.playerId) {
            this.gameState.tanks.set(player.id, player);
          }
        }
        break;

      case "playerUpdate":
        if (data.playerId && data.playerId !== this.playerId) {
          const tank = this.gameState.tanks.get(data.playerId as string);
          if (tank) {
            // Update tank properties
            if (data.position && typeof data.position === "object") {
              tank.position = data.position as Vector2;
            }
            if (typeof data.rotation === "number") {
              tank.rotation = data.rotation;
            }
            if (typeof data.health === "number") {
              tank.health = data.health;
            }
            if (typeof data.score === "number") {
              tank.score = data.score;
            }
            if (typeof data.level === "number") {
              tank.level = data.level;
            }
            if (typeof data.kills === "number") {
              tank.kills = data.kills;
            }
          }
        }
        break;

      case "bulletFired":
        if (data.bullet && typeof data.bullet === "object") {
          const bullet = data.bullet as Bullet;
          // Only add bullets from other players
          if (bullet.ownerId !== this.playerId) {
            this.gameState.bullets.push(bullet);
          }
        }
        break;

      case "playerLeft":
        if (data.playerId && data.playerId !== this.playerId) {
          this.gameState.tanks.delete(data.playerId as string);
        }
        break;

      case "gameStateUpdate":
        // Handle full game state updates
        if (data.tanks && Array.isArray(data.tanks)) {
          const tanks = data.tanks as Tank[];
          tanks.forEach((tank) => {
            if (tank.id !== this.playerId) {
              this.gameState.tanks.set(tank.id, tank);
            }
          });
        }

        if (data.bullets && Array.isArray(data.bullets)) {
          // Replace bullets with server state (filter out our own bullets to avoid duplicates)
          const serverBullets = (data.bullets as Bullet[]).filter(
            (bullet) => bullet.ownerId !== this.playerId
          );
          const ourBullets = this.gameState.bullets.filter(
            (bullet) => bullet.ownerId === this.playerId
          );
          this.gameState.bullets = [...ourBullets, ...serverBullets];
        }
        break;

      case "chatMessage":
        // Chat messages are handled by the ChatPanel component
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

  public getMultiplayerTanks() {
    // Return only real players (not bots) for leaderboard
    const realPlayers = new Map<string, Tank>();
    for (const [id, tank] of this.gameState.tanks) {
      if (!id.startsWith("bot_")) {
        realPlayers.set(id, tank);
      }
    }
    return realPlayers;
  }

  // Public methods for minimap
  public getWorldBounds() {
    return this.worldBounds;
  }

  public getPlayerViewport() {
    const player = this.gameState.tanks.get(this.playerId);
    if (!player) return null;

    return {
      centerX: player.position.x,
      centerY: player.position.y,
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  public getAllEntities() {
    return {
      tanks: Array.from(this.gameState.tanks.values()),
      bullets: this.gameState.bullets,
      playerId: this.playerId,
    };
  }

  public get gameOver() {
    return this.isGameOver;
  }

  public getCompetitionParticipants() {
    if (!this.isCompetitionMode) return new Map<string, Tank>();

    // Update participants with current stats from live tanks
    for (const [id, tank] of this.gameState.tanks) {
      if (this.competitionParticipants.has(id)) {
        this.competitionParticipants.set(id, { ...tank });
      }
    }

    return this.competitionParticipants;
  }

  private initializeCompetitionBots() {
    if (!this.isCompetitionMode || this.competitionBotsSpawned) return;

    // Clear any existing bots
    this.bots.clear();

    // Track the player as a competition participant
    const player = this.gameState.tanks.get(this.playerId);
    if (player) {
      this.competitionParticipants.set(this.playerId, { ...player });
    }

    // Spawn 7 bots with "hard" difficulty for competition
    for (let i = 0; i < 7; i++) {
      this.spawnCompetitionBot();
    }

    this.competitionBotsSpawned = true;
  }

  private spawnCompetitionBot() {
    if (this.isGameOver) return;

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
    ];

    // Get a random name but ensure no duplicates by checking existing tanks
    let botName: string = "";
    do {
      botName = botNames[Math.floor(Math.random() * botNames.length)];
    } while (
      Array.from(this.gameState.tanks.values()).some(
        (tank) => tank.name === botName
      )
    );

    // Spread bots evenly around the map
    const angle = Math.random() * Math.PI * 2;
    const distance = 500 + Math.random() * 500;
    const spawnX = Math.cos(angle) * distance;
    const spawnY = Math.sin(angle) * distance;

    const bot: Bot = {
      id: botId,
      name: botName,
      position: { x: spawnX, y: spawnY },
      rotation: Math.random() * Math.PI * 2,
      health: this.competitionStandardHealth, // Equal health for all
      maxHealth: this.competitionStandardHealth,
      score: 0,
      level: 1,
      kills: 0,
      tankClass: ["basic", "twin", "sniper"][Math.floor(Math.random() * 3)],
      color: "#FF6B6B", // Use hard bot color
      target: null,
      lastShot: 0,
      moveDirection: { x: 0, y: 0 },
      changeDirectionTime: Date.now(),
      aggroRange: 600, // Hard bot aggro range
      shootRange: 550, // Hard bot shoot range
      difficulty: "hard", // All competition bots are hard
    };

    this.gameState.tanks.set(botId, bot);
    this.bots.set(botId, new AIBot(bot, this.gameState, this.worldBounds));

    // Track this bot as a competition participant
    this.competitionParticipants.set(botId, { ...bot });
  }
}
