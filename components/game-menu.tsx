"use client";
import { useState } from "react";
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
import { useWalletUi } from "@wallet-ui/react";
import { payGameGasFee } from "@/lib/gas-payment";
import { useWalletUiSigner } from "@/components/solana/use-wallet-ui-signer";
import { AccountBalanceCustomRpc } from "@/components/account/account-ui";
import { address } from "gill";
import { Gamepad2, Users, Trophy, Settings, Volume2 } from "lucide-react";
import { useGetBalanceFromCustomRpcQuery } from "@/components/account/account-data-access";
import { SoundControlPanel } from "@/components/sound-control-panel";

interface GameMenuProps {
  onStartGame: (
    playerName: string,
    tankClass: string,
    gameMode: string
  ) => void;
}

export function GameMenu({ onStartGame }: GameMenuProps) {
  const [playerName, setPlayerName] = useState("");
  const [selectedTankClass, setSelectedTankClass] = useState("basic");
  const [gameMode, setGameMode] = useState("ffa");
  const [isPayingGas, setIsPayingGas] = useState(false);
  const [showSoundControls, setShowSoundControls] = useState(false);

  const { account } = useWalletUi();
  const txSigner = useWalletUiSigner();

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
    {
      id: "competition",
      name: "Competition Mode",
      description: "8 players, 3 min, winner takes 1 GOR",
      entryFee: 0.5, // GOR
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

    // Pay gas fee before starting the game
    try {
      setIsPayingGas(true);
      await payGasFee();
      onStartGame(playerName, selectedTankClass, gameMode);
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
    console.log("Gas fee payment result:", result);
    return result;
  };

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
              className="animate-fade-in mb-4"
              style={{ animationDelay: "0.5s", animationFillMode: "both" }}
            >
              <Button
                onClick={() => setShowSoundControls(!showSoundControls)}
                variant="outline"
                className="w-full bg-white/10 border-purple-500/30 text-white hover:bg-white/15 transition-all duration-300 py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Volume2 className="h-5 w-5" />
                Sound Controls
              </Button>
            </div>
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
                        : "Start Game (0.001 GOR)"}
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

      {/* Sound Control Panel */}
      {showSoundControls && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <SoundControlPanel onClose={() => setShowSoundControls(false)} />
        </div>
      )}
    </div>
  );
}
