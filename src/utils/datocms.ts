const token = "6dff7c12521d35098fcde1648a9d89";

export function getData({ query }: { query: string }): any {
  return fetch("https://graphql.datocms.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: query,
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data)
    .catch((error) => {
      console.log(error);
    });
}
