import { generateWCName } from "./wcName";

export type FluxApp = {
  wcName: string;
  packageName: string;
  org: string;
  version: string;
  name: string;
  description: string;
  icon: string;
};

export async function getApp(name: string): Promise<FluxApp> {
  const res = await fetch(`https://registry.npmjs.org/${name}`);
  const pkg = await res.json();
  const latest = pkg["dist-tags"].latest;
  const fluxapp = pkg.versions[latest]?.fluxapp;
  const wcName = await generateWCName(pkg.name);

  return {
    wcName: wcName,
    packageName: pkg.name,
    version: latest,
    org: "",
    name: fluxapp?.name || pkg.name,
    description: fluxapp?.description || pkg.description,
    icon: fluxapp?.icon || "",
  };
}

export async function getAllFluxApps(): Promise<FluxApp[]> {
  const res = await fetch(
    "https://registry.npmjs.org/-/v1/search?text=keywords:flux-app"
  );

  const json = await res.json();

  const packages = json.objects.map((o: any) => getApp(o.package.name));

  return Promise.all(packages);
}
