"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameCanvas } from "@/components/game-canvas"
import { Gamepad2, Users, Trophy, Settings } from "lucide-react"

export default function HomePage() {
  const [gameState, setGameState] = useState<"menu" | "game">("menu")
  const [playerName, setPlayerName] = useState("")
  const [selectedTankClass, setSelectedTankClass] = useState("basic")
  const [gameMode, setGameMode] = useState("ffa")

  const tankClasses = [
    { id: "basic", name: "Basic Tank", description: "Balanced stats, good for beginners" },
    { id: "twin", name: "Twin", description: "Dual cannons, faster fire rate" },
    { id: "sniper", name: "Sniper", description: "Long range, high damage" },
    { id: "machine-gun", name: "Machine Gun", description: "Rapid fire, lower damage" },
  ]

  const gameModes = [
    { id: "ffa", name: "Free For All", description: "Every tank for themselves" },
    { id: "team", name: "Team Deathmatch", description: "2 teams battle for supremacy" },
    { id: "domination", name: "Domination", description: "Control the dominators" },
  ]

  const startGame = () => {
    if (playerName.trim()) {
      setGameState("game")
    }
  }

  const backToMenu = () => {
    setGameState("menu")
  }

  if (gameState === "game") {
    return (
      <GameCanvas playerName={playerName} tankClass={selectedTankClass} gameMode={gameMode} onBackToMenu={backToMenu} />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-40 w-5 h-5 bg-green-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
      </div>

      <Card className="w-full max-w-2xl bg-black/20 backdrop-blur-sm border-purple-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-white mb-4 tracking-wider">
            DIEP<span className="text-purple-400">.IO</span>
          </CardTitle>
          <p className="text-gray-300">Multiplayer Tank Battle Arena</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-white font-medium">Player Name</label>
            <Input
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-white/10 border-purple-500/30 text-white placeholder:text-gray-400"
              maxLength={20}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-white font-medium">Tank Class</label>
              <Select value={selectedTankClass} onValueChange={setSelectedTankClass}>
                <SelectTrigger className="bg-white/10 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tankClasses.map((tank) => (
                    <SelectItem key={tank.id} value={tank.id}>
                      <div>
                        <div className="font-medium">{tank.name}</div>
                        <div className="text-sm text-gray-500">{tank.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">Game Mode</label>
              <Select value={gameMode} onValueChange={setGameMode}>
                <SelectTrigger className="bg-white/10 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gameModes.map((mode) => (
                    <SelectItem key={mode.id} value={mode.id}>
                      <div>
                        <div className="font-medium">{mode.name}</div>
                        <div className="text-sm text-gray-500">{mode.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={startGame}
            disabled={!playerName.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 text-lg"
          >
            <Gamepad2 className="mr-2 h-5 w-5" />
            Start Game
          </Button>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center text-white">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <div className="text-sm">Online Players</div>
              <div className="text-xl font-bold">1,247</div>
            </div>
            <div className="text-center text-white">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-sm">Active Games</div>
              <div className="text-xl font-bold">89</div>
            </div>
            <div className="text-center text-white">
              <Settings className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <div className="text-sm">Servers</div>
              <div className="text-xl font-bold">12</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
