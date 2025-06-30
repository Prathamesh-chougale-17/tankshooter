"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skull, Trophy, Target, Clock, RotateCcw, Home } from "lucide-react";
import { useState } from "react";

interface GameOverData {
  finalScore: number;
  finalLevel: number;
  totalKills: number;
  survivalTime: number;
  cause: string;
  killedBy?: string;
}

interface GameOverScreenProps {
  gameOverData: GameOverData;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  open: boolean;
}

export function GameOverScreen({
  gameOverData,
  onPlayAgain,
  onBackToMenu,
  open,
}: GameOverScreenProps) {
  const [isRestarting, setIsRestarting] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getPerformanceRating = () => {
    const { finalScore, totalKills, survivalTime } = gameOverData;

    if (finalScore > 10000 || totalKills > 20 || survivalTime > 300) {
      return {
        rating: "Excellent",
        color: "text-green-400",
        description: "Outstanding performance!",
      };
    } else if (finalScore > 5000 || totalKills > 10 || survivalTime > 180) {
      return {
        rating: "Good",
        color: "text-blue-400",
        description: "Well played!",
      };
    } else if (finalScore > 2000 || totalKills > 5 || survivalTime > 60) {
      return {
        rating: "Fair",
        color: "text-yellow-400",
        description: "Keep practicing!",
      };
    } else {
      return {
        rating: "Needs Improvement",
        color: "text-orange-400",
        description: "Try again!",
      };
    }
  };

  const handlePlayAgain = () => {
    setIsRestarting(true);
    onPlayAgain();
    // Reset after a short delay
    setTimeout(() => setIsRestarting(false), 1000);
  };

  const performance = getPerformanceRating();

  return (
    <Dialog
      open={open}
      onOpenChange={(openState) => !openState && onBackToMenu()}
    >
      <DialogContent className="max-w-2xl bg-black/90 backdrop-blur-sm border-red-500/50 text-white">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-3">
            <Skull className="h-12 w-12 text-red-400 animate-pulse" />
          </div>
          <DialogTitle className="text-3xl font-bold text-red-400 mb-2 tracking-wider">
            GAME OVER
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {gameOverData.cause}
            {gameOverData.killedBy && (
              <span className="text-red-300 text-sm mt-1">
                Destroyed by: <strong>{gameOverData.killedBy}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Performance Rating */}
          <div className="text-center">
            <Badge
              variant="secondary"
              className={`${performance.color} bg-white/10 px-3 py-1`}
            >
              {performance.rating}
            </Badge>
            <p className="text-gray-400 text-sm mt-1">
              {performance.description}
            </p>
          </div>

          {/* Game Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
              <div className="text-white font-bold">
                {gameOverData.finalScore.toLocaleString()}
              </div>
              <div className="text-gray-400 text-xs">Final Score</div>
            </div>

            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-white font-bold mb-1">
                Level {gameOverData.finalLevel}
              </div>
              <div className="text-gray-400 text-xs">Reached</div>
            </div>

            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <Target className="h-6 w-6 mx-auto mb-1 text-red-400" />
              <div className="text-white font-bold">
                {gameOverData.totalKills}
              </div>
              <div className="text-gray-400 text-xs">Total Kills</div>
            </div>

            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <Clock className="h-6 w-6 mx-auto mb-1 text-blue-400" />
              <div className="text-white font-bold">
                {formatTime(gameOverData.survivalTime)}
              </div>
              <div className="text-gray-400 text-xs">Survived</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handlePlayAgain}
              disabled={isRestarting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 disabled:opacity-50"
            >
              <RotateCcw
                className={`mr-2 h-4 w-4 ${isRestarting ? "animate-spin" : ""}`}
              />
              {isRestarting ? "Restarting..." : "Play Again"}
            </Button>
            <Button
              onClick={onBackToMenu}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold py-2"
            >
              <Home className="mr-2 h-4 w-4" />
              Main Menu
            </Button>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="text-center text-gray-400 text-xs">
            Press{" "}
            <kbd className="px-2 py-1 bg-white/10 rounded text-white">ESC</kbd>{" "}
            to return to main menu
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
