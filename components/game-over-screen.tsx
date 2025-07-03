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
  winner?: string;
  timeUp?: boolean;
  // Competition mode fields
  isCompetitionMode?: boolean;
  prizeAmount?: number;
  entryFee?: number;
  playerQualified?: boolean;
  playerWon?: boolean;
}

interface GameOverScreenProps {
  gameOverData: GameOverData;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onClaimPrize?: () => void;
  open: boolean;
}

export function GameOverScreen({
  gameOverData,
  onPlayAgain,
  onBackToMenu,
  onClaimPrize,
  open,
}: GameOverScreenProps) {
  const [isRestarting, setIsRestarting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [prizeClaimed, setPrizeClaimed] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getPerformanceRating = () => {
    const {
      finalScore,
      totalKills,
      survivalTime,
      isCompetitionMode,
      playerWon,
      playerQualified,
    } = gameOverData;

    // Competition mode has different performance criteria
    if (isCompetitionMode) {
      if (playerWon) {
        return {
          rating: "Champion",
          color: "text-yellow-400",
          description: "You won the competition!",
        };
      } else if (playerQualified) {
        return {
          rating: "Qualified",
          color: "text-green-400",
          description: "Met the minimum requirements",
        };
      } else if (totalKills > 0) {
        return {
          rating: "Competitor",
          color: "text-blue-400",
          description: "Good effort in competition",
        };
      } else {
        return {
          rating: "Eliminated",
          color: "text-red-400",
          description: "Better luck next time",
        };
      }
    }

    // Original performance rating for non-competition mode
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
            {gameOverData.killedBy && !gameOverData.timeUp && (
              <div className="text-red-300 text-sm mt-1">
                Destroyed by: <strong>{gameOverData.killedBy}</strong>
              </div>
            )}
            {gameOverData.timeUp && gameOverData.winner && (
              <div className="mt-2">
                <div className="text-yellow-300 text-lg font-semibold">
                  Winner: <strong>{gameOverData.winner}</strong>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Match ended after 3 minutes
                </div>
              </div>
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

          {/* Competition Mode Results - Only shown for competition games */}
          {gameOverData.isCompetitionMode && (
            <div className="border-2 border-yellow-500/30 bg-yellow-500/10 rounded-xl p-4 mt-2">
              <h3 className="text-yellow-400 font-bold text-center text-lg mb-3 flex items-center justify-center">
                <Trophy className="h-5 w-5 mr-2" />
                Competition Results
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-black/30 p-2 rounded-lg text-center">
                  <div className="text-xs text-gray-400">Entry Fee</div>
                  <div className="text-white font-bold">
                    {gameOverData.entryFee} GOR
                  </div>
                </div>

                <div className="bg-black/30 p-2 rounded-lg text-center">
                  <div className="text-xs text-gray-400">Prize Pool</div>
                  <div className="text-white font-bold">
                    {gameOverData.prizeAmount || 1.0} GOR
                  </div>
                </div>
              </div>

              {/* Winner announcement */}
              <div className="text-center mb-3">
                <div className="text-sm text-gray-300">Winner</div>
                <div className="text-xl font-bold">
                  {gameOverData.playerWon ? "YOU" : gameOverData.winner}
                </div>
              </div>

              {/* Prize status */}
              {gameOverData.playerWon && gameOverData.playerQualified ? (
                <div
                  className={`border-2 rounded-lg p-3 text-center ${
                    prizeClaimed
                      ? "bg-green-500/30 border-green-500/70 animate-none"
                      : "bg-green-500/20 border-green-500/50 animate-pulse"
                  }`}
                >
                  <div className="text-xl text-green-400 font-bold mb-2 flex items-center justify-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                    You won {gameOverData.prizeAmount} GOR!
                    <Trophy className="h-5 w-5 ml-2 text-yellow-400" />
                  </div>
                  <div
                    className={`text-sm p-2 rounded ${
                      prizeClaimed
                        ? "text-green-200 bg-green-500/20"
                        : "text-green-300 bg-green-500/10"
                    }`}
                  >
                    {prizeClaimed
                      ? "✅ Prize successfully claimed and transferred to your wallet!"
                      : "Congratulations! Prize has been transferred to your wallet"}
                  </div>
                </div>
              ) : gameOverData.playerQualified ? (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                  <div className="text-yellow-400 font-bold">
                    You achieved the minimum kill requirement
                  </div>
                  <div className="text-xs text-yellow-300">
                    But another player won the competition
                  </div>
                </div>
              ) : gameOverData.winner === gameOverData.killedBy ? (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                  <div className="text-red-400 font-bold">
                    You were eliminated by the winner!
                  </div>
                  <div className="text-xs text-red-300">
                    {gameOverData.winner} won the competition
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                  <div className="text-red-400 font-bold">
                    You didn&apos;t qualify for the prize
                  </div>
                  <div className="text-xs text-red-300">
                    Minimum 1 kill required to qualify
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {gameOverData.isCompetitionMode ? (
              // Competition mode buttons
              gameOverData.playerWon &&
              gameOverData.playerQualified &&
              !prizeClaimed ? (
                // Winner gets claim prize button only (if not claimed yet)
                <Button
                  onClick={async () => {
                    setIsClaiming(true);
                    if (onClaimPrize) {
                      try {
                        await onClaimPrize();
                        // Set prize as claimed after successful claim
                        setPrizeClaimed(true);
                      } catch (error) {
                        console.error("Prize claim failed:", error);
                      }
                    }
                    setIsClaiming(false);
                  }}
                  disabled={isClaiming}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 disabled:opacity-50 animate-pulse"
                >
                  <Trophy
                    className={`mr-2 h-4 w-4 ${
                      isClaiming ? "animate-spin" : ""
                    }`}
                  />
                  {isClaiming
                    ? "Claiming Prize..."
                    : `Claim ${gameOverData.prizeAmount} GOR Prize`}
                </Button>
              ) : (
                // Non-winners or winners who already claimed get main menu button only
                <Button
                  onClick={onBackToMenu}
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold py-2"
                >
                  <Home className="mr-2 h-4 w-4" />
                  {prizeClaimed ? "Prize Claimed - Main Menu" : "Main Menu"}
                </Button>
              )
            ) : (
              // Regular mode buttons
              <>
                <Button
                  onClick={handlePlayAgain}
                  disabled={isRestarting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 disabled:opacity-50"
                >
                  <RotateCcw
                    className={`mr-2 h-4 w-4 ${
                      isRestarting ? "animate-spin" : ""
                    }`}
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
              </>
            )}
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
