import getConfig from "../config";
import * as nillion from "@nillion/client-web";

interface UpdateSecret {
  nillionClient: nillion.NillionClient;
  nillionSecrets: nillion.NadaValues;
  storeSecretsReceipt: nillion.PaymentReceipt;
  storeId: string;
}

// Store Secrets that have already been paid for
export async function updateSecret({
  nillionClient,
  nillionSecrets,
  storeSecretsReceipt,
  storeId,
}: UpdateSecret): Promise<any> {
  try {
    const user_id = nillionClient.user_id;

    const result = await nillionClient.update_values(
      getConfig()!.clusterId,
      storeId,
      nillionSecrets,
      storeSecretsReceipt,
    );

    console.log(result, storeId);

    return storeId;
  } catch (error) {
    console.log(error);
    return "error";
  }
}
