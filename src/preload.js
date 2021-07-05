import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = [
      "ping",
      "getLangPath",
      "cleanState",
      "quitApp",
      "download-update",
      "quit-and-install",
      "check-update",
      "restoreWindow",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = [
      "pong",
      "getLangPathResponse",
      "getCleanState",
      "setGlobalLoading",
      "update_available",
      "update_not_available",
      "update_downloaded",
      "download_progress",
      "globalError",
      "windowState",
      "unlockedStateOff"
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
