import Ad4mConnectUI from "@coasys/ad4m-connect";

const ad4mConnect = Ad4mConnectUI({
  appName: "Flux",
  appDesc: "A Social Toolkit for the New Internet",
  appUrl: window.location.origin,
  appDomain: window.location.origin,
  appIconPath: window.location.origin + "/icon.png",
  capabilities: [{ with: { domain: "*", pointers: ["*"] }, can: ["*"] }],
  hosting: true,
  mobile: true,
});

export { ad4mConnect };
