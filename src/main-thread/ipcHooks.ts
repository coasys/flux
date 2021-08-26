import { app, ipcMain } from "electron";
import fs from "fs";
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

  ipcMain.on("quitApp", async () => {
    console.log("Got quitApp signal");
    if (mainThreadState.ad4mCore) {
      await mainThreadState.ad4mCore.exit();
    }
    app.quit();
  });
}
