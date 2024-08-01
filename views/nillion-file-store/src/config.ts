import { ChainInfo } from "@keplr-wallet/types";

const useDevNet = false;

let config: NillionEnvConfig | null = null;

interface NillionEnvConfig {
  clusterId: string;
  bootnodes: string[];
  chain: {
    chainId: string;
    endpoint: string;
    keys: string[];
    chainInfo: ChainInfo;
  };
}

function getConfig() {
  if (useDevNet) {
    let keys = [];

    for (let i = 0; i < 10; i++) {
      keys.push(
        import.meta.env[`VITE_NILLION_NILCHAIN_PRIVATE_KEY_${i}`] || ""
      );
    }

    config = {
      clusterId: import.meta.env.VITE_NILLION_CLUSTER_ID || "",
      bootnodes: [import.meta.env.VITE_NILLION_BOOTNODE_WEBSOCKET || ""],
      //@ts-ignore
      chain: {
        chainId: "22255222",
        endpoint: import.meta.env.VITE_NILLION_NILCHAIN_JSON_RPC || "",
        keys: keys,
      },
    };
  } else {
    config = {
      clusterId: "b13880d3-dde8-4a75-a171-8a1a9d985e6c",
      bootnodes: [
        "/dns/node-1.testnet-photon.nillion-network.nilogy.xyz/tcp/14211/wss/p2p/12D3KooWCfFYAb77NCjEk711e9BVe2E6mrasPZTtAjJAPtVAdbye",
      ],
      chain: {
        chainId: "nillion-chain-testnet-1",
        endpoint: `${window.location.origin}/nilchain-proxy`, // see webpack.config.js proxy
        keys: [""],
        chainInfo: {
          rpc: "http://65.109.222.111:26657",
          rest: "https://testnet-nillion-api.lavenderfive.com",
          chainId: "nillion-chain-testnet-1",
          chainName: "nillion-chain-testnet-1",
          chainSymbolImageUrl:
            "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/nillion-chain-testnet/nil.png",
          stakeCurrency: {
            coinDenom: "NIL",
            coinMinimalDenom: "unil",
            coinDecimals: 6,
            coinImageUrl:
              "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/nillion-chain-testnet/nil.png",
          },
          bip44: {
            coinType: 118,
          },
          bech32Config: {
            bech32PrefixAccAddr: "nillion",
            bech32PrefixAccPub: "nillionpub",
            bech32PrefixValAddr: "nillionvaloper",
            bech32PrefixValPub: "nillionvaloperpub",
            bech32PrefixConsAddr: "nillionvalcons",
            bech32PrefixConsPub: "nillionvalconspub",
          },
          currencies: [
            {
              coinDenom: "NIL",
              coinMinimalDenom: "unil",
              coinDecimals: 6,
              coinImageUrl:
                "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/nillion-chain-testnet/nil.png",
            },
          ],
          feeCurrencies: [
            {
              coinDenom: "NIL",
              coinMinimalDenom: "unil",
              coinDecimals: 6,
              coinImageUrl:
                "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/nillion-chain-testnet/nil.png",
              gasPriceStep: {
                low: 0.001,
                average: 0.001,
                high: 0.01,
              },
            },
          ],
          features: [],
        },
      },
    };
  }

  return config;
}

export default getConfig;
