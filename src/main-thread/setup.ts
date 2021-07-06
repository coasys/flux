import { app } from "electron";
import path from "path";
import util from "util";
import fs from "fs";

export function setup(): void {
  if (app.isPackaged) {
    console.log("App is running in production mode");

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
  } else {
    console.log("App is running in dev mode");

    // Exit cleanly on request from parent process in development mode.
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
    app.setPath("appData", path.join(app.getPath("appData"), "dev"));
  }
}
