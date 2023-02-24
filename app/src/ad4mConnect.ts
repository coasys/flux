import Ad4mConnectUI from "@perspect3vism/ad4m-connect";

const ad4mConnect = Ad4mConnectUI({
  appName: "Flux",
  appDesc: "A Social Toolkit for the New Internet",
  appDomain: "appdomain",
  appIconPath: "https://i.ibb.co/GnqjPJP/icon.png",
  capabilities: [{ with: { domain: "*", pointers: ["*"] }, can: ["*"] }],
});

export { ad4mConnect };
