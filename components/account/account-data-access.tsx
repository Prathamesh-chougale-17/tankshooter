import {
  TOKEN_2022_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs/token";
import { getTransferSolInstruction } from "gill/programs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletUi } from "@wallet-ui/react";
import {
  address,
  Address,
  airdropFactory,
  appendTransactionMessageInstruction,
  assertIsTransactionMessageWithSingleSendingSigner,
  Blockhash,
  createTransactionMessage,
  getBase58Decoder,
  lamports,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  SolanaClient,
  TransactionSendingSigner,
  createSolanaRpc,
} from "gill";
import { toast } from "sonner";
import { toastTx } from "@/components/toast-tx";
import { useWalletUiSigner } from "@/components/solana/use-wallet-ui-signer";

// Custom RPC balance checker
export async function getBalanceFromCustomRpc(
  address: Address,
  rpcUrl: string = "https://rpc.gorbagana.wtf"
) {
  try {
    const customRpc = createSolanaRpc(rpcUrl);
    const balance = await customRpc.getBalance(address).send();
    return balance;
  } catch (error) {
    console.error("Error fetching balance from custom RPC:", error);
    throw error;
  }
}

// Custom RPC signatures checker
export async function getSignaturesFromCustomRpc(
  address: Address,
  rpcUrl: string = "https://rpc.gorbagana.wtf"
) {
  try {
    const customRpc = createSolanaRpc(rpcUrl);
    const signatures = await customRpc.getSignaturesForAddress(address).send();
    return signatures;
  } catch (error) {
    console.error("Error fetching signatures from custom RPC:", error);
    throw error;
  }
}

// Custom RPC token accounts checker
export async function getTokenAccountsFromCustomRpc(
  address: Address,
  rpcUrl: string = "https://rpc.gorbagana.wtf"
) {
  try {
    const customRpc = createSolanaRpc(rpcUrl);
    const [tokenAccounts, token2022Accounts] = await Promise.all([
      customRpc
        .getTokenAccountsByOwner(
          address,
          { programId: TOKEN_PROGRAM_ADDRESS },
          { commitment: "confirmed", encoding: "jsonParsed" }
        )
        .send()
        .then((res) => res.value ?? []),
      customRpc
        .getTokenAccountsByOwner(
          address,
          { programId: TOKEN_2022_PROGRAM_ADDRESS },
          { commitment: "confirmed", encoding: "jsonParsed" }
        )
        .send()
        .then((res) => res.value ?? []),
    ]);
    return [...tokenAccounts, ...token2022Accounts];
  } catch (error) {
    console.error("Error fetching token accounts from custom RPC:", error);
    throw error;
  }
}

export function useGetBalanceFromCustomRpcQuery({
  address,
  rpcUrl = "https://rpc.gorbagana.wtf",
}: {
  address: Address;
  rpcUrl?: string;
}) {
  return useQuery({
    queryKey: ["get-balance-custom-rpc", { address, rpcUrl }],
    queryFn: () => getBalanceFromCustomRpc(address, rpcUrl),
    retry: false,
  });
}

export function useGetSignaturesFromCustomRpcQuery({
  address,
  rpcUrl = "https://rpc.gorbagana.wtf",
}: {
  address: Address;
  rpcUrl?: string;
}) {
  return useQuery({
    queryKey: ["get-signatures-custom-rpc", { address, rpcUrl }],
    queryFn: () => getSignaturesFromCustomRpc(address, rpcUrl),
    retry: false,
  });
}

export function useGetTokenAccountsFromCustomRpcQuery({
  address,
  rpcUrl = "https://rpc.gorbagana.wtf",
}: {
  address: Address;
  rpcUrl?: string;
}) {
  return useQuery({
    queryKey: ["get-token-accounts-custom-rpc", { address, rpcUrl }],
    queryFn: () => getTokenAccountsFromCustomRpc(address, rpcUrl),
    retry: false,
  });
}

// Custom RPC transfer mutation
export function useTransferSolCustomRpcMutation({
  address,
  rpcUrl = "https://rpc.gorbagana.wtf",
}: {
  address: Address;
  rpcUrl?: string;
}) {
  const txSigner = useWalletUiSigner();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { destination: Address; amount: number }) => {
      try {
        if (!txSigner) {
          throw new Error(
            "Wallet signer not available. Please connect your wallet."
          );
        }

        const customClient = { rpc: createSolanaRpc(rpcUrl) } as SolanaClient;
        const { signature } = await createTransaction({
          txSigner,
          destination: input.destination,
          amount: input.amount,
          client: customClient,
        });

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.log("error", `Transaction failed! ${error}`);
        throw error;
      }
    },
    onSuccess: async (tx) => {
      toastTx(tx);
      // Invalidate custom RPC queries
      await queryClient.invalidateQueries({
        queryKey: ["get-balance-custom-rpc", { address, rpcUrl }],
      });
      await queryClient.invalidateQueries({
        queryKey: ["get-signatures-custom-rpc", { address, rpcUrl }],
      });
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}

// Custom RPC airdrop mutation
export function useRequestAirdropCustomRpcMutation({
  address,
  rpcUrl = "https://rpc.gorbagana.wtf",
}: {
  address: Address;
  rpcUrl?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number = 1) => {
      const customClient = { rpc: createSolanaRpc(rpcUrl) } as SolanaClient;
      const airdrop = airdropFactory(customClient);

      return airdrop({
        commitment: "confirmed",
        recipientAddress: address,
        lamports: lamports(BigInt(Math.round(amount * 1_000_000_000))),
      });
    },
    onSuccess: async (tx) => {
      toastTx(tx);
      // Invalidate custom RPC queries
      await queryClient.invalidateQueries({
        queryKey: ["get-balance-custom-rpc", { address, rpcUrl }],
      });
      await queryClient.invalidateQueries({
        queryKey: ["get-signatures-custom-rpc", { address, rpcUrl }],
      });
    },
    onError: (error) => {
      toast.error(`Airdrop failed! ${error}`);
    },
  });
}

async function createTransaction({
  amount,
  destination,
  client,
  txSigner,
}: {
  amount: number;
  destination: Address;
  client: SolanaClient;
  txSigner: TransactionSendingSigner;
}): Promise<{
  signature: string;
  latestBlockhash: {
    blockhash: Blockhash;
    lastValidBlockHeight: bigint;
  };
}> {
  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash({ commitment: "confirmed" })
    .send();

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(txSigner, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        getTransferSolInstruction({
          amount,
          destination: address(destination),
          source: txSigner,
        }),
        m
      )
  );
  assertIsTransactionMessageWithSingleSendingSigner(message);

  const signature = await signAndSendTransactionMessageWithSigners(message);

  return {
    signature: getBase58Decoder().decode(signature),
    latestBlockhash,
  };
}

export function useGetBalanceCustomRpcQuery({
  address,
  rpcEndpoint,
}: {
  address: Address;
  rpcEndpoint: string;
}) {
  const { cluster } = useWalletUi();

  return useQuery({
    queryKey: ["get-balance-custom-rpc", { cluster, address, rpcEndpoint }],
    queryFn: async () => {
      const rpc = createSolanaRpc(rpcEndpoint);
      const balance = await rpc.getBalance(address).send();
      return balance;
    },
  });
}
