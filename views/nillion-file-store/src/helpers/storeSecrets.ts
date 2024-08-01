import getConfig from "../config";
import * as nillion from "@nillion/client-web";

interface StoreSecrets {
  nillionClient: nillion.NillionClient;
  nillionSecrets: nillion.NadaValues;
  storeSecretsReceipt: nillion.PaymentReceipt;
  permissions: nillion.Permissions;
  usersWithRetrievePermissions?: string[];
  usersWithUpdatePermissions?: string[];
  usersWithDeletePermissions?: string[];
  usersWithComputePermissions?: string[];
  programIdForComputePermissions?: string;
}

// Store Secrets that have already been paid for
export async function storeSecrets({
  nillionClient,
  nillionSecrets,
  storeSecretsReceipt,
  permissions,
}: StoreSecrets): Promise<any> {
  try {
    const store_id = await nillionClient.store_values(
      getConfig()!.clusterId,
      nillionSecrets,
      permissions,
      storeSecretsReceipt
    );

    return store_id;
  } catch (error) {
    console.log(error);
    return "error";
  }
}
