const fetchFluxApp = async function (packageName: string) {
  let module;
  const isOfficialApp = packageName.startsWith("@fluxapp");

  try {
    if (isOfficialApp) {
      console.log("fetching: ", packageName, " from localhost");

      if (packageName === "@fluxapp/chat-view") {
        module = await import("@fluxapp/chat-view");
      }
      if (packageName === "@fluxapp/post-view") {
        module = await import("@fluxapp/post-view");
      }
      if (packageName === "@fluxapp/webrtc-view") {
        module = await import("@fluxapp/webrtc-view");
      }
    } else {
      console.log("fetching: ", packageName, " from npm");

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
