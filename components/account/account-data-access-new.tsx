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

// ===== CUSTOM RPC FUNCTIONS =====

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

// ===== CUSTOM RPC HOOKS =====

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
        const customClient = { rpc: createSolanaRpc(rpcUrl) } as SolanaClient;
        const { signature } = await createTransactionWithCustomRpc({
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

// ===== ORIGINAL DEFAULT RPC FUNCTIONS =====

function useGetBalanceQueryKey({ address }: { address: Address }) {
  const { cluster } = useWalletUi();
  return ["get-balance", { cluster, address }];
}

function useInvalidateGetBalanceQuery({ address }: { address: Address }) {
  const queryClient = useQueryClient();
  const queryKey = useGetBalanceQueryKey({ address });
  return async () => {
    await queryClient.invalidateQueries({ queryKey });
  };
}

export function useGetBalanceQuery({ address }: { address: Address }) {
  const { client } = useWalletUi();

  return useQuery({
    retry: false,
    queryKey: useGetBalanceQueryKey({ address }),
    queryFn: () => client.rpc.getBalance(address).send(),
  });
}

function useGetSignaturesQueryKey({ address }: { address: Address }) {
  const { cluster } = useWalletUi();
  return ["get-signatures", { cluster, address }];
}

function useInvalidateGetSignaturesQuery({ address }: { address: Address }) {
  const queryClient = useQueryClient();
  const queryKey = useGetSignaturesQueryKey({ address });
  return async () => {
    await queryClient.invalidateQueries({ queryKey });
  };
}

export function useGetSignaturesQuery({ address }: { address: Address }) {
  const { client } = useWalletUi();

  return useQuery({
    queryKey: useGetSignaturesQueryKey({ address }),
    queryFn: () => client.rpc.getSignaturesForAddress(address).send(),
  });
}

async function getTokenAccountsByOwner(
  rpc: SolanaClient["rpc"],
  { address, programId }: { address: Address; programId: Address }
) {
  return await rpc
    .getTokenAccountsByOwner(
      address,
      { programId },
      { commitment: "confirmed", encoding: "jsonParsed" }
    )
    .send()
    .then((res) => res.value ?? []);
}

export function useGetTokenAccountsQuery({ address }: { address: Address }) {
  const { client, cluster } = useWalletUi();

  return useQuery({
    queryKey: ["get-token-accounts", { cluster, address }],
    queryFn: async () =>
      Promise.all([
        getTokenAccountsByOwner(client.rpc, {
          address,
          programId: TOKEN_PROGRAM_ADDRESS,
        }),
        getTokenAccountsByOwner(client.rpc, {
          address,
          programId: TOKEN_2022_PROGRAM_ADDRESS,
        }),
      ]).then(([tokenAccounts, token2022Accounts]) => [
        ...tokenAccounts,
        ...token2022Accounts,
      ]),
  });
}

export function useTransferSolMutation({ address }: { address: Address }) {
  const { client } = useWalletUi();
  const txSigner = useWalletUiSigner();
  const invalidateBalanceQuery = useInvalidateGetBalanceQuery({ address });
  const invalidateSignaturesQuery = useInvalidateGetSignaturesQuery({
    address,
  });

  return useMutation({
    mutationFn: async (input: { destination: Address; amount: number }) => {
      try {
        const { signature } = await createTransaction({
          txSigner,
          destination: input.destination,
          amount: input.amount,
          client,
        });

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.log("error", `Transaction failed! ${error}`);
        return;
      }
    },
    onSuccess: async (tx) => {
      toastTx(tx);
      await Promise.all([
        invalidateBalanceQuery(),
        invalidateSignaturesQuery(),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}

export function useRequestAirdropMutation({ address }: { address: Address }) {
  const { client } = useWalletUi();
  const invalidateBalanceQuery = useInvalidateGetBalanceQuery({ address });
  const invalidateSignaturesQuery = useInvalidateGetSignaturesQuery({
    address,
  });
  const airdrop = airdropFactory(client);

  return useMutation({
    mutationFn: async (amount: number = 1) =>
      airdrop({
        commitment: "confirmed",
        recipientAddress: address,
        lamports: lamports(BigInt(Math.round(amount * 1_000_000_000))),
      }),
    onSuccess: async (tx) => {
      toastTx(tx);
      await Promise.all([
        invalidateBalanceQuery(),
        invalidateSignaturesQuery(),
      ]);
    },
  });
}

// ===== TRANSACTION HELPERS =====

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

async function createTransactionWithCustomRpc({
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
