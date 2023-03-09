export async function getPerspectiveViews() {
  const res = await fetch(
    "https://registry.npmjs.org/-/v1/search?text=keywords:flux-app"
  );

  const json = await res.json();

  console.log({ json });
  return json.objects;
}
