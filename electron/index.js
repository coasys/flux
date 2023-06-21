const { app, BrowserWindow } = require("electron");
const path = require("path");

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (!app.isPackaged) {
    // Dev environment
    await mainWindow.loadFile("./../app/dist/index.html");

    mainWindow.webContents.openDevTools();
  } else {
    // Prod environment
    await mainWindow.loadFile("./../dist/index.html");
  }

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.executeJavaScript(`
      const head = document.getElementsByTagName('head')[0];

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = 'file://${__dirname}/assets/fonts/bootstrap-icons.css';
      link.media = 'all';
      head.appendChild(link);

      const style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.appendChild(document.createTextNode("@font-face { font-family: 'DM Sans'; src: url('file://${__dirname}/assets/fonts/flux.woff2'); } "));
      head.appendChild(style);

      const style2 = document.createElement('style');
      style2.setAttribute('type', 'text/css');
      style2.appendChild(document.createTextNode("@font-face { font-family: 'bootstrap-icons'; src: url('file://${__dirname}/assets/fonts/bootstrap-icons.woff2'); } "));
      head.appendChild(style2);
    `);
  });
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
