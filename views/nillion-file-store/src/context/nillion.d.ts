import { AgentClient, PerspectiveProxy } from "@coasys/ad4m";
import * as nillion from "@nillion/client-web";
import React from "react";

interface NillionConfig {
  private_key_seed: string;
  cluster_id: string;
  bootnodes: string[];
}

export interface NillionContextProviderProps {
  children: any;
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
}

interface TimingObject {
  import: number;
  constructor: string;
}

interface NillionContextType {
  client: nillion.NillionClient;
  nillion: typeof nillion;
  config: NillionConfig;
  timing: TimingObject;
  setTiming: React.Dispatch<React.SetStateAction<TimingObject>>;
}

declare const NillionContext: React.Context<NillionContextType>;
declare const NillionContextProvider: React.FC<NillionContextProviderProps>;
declare function useClient(): NillionContextType;

export {
  NillionContext,
  NillionContextProvider,
  useClient,
  NillionContextProviderProps,
};
