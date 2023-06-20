const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (!app.isPackaged) {
    // Dev environment
    mainWindow.loadFile("./../app/dist/index.html");

    mainWindow.webContents.openDevTools();
  } else {
    // Prod environment
    mainWindow.loadFile("./../dist/index.html");
  }
}

if (require("electron-squirrel-startup")) app.quit();

app.whenReady().then(() => {
  createWindow();

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
