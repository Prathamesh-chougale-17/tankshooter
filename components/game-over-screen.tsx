"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skull, Trophy, Target, Clock, RotateCcw, Home } from "lucide-react"

interface GameOverData {
  finalScore: number
  finalLevel: number
  totalKills: number
  survivalTime: number
  cause: string
  killedBy?: string
}

interface GameOverScreenProps {
  gameOverData: GameOverData
  onPlayAgain: () => void
  onBackToMenu: () => void
}

export function GameOverScreen({ gameOverData, onPlayAgain, onBackToMenu }: GameOverScreenProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getPerformanceRating = () => {
    const { finalScore, totalKills, survivalTime } = gameOverData

    if (finalScore > 10000 || totalKills > 20 || survivalTime > 300) {
      return { rating: "Excellent", color: "text-green-400", description: "Outstanding performance!" }
    } else if (finalScore > 5000 || totalKills > 10 || survivalTime > 180) {
      return { rating: "Good", color: "text-blue-400", description: "Well played!" }
    } else if (finalScore > 2000 || totalKills > 5 || survivalTime > 60) {
      return { rating: "Fair", color: "text-yellow-400", description: "Keep practicing!" }
    } else {
      return { rating: "Needs Improvement", color: "text-orange-400", description: "Try again!" }
    }
  }

  const performance = getPerformanceRating()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-4 h-4 bg-red-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-orange-400/30 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-40 w-5 h-5 bg-yellow-400/30 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-red-400/30 rounded-full animate-pulse"></div>
      </div>

      <Card className="w-full max-w-2xl bg-black/40 backdrop-blur-sm border-red-500/30 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <Skull className="h-16 w-16 text-red-400 animate-pulse" />
          </div>
          <CardTitle className="text-5xl font-bold text-red-400 mb-2 tracking-wider">GAME OVER</CardTitle>
          <p className="text-gray-300 text-lg">{gameOverData.cause}</p>
          {gameOverData.killedBy && (
            <p className="text-red-300 text-sm mt-1">
              Destroyed by: <strong>{gameOverData.killedBy}</strong>
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Performance Rating */}
          <div className="text-center">
            <Badge variant="secondary" className={`${performance.color} bg-white/10 text-lg px-4 py-2`}>
              {performance.rating}
            </Badge>
            <p className="text-gray-400 text-sm mt-2">{performance.description}</p>
          </div>

          {/* Game Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-white text-lg font-bold">{gameOverData.finalScore.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">Final Score</div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-white text-lg font-bold mb-2">Level {gameOverData.finalLevel}</div>
              <div className="text-gray-400 text-sm">Reached</div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <Target className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <div className="text-white text-lg font-bold">{gameOverData.totalKills}</div>
              <div className="text-gray-400 text-sm">Total Kills</div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <div className="text-white text-lg font-bold">{formatTime(gameOverData.survivalTime)}</div>
              <div className="text-gray-400 text-sm">Survived</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={onPlayAgain}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Play Again
            </Button>
            <Button
              onClick={onBackToMenu}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold py-3 text-lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Main Menu
            </Button>
          </div>

          {/* Tips for improvement */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-2">💡 Tips for Next Time:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Keep moving to avoid enemy fire</li>
              <li>• Stop shooting to regenerate health</li>
              <li>• Use upgrades to improve your tank's capabilities</li>
              <li>• Stay aware of your surroundings</li>
              <li>• Practice your aim and timing</li>
            </ul>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="text-center text-gray-400 text-sm">
            Press <kbd className="px-2 py-1 bg-white/10 rounded text-white">ESC</kbd> to return to main menu
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
