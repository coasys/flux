"use strict";

import { app, protocol, BrowserWindow, ipcMain, Tray, Menu } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension from "electron-devtools-installer";
import ad4m from "@perspect3vism/ad4m-executor";
import path from "path";
import os from "os";
import util from "util";
import fs from "fs";
import { autoUpdater } from "electron-updater";

let win: BrowserWindow;
let splash: BrowserWindow;
let Core: ad4m.PerspectivismCore;
let builtInLangPath: string;
let execPath: string;
let env;
let tray: Tray;
let isQuiting: boolean;

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

if (app.isPackaged) {
  console.log("App is running in production mode");
  //TODO: this code is probably somewhat broken
  builtInLangPath = path.resolve(
    `${process.resourcesPath}/../resources/packaged-resources/languages`
  );
  execPath = path.resolve(
    `${process.resourcesPath}/../resources/packaged-resources/bin`
  );
  env = "";
  const log_file = fs.createWriteStream(
    path.join(app.getPath("logs"), "debug.log"),
    {
      flags: "w",
    }
  );
  const log_stdout = process.stdout;

  console.log = function (...args: any) {
    args.forEach((arg: any) => {
      log_file.write(util.format(arg) + "\n");
      log_stdout.write(util.format(arg) + "\n");
    });
  };
} else {
  console.log("App is running in dev mode");
  builtInLangPath = path.resolve(`${__dirname}/../ad4m/languages`);
  execPath = path.resolve(`${__dirname}/../resources/${os.platform}/`);
  env = "dev";

  if (!fs.existsSync(path.join(app.getPath("userData"), env))) {
    fs.mkdirSync(path.join(app.getPath("userData"), env));
  }

  if (!fs.existsSync(path.join(app.getPath("appData"), env))) {
    fs.mkdirSync(path.join(app.getPath("appData"), env));
  }

  app.setPath("userData", path.join(app.getPath("userData"), env));
  app.setPath("appData", path.join(app.getPath("appData"), env));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  splash = createSplashScreen();

  autoUpdater.autoDownload = false;

  if (!isDevelopment) {
    autoUpdater.checkForUpdates();
  }

  splash.on("ready-to-show", async () => {
    splash.show();

    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      try {
        await installExtension({
          id: "ljjemllljcmogpfapbkkighbhhppjdbg",
          electron: ">=1.2.1",
        });
      } catch (e) {
        console.error("Vue Devtools failed to install:", e.toString());
      }
    }

    console.log(
      "\x1b[1m",
      "UserData path",
      app.getPath("userData"),
      "AppData path",
      app.getPath("appData"),
      "Using Resource path",
      execPath,
      "built in language path",
      builtInLangPath
    );

    console.log("\x1b[36m%s\x1b[0m", "Init AD4M...");
    ad4m
      .init({
        appDataPath: app.getPath("userData"),
        resourcePath: execPath,
        appDefaultLangPath: builtInLangPath,
        ad4mBootstrapLanguages: {
          agents: "profiles",
          languages: "languages",
          perspectives: "shared-perspectives",
        },
        ad4mBootstrapFixtures: {
          languages: [],
          perspectives: [],
        },
        appBuiltInLangs: ["social-context"],
        appLangAliases: null,
        mocks: false,
      })
      .then((ad4mCore: ad4m.PerspectivismCore) => {
        Core = ad4mCore;
        console.log(
          "\x1b[36m%s\x1b[0m",
          "Starting account creation splash screen"
        );

        createWindow();

        Core.waitForAgent().then(async () => {
          win.webContents.send("setGlobalLoading", true);
          console.log(
            "\x1b[36m%s\x1b[0m",
            "Agent has been init'd. Controllers now starting init..."
          );
          Core.initControllers();
          await Core.initLanguages();
          win.webContents.send("setGlobalLoading", false);
          console.log("\x1b[32m", "Controllers init complete!");
        });
      })
      .catch(async (err) => {
        console.error("Ad4m init error:", err);
        if (win) {
          win.webContents.send("setGlobalLoading", false);
          win.webContents.send("globalError", { show: true, message: err });
        } else {
          await createWindow();
          //@ts-ignore
          win.webContents.send("setGlobalLoading", false);
          //@ts-ignore
          win.webContents.send("globalError", { show: true, message: err });
        }
      });
  });
});

function createSplashScreen() {
  const win = new BrowserWindow({
    height: 600,
    width: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false,
    },
    minimizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    show: false,
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(`file://${process.env.PWD}/public/loading.html`);
  } else {
    win.loadURL(`file://${__dirname}/loading.html`);
  }

  return win;
}

async function createWindow() {
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    tray = new Tray(`${process.env.PWD}/public/img/icons/junto_web_logo--rainbow.png`);
  } else {
    tray = new Tray(`${__dirname}/public/img/icons/junto_web_logo--rainbow.png`);
  }

  tray.setContextMenu(Menu.buildFromTemplate([{
    label: 'Quit',
    click: () => {
      isQuiting = true;
      app.quit();
    }
  }]));

  tray.on('click', () => {
    win.show();
  })

  // Create the browser window.
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
    titleBarStyle: "hidden",
    show: false,
  });

  win.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });
  
  win.on("minimize", () => {
    win.webContents.send("windowState", "minimize");
  });

  win.on("restore", () => {
    win.webContents.send("windowState", "visible");
  });

  win.on("focus", () => {
    win.webContents.send("windowState", "visible");
  });

  win.on("blur", () => {
    win.webContents.send("windowState", "foreground");
  });

  win.removeMenu();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL(`file://${__dirname}/index.html`);
  }

  win.show();
  splash.destroy();
}

// IPC communication

ipcMain.on("ping", () => {
  win.webContents.send("pong", "Hello from main thread!");
});

ipcMain.on("restoreWindow", () => {
  if (win.isMinimized()) {
    win.restore();
  }

  if (!win.isFocused()) {
    win.focus();
  }
});

ipcMain.on("getLangPath", () => {
  win.webContents.send("getLangPathResponse", builtInLangPath);
});

ipcMain.on("cleanState", () => {
  const path = app.getPath("userData");

  fs.rmdirSync(path, { recursive: true });

  win.webContents.send("getCleanState");
});

ipcMain.on("quitApp", async () => {
  await Core.exit();
  app.quit();
});

// App hooks

// Quit when all windows are closed.
app.on("window-all-closed", async () => {
  console.log("Got window-all-closed signal");
  await Core.exit();
  app.quit();
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform !== "darwin") {
  //}
});

// Quit when all windows are closed.
app.on("will-quit", async () => {
  console.log("Got quit quit signal");
  await Core.exit();
  app.quit();
});

app.on('before-quit', async () => {
  isQuiting = true;
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Update code

ipcMain.on("check-update", () => {
  if (!isDevelopment) {
    autoUpdater.checkForUpdates();
  } else {
    win.webContents.send("update_not_available");
  }
});

autoUpdater.on("update-available", () => {
  win.webContents.send("update_available");
});

autoUpdater.on("update-not-available", () => {
  win.webContents.send("update_not_available");
});

ipcMain.on("download-update", () => {
  autoUpdater.downloadUpdate();
});

autoUpdater.on("update-downloaded", () => {
  win.webContents.send("update_downloaded");
});

ipcMain.on("quit-and-install", () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on("download-progress", (info) => {
  win.webContents.send("download_progress", info);
});

autoUpdater.on("error", () => {
  win.webContents.send("update_not_available");
});
