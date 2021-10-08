import { app } from "electron";
import path from "path";
import util from "util";
import fs from "fs";
import { MainThreadGlobal } from "./globals";

export function setup(mainThreadState: MainThreadGlobal): void {
  if (process.platform === "win32") {
    process.on("message", async (data) => {
      if (data === "graceful-exit") {
        console.warn("GRACEFUL-EXIT MESSAGE");
        await mainThreadState.ad4mCore!.exit();
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", async () => {
      console.warn("SIGTERM SIGNAL");
      await mainThreadState.ad4mCore?.exit();
      mainThreadState.ad4mCore = undefined;
      app.quit();
    });
    process.on("SIGINT", async () => {
      console.warn("SIGINT SIGNAL");
      await mainThreadState.ad4mCore?.exit();
      mainThreadState.ad4mCore = undefined;
      app.quit();
    });
  }

  if (app.isPackaged) {
    console.log(
      "\x1b[1m",
      "App is running in production mode",
      "\x1b[0m",
      "\n"
    );

    //Get the log file and redirect console logs to it
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
    console.error = function (...args: any) {
      args.forEach((arg: any) => {
        log_file.write(util.format(arg) + "\n");
        log_stdout.write(util.format(arg) + "\n");
      });
    };
    console.warn = function (...args: any) {
      args.forEach((arg: any) => {
        log_file.write(util.format(arg) + "\n");
        log_stdout.write(util.format(arg) + "\n");
      });
    };
    console.debug = function (...args: any) {
      args.forEach((arg: any) => {
        log_file.write(util.format(arg) + "\n");
        log_stdout.write(util.format(arg) + "\n");
      });
    };
  } else {
    console.log("\x1b[1m", "App is running in dev mode", "\x1b[0m", "\n");

    //Create dev directory in normal userData directory
    if (!fs.existsSync(path.join(app.getPath("userData"), "dev"))) {
      fs.mkdirSync(path.join(app.getPath("userData"), "dev"));
    }

    //Create dev data directory in normal appData directory
    if (!fs.existsSync(path.join(app.getPath("appData"), "dev"))) {
      fs.mkdirSync(path.join(app.getPath("appData"), "dev"));
    }

    //Set the app paths to the new dev directory
    app.setPath("userData", path.join(app.getPath("userData"), "dev"));
    app.setPath("appData", path.join(app.getPath("appData"), "junto", "dev"));
  }
  const repoLockPath = path.join(app.getPath("appData"), ".jsipfs/repo.lock");
  console.debug("repo lock path", repoLockPath);
  if (fs.existsSync(repoLockPath)) {
    console.log("\x1b[31m", "\n\nFound repo.lock, deleting!");
    fs.rmSync(repoLockPath);
  }
}
