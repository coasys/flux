const { app, BrowserWindow, session } = require("electron");
const path = require("path");

async function createWindow(s) {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.session = s;

  if (!app.isPackaged) {
    // Dev environment
    await mainWindow.loadFile("../app/dist/index.html");

    mainWindow.webContents.openDevTools();
  } else {
    // Prod environment
    await mainWindow.loadFile("../app/dist/index.html");
  }
}

if (require("electron-squirrel-startup")) app.quit();

app.whenReady().then(() => {
  const proxySession = session.fromPartition("proxy-partition", {
    cache: false,
  });

  createWindow(proxySession);

  // Intercept network requests
  customSession.webRequest.onBeforeRequest((details, callback) => {
    if (
      details.url ===
      "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"
    ) {
      callback({
        redirectURL: `file://${__dirname}/assets/fonts/bootstrap-icons.css`,
      });
    } else if (
      details.url ===
      "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/fonts/bootstrap-icons.woff2?2ab2cbbe07fcebb53bdaa7313bb290f2"
    ) {
      callback({
        redirectURL: `file://${__dirname}/assets/fonts/bootstrap-icons.woff2`,
      });
    } else {
      // Continue with the original request
      callback({});
    }
  });

  app.dock.setIcon("/assets/icon");

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
