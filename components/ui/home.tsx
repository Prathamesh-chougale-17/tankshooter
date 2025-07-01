"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameCanvas } from "@/components/game-canvas";
import { AppHeader } from "@/components/app-header";
import { useWalletUi } from "@wallet-ui/react";
import { payGameGasFee } from "@/lib/gas-payment";
import { useWalletUiSigner } from "@/components/solana/use-wallet-ui-signer";
import { AccountBalanceCustomRpc } from "@/components/account/account-ui";
import { address } from "gill";
import { Gamepad2, Users, Trophy, Settings } from "lucide-react";
import { useGetBalanceFromCustomRpcQuery } from "@/components/account/account-data-access";

import { useWebSocket } from "@/hooks/use-websocket";

export default function HomePage() {
  const [gameState, setGameState] = useState<"menu" | "game">("menu");
  const [playerName, setPlayerName] = useState("");
  const [selectedTankClass, setSelectedTankClass] = useState("basic");
  const [gameMode, setGameMode] = useState("ffa");
  const [playMode, setPlayMode] = useState<"auto" | "bots" | "multiplayer">(
    "auto"
  );
  const [isPayingGas, setIsPayingGas] = useState(false);

  const { account } = useWalletUi();
  const txSigner = useWalletUiSigner();
  const { isConnected, lastMessage } = useWebSocket();

  // Extract server stats from WebSocket messages
  const [serverStats, setServerStats] = useState({
    onlinePlayers: 0,
    activeGames: 0,
    servers: 1,
  });

  useEffect(() => {
    if (lastMessage && lastMessage.type === "serverStats") {
      setServerStats({
        onlinePlayers: (lastMessage.onlinePlayers as number) || 0,
        activeGames: (lastMessage.activeGames as number) || 0,
        servers: (lastMessage.servers as number) || 1,
      });
    }
  }, [lastMessage]);

  // Auto-switch from multiplayer mode if connection is lost
  useEffect(() => {
    if (playMode === "multiplayer" && !isConnected) {
      setPlayMode("auto");
    }
  }, [isConnected, playMode]);

  // Get balance for balance checking
  const dummyAddress = address("11111111111111111111111111111112");
  const balanceQuery = useGetBalanceFromCustomRpcQuery({
    address: account?.address ? address(account.address) : dummyAddress,
  });

  const tankClasses = [
    {
      id: "basic",
      name: "Basic Tank",
      description: "Balanced stats, good for beginners",
    },
    { id: "twin", name: "Twin", description: "Dual cannons, faster fire rate" },
    { id: "sniper", name: "Sniper", description: "Long range, high damage" },
    {
      id: "machine-gun",
      name: "Machine Gun",
      description: "Rapid fire, lower damage",
    },
  ];

  const gameModes = [
    {
      id: "ffa",
      name: "Free For All",
      description: "Every tank for themselves",
    },
    {
      id: "team",
      name: "Team Deathmatch",
      description: "2 teams battle for supremacy",
    },
    {
      id: "domination",
      name: "Domination",
      description: "Control the dominators",
    },
  ];

  const playModes = [
    {
      id: "auto",
      name: "Auto Select",
      description: "Multiplayer if connected, bots if offline",
      icon: "⚡",
    },
    {
      id: "multiplayer",
      name: "Multiplayer",
      description: "Play with real players online",
      icon: "🌐",
    },
    {
      id: "bots",
      name: "Bot Arena",
      description: "Practice against AI opponents",
      icon: "🤖",
    },
  ];

  const startGame = async () => {
    if (!playerName.trim()) {
      return;
    }

    if (!account?.address) {
      alert("Please connect your wallet first!");
      return;
    }

    // Check if multiplayer is selected but server is offline
    if (playMode === "multiplayer" && !isConnected) {
      alert(
        "Multiplayer mode requires server connection. Please select 'Auto Select' or 'Bot Arena' for offline play."
      );
      return;
    }

    // Pay gas fee before starting the game
    try {
      setIsPayingGas(true);
      await payGasFee();
      setGameState("game");
    } catch (error) {
      console.error("Failed to pay gas fee:", error);
      alert("Failed to pay gas fee. Please try again.");
    } finally {
      setIsPayingGas(false);
    }
  };

  const payGasFee = async () => {
    if (!account?.address) {
      throw new Error("Wallet not connected");
    }

    if (!txSigner) {
      throw new Error(
        "Wallet signer not available. Please connect your wallet."
      );
    }

    const result = await payGameGasFee(account.address, txSigner);

    if (!result.success) {
      throw new Error(result.error || "Failed to pay gas fee");
    }

    return result;
  };

  const backToMenu = () => {
    setGameState("menu");
  };

  if (gameState === "game") {
    const effectivePlayMode =
      playMode === "auto" ? (isConnected ? "multiplayer" : "bots") : playMode;

    return (
      <GameCanvas
        playerName={playerName}
        tankClass={selectedTankClass}
        gameMode={gameMode}
        playMode={effectivePlayMode}
        onBackToMenu={backToMenu}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Add header with wallet connection */}
      <AppHeader links={[]} />

      <div className="flex-1 flex items-center justify-center p-4">
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating particles */}
          <div className="absolute top-20 left-20 w-3 h-3 bg-yellow-400/60 rounded-full animate-pulse shadow-lg shadow-yellow-400/30"></div>
          <div className="absolute top-40 right-32 w-4 h-4 bg-blue-400/60 rounded-full animate-bounce shadow-lg shadow-blue-400/30"></div>
          <div className="absolute bottom-32 left-40 w-2 h-2 bg-green-400/60 rounded-full animate-ping shadow-lg shadow-green-400/30"></div>
          <div className="absolute bottom-20 right-20 w-3 h-3 bg-red-400/60 rounded-full animate-pulse shadow-lg shadow-red-400/30"></div>
          <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-purple-400/40 rounded-full animate-bounce delay-300"></div>
          <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-cyan-400/40 rounded-full animate-ping delay-500"></div>

          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idXJsKCNncmlkKSIgLz4KPHN2Zz4K')] opacity-30"></div>

          {/* Gradient orbs */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
        </div>

        <Card className="w-full max-w-2xl bg-black/30 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/10 relative overflow-hidden group animate-slide-up">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <CardHeader className="text-center relative z-10">
            <CardTitle className="text-6xl font-bold mb-4 tracking-wider bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-glow">
              Tank{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Shooter
              </span>
              {/* Connection status indicator */}
              <div
                className={`inline-block ml-4 w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                }`}
                title={isConnected ? "Multiplayer Online" : "Offline Mode"}
              ></div>
            </CardTitle>
            <p className="text-gray-300 text-lg font-medium animate-fade-in">
              {isConnected
                ? "Multiplayer Tank Battle Arena"
                : "Single Player Tank Battle Arena"}
            </p>
          </CardHeader>

          <CardContent className="space-y-8 relative z-10">
            {/* Wallet Balance Display */}
            {account?.address && (
              <div
                className="space-y-3 group animate-fade-in"
                style={{ animationDelay: "0.1s", animationFillMode: "both" }}
              >
                <AccountBalanceCustomRpc address={address(account.address)} />
                <p className="text-center text-gray-400 text-xs">
                  ⚡ Game requires 0.001 GOR to play
                  {balanceQuery.data?.value &&
                    Number(balanceQuery.data.value) >= 1000000 && (
                      <span className="text-green-400 ml-2">
                        ✓ Sufficient balance
                      </span>
                    )}
                  {balanceQuery.data?.value &&
                    Number(balanceQuery.data.value) < 1000000 && (
                      <span className="text-yellow-400 ml-2">
                        ⚠ Need more GOR
                      </span>
                    )}
                </p>
              </div>
            )}
            {/* Player Name Input */}
            <div
              className="space-y-3 group animate-fade-in"
              style={{ animationDelay: "0.2s", animationFillMode: "both" }}
            >
              <label className="text-white font-medium text-xs uppercase tracking-wide flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                Player Name
              </label>
              <Input
                placeholder="Enter your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-gray-400 h-12 text-lg backdrop-blur-sm hover:bg-white/15 focus:bg-white/20 transition-all duration-300 group-hover:border-purple-400/50 focus:ring-2 focus:ring-purple-400/50 rounded-lg"
                maxLength={20}
              />
            </div>
            {/* Play Mode Selection */}
            <div
              className="space-y-3 group animate-fade-in"
              style={{ animationDelay: "0.3s", animationFillMode: "both" }}
            >
              <label className="text-white font-medium text-xs uppercase tracking-wide flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-cyan-400 to-purple-400"></div>
                Play Mode
              </label>
              <Select
                value={playMode}
                onValueChange={(value) =>
                  setPlayMode(value as "auto" | "bots" | "multiplayer")
                }
              >
                <SelectTrigger className="bg-white/10 border-purple-500/30 text-white h-12 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 group-hover:border-purple-400/50 focus:ring-2 focus:ring-purple-400/50 rounded-lg">
                  <SelectValue placeholder="Choose play mode..." />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-purple-500/30 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/20">
                  {playModes.map((mode) => (
                    <SelectItem
                      key={mode.id}
                      value={mode.id}
                      disabled={mode.id === "multiplayer" && !isConnected}
                      className={`focus:bg-purple-500/20 hover:bg-purple-500/10 cursor-pointer transition-colors duration-200 rounded-md mx-1 my-0.5 ${
                        mode.id === "multiplayer" && !isConnected
                          ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                          : ""
                      }`}
                    >
                      <div className="py-2 px-1">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className="text-lg">{mode.icon}</span>
                          {mode.name}
                          {mode.id === "multiplayer" && !isConnected && (
                            <span className="text-xs text-red-400 ml-2">
                              (Offline)
                            </span>
                          )}
                          {mode.id === "multiplayer" && isConnected && (
                            <span className="text-xs text-green-400 ml-2">
                              (Online)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-6">
                          {mode.id === "multiplayer" && !isConnected
                            ? "Server connection required"
                            : mode.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className="flex justify-between animate-fade-in"
              style={{ animationDelay: "0.4s", animationFillMode: "both" }}
            >
              <div className="flex-1 space-y-3 group">
                <label className="text-white font-medium text-xs uppercase tracking-wide flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-400 to-blue-400"></div>
                  Tank Class
                </label>
                <Select
                  value={selectedTankClass}
                  onValueChange={setSelectedTankClass}
                >
                  <SelectTrigger className="bg-white/10 border-purple-500/30 text-white h-12 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 group-hover:border-purple-400/50 focus:ring-2 focus:ring-purple-400/50 rounded-lg">
                    <SelectValue placeholder="Choose your tank..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-purple-500/30 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/20">
                    {tankClasses.map((tank) => (
                      <SelectItem
                        key={tank.id}
                        value={tank.id}
                        className="focus:bg-purple-500/20 hover:bg-purple-500/10 cursor-pointer transition-colors duration-200 rounded-md mx-1 my-0.5"
                      >
                        <div className="py-2 px-1">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400"></div>
                            {tank.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 ml-4">
                            {tank.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-3 group">
                <label className="text-white font-medium text-xs uppercase tracking-wide flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-green-400 to-blue-400"></div>
                  Game Mode
                </label>
                <Select value={gameMode} onValueChange={setGameMode}>
                  <SelectTrigger className="bg-white/10 border-purple-500/30 text-white h-12 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 group-hover:border-purple-400/50 focus:ring-2 focus:ring-purple-400/50 rounded-lg">
                    <SelectValue placeholder="Select game mode..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-purple-500/30 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/20">
                    {gameModes.map((mode) => (
                      <SelectItem
                        key={mode.id}
                        value={mode.id}
                        className="focus:bg-purple-500/20 hover:bg-purple-500/10 cursor-pointer transition-colors duration-200 rounded-md mx-1 my-0.5"
                      >
                        <div className="py-2 px-1">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-400"></div>
                            {mode.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 ml-4">
                            {mode.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>{" "}
            <div
              className="animate-fade-in"
              style={{ animationDelay: "0.6s", animationFillMode: "both" }}
            >
              <Button
                onClick={startGame}
                disabled={
                  !playerName.trim() || !account?.address || isPayingGas
                }
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-2xl rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden min-h-[80px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {isPayingGas ? (
                  <>
                    <div className="mr-4 h-8 w-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="relative z-10">Paying Gas Fee...</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="mr-4 h-8 w-8 relative z-10" />
                    <span className="relative z-10">
                      {!account?.address
                        ? "Connect Wallet First"
                        : (() => {
                            const effectiveMode =
                              playMode === "auto"
                                ? isConnected
                                  ? "multiplayer"
                                  : "bots"
                                : playMode;

                            switch (effectiveMode) {
                              case "multiplayer":
                                return "Start Multiplayer Game (0.001 GOR)";
                              case "bots":
                                return "Start Bot Arena (0.001 GOR)";
                              default:
                                return "Start Game (0.001 GOR)";
                            }
                          })()}
                    </span>
                  </>
                )}
              </Button>
              {!account?.address && (
                <p className="text-center text-gray-400 text-sm mt-3">
                  Connect your Backpack wallet and pay 0.001 $GOR to play on
                  Gorbagana testnet
                </p>
              )}
            </div>
            <div
              className="grid grid-cols-3 gap-6 pt-6 animate-fade-in"
              style={{ animationDelay: "0.8s", animationFillMode: "both" }}
            >
              <div className="text-center text-white group cursor-pointer hover:transform hover:scale-105 transition-all duration-300">
                <div
                  className={`bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 backdrop-blur-sm border transition-all duration-300 ${
                    isConnected
                      ? "border-blue-500/30 group-hover:border-blue-400/50 group-hover:shadow-lg group-hover:shadow-blue-500/20"
                      : "border-gray-500/30 group-hover:border-gray-400/50"
                  }`}
                >
                  <Users
                    className={`h-10 w-10 mx-auto mb-3 transition-colors duration-300 ${
                      isConnected
                        ? "text-blue-400 group-hover:text-blue-300"
                        : "text-gray-400 group-hover:text-gray-300"
                    }`}
                  />
                  <div className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                    Online Players
                  </div>
                  <div
                    className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                      isConnected
                        ? "from-blue-400 to-cyan-400"
                        : "from-gray-400 to-gray-500"
                    }`}
                  >
                    {isConnected ? serverStats.onlinePlayers : "Offline"}
                  </div>
                  {!isConnected && (
                    <div className="text-xs text-gray-500 mt-1">Demo Mode</div>
                  )}
                </div>
              </div>
              <div className="text-center text-white group cursor-pointer hover:transform hover:scale-105 transition-all duration-300">
                <div
                  className={`bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 backdrop-blur-sm border transition-all duration-300 ${
                    isConnected
                      ? "border-yellow-500/30 group-hover:border-yellow-400/50 group-hover:shadow-lg group-hover:shadow-yellow-500/20"
                      : "border-gray-500/30 group-hover:border-gray-400/50"
                  }`}
                >
                  <Trophy
                    className={`h-10 w-10 mx-auto mb-3 transition-colors duration-300 ${
                      isConnected
                        ? "text-yellow-400 group-hover:text-yellow-300"
                        : "text-gray-400 group-hover:text-gray-300"
                    }`}
                  />
                  <div className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                    Active Games
                  </div>
                  <div
                    className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                      isConnected
                        ? "from-yellow-400 to-orange-400"
                        : "from-gray-400 to-gray-500"
                    }`}
                  >
                    {isConnected ? serverStats.activeGames : "Local"}
                  </div>
                  {!isConnected && (
                    <div className="text-xs text-gray-500 mt-1">With Bots</div>
                  )}
                </div>
              </div>
              <div className="text-center text-white group cursor-pointer hover:transform hover:scale-105 transition-all duration-300">
                <div
                  className={`bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 backdrop-blur-sm border transition-all duration-300 ${
                    isConnected
                      ? "border-green-500/30 group-hover:border-green-400/50 group-hover:shadow-lg group-hover:shadow-green-500/20"
                      : "border-gray-500/30 group-hover:border-gray-400/50"
                  }`}
                >
                  <Settings
                    className={`h-10 w-10 mx-auto mb-3 transition-colors duration-300 ${
                      isConnected
                        ? "text-green-400 group-hover:text-green-300"
                        : "text-gray-400 group-hover:text-gray-300"
                    }`}
                  />
                  <div className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                    Server Status
                  </div>
                  <div
                    className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                      isConnected
                        ? "from-green-400 to-emerald-400"
                        : "from-gray-400 to-gray-500"
                    }`}
                  >
                    {isConnected ? "Online" : "Offline"}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      isConnected ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    {isConnected ? "Multiplayer Ready" : "Single Player"}
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
