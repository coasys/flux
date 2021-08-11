import { app, BrowserWindow } from "electron";
import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import ad4m from "@perspect3vism/ad4m-executor";
import { autoUpdater } from "electron-updater";
import { MainThreadGlobal } from "./globals";
import { createMainWindow, createSplashScreen } from "./createUI";

export function registerAppHooks(mainThreadState: MainThreadGlobal): void {
  // This method is called if a second instance of the application is started
  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainThreadState.mainWindow) {
      if (mainThreadState.mainWindow.isMinimized())
        mainThreadState.mainWindow.restore();
      mainThreadState.mainWindow.show();
      mainThreadState.mainWindow.focus();
      if (process.platform === "darwin") {
        app.dock.show();
      }
    } else if (mainThreadState.splashWindow) {
      if (mainThreadState.splashWindow.isMinimized())
        mainThreadState.splashWindow.restore();
      mainThreadState.splashWindow.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on("ready", async () => {
    createSplashScreen(mainThreadState);

    autoUpdater.autoDownload = false;

    mainThreadState.splashWindow!.on("ready-to-show", async () => {
      mainThreadState.splashWindow!.show();

      if (!app.isPackaged && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
          await installExtension(VUEJS3_DEVTOOLS);
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
        mainThreadState.binaryExecPath,
        "built in language path",
        mainThreadState.builtInLangPath
      );

      console.log("\x1b[36m%s\x1b[0m", "Init AD4M...", app.getPath("userData"));
      ad4m
        .init({
          appDataPath: app.getPath("userData"),
          resourcePath: mainThreadState.binaryExecPath,
          appDefaultLangPath: mainThreadState.builtInLangPath,
          ad4mBootstrapLanguages: {
            agents: "agent-expression-store",
            languages: "languages",
            neighbourhoods: "neighbourhood-store",
          },
          ad4mBootstrapFixtures: {
            languages: [],
            neighbourhoods: [],
          },
          appBuiltInLangs: [],
          appLangAliases: null,
          mocks: false,
        })
        .then(async (ad4mCore: ad4m.PerspectivismCore) => {
          mainThreadState.ad4mCore = ad4mCore;
          console.log("\x1b[36m%s\x1b[0m", "Starting main UI window");

          await createMainWindow(mainThreadState);

          mainThreadState.ad4mCore.waitForAgent().then(async () => {
            console.log(
              "\x1b[36m%s\x1b[0m",
              "Agent has been init'd. Controllers now starting init..."
            );
            mainThreadState.mainWindow!.webContents.send(
              "setGlobalLoading",
              true
            );
            mainThreadState.ad4mCore.initControllers();
            await mainThreadState.ad4mCore.initLanguages();
            mainThreadState.mainWindow!.webContents.send(
              "setGlobalLoading",
              false
            );
            console.log("\x1b[32m", "Controllers init complete!");

            //Check for updates
            if (app.isPackaged) {
              autoUpdater.checkForUpdates();
            }
          });
        })
        .catch(async (err) => {
          console.error("Ad4m init error:", err);
          if (mainThreadState.mainWindow) {
            mainThreadState.mainWindow!.webContents.send(
              "setGlobalLoading",
              false
            );
            mainThreadState.mainWindow!.webContents.send("globalError", {
              show: true,
              message: err,
            });
          } else {
            await createMainWindow(mainThreadState);
            mainThreadState.mainWindow!.webContents.send(
              "setGlobalLoading",
              false
            );
            mainThreadState.mainWindow!.webContents.send("globalError", {
              show: true,
              message: err,
            });
          }
        });
    });
  });

  // Quit when all windows are closed.
  app.on("window-all-closed", async () => {
    console.log("Got window-all-closed signal");
    if (mainThreadState.ad4mCore) {
      await mainThreadState.ad4mCore.exit();
    }
    app.quit();
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    //if (process.platform !== "darwin") {
    //}
  });

  // Quit when all windows are closed.
  app.on("will-quit", async () => {
    console.log("Got will-quit signal");
    app.quit();
  });

  app.on("before-quit", async () => {
    mainThreadState.isQuiting = true;

    mainThreadState.mainWindow!.webContents.send("unlockedStateOff");
  });

  app.on("activate", async () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)
      await createMainWindow(mainThreadState);
  });
}
