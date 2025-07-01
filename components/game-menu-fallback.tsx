import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Settings } from "lucide-react";

export function GameMenuFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-500/20 group hover:shadow-purple-500/30 transition-all duration-500 rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <CardHeader className="text-center relative z-10">
            <CardTitle className="text-6xl font-bold mb-4 tracking-wider bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-glow">
              Tank{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Shooter
              </span>
            </CardTitle>
            <p className="text-gray-300 text-lg font-medium animate-fade-in">
              Multiplayer Tank Battle Arena
            </p>
          </CardHeader>

          <CardContent className="space-y-8 relative z-10">
            {/* Loading state */}
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-gray-400 text-lg">Loading wallet...</p>
              </div>
            </div>

            <div
              className="grid grid-cols-3 gap-6 pt-6 animate-fade-in"
              style={{ animationDelay: "0.8s", animationFillMode: "both" }}
            >
              <div className="text-center text-white group cursor-pointer hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 backdrop-blur-sm border border-blue-500/30 group-hover:border-blue-400/50 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                  <Users className="h-10 w-10 mx-auto mb-3 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                  <div className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                    Online Players
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    1,247
                  </div>
                </div>
              </div>
              <div className="text-center text-white group cursor-pointer hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 backdrop-blur-sm border border-yellow-500/30 group-hover:border-yellow-400/50 group-hover:shadow-lg group-hover:shadow-yellow-500/20">
                  <Trophy className="h-10 w-10 mx-auto mb-3 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" />
                  <div className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                    Active Games
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    89
                  </div>
                </div>
              </div>
              <div className="text-center text-white group cursor-pointer hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 backdrop-blur-sm border border-green-500/30 group-hover:border-green-400/50 group-hover:shadow-lg group-hover:shadow-green-500/20">
                  <Settings className="h-10 w-10 mx-auto mb-3 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
                  <div className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                    Servers
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    12
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
