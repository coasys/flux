import { app, ipcMain, shell } from "electron";
import fs from "fs";
import path from "path";
import { MainThreadGlobal } from "./globals";

export function registerIpcHooks(mainThreadState: MainThreadGlobal): void {
  // IPC communication

  ipcMain.on("ping", () => {
    mainThreadState.mainWindow!.webContents.send(
      "pong",
      "Hello from main thread!"
    );
  });

  ipcMain.on("openLinkInBrowser", (event, link) => {
    shell.openExternal(link);
  });

  ipcMain.on("restoreWindow", () => {
    if (mainThreadState.mainWindow!.isMinimized()) {
      mainThreadState.mainWindow!.restore();
    }

    if (!mainThreadState.mainWindow!.isFocused()) {
      mainThreadState.mainWindow!.focus();
    }
  });

  ipcMain.on("getLangPath", () => {
    mainThreadState.mainWindow!.webContents.send(
      "getLangPathResponse",
      mainThreadState.builtInLangPath
    );
  });

  ipcMain.on("cleanState", () => {
    const path = app.getPath("userData");

    fs.rmdirSync(path, { recursive: true });

    mainThreadState.mainWindow!.webContents.send("getCleanState");
  });

  ipcMain.on("copyLogs", () => {
    const logLocation = path.join(app.getPath("logs"), "debug.log");
    const desktopLocation = path.join(app.getPath("desktop"), "debug.log");
    if (fs.existsSync(logLocation)) {
      fs.copyFileSync(logLocation, desktopLocation);
    } else {
      console.error(
        "Could not find log file, are you running the app in dev mode?"
      );
    }
  });

  ipcMain.on("quitApp", async () => {
    console.log("Got quitApp ipc signal");
    // if (mainThreadState.ad4mCore) {
    //   await mainThreadState.ad4mCore.exit();
    // }
    // mainThreadState.ad4mCore = undefined;
    app.quit();
  });
}
