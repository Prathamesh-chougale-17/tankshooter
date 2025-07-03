"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Import the Progress component
import { useWebSocket } from "@/hooks/use-websocket";
import { GameEngine } from "@/lib/game-engine";
import { ChatPanel } from "@/components/chat-panel";
import { UpgradePanel } from "@/components/upgrade-panel";
import { Leaderboard } from "@/components/leaderboard";
import { GameOverScreen } from "@/components/game-over-screen";
import { Minimap } from "@/components/minimap";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageCircle,
  TrendingUp,
  Trophy,
  Heart,
} from "lucide-react";

interface Tank {
  id: string;
  name: string;
  score: number;
  level: number;
  kills: number;
}

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: "chat" | "system" | "kill";
}

interface GameCanvasProps {
  playerName: string;
  playerAddress: string;
  tankClass: string;
  gameMode: string;
  playMode: "multiplayer" | "bots" | "competition";
  onBackToMenu: () => void;
}

interface GameOverData {
  finalScore: number;
  finalLevel: number;
  totalKills: number;
  survivalTime: number;
  cause: string;
  killedBy?: string;
  winner?: string;
  timeUp?: boolean;
  // Competition mode fields
  isCompetitionMode?: boolean;
  prizeAmount?: number;
  entryFee?: number;
  playerQualified?: boolean;
  playerWon?: boolean;
}

