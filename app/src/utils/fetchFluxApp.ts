const fetchFluxApp = async function (packageName: string) {
  let module;
  const officialPackages = [
    "@fluxapp/chat-view",
    "@fluxapp/post-view",
    "@fluxapp/graph-view",
    "@fluxapp/table-view",
    "@fluxapp/kanban-view",
    "@fluxapp/webrtc-view",
  ];
  const isOfficialApp = officialPackages.includes(packageName);

  try {
    if (isOfficialApp) {
      if (packageName === "@fluxapp/chat-view") {
        module = await import("@fluxapp/chat-view");
      }
      if (packageName === "@fluxapp/post-view") {
        module = await import("@fluxapp/post-view");
      }
      if (packageName === "@fluxapp/graph-view") {
        module = await import("@fluxapp/graph-view");
      }
      if (packageName === "@fluxapp/webrtc-view") {
        module = await import("@fluxapp/webrtc-view");
      }
      if (packageName === "@fluxapp/table-view") {
        module = await import("@fluxapp/table-view");
      }
      if (packageName === "@fluxapp/kanban-view") {
        module = await import("@fluxapp/kanban-view");
      }
    } else {
      module = await import(
        /* @vite-ignore */
        `https://cdn.jsdelivr.net/npm/${packageName}@latest/+esm`
      );
    }
  } catch (error) {
    console.error(`Failed to import ${packageName}:`, error);
  }

  return module;
};

export default fetchFluxApp;
