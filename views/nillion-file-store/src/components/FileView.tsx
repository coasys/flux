import { useEffect, useState, useRef } from "preact/hooks";
import { AgentClient, PerspectiveProxy } from "@coasys/ad4m";
import { useAd4mModel } from "@coasys/flux-utils/src/useAd4mModel";
import { getProfile } from "@coasys/flux-api";
import { v4 } from "uuid";
import * as nil from "@nillion/client-web";

import { NillionContextProvider, useClient } from "../context/nillion.jsx";
import { getQuote } from "../helpers/getQuote";
import { storeSecrets } from "../helpers/storeSecrets";
import { payWithKeplrWallet, PaymentResult } from "../helpers/keplr";
import KeplrConnectButton from "./KeplrConnect";
import { SigningStargateClient } from "@cosmjs/stargate";

import File from "../subjects/File";
import NillionUser from "../subjects/NillionUsers";

import FileViewHeading from "./FileViewHeading";
import FileInputComponent from "./FileInput";
import QuoteView from "./QuoteView";
import Files from "./Files";
import AddPermissions from "./AddPermissions";

import styles from "./FileView.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
};

export default function AppWithProvider({ perspective, source, agent }: Props) {
  return (
    <NillionContextProvider
      agent={agent}
      perspective={perspective}
      source={source}
    >
      <FileView perspective={perspective} source={source} agent={agent} />
    </NillionContextProvider>
  );
}

export interface QuoteState {
  quote: nil.PriceQuote;
  quoteJson: Object;
  secret?: nil.NadaValues;
  rawSecret?: Uint8Array;
  operation: nil.Operation;
  type: string;
}

export interface UserPermission {
  op: string;
  did: string;
  nillionAgentId: string;
}

