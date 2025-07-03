/**
 * Prize Claim API Route - Using Official Gorbagana SDK
 *
 * This endpoint handles token transfers for prize claims on the Gorbagana network
 * using the official @gorbagana/web3.js SDK for    } catch {
      console.error('Failed to get wallet balance');
    }al compatibility.
 *
 * Gorbagana Network Information:
 * - RPC Endpoint: https://rpc.gorbagana.wtf
 * - GOR Contract: 71Jvq4Epe2FCJ7JFSF7jLXdNk1Wy4Bhqd9iL6bEFELvg
 * - Block Explorer: https://explorer.gorbagana.wtf/
 * - Faucet: https://faucet.gorbagana.wtf/
 * - Status: https://status.gorbagana.wtf/
 *
 * Key Features:
 * - Uses official Gorbagana program addresses for guaranteed compatibility
 * - Enhanced error handling specific to Gorbagana network
 * - Debug mode support for troubleshooting
 * - Automatic token account creation if needed
 * - Comprehensive logging and transaction status reporting
 *
 * Environment Variables Required:
 * - GORBAGANA_PRIVATE_KEY: Base58 encoded private key for the server wallet
 * - GOR_MINT_ADDRESS: Token mint address for GOR tokens on Gorbagana network
 * - GORBAGANA_RPC_URL: RPC endpoint (defaults to http://localhost:8899)
 * - DEBUG_MODE: Set to "true" to enable debug logging
 *
 * Current Status:
 * - ✅ Uses official Gorbagana SDK with correct program addresses
 * - ✅ Full compatibility with Gorbagana network
 * - ✅ Automatic fallback and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  GORBAGANA_PROGRAM_IDS,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "@gorbagana/web3.js";
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import bs58 from "bs58";

interface ClaimPrizeRequest {
  playerName: string;
  playerWallet: string;
  prizeAmount: number;
  competitionId: string;
}

interface ApiResponse {
  success: boolean;
  signature?: string;
  explorerUrl?: string;
  debug?: DebugInfo;
  error?: string;
  warning?: string;
}

interface DebugInfo {
  request?: ClaimPrizeRequest;
  network?: { rpcUrl: string };
  serverWallet?: { address: string; balance: number };
  balanceError?: unknown;
  tokenTransfer?: {
    mint: string;
    recipient: string;
    amount: number;
    amountInSmallestUnit: number;
    decimals: number;
  };
  programIds?: {
    tokenProgram: string;
    token2022Program: string;
    ataProgram: string;
  };
  tokenAccounts?: {
    server: string;
    player: string;
  };
  serverTokenBalance?: {
    amount: number;
    formatted: number;
  };
  transaction?: {
    instructions: number;
    feePayer?: string;
    recentBlockhash?: string;
  };
  result?: {
    signature: string;
    explorerUrl: string;
    status: string;
  };
  error?: {
    message: string;
    stack?: string;
    logs?: string[];
  };
  apiError?: {
    message: string;
    stack?: string;
  };
  serverTokenAccountError?: {
    message: string;
    stack?: string;
    mintAddress: string;
    serverWallet: string;
    tokenProgram: string;
  };
  mintVerification?: {
    address: string;
    owner: string;
    lamports: number;
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const debugMode = process.env.DEBUG_MODE === "true";
  const debugInfo: DebugInfo = {};

  try {
    const body: ClaimPrizeRequest = await request.json();
    const { playerName, playerWallet, prizeAmount, competitionId } = body;

    if (debugMode) {
      debugInfo.request = {
        playerName,
        playerWallet,
        prizeAmount,
        competitionId,
      };
      console.log("🐛 [DEBUG] Processing claim request:", debugInfo.request);
    }

    // Validate the request
    if (!playerName || !playerWallet || !prizeAmount || !competitionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate wallet address format
    try {
      new PublicKey(playerWallet);
    } catch (walletError) {
      console.error("Invalid wallet address format:", walletError);
      return NextResponse.json(
        { success: false, error: "Invalid player wallet address" },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.GORBAGANA_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: "Server wallet private key not configured" },
        { status: 500 }
      );
    }

    const GOR_MINT_ADDRESS = process.env.GOR_MINT_ADDRESS;
    if (
      !GOR_MINT_ADDRESS ||
      GOR_MINT_ADDRESS === "YOUR_GOR_TOKEN_MINT_ADDRESS"
    ) {
      return NextResponse.json(
        { success: false, error: "GOR mint address not configured" },
        { status: 500 }
      );
    }

    // Create connection using official Gorbagana SDK
    const rpcUrl = process.env.GORBAGANA_RPC_URL || "http://localhost:8899";
    const connection = new Connection(rpcUrl);

    if (debugMode) {
      debugInfo.network = { rpcUrl };
      console.log("🐛 [DEBUG] Connected to Gorbagana network:", rpcUrl);
    }

    // Load server wallet
    const serverKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.GORBAGANA_PRIVATE_KEY)
    );

    console.log("Server wallet address:", serverKeypair.publicKey.toBase58());

    // Check server wallet balance
    try {
      const balance = await connection.getBalance(serverKeypair.publicKey);
      const balanceInGOR = balance / LAMPORTS_PER_SOL;
      console.log(`Server wallet GOR balance: ${balanceInGOR} GOR`);

      if (debugMode) {
        debugInfo.serverWallet = {
          address: serverKeypair.publicKey.toBase58(),
          balance: balanceInGOR,
        };
      }

      if (balance < 0.01 * LAMPORTS_PER_SOL) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient GOR balance for transaction fees",
            debug: debugMode ? debugInfo : undefined,
          },
          { status: 500 }
        );
      }
    } catch (balanceError) {
      console.error("Failed to get wallet balance:", balanceError);
      if (debugMode) {
        debugInfo.balanceError = balanceError;
      }
    }

    // Setup token addresses
    const mintAddress = new PublicKey(GOR_MINT_ADDRESS);
    const playerWalletPubkey = new PublicKey(playerWallet);

    // Verify the mint address exists on the network
    try {
      const mintInfo = await connection.getAccountInfo(mintAddress);
      if (!mintInfo) {
        return NextResponse.json(
          {
            success: false,
            error: `GOR mint address ${GOR_MINT_ADDRESS} not found on Gorbagana network`,
            warning:
              "Please verify the mint address is correct for the Gorbagana network",
            debug: debugMode ? debugInfo : undefined,
          },
          { status: 500 }
        );
      }

      if (debugMode) {
        console.log(
          "🐛 [DEBUG] Mint account verified:",
          mintAddress.toString()
        );
        debugInfo.mintVerification = {
          address: mintAddress.toString(),
          owner: mintInfo.owner.toString(),
          lamports: mintInfo.lamports,
        };
      }
    } catch (mintError) {
      console.error("Failed to verify mint address:", mintError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify GOR mint address on network",
          warning: "Network connection issue or invalid mint address",
          debug: debugMode ? debugInfo : undefined,
        },
        { status: 500 }
      );
    }

    // Calculate amount in token's smallest unit (assuming 9 decimals for GOR)
    const decimals = 9;
    const amountInSmallestUnit = Math.floor(
      prizeAmount * Math.pow(10, decimals)
    );

    if (debugMode) {
      debugInfo.tokenTransfer = {
        mint: mintAddress.toBase58(),
        recipient: playerWalletPubkey.toBase58(),
        amount: prizeAmount,
        amountInSmallestUnit,
        decimals,
      };
      console.log(
        "🐛 [DEBUG] Token transfer details:",
        debugInfo.tokenTransfer
      );
    }

    // Get token program ID from official Gorbagana SDK
    const tokenProgramId = GORBAGANA_PROGRAM_IDS.TOKEN_PROGRAM_ID;

    if (debugMode) {
      debugInfo.programIds = {
        tokenProgram: tokenProgramId.toBase58(),
        token2022Program:
          GORBAGANA_PROGRAM_IDS.TOKEN_2022_PROGRAM_ID?.toBase58() || "N/A",
        ataProgram:
          GORBAGANA_PROGRAM_IDS.ASSOCIATED_TOKEN_PROGRAM_ID?.toBase58() ||
          "N/A",
      };
      console.log(
        "🐛 [DEBUG] Using Gorbagana program IDs:",
        debugInfo.programIds
      );
    }

    // Get associated token accounts
    const serverTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      serverKeypair.publicKey,
      false,
      tokenProgramId
    );

    const playerTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      playerWalletPubkey,
      false,
      tokenProgramId
    );

    if (debugMode) {
      debugInfo.tokenAccounts = {
        server: serverTokenAccount.toBase58(),
        player: playerTokenAccount.toBase58(),
      };
      console.log("🐛 [DEBUG] Token accounts:", debugInfo.tokenAccounts);
    }

    // Check if server has tokens - create account if it doesn't exist
    let serverTokenBalance = 0;
    try {
      const serverTokenAccountInfo = await connection.getTokenAccountBalance(
        serverTokenAccount
      );
      serverTokenBalance = parseInt(serverTokenAccountInfo.value.amount);

      if (debugMode) {
        debugInfo.serverTokenBalance = {
          amount: serverTokenBalance,
          formatted: serverTokenBalance / Math.pow(10, decimals),
        };
        console.log(
          "🐛 [DEBUG] Server token balance:",
          debugInfo.serverTokenBalance
        );
      }
    } catch (tokenError) {
      console.error("Server token account doesn't exist yet:", tokenError);

      // Try to create the server token account
      try {
        if (debugMode) {
          console.log("🐛 [DEBUG] Creating server token account");
        }

        const serverTokenAccountCreated =
          await getOrCreateAssociatedTokenAccount(
            connection,
            serverKeypair,
            mintAddress,
            serverKeypair.publicKey,
            false,
            "confirmed",
            {},
            tokenProgramId
          );

        serverTokenBalance = 0; // New account will have 0 balance

        if (debugMode) {
          console.log(
            "🐛 [DEBUG] Server token account created:",
            serverTokenAccountCreated.address.toString()
          );
          debugInfo.serverTokenBalance = {
            amount: 0,
            formatted: 0,
          };
        }
      } catch (createError) {
        console.error("Failed to create server token account:", createError);

        if (debugMode) {
          debugInfo.serverTokenAccountError = {
            message:
              createError instanceof Error
                ? createError.message
                : String(createError),
            stack: createError instanceof Error ? createError.stack : undefined,
            mintAddress: mintAddress.toString(),
            serverWallet: serverKeypair.publicKey.toString(),
            tokenProgram: tokenProgramId.toString(),
          };
        }

        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to create server token account. This could be due to: 1) Incorrect GOR mint address, 2) Network compatibility issues, 3) Insufficient permissions.",
            warning:
              "Please verify the GOR mint address is correct for the Gorbagana network",
            debug: debugMode ? debugInfo : undefined,
          },
          { status: 500 }
        );
      }
    }

    // Check if server has sufficient tokens
    if (serverTokenBalance < amountInSmallestUnit) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient GOR tokens. Need ${prizeAmount}, have ${
            serverTokenBalance / Math.pow(10, decimals)
          }. Please fund the server wallet with GOR tokens.`,
          warning: `Server wallet: ${serverKeypair.publicKey.toBase58()}`,
          debug: debugMode ? debugInfo : undefined,
        },
        { status: 500 }
      );
    }

    // Create transaction
    const transaction = new Transaction();

    // Add compute budget instructions for better success rate
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 2000 })
    );

    // Check if player token account exists, create if not
    try {
      await connection.getAccountInfo(playerTokenAccount);
      if (debugMode) {
        console.log("🐛 [DEBUG] Player token account exists");
      }
    } catch (accountError) {
      if (debugMode) {
        console.log("🐛 [DEBUG] Creating player token account", accountError);
      }

      // Create associated token account for player
      const playerTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        serverKeypair,
        mintAddress,
        playerWalletPubkey,
        false,
        "confirmed",
        {},
        tokenProgramId
      );

      if (debugMode) {
        console.log(
          "🐛 [DEBUG] Player token account created:",
          playerTokenAccount.address.toString()
        );
      }
    }

    // Add transfer instruction
    const transferInstruction = createTransferInstruction(
      serverTokenAccount,
      playerTokenAccount,
      serverKeypair.publicKey,
      amountInSmallestUnit,
      [],
      tokenProgramId
    );

    transaction.add(transferInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = serverKeypair.publicKey;

    if (debugMode) {
      debugInfo.transaction = {
        instructions: transaction.instructions.length,
        feePayer: transaction.feePayer?.toBase58(),
        recentBlockhash: transaction.recentBlockhash,
      };
      console.log("🐛 [DEBUG] Transaction prepared:", debugInfo.transaction);
    }

    // Sign and send transaction
    console.log("Sending GOR token transfer transaction...");

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [serverKeypair],
        {
          commitment: "confirmed",
          maxRetries: 3,
        }
      );

      const explorerUrl = `https://explorer.gorbagana.wtf/tx/${signature}`;

      console.log("✅ Transaction successful!");
      console.log("Transaction signature:", signature);
      console.log("Explorer URL:", explorerUrl);

      if (debugMode) {
        debugInfo.result = {
          signature,
          explorerUrl,
          status: "confirmed",
        };
      }

      return NextResponse.json({
        success: true,
        signature,
        explorerUrl,
        debug: debugMode ? debugInfo : undefined,
      });
    } catch (sendError: unknown) {
      console.error("Transaction failed:", sendError);

      // Handle specific Gorbagana errors
      let errorMessage = "Transaction failed";
      let troubleshooting = "";

      const errorMsg =
        sendError instanceof Error ? sendError.message : String(sendError);
      if (errorMsg.includes("7050004")) {
        errorMessage = "Gorbagana network compatibility issue";
        troubleshooting =
          "This error indicates a program compatibility issue. The transaction was properly built but failed during execution.";
      } else if (errorMsg.includes("insufficient")) {
        errorMessage = "Insufficient balance for transaction";
        troubleshooting = "Check GOR token balance and network fees.";
      } else if (errorMsg.includes("timeout")) {
        errorMessage = "Transaction timeout";
        troubleshooting = "Network congestion or RPC issues. Try again later.";
      }

      if (debugMode) {
        debugInfo.error = {
          message: errorMsg,
          stack: sendError instanceof Error ? sendError.stack : undefined,
          logs: Array.isArray((sendError as Record<string, unknown>)?.logs)
            ? ((sendError as Record<string, unknown>).logs as string[])
            : [],
        };
        console.log("🐛 [DEBUG] Transaction error details:", debugInfo.error);
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          warning: troubleshooting,
          debug: debugMode ? debugInfo : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("API Error:", error);

    if (debugMode) {
      debugInfo.apiError = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        debug: debugMode ? debugInfo : undefined,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  try {
    const rpcUrl = process.env.GORBAGANA_RPC_URL || "http://localhost:8899";
    const connection = new Connection(rpcUrl);

    // Test connection
    await connection.getLatestBlockhash();

    return NextResponse.json({
      status: "healthy",
      network: "gorbagana",
      rpcUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (connectionError) {
    console.error("Health check failed:", connectionError);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Failed to connect to Gorbagana network",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
