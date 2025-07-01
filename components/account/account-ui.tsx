import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExplorerLink } from "@/components/cluster/cluster-ui";
import { ellipsify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppModal } from "@/components/app-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletUi } from "@wallet-ui/react";
import { address, Address, Lamports, lamportsToSol } from "gill";
import {
  useGetBalanceFromCustomRpcQuery,
  useGetSignaturesFromCustomRpcQuery,
  useGetTokenAccountsFromCustomRpcQuery,
  useRequestAirdropCustomRpcMutation,
  useTransferSolCustomRpcMutation,
} from "./account-data-access";
import {
  useRequestAirdropMutation,
  useTransferSolMutation,
} from "./account-data-access-new";

// ===== BALANCE COMPONENTS =====

export function AccountBalance({ address }: { address: Address }) {
  const query = useGetBalanceFromCustomRpcQuery({ address });

  return (
    <h1
      className="text-5xl font-bold cursor-pointer"
      onClick={() => query.refetch()}
    >
      {query.data?.value ? <BalanceSol balance={query.data?.value} /> : "..."}{" "}
      SOL
    </h1>
  );
}

export function AccountBalanceCustomRpc({ address }: { address: Address }) {
  const query = useGetBalanceFromCustomRpcQuery({ address });

  return (
    <div className="relative group">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur-sm group-hover:blur-none transition-all duration-500 animate-pulse"></div>

      {/* Main content container - horizontal layout */}
      <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 shadow-2xl shadow-purple-500/10 group-hover:shadow-purple-500/20 transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Balance info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-sm font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Balance
              </h2>
            </div>

            <div
              className="group/balance cursor-pointer transition-all duration-300 hover:scale-105 flex items-baseline gap-2"
              onClick={() => query.refetch()}
            >
              {query.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                  <span className="text-lg font-bold text-gray-400 animate-pulse">
                    Loading...
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent group-hover/balance:from-purple-300 group-hover/balance:to-blue-300 transition-all duration-300">
                    {query.data?.value ? (
                      <BalanceSol balance={query.data?.value} />
                    ) : (
                      "0.000"
                    )}
                  </div>
                  <div className="text-sm font-medium text-purple-400/80">
                    GOR
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right side - RPC info and controls */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span className="font-mono text-xs">gorbagana.wtf</span>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              {/* Error state inline */}
              {query.isError && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  <span>Error</span>
                </div>
              )}
            </div>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={query.isLoading}
              className="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/50 hover:text-purple-200 transition-all duration-300 backdrop-blur-sm h-8 w-8 p-0"
            >
              <RefreshCw
                size={12}
                className={query.isLoading ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute top-1 right-1 w-0.5 h-0.5 bg-purple-400/60 rounded-full animate-ping"></div>
        <div
          className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-blue-400/60 rounded-full animate-ping"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>
    </div>
  );
}

export function AccountButtons({ address }: { address: Address }) {
  const { cluster } = useWalletUi();

  return (
    <div>
      <div className="space-x-2">
        {cluster.id === "solana:mainnet" ? null : (
          <ModalAirdrop address={address} />
        )}
        <ModalSend address={address} />
        <ModalReceive address={address} />
      </div>
    </div>
  );
}

export function AccountButtonsCustomRpc({ address }: { address: Address }) {
  return (
    <div>
      <div className="space-x-2">
        <ModalAirdropCustomRpc address={address} />
        <ModalSendCustomRpc address={address} />
        <ModalReceive address={address} />
      </div>
    </div>
  );
}

// ===== TOKEN ACCOUNTS COMPONENTS =====

export function AccountTokensCustomRpc({ address }: { address: Address }) {
  const [showAll, setShowAll] = useState(false);
  const query = useGetTokenAccountsFromCustomRpcQuery({ address });
  const client = useQueryClient();
  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="space-y-2">
      <div className="justify-between">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Token Accounts (Custom RPC)</h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <Button
                variant="outline"
                onClick={async () => {
                  await query.refetch();
                  await client.invalidateQueries({
                    queryKey: ["get-token-accounts-custom-rpc"],
                  });
                }}
              >
                <RefreshCw size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500">RPC: https://rpc.gorbagana.wtf</p>
      {query.isError && (
        <pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No token accounts found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Public Key</TableHead>
                  <TableHead>Mint</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map(({ account, pubkey }) => (
                  <TableRow key={pubkey.toString()}>
                    <TableCell>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(pubkey.toString())}
                            address={pubkey.toString()}
                            useCustomRpc={true}
                          />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(account.data.parsed.info.mint)}
                            address={account.data.parsed.info.mint.toString()}
                            useCustomRpc={true}
                          />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">
                        {account.data.parsed.info.tokenAmount.uiAmount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}

                {(query.data?.length ?? 0) > 5 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? "Show Less" : "Show All"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

// ===== TRANSACTION COMPONENTS =====

export function AccountTransactions({ address }: { address: Address }) {
  const query = useGetSignaturesFromCustomRpcQuery({ address });
  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Button variant="outline" onClick={() => query.refetch()}>
              <RefreshCw size={16} />
            </Button>
          )}
        </div>
      </div>
      {query.isError && (
        <pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signature</TableHead>
                  <TableHead className="text-right">Slot</TableHead>
                  <TableHead>Block Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.signature}>
                    <TableHead className="font-mono">
                      <ExplorerLink
                        transaction={item.signature}
                        label={ellipsify(item.signature, 8)}
                      />
                    </TableHead>
                    <TableCell className="font-mono text-right">
                      <ExplorerLink
                        block={item.slot.toString()}
                        label={item.slot.toString()}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(
                        (Number(item.blockTime) ?? 0) * 1000
                      ).toISOString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.err ? (
                        <span
                          className="text-red-500"
                          title={JSON.stringify(item.err)}
                        >
                          Failed
                        </span>
                      ) : (
                        <span className="text-green-500">Success</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? "Show Less" : "Show All"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountTransactionsCustomRpc({
  address,
}: {
  address: Address;
}) {
  const query = useGetSignaturesFromCustomRpcQuery({ address });
  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction History (Custom RPC)</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Button variant="outline" onClick={() => query.refetch()}>
              <RefreshCw size={16} />
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500">RPC: https://rpc.gorbagana.wtf</p>
      {query.isError && (
        <pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signature</TableHead>
                  <TableHead className="text-right">Slot</TableHead>
                  <TableHead>Block Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.signature}>
                    <TableHead className="font-mono">
                      <ExplorerLink
                        transaction={item.signature}
                        label={ellipsify(item.signature, 8)}
                        useCustomRpc={true}
                      />
                    </TableHead>
                    <TableCell className="font-mono text-right">
                      <ExplorerLink
                        block={item.slot.toString()}
                        label={item.slot.toString()}
                        useCustomRpc={true}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(
                        (Number(item.blockTime) ?? 0) * 1000
                      ).toISOString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.err ? (
                        <span
                          className="text-red-500"
                          title={JSON.stringify(item.err)}
                        >
                          Failed
                        </span>
                      ) : (
                        <span className="text-green-500">Success</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? "Show Less" : "Show All"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

// ===== COMPOSED VIEW COMPONENTS =====

export function AccountCustomRpcView({ address }: { address: Address }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <AccountBalanceCustomRpc address={address} />
        <div className="mt-4">
          <AccountButtonsCustomRpc address={address} />
        </div>
      </div>
      <AccountTokensCustomRpc address={address} />
      <AccountTransactionsCustomRpc address={address} />
    </div>
  );
}

// export function AccountComparisonView({ address }: { address: Address }) {
//   return (
//     <div className="space-y-8">
//       <AccountBalanceComparison address={address} />

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         <div>
//           <AccountTokens address={address} />
//         </div>
//         <div>
//           <AccountTokensCustomRpc address={address} />
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         <div>
//           <AccountTransactions address={address} />
//         </div>
//         <div>
//           <AccountTransactionsCustomRpc address={address} />
//         </div>
//       </div>
//     </div>
//   );
// }

// ===== HELPER COMPONENTS =====

function BalanceSol({ balance }: { balance: Lamports }) {
  return <span>{lamportsToSol(balance)}</span>;
}

// ===== MODAL COMPONENTS =====

function ModalReceive({ address }: { address: Address }) {
  return (
    <AppModal title="Receive">
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  );
}

function ModalAirdrop({ address }: { address: Address }) {
  const mutation = useRequestAirdropMutation({ address });
  const [amount, setAmount] = useState("2");

  return (
    <AppModal
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount))}
    >
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  );
}

function ModalSend(props: { address: Address }) {
  const mutation = useTransferSolMutation({ address: props.address });
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("1");

  if (!props.address) {
    return <div>Wallet not connected</div>;
  }

  return (
    <AppModal
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={async () => {
        await mutation.mutateAsync({
          destination: address(destination),
          amount: parseFloat(amount),
        });
      }}
    >
      <Label htmlFor="destination">Destination</Label>
      <Input
        disabled={mutation.isPending}
        id="destination"
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination"
        type="text"
        value={destination}
      />
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  );
}

function ModalAirdropCustomRpc({ address }: { address: Address }) {
  const mutation = useRequestAirdropCustomRpcMutation({ address });
  const [amount, setAmount] = useState("2");

  return (
    <AppModal
      title="Airdrop (Custom RPC)"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount))}
    >
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
      <p className="text-sm text-gray-500 mt-2">
        Using RPC: https://rpc.gorbagana.wtf
      </p>
    </AppModal>
  );
}

function ModalSendCustomRpc(props: { address: Address }) {
  const mutation = useTransferSolCustomRpcMutation({ address: props.address });
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("1");

  if (!props.address) {
    return <div>Wallet not connected</div>;
  }

  return (
    <AppModal
      title="Send (Custom RPC)"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={async () => {
        await mutation.mutateAsync({
          destination: address(destination),
          amount: parseFloat(amount),
        });
      }}
    >
      <Label htmlFor="destination">Destination</Label>
      <Input
        disabled={mutation.isPending}
        id="destination"
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination"
        type="text"
        value={destination}
      />
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
      <p className="text-sm text-gray-500 mt-2">
        Using RPC: https://rpc.gorbagana.wtf
      </p>
    </AppModal>
  );
}