export function FileView({ perspective, source, agent }: Props) {
  const { client, nillion } = useClient();

  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationText, setNotificationText] = useState<string>("");
  const [variant, setVariant] = useState<
    "" | "success" | "danger" | "warning" | undefined
  >("success");

  const [fileName, setFileName] = useState<string>("");
  //Stores the id of the secret as its inserted into NadaValues
  const [secretId, setSecretId] = useState<string>("");
  //Stores the id of the store operation
  const [storeId, setStoreId] = useState<string>("");
  //Stores the quote for storing the file
  const [quote, setQuote] = useState<QuoteState | null>(null);
  //Stores the payment receipt for storing the file
  const [paymentReceipt, setPaymentReceipt] =
    useState<nil.PaymentReceipt | null>(null);

  //Stores a map of did to user profile
  const [profiles, setProfiles] = useState(new Map<string, any>());
  //Signing client
  const [signingClient, setSigningClient] =
    useState<SigningStargateClient | null>(null);
  //Wallet key
  const [wallet, setWallet] = useState<any | null>(null);
  //Connected address
  const [connectedAddress, setConnectedAddress] = useState<any | null>(null);
  //Other agents in neighbourhood
  const [otherAgents, setOtherAgents] = useState<string[]>([]);
  //State for processing permissions
  const [processingPermissions, setProcessingPermissions] =
    useState<Boolean>(false);
  //Permission set for secret to be stored
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [ttlValue, setTtlValue] = useState<number>(30);
  const [currentFile, setCurrentFile] = useState<Uint8Array | null>(null);
  const [showQuoteLoader, setShowQuoteLoader] = useState<boolean>(false);

  const [showLoader, setShowLoader] = useState<boolean>(false);

  const { entries: files } = useAd4mModel({
    perspective,
    model: File,
    query: { source },
  });

  const { entries: nillionUsers } = useAd4mModel({
    perspective,
    model: NillionUser,
    query: { source },
  });

  console.log({ nillionUsers });

  useEffect(() => {
    if (!client) return;
    //Create a mapping in ADAM between the nillion user and the agent did
    const createNillionUser = async () => {
      console.log("Creating nillion user...", client.user_id);
      const me = await agent.me();
      const newNillionUser = new NillionUser(perspective, me.did, source);
      newNillionUser.userId = client.user_id;
      await newNillionUser.save();
      console.log("Nillion user created", newNillionUser);
    };

    createNillionUser();
  }, [client?.user_id]);

  useEffect(() => {
    //Fetch the agent profiles for each file author
    const fetchProfiles = async () => {
      for (const did of otherAgents) {
        const profile = await getProfile(did);
        setProfiles((prev) => new Map(prev).set(did, profile));
      }
    };

    fetchProfiles();
  }, [otherAgents]);

  useEffect(() => {
    //Fetch the other agents in the neighbourhood
    const fetchMembers = async () => {
      const me = await agent.me();
      console.log("Got me:", me);
      setOtherAgents([me.did]);

      const neighbourhood = perspective?.getNeighbourhoodProxy();
      if (perspective.neighbourhood) {
        if (neighbourhood) {
          const others = await neighbourhood?.otherAgents();
          console.log("Got others:", others);
          setOtherAgents([...others, me.did]);
        }
      }
    };

    console.log("Fetching neighbourhood members...");
    fetchMembers();
  }, [perspective]);

  useEffect(() => {
    //Get the connected wallet address
    const getAddress = async (wallet: any) => {
      setWallet(wallet);
      if (wallet) {
        const [account] = await wallet.getAccounts();
        setConnectedAddress(account.address);
      } else {
        setConnectedAddress(null);
      }
    };
    getAddress(wallet);
  }, [wallet]);

  const resetState = () => {
    setFileName("");
    setSecretId("");
    setStoreId("");
    setQuote(null);
    setPaymentReceipt(null);
    setProcessingPermissions(false);
    setPermissions([]);
    setShowLoader(false);
    setTtlValue(30);
  };

  const fetchQuote = async (name: string, byteArray: Uint8Array) => {
    setCurrentFile(byteArray);
    console.log("Fetching quote...");
    console.log("For byteArray with length:", byteArray.length);
    console.log("Nillion:", nillion);
    console.log("Client:", client);
    console.log("");

    setFileName(name);

    if (nillion) {
      let newStoreId = v4();
      setSecretId(newStoreId);

      console.log("SecretId being set to:", newStoreId);

      const secretForQuote = new nillion.NadaValues();

      const newSecretBlob = nillion.NadaValue.new_secret_blob(byteArray);
      secretForQuote.insert(newStoreId, newSecretBlob);

      console.log(
        "Secret for quote:  ",
        secretForQuote,
        secretForQuote.toJSON()
      );

      console.log("Constructing store operation with ttl:", ttlValue);

      const storeOperation = nillion.Operation.store_values(
        secretForQuote,
        ttlValue
      );

      console.log("Store operation:", storeOperation, storeOperation.toJSON());

      const quote = await getQuote({
        client: client,
        operation: storeOperation,
      });

      console.log("Got quote:", quote, quote.toJSON());

      setQuote({
        quote,
        quoteJson: quote.toJSON(),
        secret: secretForQuote,
        rawSecret: byteArray,
        operation: storeOperation,
        type: "store",
      });
    }
  };

  const store = async () => {
    try {
      if (client && quote?.operation) {
        setShowLoader(true);
        const paymentResult: PaymentResult = await payWithKeplrWallet(
          signingClient!,
          wallet,
          quote,
          `store secret: ${fileName}`
        );

        const { receipt, error, tx } = paymentResult;

        console.log("Payment receipt:", receipt, receipt?.toJSON());
        console.log("Payment error:", error);
        console.log("Payment tx:", tx);

        if (error) {
          throw new Error(error);
        }

        setVariant("success");
        setNotificationText(`Transaction confirmed with address: ${tx}.`);
        setShowNotification(true);

        setPaymentReceipt(receipt);

        const user_id = client.user_id;
        const otherReadPermissions = permissions
          .filter((permission) => permission.op === "read")
          .map((permission) => permission.nillionAgentId);
        const otherWritePermissions = permissions
          .filter((permission) => permission.op === "write")
          .map((permission) => permission.nillionAgentId);
        const otherDeletePermissions = permissions
          .filter((permission) => permission.op === "delete")
          .map((permission) => permission.nillionAgentId);

        const nillionPermissions = new nillion.Permissions();
        nillionPermissions.add_retrieve_permissions([
          // user_id,
          ...otherReadPermissions,
        ]);
        nillionPermissions.add_update_permissions([
          // user_id,
          ...otherWritePermissions,
        ]);
        nillionPermissions.add_delete_permissions([
          // user_id,
          ...otherDeletePermissions,
        ]);

        const storeId = await storeSecrets({
          nillionClient: client,
          nillionSecrets: quote.secret!,
          storeSecretsReceipt: receipt!,
          permissions: nillionPermissions,
        });

        console.log("storeSecrets completed", storeId);

        const sizeInMB = quote.rawSecret!.length / 1_048_576;

        const newFile = new File(perspective, undefined, source);
        newFile.name = fileName;
        newFile.secretId = secretId;
        newFile.storeId = storeId;
        newFile.size = sizeInMB.toString();
        await newFile.save();

        setShowLoader(false);

        setVariant("success");
        setNotificationText(
          `File stored successfully on Nillion with Secret ID: ${secretId}.`
        );
        setShowNotification(true);
      } else {
        console.log("No quote available.");
      }
    } catch (error: any) {
      console.log("Got error", error, error.message);
      setShowLoader(false);
      if (error.message.includes("Request rejected")) {
        setNotificationText("Transaction rejected.");
        setVariant("");
        setShowNotification(true);
      } else {
        setNotificationText(
          "Error storing file. Please report and quote the following error: " +
            error
        );
        setVariant("danger");
        setShowNotification(true);
      }
      console.error("Error storing file", error);
    } finally {
      resetState();
    }
  };

  const handleGetQuote = async (
    name: string,
    storeId: string,
    secretId: string
  ) => {
    resetState();
    setFileName(name);
    setStoreId(storeId);
    setSecretId(secretId);

    if (client) {
      const operation = nillion.Operation.retrieve_value();

      const quote = await getQuote({
        client: client,
        operation,
      });

      setQuote({
        quote,
        quoteJson: quote.toJSON(),
        operation,
        type: "get",
      });
    }
  };

  const handleTtlChange = (event: any) => {
    setTtlValue(event.target.value);
    fetchQuote(fileName, currentFile!);
  };

  if (!connectedAddress) {
    return (
      <j-flex j="center" a="center" wrap gap="500" direction="column">
        <FileViewHeading />
        <div style={{ height: "300px", display: "grid", placeItems: "center" }}>
          <KeplrConnectButton
            setChainClient={(signingclient) => setSigningClient(signingclient)}
            setWallet={(key) => setWallet(key)}
          />
        </div>
      </j-flex>
    );
  }

  return (
    <>
      <j-flex j="center" a="center" wrap gap="500" direction="column">
        <FileViewHeading connectedAddress={connectedAddress} />

        {!quote && <FileInputComponent onFileUpload={fetchQuote} />}

        {quote && (
          <QuoteView
            client={client}
            signingClient={signingClient!}
            wallet={wallet}
            fileName={fileName}
            storeId={storeId}
            secretId={secretId}
            setPaymentReceipt={setPaymentReceipt}
            quote={quote}
            setProcessingPermissions={setProcessingPermissions}
            resetState={resetState}
            setNotificationText={setNotificationText}
            setVariant={setVariant}
            setShowNotification={setShowNotification}
            setShowLoader={setShowLoader}
            showLoader={showLoader}
          />
        )}

        {processingPermissions && !showLoader && (
          <>
            <AddPermissions
              profiles={profiles}
              otherAgents={otherAgents}
              nillionUsers={nillionUsers}
              permissions={permissions}
              setPermissions={setPermissions}
            />
            <j-text>Set Storage Time:</j-text>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={ttlValue}
              onChange={handleTtlChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <j-text>{ttlValue} days</j-text>
            <j-button onClick={store}>Store</j-button>
          </>
        )}

        {showLoader && <j-spinner></j-spinner>}

        <Files
          files={files}
          handleGetQuote={handleGetQuote}
          deleteFile={async (id: string) => {
            const file = new File(perspective, id, source);
            await file.delete();
          }}
          profiles={profiles}
        />
      </j-flex>

      <j-toast
        variant={variant}
        open={showNotification}
        onToggle={(e) => setShowNotification(e.target.open)}
      >
        {notificationText}
      </j-toast>
    </>
  );
}
