/**
 * Prize Claim API Route - Native GOR Token Transfers
 *
 * IMPORTANT DISCOVERY: Gorbagana network uses native GOR tokens, not SPL tokens.
 * This means we need to use native SOL/GOR transfers instead of token program transfers.
 *
 * Updated approach:
 * - Use SystemProgram.transfer() for native GOR transfers
 * - No need for token accounts or SPL token operations
 * - Direct wallet-to-wallet transfers using native lamports
 */

import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@gorbagana/web3.js";
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
  tokenTransfer?: {
    recipient: string;
    amount: number;
    amountInLamports: number;
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
  };
  apiError?: {
    message: string;
    stack?: string;
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
      console.log(
        "🐛 [DEBUG] Processing native GOR transfer:",
        debugInfo.request
      );
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

    // Create connection to Gorbagana network
    const rpcUrl = process.env.GORBAGANA_RPC_URL || "https://rpc.gorbagana.wtf";
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
    const balance = await connection.getBalance(serverKeypair.publicKey);
    const balanceInGOR = balance / LAMPORTS_PER_SOL;
    console.log(`Server wallet GOR balance: ${balanceInGOR} GOR`);

    if (debugMode) {
      debugInfo.serverWallet = {
        address: serverKeypair.publicKey.toBase58(),
        balance: balanceInGOR,
      };
    }

    // Calculate amount in lamports (native GOR units)
    const amountInLamports = Math.floor(prizeAmount * LAMPORTS_PER_SOL);
    const transactionFee = 0.000005 * LAMPORTS_PER_SOL; // Estimate 5,000 lamports for transaction fee

    if (debugMode) {
      debugInfo.tokenTransfer = {
        recipient: playerWallet,
        amount: prizeAmount,
        amountInLamports,
      };
      console.log(
        "🐛 [DEBUG] Native GOR transfer details:",
        debugInfo.tokenTransfer
      );
    }

    // Check if server has sufficient balance (including transaction fees)
    if (balance < amountInLamports + transactionFee) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient GOR balance. Need ${
            (amountInLamports + transactionFee) / LAMPORTS_PER_SOL
          } GOR, have ${balanceInGOR} GOR`,
          warning: `Server wallet: ${serverKeypair.publicKey.toBase58()}`,
          debug: debugMode ? debugInfo : undefined,
        },
        { status: 500 }
      );
    }

    // Create native GOR transfer transaction
    const playerWalletPubkey = new PublicKey(playerWallet);
    const transaction = new Transaction();

    // Add native transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: serverKeypair.publicKey,
      toPubkey: playerWalletPubkey,
      lamports: amountInLamports,
    });

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
    console.log("Sending native GOR transfer transaction...");

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

      console.log("✅ Native GOR transfer successful!");
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

      const errorMsg =
        sendError instanceof Error ? sendError.message : String(sendError);
      let errorMessage = "Native GOR transfer failed";
      let troubleshooting = "";

      if (errorMsg.includes("insufficient")) {
        errorMessage = "Insufficient GOR balance for transfer and fees";
        troubleshooting =
          "Check GOR balance and ensure enough for transaction fees.";
      } else if (errorMsg.includes("timeout")) {
        errorMessage = "Transaction timeout";
        troubleshooting = "Network congestion. Try again later.";
      }

      if (debugMode) {
        debugInfo.error = {
          message: errorMsg,
          stack: sendError instanceof Error ? sendError.stack : undefined,
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
    const rpcUrl = process.env.GORBAGANA_RPC_URL || "https://rpc.gorbagana.wtf";
    const connection = new Connection(rpcUrl);

    // Test connection and get network info
    const latestBlockhash = await connection.getLatestBlockhash();
    const supply = await connection.getSupply();

    return NextResponse.json({
      status: "healthy",
      network: "gorbagana",
      rpcUrl,
      transferType: "native-gor",
      networkInfo: {
        totalSupply:
          (supply.value.total / LAMPORTS_PER_SOL).toFixed(2) + " GOR",
        circulatingSupply:
          (supply.value.circulating / LAMPORTS_PER_SOL).toFixed(2) + " GOR",
        latestBlockhash: latestBlockhash.blockhash,
      },
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
