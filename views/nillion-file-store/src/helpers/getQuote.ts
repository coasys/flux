import getConfig from "../config";
import * as nillion from "@nillion/client-web";

export async function getQuote({
  client,
  operation,
}: {
  client: nillion.NillionClient;
  operation: nillion.Operation;
}) {
  const clusterId = getConfig()!.clusterId;
  console.log("getConfig()!.clusterId", clusterId, "operation", operation);
  return await client.request_price_quote(clusterId, operation);
}
