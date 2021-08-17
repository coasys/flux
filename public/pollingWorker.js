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

function createId({ query, variables }) {
  return query + variables ? JSON.stringify(variables) : "";
}

let polls = [];

function pollData(params) {
  const {
    id = "",
    retry = null,
    interval = 1000,
    query,
    variables,
    name = "Undefined",
    retries = 0,
    callbackData = null,
    dataKey,
  } = params;

  // remove poll if we are over our retries
  if (retry !== null && retries > retry) {
    polls = polls.filter((pollId) => pollId !== id);
  }

  if (!polls.includes(id)) {
    return;
  }

  getData({ query, variables })
    .then((res) => {
      console.log("Polling ", retries, name, " Got response: ", res);

      // post data if we have a result
      if (res[dataKey]) {
        // if we have defined a retry amount,
        // it means we want it to quit when we have a response
        // TODO: Maybe make this more explicit
        if (retry !== null) {
          polls = polls.filter((pollId) => pollId !== id);
        }
        self.postMessage({ ...res, callbackData });
      }
    })
    .catch((e) => {
      throw new Error(e);
    })
    .finally(() => {
      if (polls.includes(id)) {
        sleep(interval * (retries + 1)).then(() => {
          pollData({ ...params, retries: retries + 1 });
        });
      }
    });
}

self.addEventListener(
  "message",
  (e) => {
    let pollIdentifier = createId(e.data);
    const isAlreadyPolling = polls.includes(pollIdentifier);
    if (!isAlreadyPolling) {
      polls.push(pollIdentifier);
      pollData({ ...e.data, id: pollIdentifier, retries: 0 });
    }
  },
  false
);
