import { useState } from "preact/hooks";
import * as nillion from "@nillion/client-web";
import { SigningStargateClient } from "@cosmjs/stargate";

import { QuoteState } from "./FileView";
import { payWithKeplrWallet, PaymentResult } from "../helpers/keplr";
import { retrieveSecret } from "../helpers/retrieveSecret";
import { downloadFile } from "../helpers/utils";

import styles from "./FileView.module.css";

interface QuoteViewProps {
  client: nillion.NillionClient;
  signingClient: SigningStargateClient;
  wallet: any;
  fileName: string;
  storeId: string;
  secretId: string;
  setPaymentReceipt: (receipt: nillion.PaymentReceipt) => void;
  quote: QuoteState;
  setProcessingPermissions: (processing: boolean) => void;
  resetState: () => void;
  setNotificationText: (text: string) => void;
  setVariant: (
    variant: "" | "success" | "danger" | "warning" | undefined
  ) => void;
  setShowNotification: (show: boolean) => void;
  showLoader: boolean;
  setShowLoader: (show: boolean) => void;
}

//@ts-ignore
export default function QuoteView({
  client,
  signingClient,
  wallet,
  fileName,
  storeId,
  secretId,
  setPaymentReceipt,
  quote,
  setProcessingPermissions,
  resetState,
  setNotificationText,
  setVariant,
  setShowNotification,
  showLoader,
  setShowLoader,
}: QuoteViewProps) {
  const [showStoreButton, setShowStoreButton] = useState(true);

  const handlePayAndRetrieve = async () => {
    try {
      if (client && quote?.operation) {
        setShowLoader(true);
        const paymentResult: PaymentResult = await payWithKeplrWallet(
          signingClient,
          wallet,
          quote,
          `get secret: ${fileName}`
        );

        const { receipt, error, tx } = paymentResult;

        if (error) {
          throw new Error(error);
        }

        setVariant("success");
        setNotificationText(`Transaction confirmed with address: ${tx}.`);
        setShowNotification(true);

        console.log("Payment receipt:", receipt, receipt!.toJSON());
        console.log("Payment error:", error);
        console.log("Payment tx:", tx);
        console.log("storeId:", storeId);
        console.log("secretId:", secretId);

        setPaymentReceipt(receipt!);

        const value = await retrieveSecret({
          nillionClient: client,
          store_id: storeId,
          secret_name: secretId,
          receipt: receipt!,
        });
        setShowLoader(false);
        console.log(`client.retrieve_secret completed`);
        console.log(JSON.stringify(value, null, 4));
        console.log(`DONE`);
        console.log(`finished client.retrieve_secret`);

        //@ts-ignore
        downloadFile(value, fileName);

        setVariant("success");
        setNotificationText("File downloaded successfully.");
        setShowNotification(true);
      }
    } catch (error: any) {
      setShowLoader(false);
      if (error.message.includes("PermissionError")) {
        setNotificationText(
          "You have not been granted permission to access this file."
        );
        setVariant("danger");
        setShowNotification(true);
      }
      if (error.message.includes("Request rejected")) {
        setNotificationText("Transaction rejected.");
        setVariant("danger");
        setShowNotification(true);
      }
      if (error.message.includes("values not found")) {
        setNotificationText("Secret not found. This file may have expired.");
        setVariant("danger");
        setShowNotification(true);
      }
      console.log("Error in handlePayAndRetrieve", error);
      resetState();
    } finally {
      resetState();
    }
  };

  return (
    <>
      <j-box>
        <j-flex j="center" a="center" wrap gap="500" direction="column">
          <j-text
            uppercase
            color="ui-800"
            size="200"
            nomargin
            variant="heading-lg"
          >
            Storage Quote:
          </j-text>
          <j-text size="300" nomargin>
            Total: {quote.quoteJson.cost.total}
          </j-text>
          <j-text size="300" nomargin>
            Expires: {quote.quoteJson.expires_at.toString()}
          </j-text>
          {quote.type == "store" && (
            <>
              {showStoreButton && !showLoader && (
                <j-button
                  onClick={() => {
                    setShowStoreButton(false);
                    setProcessingPermissions(true);
                  }}
                >
                  Set Permissions
                </j-button>
              )}
            </>
          )}
          {quote.type == "get" && !showLoader && (
            <j-button onClick={() => handlePayAndRetrieve()}>Download</j-button>
          )}
        </j-flex>
      </j-box>
    </>
  );
}
