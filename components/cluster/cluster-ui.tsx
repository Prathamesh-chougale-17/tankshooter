import { ReactNode } from "react";
import { getExplorerLink, GetExplorerLinkArgs } from "gill";
import { Button } from "@/components/ui/button";
import { AppAlert } from "@/components/app-alert";
import { useWalletUi } from "@wallet-ui/react";
import { useClusterVersion } from "./use-cluster-version";

export function ExplorerLink({
  className,
  label = "",
  useCustomRpc = true, // Default to true for custom RPC
  customRpcUrl = "https://rpc.gorbagana.wtf",
  ...link
}: GetExplorerLinkArgs & {
  className?: string;
  label: string;
  useCustomRpc?: boolean;
  customRpcUrl?: string;
}) {
  const { cluster } = useWalletUi();

  let explorerUrl: string;

  if (useCustomRpc) {
    // For custom RPC, we need to construct the Solana Explorer URL manually
    // with the custom cluster parameter
    const baseUrl = "https://explorer.solana.com";
    const params = new URLSearchParams();
    params.set("cluster", "custom");
    params.set("customUrl", customRpcUrl);

    // Handle different link types based on the properties passed
    if ("address" in link && link.address) {
      explorerUrl = `${baseUrl}/address/${link.address}?${params.toString()}`;
    } else if ("transaction" in link && link.transaction) {
      explorerUrl = `${baseUrl}/tx/${link.transaction}?${params.toString()}`;
    } else if ("block" in link && link.block) {
      explorerUrl = `${baseUrl}/block/${link.block}?${params.toString()}`;
    } else {
      // Fallback to default explorer link generation
      explorerUrl = getExplorerLink({ ...link, cluster: cluster.cluster });
    }
  } else {
    explorerUrl = getExplorerLink({ ...link, cluster: cluster.cluster });
  }

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link font-mono`}
      title={
        useCustomRpc ? `View on explorer using ${customRpcUrl}` : undefined
      }
    >
      {label}
      {useCustomRpc && (
        <span className="text-xs text-gray-500 ml-1">(Custom RPC)</span>
      )}
    </a>
  );
}

export function ClusterChecker({ children }: { children: ReactNode }) {
  const { cluster } = useWalletUi();
  const query = useClusterVersion();

  if (query.isLoading) {
    return null;
  }

  if (query.isError || !query.data) {
    return (
      <AppAlert
        action={
          <Button variant="outline" onClick={() => query.refetch()}>
            Refresh
          </Button>
        }
        className="mb-4"
      >
        Error connecting to cluster{" "}
        <span className="font-bold">{cluster.label}</span>.
      </AppAlert>
    );
  }
  return children;
}
