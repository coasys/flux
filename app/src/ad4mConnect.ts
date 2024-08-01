import Ad4mConnectUI from "@coasys/ad4m-connect";

const ad4mConnect = Ad4mConnectUI({
  appName: "Flux",
  appDesc: "A Social Toolkit for the New Internet",
  appUrl: window.location.origin,
  appDomain: window.location.origin,
  appIconPath: "/icon.png",
  capabilities: [{ with: { domain: "*", pointers: ["*"] }, can: ["*"] }],
});

export { ad4mConnect };
