const fetchFluxApp = async function (packageName: string) {
  let module;
  const officialPackages = [
    "@coasys/flux-chat-view",
    "@coasys/flux-post-view",
    "@coasys/flux-graph-view",
    "@coasys/flux-table-view",
    "@coasys/flux-kanban-view",
    "@coasys/flux-webrtc-view",
    "@coasys/nillion-file-store",
    "@coasys/flux-synergy-demo-view"
    "@coasys/flux-poll-view",
  ];
  const isOfficialApp = officialPackages.includes(packageName);

  try {
    if (isOfficialApp) {
      if (packageName === "@coasys/flux-chat-view") {
        module = await import("@coasys/flux-chat-view");
      }
      if (packageName === "@coasys/flux-post-view") {
        module = await import("@coasys/flux-post-view");
      }
      if (packageName === "@coasys/flux-graph-view") {
        module = await import("@coasys/flux-graph-view");
      }
      if (packageName === "@coasys/flux-webrtc-view") {
        module = await import("@coasys/flux-webrtc-view");
      }
      if (packageName === "@coasys/flux-table-view") {
        module = await import("@coasys/flux-table-view");
      }
      if (packageName === "@coasys/flux-synergy-demo-view") {
        module = await import("@coasys/flux-synergy-demo-view");
      }
      if (packageName === "@coasys/flux-kanban-view") {
        module = await import("@coasys/flux-kanban-view");
      }
      if (packageName === "@coasys/nillion-file-store") {
        module = await import(
          /* @vite-ignore */
          new URL("./@coasys/nillion-file-store/main.js", import.meta.url).href
        );
      }
      if (packageName === "@coasys/flux-poll-view") {
        module = await import("@coasys/flux-poll-view");
      }
    } else {
      module = await import(
        /* @vite-ignore */
        `/cdn-proxy/npm/${packageName}@latest/+esm`
      );
    }
  } catch (error) {
    console.error(`Failed to import ${packageName}:`, error);
  }

  return module;
};

export default fetchFluxApp;
