const API_ENDPOINT = "http://localhost:4000/graphql";

async function getData({ query, variables }) {
  try {
    const { data, errors = [] } = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }).then((res) => res.json());

    if (errors.length > 0) {
      console.log(
        `GraphQL call errored with:`,
        JSON.stringify(errors, null, 2)
      );
      throw new Error("GraphQL query failed, better check the logs.");
    }

    return data;
  } catch (err) {
    console.log("fetch() failed", err);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let retries = 0;

function pollData(e) {
  const {
    retry = null,
    quitOnResponse = false,
    interval = 1000,
    query,
    variables,
  } = e.data;

  console.log("Started polling", {
    retries,
    retry,
    interval,
    query,
    variables,
  });

  if (retry !== null && retries > retry) {
    self.close();
  }

  getData({ query, variables })
    .then((res) => {
      if (res) {
        self.postMessage(res);
        if (quitOnResponse) {
          self.close();
        }
      }
    })
    .catch((e) => {
      console.log(e);
    })
    .finally(() => {
      retries = retries + 1;
      sleep(interval).then(() => pollData(e));
    });
}

self.addEventListener("message", pollData, false);
