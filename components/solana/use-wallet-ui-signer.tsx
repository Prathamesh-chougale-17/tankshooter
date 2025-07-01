import {
  UiWalletAccount,
  useWalletAccountTransactionSendingSigner,
  useWalletUi,
} from "@wallet-ui/react";

export function useWalletUiSigner() {
  const { account, cluster } = useWalletUi();

  // Always call the hook with proper fallbacks
  const signer = useWalletAccountTransactionSendingSigner(
    account as UiWalletAccount,
    cluster?.id || "mainnet-beta"
  );

  // Return null if wallet is not connected
  if (!account || !cluster) {
    return null;
  }

  return signer;
}
