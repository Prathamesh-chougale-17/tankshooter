"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { GameEngine } from "@/lib/game-engine";
import { ChatPanel } from "@/components/chat-panel";
import { UpgradePanel } from "@/components/upgrade-panel";
import { Leaderboard } from "@/components/leaderboard";
import { GameOverScreen } from "@/components/game-over-screen";
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

interface GameCanvasProps {
  playerName: string;
  tankClass: string;
  gameMode: string;
  onBackToMenu: () => void;
}

interface GameOverData {
  finalScore: number;
  finalLevel: number;
  totalKills: number;
  survivalTime: number;
  cause: string;
  killedBy?: string;
}

export function GameCanvas({
  playerName,
  tankClass,
  gameMode,
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
  });
  const [leaderboardData, setLeaderboardData] = useState<
    | {
        tanks: Map<string, Tank>;
        playerId: string;
      }
    | undefined
  >(undefined);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const gameKey = 0; // Static key since we don't need re-rendering

  const { socket, isConnected, sendMessage } = useWebSocket();

  const handleGameOver = useCallback((data: GameOverData) => {
    setGameOverData(data);
    setIsGameOver(true);
  }, []);

  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      onStatsUpdate: (stats) => {
        setGameStats(stats);
        setIsRegenerating(stats.health < stats.maxHealth && stats.health > 0);
      },
      onGameOver: handleGameOver,
    });

    gameEngineRef.current = gameEngine;
    gameEngine.start();

    // Handle WebSocket messages
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        gameEngine.handleServerMessage(data);
      };
    }

    return () => {
      gameEngine.stop();
    };
  }, [playerName, tankClass, gameMode, socket, handleGameOver]);

  useEffect(() => {
    const cleanup = initializeGame();
    return cleanup;
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
        setLeaderboardData({
          tanks: gameEngineRef.current.getGameState().tanks,
          playerId: gameEngineRef.current.getPlayerId(),
        });
      }
    };

    const interval = setInterval(updateLeaderboard, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, gameKey]);

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

    gameEngineRef.current?.upgradePlayer(upgradeType);
    sendMessage({
      type: "upgrade",
      upgradeType,
      playerId: gameEngineRef.current?.getPlayerId(),
    });
  };

  const handleChatMessage = (message: string) => {
    if (isGameOver) return;

    sendMessage({
      type: "chat",
      message,
      playerName,
      playerId: gameEngineRef.current?.getPlayerId(),
    });
  };

  const handlePlayAgain = () => {
    // Reset all React state first
    setIsGameOver(false);
    setGameOverData(null);
    setGameStats({
      score: 0,
      level: 1,
      kills: 0,
      health: 1000,
      maxHealth: 1000,
    });
    setIsRegenerating(false);
    setLeaderboardData(undefined);

    // Reset UI panels
    setShowChat(false);
    setShowUpgrades(false);
    setShowLeaderboard(true);

    // Use the game engine's restart method WITHOUT changing gameKey
    if (gameEngineRef.current) {
      gameEngineRef.current.restart();
    }
  };

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
                  <span>
                    Level: <strong>{gameStats.level}</strong>
                  </span>
                  <span>
                    Score: <strong>{gameStats.score.toLocaleString()}</strong>
                  </span>
                  <span>
                    Kills: <strong>{gameStats.kills}</strong>
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

        {/* Enhanced Health Bar */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <Card
            className={`bg-black/50 border-white/20 px-6 py-3 ${
              gameStats.health <= 0 ? "border-red-500/50" : ""
            }`}
          >
            <div className="text-white text-center mb-2 flex items-center justify-center gap-2">
              <span className="text-sm">{playerName}</span>
              {isRegenerating &&
                healthPercentage < 100 &&
                healthPercentage > 0 && (
                  <div className="flex items-center gap-1 text-green-400">
                    <Heart className="h-3 w-3 animate-pulse" />
                    <span className="text-xs">Regenerating...</span>
                  </div>
                )}
              {gameStats.health <= 0 && (
                <div className="flex items-center gap-1 text-red-400">
                  <span className="text-xs font-bold">DESTROYED</span>
                </div>
              )}
            </div>
            <div className="w-80 h-6 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div
                className={`h-full transition-all duration-300 ${
                  healthPercentage > 75
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : healthPercentage > 50
                    ? "bg-gradient-to-r from-yellow-400 to-green-400"
                    : healthPercentage > 25
                    ? "bg-gradient-to-r from-orange-400 to-yellow-400"
                    : healthPercentage > 0
                    ? "bg-gradient-to-r from-red-500 to-orange-400"
                    : "bg-gray-600"
                } ${
                  isRegenerating && healthPercentage > 0 ? "animate-pulse" : ""
                }`}
                style={{ width: `${Math.max(0, healthPercentage)}%` }}
              />
            </div>
            <div className="text-center text-sm text-white mt-2 flex items-center justify-center gap-2">
              <span className="font-mono">
                {Math.max(0, gameStats.health)} / {gameStats.maxHealth}
              </span>
              {healthPercentage < 100 && healthPercentage > 0 && (
                <span className="text-xs text-gray-400">
                  (Stop shooting to regenerate)
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {isConnected ? "Connected" : "Offline Mode"}
          </div>
        </div>
      </div>

      {/* Side Panels - Hidden when game over */}
      {!isGameOver && showLeaderboard && (
        <div className="absolute top-20 right-4 pointer-events-auto">
          <Leaderboard gameData={leaderboardData} />
        </div>
      )}

      {!isGameOver && showUpgrades && (
        <div className="absolute top-20 left-4 pointer-events-auto">
          <UpgradePanel playerStats={gameStats} onUpgrade={handleUpgrade} />
        </div>
      )}

      {!isGameOver && showChat && (
        <div className="absolute bottom-20 left-4 pointer-events-auto">
          <ChatPanel
            onSendMessage={handleChatMessage}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* Enhanced Game Instructions - Hidden when game over */}
      {!isGameOver && (
        <div className="absolute bottom-4 right-4 pointer-events-auto">
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
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bot Activity Indicator - Hidden when game over */}
      {!isGameOver && (
        <div className="absolute top-20 left-4 pointer-events-none">
          <Card className="bg-black/50 border-white/20 px-3 py-2">
            <div className="text-white text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span>Bots Active: Continuous Spawning</span>
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
          open={isGameOver}
        />
      )}
    </div>
  );
}
