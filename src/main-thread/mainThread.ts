"use strict";

import { app, protocol } from "electron";
import { MainThreadGlobal } from "./globals";
import { registerAppHooks } from "./appHooks";
import { registerIpcHooks } from "./ipcHooks";
import { registerUpdateHooks } from "./updateHooks";
import { setup } from "./setup";

const mainThreadState = new MainThreadGlobal();

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});

// See if we can get the lock for the app
const hasAppLock = app.requestSingleInstanceLock();

if (!hasAppLock) {
  console.log("App is already running, quitting and focusing other window...");
  app.quit();
}

// Run app data setup
setup(mainThreadState);

registerAppHooks(mainThreadState);
registerIpcHooks(mainThreadState);
registerUpdateHooks(mainThreadState);
