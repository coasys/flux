import { app, ipcMain } from "electron";
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
    const desktopLocation = app.getPath("desktop");
    fs.copyFileSync(logLocation, desktopLocation);
  });

  ipcMain.on("quitApp", async () => {
    console.log("Got quitApp ipc signal");
    if (mainThreadState.ad4mCore) {
      await mainThreadState.ad4mCore.exit();
    }
    mainThreadState.ad4mCore = undefined;
    app.quit();
  });
}