export function GameCanvas({
  playerName,
  playerAddress,
  tankClass,
  gameMode,
  playMode,
  onBackToMenu,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [gameStats, setGameStats] = useState({
    score: 0,
    level: 1,
    kills: 0,
    health: 1000,
    maxHealth: 1000,
    isRegenerating: false,
  });
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  // Competition mode state (only used when playMode === "competition")
  const isCompetitionMode = playMode === "competition";
  const competitionConfig = {
    entryFee: 0.5, // 0.5 GOR entry fee
    prize: 1.0, // 1.0 GOR prize
    playerCount: 8, // 8 players (1 human + 7 bots)
    minKillsForPrize: 1, // Minimum 1 kill required to qualify
    hasEnteredCompetition: true, // We auto-enter players into the competition
  };

  const [leaderboardData, setLeaderboardData] = useState<
    | {
        tanks: Map<string, Tank>;
        playerId: string;
      }
    | undefined
  >(undefined);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      playerName: "System",
      message: "Welcome to the game! Use WASD to move and mouse to aim.",
      timestamp: Date.now(),
      type: "system",
    },
  ]);
  const prevStatsRef = useRef({
    score: 0,
    level: 1,
    kills: 0,
    health: 1000,
    maxHealth: 1000,
    isRegenerating: false,
  });
  const gameKey = 0; // Static key since we don't need re-rendering

  // Timer reference to keep track of real-time values
  const timerRef = useRef<{
    startTime: number;
    endTime: number;
    lastSecondUpdate: number;
    animationFrameId?: number;
  }>({
    startTime: Date.now(),
    endTime: Date.now() + 180 * 1000,
    lastSecondUpdate: 180,
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // More precise time formatter with deciseconds for the final countdown
  const formatPreciseTime = (seconds: number): string => {
    if (seconds > 10) {
      return formatTime(seconds);
    }

    // For the final 10 seconds, show tenths of seconds
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    // Since our state is just an integer, we'll make the tenth digit pulse
    // to create the illusion of tenth-second precision
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const { socket, isConnected, sendMessage } = useWebSocket();

  // Connection status notifications
  useEffect(() => {
    // Connection status tracking without notifications
  }, [isConnected, playMode]);

  const handleGameOver = useCallback((data: GameOverData) => {
    setGameOverData(data);
    setIsGameOver(true);
  }, []);

  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Clear any existing game engine
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
        gameEngineRef.current = null;
      }

      // Ensure canvas is properly sized
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Create new game engine
      const gameEngine = new GameEngine(canvas, {
        playerName,
        tankClass,
        gameMode,
        sendMessage: playMode === "multiplayer" ? sendMessage : undefined, // Only enable multiplayer for multiplayer mode
        enableBots: true, // Always enable bots for now - they provide good gameplay
        onStatsUpdate: (stats) => {
          setGameStats(stats);
        },
        onGameOver: handleGameOver,
        // Configure competition mode settings
        isCompetitionMode: playMode === "competition",
        // Pass competition duration
        competitionDuration: 180, // 3 minutes
      });

      gameEngineRef.current = gameEngine;
      gameEngine.start();

      // Handle WebSocket messages
      if (socket) {
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);

          // Handle chat messages in the UI
          if (data.type === "chatMessage" && data.message) {
            const newMessage: ChatMessage = {
              id: data.message.id || Date.now().toString(),
              playerName: data.message.playerName || "Unknown",
              message: data.message.message || "",
              timestamp: data.message.timestamp || Date.now(),
              type: data.message.type || "chat",
            };
            setChatMessages((prev) => [...prev, newMessage]);

            // System messages logged to console instead of toast
            if (newMessage.type === "system" || newMessage.type === "kill") {
              console.log(
                `[${newMessage.type.toUpperCase()}]`,
                newMessage.message
              );
            }
          }

          // Pass to game engine for other message types
          gameEngine.handleServerMessage(data);
        };
      }

      return () => {
        gameEngine.stop();
      };
    } catch (error) {
      console.error("Game initialization error:", error);
    }
  }, [
    playerName,
    tankClass,
    gameMode,
    playMode,
    socket,
    sendMessage,
    handleGameOver,
  ]);

  useEffect(() => {
    const cleanup = initializeGame();

    // Start timer when game initializes, with a small delay to ensure
    // all game state is properly initialized first
    setTimeout(() => {
      console.log("Initial game timer activation");
      setTimerActive(true);
    }, 200);

    // Cleanup function will stop the game engine and any timers
    return () => {
      if (cleanup) cleanup();

      // Ensure timer is stopped when component unmounts
      setTimerActive(false);
      if (timerRef.current.animationFrameId) {
        cancelAnimationFrame(timerRef.current.animationFrameId);
        timerRef.current.animationFrameId = undefined;
      }
    };
  }, [initializeGame]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && gameEngineRef.current) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gameEngineRef.current.handleResize();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const updateLeaderboard = () => {
      if (gameEngineRef.current && !isGameOver) {
        // In competition mode, show only the original 8 participants
        if (isCompetitionMode) {
          const competitionParticipants =
            gameEngineRef.current.getCompetitionParticipants();
          setLeaderboardData({
            tanks: competitionParticipants,
            playerId: gameEngineRef.current.getPlayerId(),
          });
        } else {
          // Get both multiplayer tanks and all tanks for regular modes
          const multiplayerTanks = gameEngineRef.current.getMultiplayerTanks();
          const allTanks = gameEngineRef.current.getGameState().tanks;

          // Show multiplayer tanks if there are real players, otherwise show all tanks
          setLeaderboardData({
            tanks: multiplayerTanks.size > 1 ? multiplayerTanks : allTanks,
            playerId: gameEngineRef.current.getPlayerId(),
          });
        }
      }
    };

    const interval = setInterval(updateLeaderboard, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, gameKey, isCompetitionMode]);
  // Game events tracking (without notifications)
  useEffect(() => {
    const prevStats = prevStatsRef.current;

    // Skip initial render
    if (prevStats.score === 0 && gameStats.score === 0) {
      prevStatsRef.current = gameStats;
      return;
    }

    // Debug: Log regeneration state changes
    if (gameStats.isRegenerating !== prevStats.isRegenerating) {
      console.log(
        `Health regeneration: ${
          gameStats.isRegenerating ? "STARTED" : "STOPPED"
        }`
      );
    }

    // Update previous stats for next comparison
    prevStatsRef.current = {
      score: gameStats.score,
      level: gameStats.level,
      kills: gameStats.kills,
      health: gameStats.health,
      maxHealth: gameStats.maxHealth,
      isRegenerating: gameStats.isRegenerating,
    };
  }, [gameStats]);

  // Handle ESC key for game over screen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isGameOver) {
        onBackToMenu();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isGameOver, onBackToMenu]);

  const handleUpgrade = (upgradeType: string) => {
    if (isGameOver) return;

    const upgradeName = upgradeType === "max-health" ? "Max Health" : "Damage";

    gameEngineRef.current?.upgradePlayer(upgradeType);
    sendMessage({
      type: "upgrade",
      upgradeType,
      playerId: gameEngineRef.current?.getPlayerId(),
    });

    // Upgrade applied silently
    console.log(`${upgradeName} upgraded!`);
  };

  const handleChatMessage = (message: string) => {
    if (isGameOver) return;

    try {
      sendMessage({
        type: "chat",
        message,
        playerName,
        playerId: gameEngineRef.current?.getPlayerId(),
      });
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const handleClaimPrize = async () => {
    try {
      // Call the server-side API to handle the prize transfer
      const response = await fetch("/api/claim-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: playerName,
          playerWallet: playerAddress, // TODO: Get from actual wallet connection
          prizeAmount: gameOverData?.prizeAmount || 1.0,
          competitionId: Date.now().toString(), // Simple competition ID for tracking
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(
          "Prize transfer successful! Transaction signature:",
          result.signature
        );
        console.log("Explorer link:", result.explorerLink);
        toast.success(`Prize of 1 GOR claimed successfully!`, {
          description: "Transaction confirmed on Solana blockchain",
          duration: 5000,
        });
      } else {
        console.error("Prize claim failed:", result.error);
        toast.error("Failed to claim prize", {
          description: result.error || "Please try again later",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error claiming prize:", error);
      toast.error("Failed to claim prize", {
        description: "Network error - please try again later",
        duration: 5000,
      });
    }
  };

  const handlePlayAgain = () => {
    console.log("Play again - resetting game state");

    // Reset timer first (important ordering)
    setTimerActive(false); // Disable current timer
    setTimeRemaining(180); // Reset to 3 minutes

    // Cancel any active timer animation frame
    if (timerRef.current.animationFrameId) {
      cancelAnimationFrame(timerRef.current.animationFrameId);
      console.log("Cancelled active timer animation frame");
    }

    // Clean reset of timer reference values
    timerRef.current = {
      startTime: 0, // This will trigger a fresh initialization in the timer effect
      endTime: 0,
      lastSecondUpdate: 180,
      animationFrameId: undefined,
    };

    // Reset all React state
    setIsGameOver(false);
    setGameOverData(null);
    setGameStats({
      score: 0,
      level: 1,
      kills: 0,
      health: 1000,
      maxHealth: 1000,
      isRegenerating: false,
    });
    prevStatsRef.current = {
      score: 0,
      level: 1,
      kills: 0,
      health: 1000,
      maxHealth: 1000,
      isRegenerating: false,
    };
    setLeaderboardData(undefined);

    // Reset UI panels
    setShowChat(false);
    setShowUpgrades(false);
    setShowLeaderboard(true);

    // Use the game engine's restart method WITHOUT changing gameKey
    if (gameEngineRef.current) {
      gameEngineRef.current.restart();
    }

    // Activate timer after state reset and a sufficient delay
    // This ensures all cleanup has completed before starting a new timer
    setTimeout(() => {
      console.log("Activating new real-time timer");
      setTimerActive(true);
    }, 300); // Increased delay for better reliability
  };

  // Use separate refs for values that shouldn't trigger timer restarts
  const gameDataRef = useRef({
    playerName,
    gameStats,
    leaderboardData,
  });

  // Keep these refs updated when their values change
  useEffect(() => {
    gameDataRef.current = {
      playerName,
      gameStats,
      leaderboardData,
    };
  }, [playerName, gameStats, leaderboardData]);

  // Real-time timer logic with precise countdown - optimized to prevent restarts
  useEffect(() => {
    // Only start a new timer if timer is activated and game is not over
    if (isGameOver || !timerActive) {
      return;
    }

    console.log("Timer initializing once");

    // Initialize timer values when the timer starts (only happens once per game)
    if (!timerRef.current.startTime || timerRef.current.startTime === 0) {
      console.log(`Timer starting fresh: ${formatTime(180)}`);
      timerRef.current = {
        startTime: Date.now(),
        endTime: Date.now() + 180 * 1000, // Always start with full 3 minutes (180 seconds)
        lastSecondUpdate: 180,
      };
      setTimeRemaining(180); // Reset to full time
    }

    // Update timer function using requestAnimationFrame for smooth updates
    const updateTimer = () => {
      // Don't update if game is over or page is hidden
      if (document.hidden || isGameOver) {
        return;
      }

      const now = Date.now();
      const remaining = Math.max(0, timerRef.current.endTime - now);
      const remainingSeconds = Math.ceil(remaining / 1000);

      // Update the state only when the second changes
      if (remainingSeconds !== timerRef.current.lastSecondUpdate) {
        timerRef.current.lastSecondUpdate = remainingSeconds;
        setTimeRemaining(remainingSeconds);

        // Log every 10 seconds or during final countdown
        if (remainingSeconds % 10 === 0 || remainingSeconds <= 5) {
          console.log(`Time remaining: ${formatTime(remainingSeconds)}`);
        }

        // Special effect for last 10 seconds
        if (remainingSeconds === 10) {
          console.log("Final countdown started!");
        }
      }

      // Check if time's up
      if (remaining <= 0) {
        console.log("TIME'S UP!");

        // Access the latest data from our refs
        const {
          playerName: currentPlayerName,
          gameStats: currentStats,
          leaderboardData: currentLeaderboard,
        } = gameDataRef.current;

        let currentWinner = currentPlayerName;
        let highestKills = 0;
        let highestScore = 0;
        let playerQualified = false;

        if (currentLeaderboard?.tanks) {
          // For competition mode, we determine winner based on kills
          if (isCompetitionMode) {
            Object.values(currentLeaderboard.tanks).forEach((tank) => {
              if (
                tank.kills > highestKills ||
                (tank.kills === highestKills && tank.score > highestScore)
              ) {
                highestKills = tank.kills;
                highestScore = tank.score;
                currentWinner = tank.name;
              }

              // Check if player qualified (got at least minimum kills)
              if (
                tank.id === currentLeaderboard.playerId &&
                tank.kills >= competitionConfig.minKillsForPrize
              ) {
                playerQualified = true;
              }
            });
          } else {
            // Regular mode: winner determined by score
            Object.values(currentLeaderboard.tanks).forEach((tank) => {
              if (tank.score > highestScore) {
                highestScore = tank.score;
                currentWinner = tank.name;
              }
            });
          }
        }

        // Game over data
        const gameOverObj = {
          finalScore: currentStats.score,
          finalLevel: currentStats.level,
          totalKills: currentStats.kills,
          survivalTime: 180, // 3 minutes
          cause: "Time's up! The match has ended.",
          timeUp: true,
          winner: currentWinner,
        };

        // Add competition specific data if in competition mode
        if (isCompetitionMode) {
          const isWinner = currentWinner === currentPlayerName;
          const hasQualified = playerQualified && isWinner;

          Object.assign(gameOverObj, {
            isCompetitionMode: true,
            prizeAmount: hasQualified ? competitionConfig.prize : 0,
            entryFee: competitionConfig.entryFee,
            playerQualified: playerQualified,
            cause:
              `Time's up! ${currentWinner} won the competition with ${highestKills} kills!` +
              (hasQualified
                ? " You won the prize!"
                : playerQualified
                ? " You had enough kills but didn't win."
                : " You didn't get enough kills to qualify."),
          });
        }

        // Game over with time up
        handleGameOver(gameOverObj);
        return;
      }

      // Continue the animation loop
      timerRef.current.animationFrameId = requestAnimationFrame(updateTimer);
    };

    // Start the animation loop
    timerRef.current.animationFrameId = requestAnimationFrame(updateTimer);

    // Cleanup function
    return () => {
      if (timerRef.current.animationFrameId) {
        cancelAnimationFrame(timerRef.current.animationFrameId);
        console.log("Timer animation frame canceled");
      }
    };
    // Dependencies for the timer
  }, [
    isGameOver,
    timerActive,
    handleGameOver,
    // Competition mode dependencies
    isCompetitionMode,
    competitionConfig.entryFee,
    competitionConfig.prize,
    competitionConfig.minKillsForPrize,
  ]);

  // This effect was redundant - timer now starts in the initializeGame effect

  // Reset the timer when the game is over
  useEffect(() => {
    if (isGameOver) {
      // Stop the timer and ensure animation frame is canceled
      setTimerActive(false);

      // Extra safety: cancel any animation frames
      if (timerRef.current.animationFrameId) {
        cancelAnimationFrame(timerRef.current.animationFrameId);
        timerRef.current.animationFrameId = undefined;
        console.log("Timer animation frame canceled on game over");
      }
    }
  }, [isGameOver]);

  const healthPercentage = (gameStats.health / gameStats.maxHealth) * 100;

  return (
    <div
      key={gameKey}
      className="relative w-full h-screen bg-gray-800 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{
          background:
            "linear-gradient(45deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          display: "block", // Ensure canvas is displayed
        }}
      />

      {/* Game UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          <div className="flex gap-4">
            <Button
              onClick={onBackToMenu}
              variant="outline"
              size="sm"
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
              disabled={isGameOver}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Menu
            </Button>

            <Card className="bg-black/50 border-white/20 px-4 py-2">
              <div className="text-white text-sm">
                <div className="flex items-center gap-4">
                  <div
                    className={`text-center font-mono px-3 py-1 rounded-md flex items-center ${
                      timeRemaining <= 5
                        ? "bg-red-700/70 text-white animate-bounce border-2 border-red-400 shadow-lg shadow-red-500/50"
                        : timeRemaining <= 10
                        ? "bg-red-600/50 text-red-100 animate-pulse border-2 border-red-500"
                        : timeRemaining < 30
                        ? "bg-red-600/30 text-red-300 animate-pulse border border-red-500/50"
                        : timeRemaining < 60
                        ? "bg-yellow-600/30 text-yellow-300 border border-yellow-500/50"
                        : "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                    }`}
                  >
                    {timeRemaining <= 5 ? (
                      <>
                        <span className="animate-ping mr-1 text-red-300">
                          ⏱️
                        </span>
                        <span className="font-bold text-lg">
                          {formatPreciseTime(timeRemaining)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold">
                        ⏱️{" "}
                        {timeRemaining <= 10
                          ? formatPreciseTime(timeRemaining)
                          : formatTime(timeRemaining)}
                      </span>
                    )}
                  </div>
                  <span>
                    Level: <strong>{gameStats.level}</strong>
                  </span>
                  <span>
                    Score: <strong>{gameStats.score.toLocaleString()}</strong>
                  </span>
                  <span>
                    Kills: <strong>{gameStats.kills}</strong>
                  </span>
                  <span className="text-orange-300">
                    Damage: <strong>{50 + (gameStats.level - 1) * 10}</strong>
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-300">Next Level:</span>
                  <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
                      style={{
                        width: `${((gameStats.score % 1000) / 1000) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-300">
                    {1000 - (gameStats.score % 1000)} pts
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              variant="outline"
              size="sm"
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
              disabled={isGameOver}
            >
              <Trophy className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setShowUpgrades(!showUpgrades)}
              variant="outline"
              size="sm"
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
              disabled={isGameOver}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setShowChat(!showChat)}
              variant="outline"
              size="sm"
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
              disabled={isGameOver}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Health Bar with Shadcn Progress component */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <Card
            className={`bg-black/50 border-white/20 px-2 py-1 gap-0 ${
              gameStats.health <= 0 ? "border-red-500/50" : ""
            }`}
          >
            <div className="text-white text-center flex items-center justify-center gap-1 mb-1">
              <span className="text-xs font-medium">{playerName}</span>
              {gameStats.isRegenerating &&
                healthPercentage < 100 &&
                healthPercentage > 0 && (
                  <div className="flex items-center gap-1 text-green-400">
                    <Heart className="h-2 w-2 animate-pulse" />
                    <span className="text-xs">Regen</span>
                  </div>
                )}
              {gameStats.health <= 0 && (
                <span className="text-xs font-bold text-red-400">
                  DESTROYED
                </span>
              )}
            </div>
            <div className="relative w-36 mb-1">
              <Progress
                value={Math.max(0, healthPercentage)}
                className={`h-3 ${
                  healthPercentage > 75
                    ? "bg-gray-700 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-green-500"
                    : healthPercentage > 50
                    ? "bg-gray-700 [&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-green-400"
                    : healthPercentage > 25
                    ? "bg-gray-700 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-yellow-400"
                    : healthPercentage > 0
                    ? "bg-gray-700 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-400"
                    : "bg-gray-700 [&>div]:bg-gray-600"
                } ${
                  gameStats.isRegenerating &&
                  healthPercentage > 0 &&
                  healthPercentage < 100
                    ? "border border-green-500/30 [&>div]:animate-pulse"
                    : "border border-gray-600"
                }`}
              />
              {/* Regeneration glow effect */}
              {gameStats.isRegenerating &&
                healthPercentage > 0 &&
                healthPercentage < 100 && (
                  <div className="absolute inset-0 bg-green-400/20 animate-pulse rounded-full pointer-events-none" />
                )}
            </div>
            <div className="text-center">
              <span className="font-mono text-xs text-gray-300">
                {Math.max(0, gameStats.health)} / {gameStats.maxHealth}
              </span>
            </div>
          </Card>
        </div>

        {/* Connection Status - Moved to top right */}
        <div className="absolute bottom-4 right-4 pointer-events-auto flex flex-col gap-1">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isConnected && playMode === "multiplayer"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {isConnected && playMode === "multiplayer"
              ? "Multiplayer Online"
              : "Offline Mode"}
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {playMode === "multiplayer"
              ? "🌐 Multiplayer"
              : playMode === "competition"
              ? "🏆 Competition"
              : "🤖 Bot Arena"}
          </div>
          {/* Show player info */}
          {isCompetitionMode && (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              💰 Entry: {competitionConfig.entryFee} GOR • Prize:{" "}
              {competitionConfig.prize} GOR
            </div>
          )}
          {/* Show real player count in multiplayer mode */}
          {playMode === "multiplayer" && leaderboardData && (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
              👥 {leaderboardData.tanks.size || 0} Players
            </div>
          )}
        </div>
      </div>

      {/* Side Panels - Moved to left side to avoid overlap with multiplayer badges */}
      {!isGameOver && showLeaderboard && (
        <div className="absolute top-20 left-4 pointer-events-auto">
          <Leaderboard
            gameData={leaderboardData}
            isCompetitionMode={isCompetitionMode}
          />
        </div>
      )}

      {!isGameOver && showUpgrades && (
        <div className="absolute top-20 left-80 pointer-events-auto">
          <UpgradePanel playerStats={gameStats} onUpgrade={handleUpgrade} />
        </div>
      )}

      {!isGameOver && showChat && (
        <div className="absolute bottom-28 right-4 pointer-events-auto">
          <ChatPanel
            onSendMessage={handleChatMessage}
            onClose={() => setShowChat(false)}
            messages={chatMessages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))}
          />
        </div>
      )}

      {/* Minimap - Top right corner */}
      {!isGameOver && (
        <div className="absolute top-20 right-4 pointer-events-auto">
          <Minimap gameEngine={gameEngineRef.current} />
        </div>
      )}

      {/* Enhanced Game Instructions - Moved to bottom left */}
      {!isGameOver && (
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <Card className="bg-black/50 border-white/20 p-3">
            <div className="text-white text-xs space-y-1">
              <div className="font-semibold text-purple-300 mb-2">
                Controls:
              </div>
              <div>
                <strong>WASD:</strong> Move
              </div>
              <div>
                <strong>Mouse:</strong> Aim & Shoot
              </div>
              <div>
                <strong>E:</strong> Auto-fire
              </div>
              <div>
                <strong>Enter:</strong> Chat
              </div>
              <div className="border-t border-white/20 pt-2 mt-2">
                <div className="text-green-400 flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>Health regens when not shooting</span>
                </div>
                <div className="text-purple-400 text-xs mt-1">
                  ⚡ Level up every 1000 points for stronger bullets!
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bot Activity Indicator - Moved to right side */}
      {!isGameOver && (
        <div className="absolute top-14 right-4 pointer-events-none">
          <Card className="bg-black/50 border-white/20 px-3 py-2">
            <div className="text-white text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              {isCompetitionMode ? (
                <span className="text-yellow-300">
                  Competition Mode: 7 Hard Bots
                </span>
              ) : (
                <span>Bots Active: Continuous Spawning</span>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Game Over Dialog Overlay */}
      {gameOverData && (
        <GameOverScreen
          gameOverData={gameOverData}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={onBackToMenu}
          onClaimPrize={handleClaimPrize}
          open={isGameOver}
        />
      )}

      {/* Spectator mode notification for eliminated players in competition */}
      {isGameOver && isCompetitionMode && !gameOverData?.timeUp && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <Card className="bg-purple-900/70 border-2 border-purple-500/50 backdrop-blur-md px-6 py-3 animate-pulse">
            <div className="text-white text-center">
              <h3 className="text-xl font-bold text-purple-300 mb-1">
                Spectator Mode
              </h3>
              <p className="text-sm">
                You have been eliminated but can continue watching the
                competition
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Entry fee indicator for competition mode */}
      {!isGameOver && isCompetitionMode && (
        <div className="absolute top-28 right-4 pointer-events-none">
          <Card className="bg-yellow-900/20 border-yellow-500/30 px-3 py-2">
            <div className="text-yellow-300 text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Entry Fee Paid: {competitionConfig.entryFee} GOR</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
