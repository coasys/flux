---
layout: home
---

<div class="container">
<j-box pt="500">
<j-text variant="heading">Flux App Directory</j-text>
</j-box>
<j-box v-if="loading" py="900" align="center">
<j-flex direction="column" a="center" j="center">
<j-text>Loading Apps..</j-text>
<j-spinner></j-spinner>
</j-flex>
</j-box>
<j-box pt="900">
<div class="grid">
<a :href="`/app-library/app?pkg=${app.pkg}`" class="grid-item" v-for="app in apps">
<j-box pb="500">
    <j-icon :name="app.icon"></j-icon>
</j-box>
<j-text variant="heading">{{app.name}}</j-text>
<j-text variant="body">{{app.description}}</j-text>
</a>
</div>
</j-box>
</div>

<style scoped>

.container {
    width: 100%;
    margin: 0 auto;
    padding-left: 1rem;
    padding-right: 1rem;
    max-width: calc(var(--vp-layout-max-width));
}

.grid {
    gap: var(--j-space-500);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.grid-item {
    border-radius: var(--j-border-radius-sm);
    box-shadow: var(--j-depth-200);
    cursor: pointer;
    padding: var(--j-space-500);
    border: 1px solid var(--j-color-ui-100);
}

.grid-item:hover {
    border: 1px solid var(--j-color-primary-500);
}

</style>

<script setup lang="ts">
import {onMounted, ref} from 'vue';

const apps = ref([]);
const loading = ref(false);

onMounted(async () => {
    apps.value = await getAllFluxApps();
})

async function getApp(name: string): Promise<FluxApp> {
  const res = await fetch(`https://registry.npmjs.org/${name}`);
  const pkg = await res.json();
  const latest = pkg["dist-tags"].latest;
  const fluxapp = pkg.versions[latest]?.fluxapp;

  return {
    pkg: pkg.name,
    version: latest,
    org: "",
    name: fluxapp?.name || pkg.name,
    description: fluxapp?.description || pkg.description,
    icon: fluxapp?.icon || "",
  };
}

async function getAllFluxApps(): Promise<FluxApp[]> {

  loading.value = true;

  try {

  const res = await fetch(
    "https://registry.npmjs.org/-/v1/search?text=keywords:flux-app"
  );


  const json = await res.json();

  const packages = json.objects.map((o: any) => getApp(o.package.name));

  const resolved = await Promise.all(packages);

  return resolved.filter(p => p.pkg.includes("@fluxapp/"))

  } catch(e) {
    console.log(e)
  } finally {
    loading.value = false
  }

}

</script>
