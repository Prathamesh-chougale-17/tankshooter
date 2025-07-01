"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Zap, Circle } from "lucide-react";
import { ThemeSelect } from "@/components/theme-select";
import {
  ClusterButton,
  WalletButton,
} from "@/components/solana/solana-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export function AppHeader({
  links = [],
}: {
  links: { label: string; path: string }[];
}) {
  const pathname = usePathname();

  function isActive(path: string) {
    return path === "/" ? pathname === "/" : pathname.startsWith(path);
  }

  return (
    <header className="relative z-50 px-4 py-3 bg-gradient-to-r from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-md border-b border-purple-500/20 shadow-sm">
      <div className="mx-auto max-w-7xl flex justify-between items-center">
        <div className="flex items-baseline gap-4">
          <Link
            className="group flex items-center gap-2 text-xl hover:text-neutral-500 dark:hover:text-white transition-colors duration-200"
            href="/"
          >
            <div className="relative flex items-center">
              {/* Animated background circle */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>

              {/* Main logo icon */}
              <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Zap className="w-4 h-4 text-white drop-shadow-sm animate-bounce group-hover:animate-none transition-all duration-300" />
              </div>

              {/* Animated orbit circles */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Circle className="absolute top-0 left-0 w-2 h-2 text-purple-400 animate-spin" />
                <Circle className="absolute bottom-0 right-0 w-2 h-2 text-blue-400 animate-spin animate-reverse" />
              </div>
            </div>

            {/* Logo text */}
            <span className="font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent group-hover:from-purple-500 group-hover:via-blue-500 group-hover:to-cyan-400 transition-all duration-300">
              Tank Shooter
            </span>
          </Link>
          <div className="hidden md:flex items-center">
            <nav className="relative">
              <ul className="flex gap-1 flex-nowrap items-center">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:scale-105 ${
                        isActive(path)
                          ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 shadow-sm"
                          : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                      href={path}
                    >
                      {label}
                      {isActive(path) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg animate-pulse" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-1 md:hidden">
          <div className="p-1 bg-white/10 rounded-lg">
            <ThemeSelect />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95 text-white"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] p-0">
              <SheetHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <SheetTitle className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    {/* Animated logo for mobile menu */}
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-lg shadow-md">
                      <Zap className="w-4 h-4 text-white animate-pulse" />
                    </div>
                  </div>
                  <span className="text-lg bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent font-bold">
                    Tank Shooter
                  </span>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6 mt-6">
                {/* Navigation Links */}
                <nav className="px-6">
                  <ul className="flex flex-col gap-1">
                    {links.map(({ label, path }) => (
                      <li key={path}>
                        <SheetClose asChild>
                          <Link
                            className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:scale-[1.02] ${
                              isActive(path)
                                ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 shadow-sm border border-purple-200 dark:border-purple-800/50"
                                : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent"
                            }`}
                            href={path}
                          >
                            {label}
                            {isActive(path) && (
                              <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                            )}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Divider */}
                <div className="mx-6 h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent" />

                {/* Wallet Controls */}
                <div className="px-6 pb-6 flex flex-col gap-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Wallet & Network
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="w-full">
                        <WalletButton />
                      </div>
                      <div className="w-full">
                        <ClusterButton />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 p-1 bg-white/10 rounded-lg">
            <WalletButton size="sm" />
            <ClusterButton size="sm" />
          </div>
          <div className="w-px h-6 bg-purple-500/30" />
          <ThemeSelect />
        </div>
      </div>
    </header>
  );
}
