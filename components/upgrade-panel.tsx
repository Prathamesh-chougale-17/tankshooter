"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, Shield, Target, Gauge, Plus } from "lucide-react"

interface PlayerStats {
  score: number
  level: number
  kills: number
  health: number
  maxHealth: number
}

interface UpgradePanelProps {
  playerStats: PlayerStats
  onUpgrade: (upgradeType: string) => void
}

interface UpgradeOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  cost: number
  maxLevel: number
  currentLevel: number
}

export function UpgradePanel({ playerStats, onUpgrade }: UpgradePanelProps) {
  const upgradePoints = Math.floor(playerStats.score / 1000)

  const upgrades: UpgradeOption[] = [
    {
      id: "health",
      name: "Health Regen",
      description: "Increases health regeneration rate",
      icon: <Shield className="h-4 w-4" />,
      cost: 1,
      maxLevel: 7,
      currentLevel: 0,
    },
    {
      id: "damage",
      name: "Body Damage",
      description: "Increases collision damage",
      icon: <Zap className="h-4 w-4" />,
      cost: 1,
      maxLevel: 7,
      currentLevel: 0,
    },
    {
      id: "bullet-speed",
      name: "Bullet Speed",
      description: "Increases projectile velocity",
      icon: <Target className="h-4 w-4" />,
      cost: 1,
      maxLevel: 7,
      currentLevel: 0,
    },
    {
      id: "bullet-penetration",
      name: "Bullet Penetration",
      description: "Bullets can pierce through objects",
      icon: <Target className="h-4 w-4" />,
      cost: 1,
      maxLevel: 7,
      currentLevel: 0,
    },
    {
      id: "bullet-damage",
      name: "Bullet Damage",
      description: "Increases bullet damage",
      icon: <Zap className="h-4 w-4" />,
      cost: 1,
      maxLevel: 7,
      currentLevel: 0,
    },
    {
      id: "reload",
      name: "Reload",
      description: "Increases firing rate",
      icon: <Gauge className="h-4 w-4" />,
      cost: 1,
      maxLevel: 7,
      currentLevel: 0,
    },
    {
      id: "movement-speed",
      name: "Movement Speed",
      description: "Increases tank movement speed",
      icon: <Gauge className="h-4 w-4" />,
      cost: 1,
      maxLevel: 7,
      currentLevel: 0,
    },
    {
      id: "max-health",
      name: "Max Health",
      description: "Increases maximum health",
      icon: <Shield className="h-4 w-4" />,
      cost: 1,
      maxLevel: 7,
      currentLevel: 0,
    },
  ]

  const canUpgrade = (upgrade: UpgradeOption) => {
    return upgradePoints >= upgrade.cost && upgrade.currentLevel < upgrade.maxLevel
  }

  return (
    <Card className="w-80 bg-black/80 border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          Upgrades
          <Badge variant="secondary" className="bg-purple-600 text-white">
            {upgradePoints} points
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-3 max-h-96 overflow-y-auto">
        {upgrades.map((upgrade) => (
          <div key={upgrade.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-purple-400">{upgrade.icon}</div>
                <div>
                  <div className="text-white text-xs font-medium">{upgrade.name}</div>
                  <div className="text-gray-400 text-xs">{upgrade.description}</div>
                </div>
              </div>
              <Button
                onClick={() => onUpgrade(upgrade.id)}
                disabled={!canUpgrade(upgrade)}
                size="sm"
                className="h-6 w-6 p-0 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Progress value={(upgrade.currentLevel / upgrade.maxLevel) * 100} className="flex-1 h-2" />
              <span className="text-xs text-gray-400 min-w-[30px]">
                {upgrade.currentLevel}/{upgrade.maxLevel}
              </span>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-white/10">
          <div className="text-xs text-gray-400 text-center">Earn upgrade points by gaining score</div>
        </div>
      </CardContent>
    </Card>
  )
}
