async function getData({ query, variables, port }) {
  try {
    const { data, errors = [] } = await fetch(`http://207.148.114.152:${port}/graphql`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "cache-control": "no-store",
        fetchPolicy: "no-store",
        pragma: "no-store",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store",
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
    /// GraphQL query to be made
    query,
    /// Variables for graphql query
    variables,
    name = "Undefined",
    retries = 0,
    /// Optional data to send in callback once worker has executed
    callbackData = null,
    dataKey,
    /// Determines if the sleep between loop execution should backoff or not
    staticSleep = false,
    /// Hacky solution that allows for the updating of from/until dates in worker loops for perspective link queries
    resetUntil = false,
    resetFrom = false,
    port
  } = params;

  // remove poll if we are over our retries
  if (retry !== null && retries > retry) {
    polls = polls.filter((pollId) => pollId !== id);
  }

  if (!polls.includes(id)) {
    return;
  }

  if (resetUntil) {
    variables.query.untilDate = new Date();
  }
  if (resetFrom) {
    variables.query.fromDate = new Date();
  }

  getData({ query, variables, port })
    .then((res) => {
      console.log("Polling ", retries, name, " Got response: ", res);

      // post data if we have a result
      if (res && res[dataKey]) {
        // if we have defined a retry amount,
        // it means we want it to quit when we have a response
        // TODO: Maybe make this more explicit
        if (retry !== null) {
          polls = polls.filter((pollId) => pollId !== id);
        }
        // Below code is useful if we want to see what messages are being returned by expression poll workers
        // if (dataKey == "expression") {
        //   console.warn("Sending response", JSON.parse(res.expression.data).body)
        // }
        self.postMessage({ ...res, callbackData });
      }
    })
    .catch((e) => {
      throw new Error(e);
    })
    .finally(() => {
      const time = staticSleep ? interval : interval * (retries + 1);
      if (polls.includes(id)) {
        sleep(time).then(() => {
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
