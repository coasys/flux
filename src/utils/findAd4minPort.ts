import { MainClient } from "@/app";
import { Ad4mClient } from "@perspect3vism/ad4m";

function Timeout() {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 20);
  return controller;
}

async function checkConnection(
  url: string,
  client: Ad4mClient
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (client) {
        const id = setTimeout(() => {
          resolve("");
        }, 1000);
        await client.runtime.hcAgentInfos(); // TODO runtime info is broken
        clearTimeout(id);
        console.log("get hc agent infos success.");
        resolve(url);
      }
    } catch (err) {
      if (url) {
        throw Error(
          "Cannot connect to the URL provided please check if the executor is running or pass a different URL"
        );
      }
      resolve("");
    }
  });
}

export async function findAd4mPort(port?: number) {
  if (port) {
    return await checkPort(port);
  } else {
    for (let i = 12000; i <= 12010; i++) {
      const status = await checkPort(i);
      if (!status) {
        continue;
      } else {
        return status;
      }
    }
  }

  MainClient.setPortSearchState("not_found");

  throw Error("Couldn't find an open port");
}

async function checkPostSimple(port: number) {

}

async function checkPort(port: number) {
  const url = `ws://localhost:${port}/graphql`;

  try {
    const res = await fetch(`http://localhost:${port}`, {
      signal: Timeout().signal,
    });

    MainClient.setPort(port);

    const client = MainClient.ad4mClient;

    const ad4mUrl = await checkConnection(url, client);

    const status = await client.agent.status();

    return status;
  } catch (e) {
    console.error("failed", e);

    if (Array.isArray(e)) {
      if (
        e.length > 0 &&
        e[0].message.startsWith(
          "Capability is not matched, you have capabilities:"
        )
      ) {
        throw e[0];
      }
    }

    if (
      e.message ===
      "Cannot extractByTags from a ciphered wallet. You must unlock first."
    ) {
      throw e;
    }

    if (e.message === "signature verification failed") {
      throw e;
    }
  }
}
