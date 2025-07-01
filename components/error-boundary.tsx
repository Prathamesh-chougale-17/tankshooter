"use client";

import React, { Component, ReactNode } from "react";
import { Zap, Circle, Wallet } from "lucide-react";
import { WalletButton } from "@/components/solana/solana-provider";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isWalletError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isWalletError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.warn("Error boundary caught:", error.message);
    // Check if it's a wallet error
    const isWalletError =
      error.message.includes("chains") || error.message.includes("wallet");
    return { hasError: true, isWalletError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log wallet-related errors but don't crash the app
    if (error.message.includes("chains") || error.message.includes("wallet")) {
      console.warn("Wallet error caught:", error, errorInfo);
      // Set a flag to show wallet connection message instead of generic error
      this.setState({ hasError: true, isWalletError: true });
    } else {
      console.error("Error caught by boundary:", error, errorInfo);
      this.setState({ hasError: true, isWalletError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isWalletError) {
        // Show wallet connection interface for wallet errors
        return (
          this.props.fallback || (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
              {/* Header similar to app-header */}
              <header className="relative z-50 px-4 py-3 bg-gradient-to-r from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-md border-b border-purple-500/20 shadow-sm">
                <div className="mx-auto max-w-7xl flex justify-between items-center">
                  <div className="flex items-baseline gap-4">
                    <div className="group flex items-center gap-2 text-xl">
                      <div className="relative flex items-center">
                        {/* Animated background circle */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-20 animate-pulse"></div>

                        {/* Main logo icon */}
                        <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-lg shadow-lg">
                          <Zap className="w-4 h-4 text-white drop-shadow-sm animate-bounce" />
                        </div>

                        {/* Animated orbit circles */}
                        <div className="absolute inset-0 opacity-100">
                          <Circle className="absolute top-0 left-0 w-2 h-2 text-purple-400 animate-spin" />
                          <Circle className="absolute bottom-0 right-0 w-2 h-2 text-blue-400 animate-spin animate-reverse" />
                        </div>
                      </div>

                      {/* Logo text */}
                      <span className="font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        Tank Shooter
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 p-1 bg-white/10 rounded-lg">
                      <WalletButton size="sm" />
                    </div>
                  </div>
                </div>
              </header>

              {/* Main content area */}
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                  <div className="relative mb-8">
                    <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-full shadow-2xl mx-auto mb-6">
                      <Wallet className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
                  </div>

                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                    Connect Your Wallet
                  </h2>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    To continue playing Tank Shooter, please connect your wallet
                    using the button in the header above.
                  </p>
                  <p className="text-sm text-gray-400 mb-8">
                    A wallet connection is required to pay the small gas fee and
                    join the game.
                  </p>

                  <button
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                    onClick={() => {
                      this.setState({ hasError: false, isWalletError: false });
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )
        );
      } else {
        // Show generic error for non-wallet errors
        return (
          this.props.fallback || (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Something went wrong
                </h2>
                <p className="text-gray-400 mb-4">
                  An unexpected error occurred.
                </p>
                <button
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                  onClick={() => {
                    this.setState({ hasError: false, isWalletError: false });
                    window.location.reload();
                  }}
                >
                  Reload Page
                </button>
              </div>
            </div>
          )
        );
      }
    }

    return this.props.children;
  }
}
