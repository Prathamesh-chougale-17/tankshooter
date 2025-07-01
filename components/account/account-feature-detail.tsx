"use client";
import { assertIsAddress } from "gill";
import { useMemo } from "react";
import { ExplorerLink } from "@/components/cluster/cluster-ui";
import { AppHero } from "@/components/app-hero";
import { ellipsify } from "@/lib/utils";
import {
  AccountBalanceCustomRpc,
  AccountButtonsCustomRpc,
  AccountTokensCustomRpc,
  AccountTransactionsCustomRpc,
} from "./account-ui";
import { useWalletUi } from "@wallet-ui/react";

export default function AccountFeatureDetail() {
  const { account } = useWalletUi();
  const params = account?.address;

  const address = useMemo(() => {
    if (!params || typeof params !== "string") {
      return;
    }
    assertIsAddress(params);
    return params;
  }, [params]);
  if (!address) {
    return <div>Error loading account</div>;
  }

  return (
    <div>
      <AppHero
        title={<AccountBalanceCustomRpc address={address} />}
        subtitle={
          <div className="my-4">
            <ExplorerLink
              address={address.toString()}
              label={ellipsify(address.toString())}
              useCustomRpc={true}
            />
          </div>
        }
      >
        <div className="my-4">
          <AccountButtonsCustomRpc address={address} />
        </div>
      </AppHero>
      <div className="space-y-8">
        <AccountTokensCustomRpc address={address} />
        <AccountTransactionsCustomRpc address={address} />
      </div>
    </div>
  );
}
