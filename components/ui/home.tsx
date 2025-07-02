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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GameCanvas } from "@/components/game-canvas";
import { AppHeader } from "@/components/app-header";
import { useWalletUi } from "@wallet-ui/react";
import { payGameGasFee, validateWalletBalance } from "@/lib/gas-payment";
import { useWalletUiSigner } from "@/components/solana/use-wallet-ui-signer";
import { AccountBalanceCustomRpc } from "@/components/account/account-ui";
import { address } from "gill";
import {
  Gamepad2,
  Users,
  Trophy,
  Settings,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { useGetBalanceFromCustomRpcQuery } from "@/components/account/account-data-access";
import { toast } from "sonner";

import { useWebSocket } from "@/hooks/use-websocket";

export default function HomePage() {
  const [gameState, setGameState] = useState<"menu" | "game">("menu");
  const [playerName, setPlayerName] = useState("");
  const [selectedTankClass, setSelectedTankClass] = useState("basic");
  const [gameMode, setGameMode] = useState("ffa");
  const [playMode, setPlayMode] = useState<
    "auto" | "bots" | "multiplayer" | "competition"
  >("auto");
  const [isPayingGas, setIsPayingGas] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showWalletAlert, setShowWalletAlert] = useState(false);
  const [showCompetitionAlert, setShowCompetitionAlert] = useState(false);

  const { account } = useWalletUi();
  const txSigner = useWalletUiSigner();
  const { isConnected, lastMessage } = useWebSocket();

  // Extract server stats from WebSocket messages
  const [serverStats, setServerStats] = useState({
    onlinePlayers: 0,
    activeGames: 0,
    servers: 1,
  });

  const [hasShownConnectionToast, setHasShownConnectionToast] = useState(false);

  // Show connection status toasts
  useEffect(() => {
    if (!hasShownConnectionToast) {
      if (isConnected) {
        toast.success("Server connected", {
          description: "Multiplayer mode is now available!",
          duration: 3000,
        });
      } else {
        toast.info("Running in offline mode", {
          description: "Connect to enable multiplayer battles",
          duration: 3000,
        });
      }
      setHasShownConnectionToast(true);
    }
  }, [isConnected, hasShownConnectionToast]);

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
      toast.warning("Switched to Auto Select", {
        description: "Server connection lost. Switched to offline mode.",
        duration: 4000,
      });
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
      id: "competition",
      name: "Competition Mode",
      description: "8-player tournament (0.5 GOR entry, 1 GOR prize)",
      icon: "🏆",
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
      toast.error("Player name required", {
        description:
          "Please enter your tank commander name before starting the battle.",
        duration: 3000,
      });
      return;
    }

    if (!account?.address) {
      setShowWalletAlert(true);
      return;
    }

    // Check if multiplayer is selected but server is offline
    if (playMode === "multiplayer" && !isConnected) {
      setShowOfflineAlert(true);
      return;
    }

    // Special handling for competition mode - check balance and show dialog
    if (playMode === "competition") {
      // Validate wallet has enough balance for competition fee
      if (
        !balanceQuery.data?.value ||
        !validateWalletBalance(Number(balanceQuery.data.value), true)
      ) {
        toast.error("Insufficient balance for Competition Mode", {
          description: "You need at least 0.5 GOR to enter Competition Mode.",
          duration: 4000,
        });
        return;
      }

      // Show competition confirmation dialog
      setShowCompetitionAlert(true);
      return;
    }

    // Show confirmation before payment for other modes
    const effectiveMode =
      playMode === "auto" ? (isConnected ? "multiplayer" : "bots") : playMode;

    const modeText =
      effectiveMode === "multiplayer"
        ? "Enter multiplayer battle"
        : effectiveMode === "bots"
        ? "Start training with bots"
        : "Begin mission";

    // Use the correct fee amount (always 0.001 for non-competition modes)
    const feeAmount = "0.001";

    toast.info("Starting game...", {
      description: `${modeText} • Paying ${feeAmount} GOR entry fee`,
      duration: 2000,
    });

    // Pay gas fee before starting the game
    try {
      setIsPayingGas(true);
      toast.loading("Processing payment...", {
        description: `Signing transaction and paying ${feeAmount} GOR fee`,
        id: "payment-toast",
      });

      await payGasFee();

      toast.success("Payment successful!", {
        description: "Welcome to the battlefield, commander!",
        id: "payment-toast",
        duration: 2000,
      });

      setGameState("game");
    } catch (error) {
      console.error("Failed to pay gas fee:", error);
      toast.error("Payment failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to pay gas fee. Please try again.",
        id: "payment-toast",
        duration: 5000,
      });
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

    // Pass the competition mode flag to use the correct fee amount
    const isCompetitionMode = playMode === "competition";
    const result = await payGameGasFee(
      account.address,
      txSigner,
      isCompetitionMode
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to pay gas fee");
    }

    return result;
  };

  const backToMenu = () => {
    setGameState("menu");
  };

  if (gameState === "game") {
    // For auto mode, select multiplayer or bots based on connection
    // For competition mode, we'll handle it specially in the GameCanvas
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex flex-col relative overflow-hidden">
      {/* Add header with wallet connection */}
      <AppHeader links={[]} />

      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated tank silhouettes */}
          <div className="absolute top-20 left-10 w-16 h-16 opacity-10 animate-pulse">
            <div className="w-full h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full relative">
              <div className="absolute top-1/2 right-0 w-6 h-2 bg-gradient-to-r from-purple-400 to-blue-400 transform -translate-y-1/2"></div>
            </div>
          </div>
          <div className="absolute bottom-32 right-16 w-12 h-12 opacity-10 animate-bounce">
            <div className="w-full h-full bg-gradient-to-r from-green-400 to-yellow-400 rounded-full relative">
              <div className="absolute top-1/2 left-0 w-4 h-1 bg-gradient-to-r from-green-400 to-yellow-400 transform -translate-y-1/2"></div>
            </div>
          </div>

          {/* Floating particles with glow */}
          <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50"></div>
          <div
            className="absolute top-2/3 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-400/50"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-pink-400 rounded-full animate-ping shadow-lg shadow-pink-400/50"></div>

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

          {/* Gradient orbs with enhanced glow */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-2xl animate-pulse"></div>
          <div
            className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-60 h-60 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        <Card className="w-full max-w-4xl bg-black/20 backdrop-blur-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 relative overflow-hidden group">
          {/* Enhanced card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <CardHeader className="text-center relative z-10 pb-8">
            <div className="relative">
              <CardTitle className="text-7xl font-black mb-6 tracking-wider relative">
                <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-2xl">
                  Tank
                </span>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent ml-4 drop-shadow-2xl">
                  Shooter
                </span>
                {/* Enhanced connection status indicator */}
                <div className="absolute -top-3 -right-16 flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      isConnected
                        ? "bg-emerald-400 border-emerald-300 shadow-lg shadow-emerald-400/50 animate-pulse"
                        : "bg-slate-400 border-slate-300 shadow-lg shadow-slate-400/30"
                    }`}
                  ></div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isConnected ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {isConnected ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
              </CardTitle>

              <div className="relative">
                <p className="text-xl font-semibold bg-gradient-to-r from-slate-300 to-slate-100 bg-clip-text text-transparent mb-2">
                  {isConnected
                    ? "🌐 Multiplayer Tank Battle Arena"
                    : "🤖 Single Player Tank Battle Arena"}
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  Built on{" "}
                  <span className="text-purple-400 font-bold">
                    Gorbagana Testnet
                  </span>{" "}
                  • Powered by{" "}
                  <span className="text-cyan-400 font-bold">$GOR</span>
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-10 relative z-10 px-8 pb-8">
            {/* Wallet Balance Display */}
            {account?.address && (
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20 backdrop-blur-sm">
                <AccountBalanceCustomRpc address={address(account.address)} />
                <div className="text-center mt-4">
                  <p className="text-sm text-slate-300 mb-2">
                    ⚡ Entry Fee:{" "}
                    <span className="font-bold text-yellow-400">
                      {playMode === "competition" ? "0.5 GOR" : "0.001 GOR"}
                    </span>
                  </p>
                  {balanceQuery.data?.value && (
                    <div className="space-y-2">
                      {/* Regular mode balance check */}
                      {playMode !== "competition" &&
                        Number(balanceQuery.data.value) >= 1000000 && (
                          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-500/30">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            Sufficient Balance
                          </div>
                        )}
                      {playMode !== "competition" &&
                        Number(balanceQuery.data.value) < 1000000 && (
                          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-semibold border border-amber-500/30">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            Need More GOR
                          </div>
                        )}

                      {/* Competition mode balance check */}
                      {playMode === "competition" &&
                        validateWalletBalance(
                          Number(balanceQuery.data.value),
                          true
                        ) && (
                          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-500/30">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            Sufficient for Competition Mode
                          </div>
                        )}
                      {playMode === "competition" &&
                        !validateWalletBalance(
                          Number(balanceQuery.data.value),
                          true
                        ) && (
                          <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold border border-red-500/30">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            Insufficient for Competition Mode (Need 0.5+ GOR)
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Player Configuration */}
            <div className="space-y-8">
              {/* Player Name Input - Full Width */}
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-white font-bold text-sm uppercase tracking-wider">
                  <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/30"></div>
                  Player Name
                </label>
                <Input
                  placeholder="Enter your tank commander name..."
                  value={playerName}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setPlayerName(newValue);

                    // Show helpful toast when user starts typing
                    if (newValue.length === 1) {
                      toast.info("Great start, commander!", {
                        description:
                          "Choose a name that strikes fear into your enemies",
                        duration: 2000,
                      });
                    }

                    // Warn when approaching character limit
                    if (newValue.length === 18) {
                      toast.warning("Character limit approaching", {
                        description: "Maximum 20 characters allowed",
                        duration: 2000,
                      });
                    }
                  }}
                  className="bg-slate-800/50 border-2 border-slate-600/50 text-white placeholder:text-slate-400 h-14 text-lg backdrop-blur-sm hover:bg-slate-800/70 focus:bg-slate-800/80 focus:border-purple-400/70 transition-all duration-300 rounded-xl shadow-lg focus:shadow-purple-400/20"
                  maxLength={20}
                />
              </div>

              {/* Battle Configuration - Single Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Battle Mode Selection */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-white font-bold text-sm uppercase tracking-wider">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 shadow-lg shadow-cyan-400/30"></div>
                    Battle Mode
                  </label>{" "}
                  <Select
                    value={playMode}
                    onValueChange={(value) => {
                      const newMode = value as
                        | "auto"
                        | "bots"
                        | "multiplayer"
                        | "competition";
                      setPlayMode(newMode);

                      // Show toast based on selected mode
                      const modeInfo = playModes.find(
                        (mode) => mode.id === newMode
                      );
                      if (modeInfo) {
                        if (newMode === "multiplayer" && !isConnected) {
                          toast.warning("Multiplayer unavailable", {
                            description:
                              "Server connection required for multiplayer battles",
                            duration: 3000,
                          });
                        } else {
                          toast.info(`${modeInfo.name} selected`, {
                            description: modeInfo.description,
                            duration: 2000,
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-2 border-slate-600/50 text-white h-14 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 focus:border-purple-400/70 rounded-xl shadow-lg focus:shadow-purple-400/20">
                      <SelectValue placeholder="Choose your battle mode...">
                        {playMode && (
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {
                                playModes.find((mode) => mode.id === playMode)
                                  ?.icon
                              }
                            </span>
                            <span className="font-semibold">
                              {
                                playModes.find((mode) => mode.id === playMode)
                                  ?.name
                              }
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 border-2 border-purple-500/30 backdrop-blur-xl rounded-xl shadow-2xl shadow-purple-500/20">
                      {playModes.map((mode) => (
                        <SelectItem
                          key={mode.id}
                          value={mode.id}
                          disabled={mode.id === "multiplayer" && !isConnected}
                          className={`focus:bg-purple-500/20 hover:bg-purple-500/10 cursor-pointer transition-all duration-200 rounded-lg mx-2 my-1 p-4 ${
                            mode.id === "multiplayer" && !isConnected
                              ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{mode.icon}</span>
                            <div>
                              <div className="font-bold text-white text-lg flex items-center gap-2">
                                {mode.name}
                                {mode.id === "multiplayer" && !isConnected && (
                                  <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">
                                    OFFLINE
                                  </span>
                                )}
                                {mode.id === "multiplayer" && isConnected && (
                                  <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                                    ONLINE
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                {mode.id === "multiplayer" && !isConnected
                                  ? "Server connection required"
                                  : mode.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tank Class Selection */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-white font-bold text-sm uppercase tracking-wider">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 shadow-lg shadow-purple-400/30"></div>
                    Tank Class
                  </label>
                  <Select
                    value={selectedTankClass}
                    onValueChange={(value) => {
                      setSelectedTankClass(value);

                      // Show toast with tank class info
                      const tankInfo = tankClasses.find(
                        (tank) => tank.id === value
                      );
                      if (tankInfo) {
                        toast.info(`${tankInfo.name} selected`, {
                          description: tankInfo.description,
                          duration: 2000,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-2 border-slate-600/50 text-white h-14 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 focus:border-purple-400/70 rounded-xl shadow-lg focus:shadow-purple-400/20">
                      <SelectValue placeholder="Choose your tank...">
                        {selectedTankClass && (
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 shadow-lg shadow-purple-400/50"></div>
                            <span className="font-semibold">
                              {
                                tankClasses.find(
                                  (tank) => tank.id === selectedTankClass
                                )?.name
                              }
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 border-2 border-purple-500/30 backdrop-blur-xl rounded-xl shadow-2xl shadow-purple-500/20">
                      {tankClasses.map((tank) => (
                        <SelectItem
                          key={tank.id}
                          value={tank.id}
                          className="focus:bg-purple-500/20 hover:bg-purple-500/10 cursor-pointer transition-all duration-200 rounded-lg mx-2 my-1 p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 shadow-lg shadow-purple-400/50"></div>
                            <div>
                              <div className="font-bold text-white text-lg">
                                {tank.name}
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                {tank.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Game Mode Selection */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-white font-bold text-sm uppercase tracking-wider">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 shadow-lg shadow-emerald-400/30"></div>
                    Game Mode
                  </label>
                  <Select
                    value={gameMode}
                    onValueChange={(value) => {
                      setGameMode(value);

                      // Show toast with game mode info
                      const modeInfo = gameModes.find(
                        (mode) => mode.id === value
                      );
                      if (modeInfo) {
                        toast.info(`${modeInfo.name} selected`, {
                          description: modeInfo.description,
                          duration: 2000,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-2 border-slate-600/50 text-white h-14 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 focus:border-purple-400/70 rounded-xl shadow-lg focus:shadow-purple-400/20">
                      <SelectValue placeholder="Select game mode...">
                        {gameMode && (
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 shadow-lg shadow-emerald-400/50"></div>
                            <span className="font-semibold">
                              {
                                gameModes.find((mode) => mode.id === gameMode)
                                  ?.name
                              }
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 border-2 border-purple-500/30 backdrop-blur-xl rounded-xl shadow-2xl shadow-purple-500/20">
                      {gameModes.map((mode) => (
                        <SelectItem
                          key={mode.id}
                          value={mode.id}
                          className="focus:bg-purple-500/20 hover:bg-purple-500/10 cursor-pointer transition-all duration-200 rounded-lg mx-2 my-1 p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 shadow-lg shadow-emerald-400/50"></div>
                            <div>
                              <div className="font-bold text-white text-lg">
                                {mode.name}
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                {mode.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Start Game Button */}
            <div className="pt-4">
              <Button
                onClick={startGame}
                disabled={
                  !playerName.trim() || !account?.address || isPayingGas
                }
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-black py-8 text-2xl rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden border-2 border-purple-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {isPayingGas ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-8 w-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="relative z-10 tracking-wider">
                      PROCESSING PAYMENT...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <Gamepad2 className="h-10 w-10 relative z-10" />
                    <span className="relative z-10 tracking-wider">
                      {!account?.address
                        ? "CONNECT WALLET FIRST"
                        : (() => {
                            const effectiveMode =
                              playMode === "auto"
                                ? isConnected
                                  ? "multiplayer"
                                  : "bots"
                                : playMode;

                            switch (effectiveMode) {
                              case "multiplayer":
                                return "DEPLOY TO BATTLE • 0.001 GOR";
                              case "bots":
                                return "ENTER TRAINING • 0.001 GOR";
                              case "competition":
                                return "ENTER COMPETITION • 0.5 GOR";
                              default:
                                return "START MISSION • 0.001 GOR";
                            }
                          })()}
                    </span>
                  </div>
                )}
              </Button>
              {!account?.address && (
                <p className="text-center text-slate-400 text-sm mt-4 bg-slate-800/30 rounded-lg p-3 border border-slate-600/30">
                  🔗 Connect your{" "}
                  <span className="font-bold text-purple-400">
                    Backpack wallet
                  </span>{" "}
                  and pay{" "}
                  <span className="font-bold text-yellow-400">
                    {playMode === "competition" ? "0.5" : "0.001"} $GOR
                  </span>{" "}
                  to enter the battlefield on{" "}
                  <span className="font-bold text-cyan-400">
                    Gorbagana testnet
                  </span>
                </p>
              )}
            </div>

            {/* Enhanced Server Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center group cursor-pointer transform hover:scale-105 transition-all duration-300">
                <div
                  className={`relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm border transition-all duration-500 ${
                    isConnected
                      ? "bg-gradient-to-br from-blue-500/10 to-cyan-500/20 border-blue-500/30 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/20"
                      : "bg-gradient-to-br from-slate-500/10 to-slate-600/20 border-slate-500/30 hover:border-slate-400/60"
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Users
                    className={`h-12 w-12 mx-auto mb-4 transition-all duration-300 ${
                      isConnected
                        ? "text-blue-400 group-hover:text-blue-300 drop-shadow-lg"
                        : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  />
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Online Players
                  </div>
                  <div
                    className={`text-3xl font-black mb-2 ${
                      isConnected
                        ? "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
                        : "text-slate-400"
                    }`}
                  >
                    {isConnected ? serverStats.onlinePlayers : "---"}
                  </div>
                  {!isConnected && (
                    <div className="text-xs text-slate-500 bg-slate-700/50 rounded-full px-3 py-1">
                      OFFLINE MODE
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center group cursor-pointer transform hover:scale-105 transition-all duration-300">
                <div
                  className={`relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm border transition-all duration-500 ${
                    isConnected
                      ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/20 border-yellow-500/30 hover:border-yellow-400/60 hover:shadow-xl hover:shadow-yellow-500/20"
                      : "bg-gradient-to-br from-slate-500/10 to-slate-600/20 border-slate-500/30 hover:border-slate-400/60"
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Trophy
                    className={`h-12 w-12 mx-auto mb-4 transition-all duration-300 ${
                      isConnected
                        ? "text-yellow-400 group-hover:text-yellow-300 drop-shadow-lg"
                        : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  />
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Active Battles
                  </div>
                  <div
                    className={`text-3xl font-black mb-2 ${
                      isConnected
                        ? "bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"
                        : "text-slate-400"
                    }`}
                  >
                    {isConnected ? serverStats.activeGames : "---"}
                  </div>
                  {!isConnected && (
                    <div className="text-xs text-slate-500 bg-slate-700/50 rounded-full px-3 py-1">
                      BOT ARENA
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center group cursor-pointer transform hover:scale-105 transition-all duration-300">
                <div
                  className={`relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm border transition-all duration-500 ${
                    isConnected
                      ? "bg-gradient-to-br from-emerald-500/10 to-green-500/20 border-emerald-500/30 hover:border-emerald-400/60 hover:shadow-xl hover:shadow-emerald-500/20"
                      : "bg-gradient-to-br from-slate-500/10 to-slate-600/20 border-slate-500/30 hover:border-slate-400/60"
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Settings
                    className={`h-12 w-12 mx-auto mb-4 transition-all duration-300 ${
                      isConnected
                        ? "text-emerald-400 group-hover:text-emerald-300 drop-shadow-lg"
                        : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  />
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Network Status
                  </div>
                  <div
                    className={`text-3xl font-black mb-2 ${
                      isConnected
                        ? "bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent"
                        : "text-slate-400"
                    }`}
                  >
                    {isConnected ? "LIVE" : "OFF"}
                  </div>
                  <div
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      isConnected
                        ? "text-emerald-400 bg-emerald-500/20 border border-emerald-500/30"
                        : "text-slate-500 bg-slate-700/50"
                    }`}
                  >
                    {isConnected ? "MULTIPLAYER READY" : "SINGLE PLAYER"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Dialogs */}
      <AlertDialog open={showWalletAlert} onOpenChange={setShowWalletAlert}>
        <AlertDialogContent className="bg-slate-900/95 border-2 border-purple-500/30 backdrop-blur-xl rounded-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <Wallet className="h-6 w-6 text-purple-400" />
              Wallet Connection Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-base leading-relaxed">
              You need to connect your Backpack wallet to pay the{" "}
              <span className="font-bold text-yellow-400">
                {playMode === "competition" ? "0.5 GOR" : "0.001 GOR"}
              </span>{" "}
              entry fee and join the battle on Gorbagana testnet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => {
                toast.info("Connect your wallet", {
                  description:
                    "Please use the wallet button in the top-right corner",
                  duration: 4000,
                });
              }}
            >
              Connect Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showOfflineAlert} onOpenChange={setShowOfflineAlert}>
        <AlertDialogContent className="bg-slate-900/95 border-2 border-amber-500/30 backdrop-blur-xl rounded-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
              Server Connection Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-base leading-relaxed">
              Multiplayer mode requires an active server connection. The server
              appears to be offline.
              <br />
              <br />
              You can either:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  Switch to{" "}
                  <strong className="text-cyan-400">Auto Select</strong> mode
                </li>
                <li>
                  Play in <strong className="text-green-400">Bot Arena</strong>{" "}
                  for offline practice
                </li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              onClick={() => {
                setPlayMode("auto");
                toast.success("Switched to Auto Select", {
                  description: "Will use bot arena while server is offline",
                  duration: 3000,
                });
              }}
            >
              Switch to Auto Select
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Competition Mode Confirmation Dialog */}
      <AlertDialog
        open={showCompetitionAlert}
        onOpenChange={setShowCompetitionAlert}
      >
        <AlertDialogContent className="bg-slate-900/95 border-2 border-yellow-500/30 backdrop-blur-xl rounded-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Competition Mode Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-base leading-relaxed">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                <p className="font-bold text-yellow-400 text-lg mb-2">
                  Entry Fee: 0.5 GOR
                </p>
                <p className="text-slate-300 mb-2">
                  Win the tournament to earn 1 GOR prize!
                </p>
              </div>

              <p className="mb-3 font-medium text-white">Competition Rules:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li className="text-slate-300">
                  8 players (you + 7 advanced bots)
                </li>
                <li className="text-slate-300">3 minute timed match</li>
                <li className="text-slate-300">All players have equal stats</li>
                <li className="text-slate-300">
                  Bots will attack each other and you
                </li>
                <li className="text-slate-300">
                  Winner has most kills (minimum 1 to qualify)
                </li>
                <li className="text-slate-300">
                  Winner takes all - 1 GOR prize
                </li>
              </ul>

              <p className="text-slate-300 mb-2">
                If you&apos;re eliminated, you can continue watching the
                competition until it ends, but you won&apos;t qualify for the
                prize.
              </p>

              <span className="text-slate-400 italic text-sm">
                Are you ready to compete for glory and GOR?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
              onClick={() => {
                // Continue with game start process
                const feeAmount = "0.5";

                toast.info("Starting competition...", {
                  description: `Enter competition • Paying ${feeAmount} GOR entry fee`,
                  duration: 2000,
                });

                // Pay gas fee and start game
                (async () => {
                  try {
                    setIsPayingGas(true);
                    toast.loading("Processing payment...", {
                      description: `Signing transaction and paying ${feeAmount} GOR fee`,
                      id: "payment-toast",
                    });

                    await payGasFee();

                    toast.success("Payment successful!", {
                      description: "Welcome to the competition!",
                      id: "payment-toast",
                      duration: 2000,
                    });

                    setGameState("game");
                  } catch (error) {
                    console.error("Failed to pay gas fee:", error);
                    toast.error("Payment failed", {
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to pay gas fee. Please try again.",
                      id: "payment-toast",
                      duration: 5000,
                    });
                  } finally {
                    setIsPayingGas(false);
                  }
                })();
              }}
            >
              Start Competition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
