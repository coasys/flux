import { app, BrowserWindow, Tray, Menu, shell } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import path from "path";
import { MainThreadGlobal } from "./globals";

export async function createMainWindow(
  mainThreadState: MainThreadGlobal
): Promise<void> {
  createTray(mainThreadState);

  // Create the browser window.
  mainThreadState.mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 850,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
    titleBarStyle: "hidden",
    show: false,
    icon: mainThreadState.iconPath!,
  });

  // Open external links in browser instead of inside the electron app
  mainThreadState.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainThreadState.mainWindow.on("close", (event) => {
    if (!mainThreadState.isQuiting) {
      event.preventDefault();
      mainThreadState.mainWindow!.hide();
      if (process.platform === "darwin") {
        app.dock.hide();
      }
    }
  });

  // mainThreadState.mainWindow.removeMenu();

  mainThreadState.mainWindow.on("minimize", () => {
    mainThreadState.mainWindow!.webContents.send("windowState", "minimize");
  });

  mainThreadState.mainWindow.on("restore", () => {
    mainThreadState.mainWindow!.webContents.send("windowState", "visible");
  });

  mainThreadState.mainWindow.on("focus", () => {
    mainThreadState.mainWindow!.webContents.send("windowState", "visible");
  });

  mainThreadState.mainWindow.on("blur", () => {
    mainThreadState.mainWindow!.webContents.send("windowState", "foreground");
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainThreadState.mainWindow.loadURL(
      process.env.WEBPACK_DEV_SERVER_URL as string
    );
    if (!process.env.IS_TEST)
      mainThreadState.mainWindow.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    await mainThreadState.mainWindow.loadURL(`file://${__dirname}/index.html`);
  }

  mainThreadState.mainWindow.show();
  mainThreadState.splashWindow!.destroy();
}

export function createSplashScreen(mainThreadState: MainThreadGlobal): void {
  mainThreadState.splashWindow = new BrowserWindow({
    height: 600,
    width: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
    minimizable: false,
    alwaysOnTop: false,
    frame: false,
    transparent: true,
    show: false,
    icon: mainThreadState.iconPath!,
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    mainThreadState.splashWindow!.loadURL(
      `file://${process.env.PWD}/public/loading.html`
    );
  } else {
    mainThreadState.splashWindow!.loadURL(`file://${__dirname}/loading.html`);
  }
}

function createTray(mainThreadState: MainThreadGlobal): void {
  if (app.isPackaged) {
    mainThreadState.tray = new Tray(
      `${__dirname}/img/icons/favicon-32x32-Template@2x.png`
    );
  } else {
    mainThreadState.tray = new Tray(
      `${process.env.PWD}/public/img/icons/favicon-32x32-Template@2x.png`
    );
  }

  mainThreadState.tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open",
        click: async () => {
          mainThreadState.mainWindow!.show();
          if (process.platform === "darwin") {
            app.dock.show();
          }
        },
      },
      {
        label: "Quit",
        click: async () => {
          mainThreadState.isQuiting = true;
          if (mainThreadState.ad4mCore) {
            await mainThreadState.ad4mCore!.exit();
          }
          app.quit();
        },
      },
    ])
  );

  mainThreadState.tray.on("click", () => {
    mainThreadState.mainWindow!.show();
  });
}
