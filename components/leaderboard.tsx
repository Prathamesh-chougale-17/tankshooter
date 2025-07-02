"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Medal, Award, Bot } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  level: number;
  kills: number;
  isCurrentPlayer?: boolean;
  isBot?: boolean;
}

interface Tank {
  id: string;
  name: string;
  score: number;
  level: number;
  kills: number;
}

interface LeaderboardProps {
  gameData?: {
    tanks: Map<string, Tank>;
    playerId: string;
  };
  isCompetitionMode?: boolean; // Added this prop
}

export function Leaderboard({
  gameData,
  isCompetitionMode = false,
}: LeaderboardProps) {
  // Generate leaderboard from real game data if available
  const leaderboardData: LeaderboardEntry[] = gameData
    ? Array.from(gameData.tanks.values())
        // Sort by kills for competition mode, otherwise by score
        .sort((a, b) => {
          if (isCompetitionMode) {
            // Sort by kills first, then by score as a tiebreaker
            return b.kills !== a.kills ? b.kills - a.kills : b.score - a.score;
          }
          return b.score - a.score;
        })
        .slice(0, 10)
        .map((tank, index) => ({
          rank: index + 1,
          name: tank.name,
          score: tank.score,
          level: tank.level,
          kills: tank.kills,
          isCurrentPlayer: tank.id === gameData.playerId,
          isBot: tank.id.startsWith("bot_"),
        }))
    : // Fallback static data
      [
        { rank: 1, name: "TankMaster", score: 45230, level: 45, kills: 23 },
        { rank: 2, name: "BulletStorm", score: 38940, level: 42, kills: 19 },
        { rank: 3, name: "TankLord", score: 32150, level: 38, kills: 16 },
        {
          rank: 4,
          name: "You",
          score: 15420,
          level: 25,
          kills: 8,
          isCurrentPlayer: true,
        },
        { rank: 5, name: "NoobSlayer", score: 12890, level: 22, kills: 7 },
      ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case 2:
        return <Trophy className="h-4 w-4 text-gray-300" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return <Award className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400";
      case 2:
        return "text-gray-300";
      case 3:
        return "text-amber-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <Card className="w-72 bg-black/80 border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          {isCompetitionMode ? "Competition" : "Leaderboard"}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2 max-h-80 overflow-y-auto">
        {leaderboardData.map((player) => (
          <div
            key={player.rank}
            className={`flex items-center justify-between p-2 rounded ${
              player.isCurrentPlayer
                ? "bg-purple-600/20 border border-purple-500/30"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {getRankIcon(player.rank)}
                <span
                  className={`text-xs font-bold ${getRankColor(player.rank)}`}
                >
                  #{player.rank}
                </span>
              </div>

              <div>
                <div
                  className={`text-xs font-medium flex items-center gap-1 ${
                    player.isCurrentPlayer ? "text-purple-300" : "text-white"
                  }`}
                >
                  {player.name}
                  {player.isBot && <Bot className="h-3 w-3 text-orange-400" />}
                </div>
                <div className="text-xs text-gray-400">
                  {isCompetitionMode ? (
                    <span
                      className={
                        player.kills > 0 ? "text-yellow-400" : "text-gray-400"
                      }
                    >
                      {player.kills} {player.kills === 1 ? "kill" : "kills"}
                    </span>
                  ) : (
                    <>
                      Level {player.level} • {player.kills} kills
                    </>
                  )}
                </div>
              </div>
            </div>

            <Badge
              variant="secondary"
              className={`${
                isCompetitionMode && player.kills > 0
                  ? "bg-yellow-900/50 text-yellow-300"
                  : "bg-gray-700 text-white"
              } text-xs`}
            >
              {player.score.toLocaleString()}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
