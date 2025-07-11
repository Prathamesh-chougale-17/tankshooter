"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

export function AppProviders({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SolanaProvider>
          {children}
          <Toaster position="top-center" expand={true} richColors closeButton />
        </SolanaProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  );
}
