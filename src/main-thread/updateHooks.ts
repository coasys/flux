import { app, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import { MainThreadGlobal } from "./globals";

export function registerUpdateHooks(mainThreadState: MainThreadGlobal): void {
  ipcMain.on("check-update", () => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    } else {
      mainThreadState.mainWindow!.webContents.send("update_not_available");
    }
  });

  autoUpdater.on("update-available", () => {
    mainThreadState.mainWindow!.webContents.send("update_available");
  });

  autoUpdater.on("update-not-available", () => {
    mainThreadState.mainWindow!.webContents.send("update_not_available");
  });

  ipcMain.on("download-update", () => {
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on("update-downloaded", () => {
    mainThreadState.mainWindow!.webContents.send("update_downloaded");
  });

  ipcMain.on("quit-and-install", () => {
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on("download-progress", (info) => {
    mainThreadState.mainWindow!.webContents.send("download_progress", info);
  });

  autoUpdater.on("error", () => {
    mainThreadState.mainWindow!.webContents.send("update_not_available");
  });
}
