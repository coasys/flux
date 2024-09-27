import { DirectSecp256k1Wallet, Registry } from "@cosmjs/proto-signing";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import { PaymentReceipt, NillionClient } from "@nillion/client-web";
import { MsgPayFor, typeUrl } from "@nillion/client-web/proto";

import getConfig from "../config";

export async function createNilChainClientAndWalletFromPrivateKey(): Promise<
  [SigningStargateClient, DirectSecp256k1Wallet]
> {
  const key = Uint8Array.from(
    getConfig()!
      .chain.keys[0].match(/.{1,2}/g)!
      .map((byte) => parseInt(byte, 16)),
  );
  const wallet = await DirectSecp256k1Wallet.fromKey(key, "nillion");

  const registry = new Registry();
  registry.register(typeUrl, MsgPayFor);

  const options = {
    registry,
    gasPrice: GasPrice.fromString("25unil"),
    gasAdjustment: 1.3,
    autoGas: true,
  };

  const client = await SigningStargateClient.connectWithSigner(
    getConfig()!.chain.endpoint,
    wallet,
    options,
  );
  return [client, wallet];
}

export async function payWithWalletFromPrivateKey(
  nilChainClient: SigningStargateClient,
  wallet: DirectSecp256k1Wallet,
  quoteInfo: any,
): Promise<PaymentReceipt> {
  const { quote } = quoteInfo;
  const denom = "unil";
  const [account] = await wallet.getAccounts();
  const from = account.address;

  const payload: MsgPayFor = {
    fromAddress: from,
    resource: quote.nonce,
    amount: [{ denom, amount: quote.cost.total }],
  };

  console.log(payload);

  const result = await nilChainClient.signAndBroadcast(
    from,
    [{ typeUrl, value: payload }],
    "auto",
  );

  return new PaymentReceipt(quote, result.transactionHash);
}
