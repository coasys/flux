import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    // whitelist channels
    const validChannels = [
      "ping",
      "getLangPath",
      "cleanState",
      "quitApp",
      "download-update",
      "quit-and-install",
      "check-update",
      "restoreWindow",
      "copyLogs",
      "openLinkInBrowser",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
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
      "unlockedStateOff",
      "clearMessages",
      "ad4mAgentInit",
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
