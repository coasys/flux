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

let polls = [];

function pollData(e) {
  const {
    retry = null,
    quitOnResponse = true,
    interval = 1000,
    query,
    variables,
    name = "Undefined",
    retries = 0,
    dataKey,
  } = e.data;

  if (retry !== null && retries > retry) {
    self.close();
  }

  getData({ query, variables })
    .then((res) => {
      console.log("Polling ", retries, name, " Got response: ", res);
      if (res[dataKey]) {
        self.postMessage(res);
        if (quitOnResponse) {
          const pollsIndex = polls.indexOf(
            query + JSON.stringify(e.data.variables)
          );
          if (pollsIndex > -1) {
            polls.splice(pollsIndex);
          }
          self.close();
        }
      }
    })
    .catch((e) => {
      const pollsIndex = polls.indexOf(
        query + JSON.stringify(e.data.variables)
      );
      if (pollsIndex > -1) {
        polls.splice(pollsIndex);
      }
      throw new Error(e);
    })
    .finally(() => {
      e.data.retries = retries + 1;
      sleep(interval * retries + 1).then(() => pollData(e));
    });
}

self.addEventListener(
  "message",
  (e) => {
    let pollIdentifier = e.data.query + JSON.stringify(e.data.variables);
    if (polls.filter((poll) => poll == pollIdentifier).length == 0) {
      polls.push(pollIdentifier);
      e.data.retries = 0;
      pollData(e);
    }
  },
  false
);
