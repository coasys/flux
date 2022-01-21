import { app, BrowserWindow } from "electron";
import fs from "fs";
import path from "path";
import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import ad4m from "@perspect3vism/ad4m-executor";
import { autoUpdater } from "electron-updater";
import { MainThreadGlobal } from "./globals";
import { createMainWindow, createSplashScreen } from "./createUI";

export function registerAppHooks(mainThreadState: MainThreadGlobal): void {
  if (!fs.existsSync(path.join(app.getPath("userData"), "dontDelete-0.2.13"))) {
    console.warn(
      "Did not find dontDelete-0.2.13 deleting ad4m and Local Storage directories"
    );
    const ad4mPath = path.join(app.getPath("userData"), "ad4m");
    if (fs.existsSync(ad4mPath)) fs.rmSync(ad4mPath, { recursive: true });

    const localStoragePath = path.join(
      app.getPath("userData"),
      "Local Storage"
    );
    if (fs.existsSync(localStoragePath))
      fs.rmSync(localStoragePath, { recursive: true });

    fs.mkdirSync(path.join(app.getPath("userData"), "dontDelete-0.2.13"));
  } else {
    console.warn("Found dontDelete-0.2.13, skipping deletion of config");
  }

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
        "\nAppData path",
        app.getPath("appData"),
        "\nLog path",
        app.getPath("logs"),
        "\nUsing Resource path",
        mainThreadState.binaryExecPath,
        "\nbuilt in language path\n",
        mainThreadState.builtInLangPath
      );

      console.log("\x1b[36m%s\x1b[0m", "Init AD4M...\n");
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
            languages: [
              {
                address: "QmR1dV5KuAQtYG98qqmYEvHXfxJZ3jKyjf7SFMriCMfHVQ",
                meta: {
                  author:
                    "did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n",
                  timestamp: "2021-10-07T21:39:36.607Z",
                  data: {
                    name: "Direct Message Language",
                    address: "QmR1dV5KuAQtYG98qqmYEvHXfxJZ3jKyjf7SFMriCMfHVQ",
                    description:
                      "Template source for personal, per-agent DM languages. Holochain based.",
                    possibleTemplateParams: [
                      "recipient_did",
                      "recipient_hc_agent_pubkey",
                    ],
                    sourceCodeLink:
                      "https://github.com/perspect3vism/direct-message-language",
                  },
                  proof: {
                    signature:
                      "e933e34f88694816ea91361605c8c2553ceeb96e847f8c73b75477cc7d9bacaf11eae34e38c2e3f474897f59d20f5843d6f1d2c493b13552093bc16472b0ac33",
                    key: "#zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n",
                    valid: true,
                  },
                },
                bundle: fs
                  .readFileSync(
                    path.join(
                      mainThreadState.builtInLangPath,
                      "direct-message-language",
                      "build",
                      "bundle.js"
                    )
                  )
                  .toString(),
              },
            ],
            neighbourhoods: [],
            perspectives: []
          },
          appBuiltInLangs: ["direct-message-language", "lang-note-ipfs"],
          appLangAliases: null,
          mocks: false,
          // @ts-ignore
          runDappServer: true,
        })
        .then(async (ad4mCore: ad4m.PerspectivismCore) => {
          mainThreadState.ad4mCore = ad4mCore;
          const isAlreadySignedUp = ad4mCore.agentService.isInitialized();
          console.log("\x1b[36m%s\x1b[0m", "Starting main UI window\n\n");

          await createMainWindow(mainThreadState);

          mainThreadState.ad4mCore.waitForAgent().then(async () => {
            console.log(
              "\x1b[36m%s\x1b[0m",
              "Agent has been init'd. Controllers now starting init...\n\n"
            );
            //Show loading screen whilst ad4m controllers and languages start
            mainThreadState.mainWindow!.webContents.send(
              "setGlobalLoading",
              true
            );
            mainThreadState.ad4mCore.initControllers();
            await mainThreadState.ad4mCore.initLanguages();
            //Stop loading screen
            mainThreadState.mainWindow!.webContents.send(
              "setGlobalLoading",
              false
            );
            //Tell the UI that agent has been created/logged in
            mainThreadState.mainWindow!.webContents.send(
              "ad4mAgentInit",
              isAlreadySignedUp
            );

            console.log("\x1b[32m", "\n\nControllers init complete!\n\n");

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
    console.warn("window-all-closed SIGNAL");
    if (mainThreadState.ad4mCore) {
      await mainThreadState.ad4mCore.exit();
      mainThreadState.ad4mCore = undefined;
    }
    app.quit();
  });

  // Quit when all windows are closed.
  app.on("will-quit", () => {
    console.warn("will-quit SIGNAL");
    app.quit();
  });

  app.on("before-quit", async () => {
    console.warn("before-quit SIGNAL");
    mainThreadState.isQuiting = true;

    mainThreadState.mainWindow!.webContents.send("unlockedStateOff");

    mainThreadState.mainWindow!.webContents.send("clearMessages");

    if (mainThreadState.ad4mCore) {
      await mainThreadState.ad4mCore.exit();
      mainThreadState.ad4mCore = undefined;
    }
  });

  app.on("activate", async () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)
      await createMainWindow(mainThreadState);
  });
}
