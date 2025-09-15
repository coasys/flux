import { Window as KeplrWindow, Keplr } from "@keplr-wallet/types";
import getConfig from "../config";

import { Registry } from "@cosmjs/proto-signing";
import { PaymentReceipt } from "@nillion/client-web";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import { MsgPayFor } from "@nillion/client-web/proto";

const typeUrl = "/nillion.meta.v1.MsgPayFor";

// interface Amount {
//   denom: string;
//   amount: string;
// }

// interface MsgPayFor {
//   resource: Uint8Array;
//   fromAddress: string;
//   amount: Amount[];
// }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends KeplrWindow {}
}

export async function getKeplr(): Promise<Keplr | undefined> {
  if (window.keplr) {
    return window.keplr;
  }

  if (document.readyState === "complete") {
    return window.keplr;
  }

  return new Promise((resolve) => {
    const documentStateChange = (event: Event) => {
      if (
        event.target &&
        (event.target as Document).readyState === "complete"
      ) {
        resolve(window.keplr);
        document.removeEventListener("readystatechange", documentStateChange);
      }
    };

    document.addEventListener("readystatechange", documentStateChange);
  });
}

export async function signerViaKeplr(chainId: string, keplr: Keplr) {
  return await keplr
    .experimentalSuggestChain(getConfig()!.chain.chainInfo)
    .then(async () => {
      await keplr.enable(getConfig()!.chain.chainId);
      const signer = await keplr.getOfflineSigner(getConfig()!.chain.chainId);
      return signer;
    });
}

export async function createNilChainClientAndKeplrWallet(): Promise<
  [SigningStargateClient, any]
> {
  const keplr = await getKeplr();
  if (!keplr) {
    alert(
      "Install Keplr and create a Nillion Wallet following instructions here: https://docs.nillion.com/guide-testnet-connect"
    );
    throw new Error("Keplr extension not installed");
  }
  const wallet = await signerViaKeplr(getConfig()!.chain.chainId, keplr);

  const registry = new Registry();
  registry.register(typeUrl, MsgPayFor);

  const options = {
    registry,
    gasPrice: GasPrice.fromString("0.0unil"),
  };

  const client = await SigningStargateClient.connectWithSigner(
    getConfig()!.chain.endpoint,
    wallet,
    options
  );
  return [client, wallet];
}

export interface PaymentResult {
  error?: any | null;
  receipt: PaymentReceipt | null;
  tx: string | null;
}

export async function payWithKeplrWallet(
  nilChainClient: SigningStargateClient,
  wallet: any,
  quoteInfo: any,
  memo: string = ""
): Promise<PaymentResult> {
  const { quote } = quoteInfo;
  const denom = "unil";
  const [account] = await wallet.getAccounts();
  console.log(account);
  const currentAddress = account.address;

  const balance = await nilChainClient.getBalance(currentAddress, denom);

  const paymentResult: PaymentResult = {
    error: null,
    receipt: null,
    tx: null,
  };

  if (balance > quote.cost.total) {
    const payload: MsgPayFor = {
      fromAddress: currentAddress,
      resource: quote.nonce,
      amount: [{ denom, amount: quote.cost.total }],
    };
    try {
      const result = await nilChainClient.signAndBroadcast(
        currentAddress,
        [{ typeUrl, value: payload }],
        "auto",
        memo
      );
      return {
        ...paymentResult,
        receipt: new PaymentReceipt(quote, result.transactionHash),
        tx: result.transactionHash,
      };
    } catch (error) {
      return {
        ...paymentResult,
        error,
      };
    }
  } else {
    return {
      ...paymentResult,
      error: `Account ${currentAddress} has an insufficient balance.`,
    };
  }
}
