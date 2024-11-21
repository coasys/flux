import React, { createContext, useContext, useEffect, useState } from "react";
import * as nil from "@nillion/client-web";
import { NillionContextProviderProps } from "./nillion.d";

import getConfig from "../config";
import { useSubjects } from "@coasys/ad4m-react-hooks";
import NillionUser from "../subjects/NillionUsers";
import { Literal } from "@coasys/ad4m";

interface NillionContextType {
  client: nil.NillionClient | null;
  nillion: typeof nil | null;
}

const defaultState = {
  client: null,
  nillion: null,
} as NillionContextType;

const NillionContext = createContext(defaultState);
export const useClient = () => useContext(NillionContext);

export const NillionContextProvider = (props: NillionContextProviderProps) => {
  const [state, setState] = useState(defaultState);
  const { client, nillion } = state;
  const agentClient = props.agent;

  // const { repo } = useSubject({
  //   perspective: props.perspective,
  //   id: client?.user_id || "ad4m://self",
  //   subject: NillionUser,
  // });

  const { entries: nillionUsers, repo } = useSubjects({
    perspective: props.perspective,
    source: props.source,
    subject: NillionUser,
  });

  const loaded = React.useRef(false);

  const config = getConfig();

  useEffect(() => {
    const loadWasm = async () => {
      if (loaded.current || client !== null || nillion !== null) return;
      loaded.current = true;
      console.log("Using Nillion Config", config);

      console.info(`>> STARTING LOAD nillion_client_js_browser`);

      await nil.default();

      const signedNillionMessage = await agentClient.signMessage("nillion");
      console.log("Signed Nillion Message", signedNillionMessage);
      const userKey = nil.UserKey.from_seed(
        //@ts-ignore
        signedNillionMessage.signature.slice(0, 32)
      );
      console.log("Gen user key", userKey);

      const defaultNodeKeySeed = `nillion-testnet-seed-${Math.floor(Math.random() * 10) + 1}`;
      var nodeKey = nil.NodeKey.from_seed(defaultNodeKeySeed);

      nil.NillionClient.enable_remote_logging();
      const wasmclient = new nil.NillionClient(
        userKey,
        nodeKey,
        config!.bootnodes
      );
      setState({ client: wasmclient, nillion: nil });

      console.log("Finished init client");

      const info = await wasmclient.cluster_information(config!.clusterId);

      console.log("Cluster info", info);

      console.info(`<< FINISHED LOAD nillion_client_js_browser`);
      console.log("client", wasmclient);
    };
    loadWasm();
  }, [setState]);

  return (
    <NillionContext.Provider value={{ client, nillion }}>
      {props.children}
    </NillionContext.Provider>
  );
};
