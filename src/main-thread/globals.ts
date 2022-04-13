import { BrowserWindow, app, Tray } from "electron";
import ad4m from "@perspect3vism/ad4m-executor";
import path from "path";
import os from "os";

export class MainThreadGlobal {
  mainWindow?: BrowserWindow;
  splashWindow?: BrowserWindow;
  tray?: Tray;
  ad4mCore?: ad4m.PerspectivismCore;
  isQuiting: boolean;
  seedPath: string;
  binaryExecPath: string;
  iconPath: string;

  constructor() {
    let iconPath;
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      iconPath = `${process.env.PWD}/public/img/icons/icon.png`;
    } else {
      iconPath = `${__dirname}/img/icons/icon.png`;
    }

    let seedPath;
    let binaryExecPath;
    if (app.isPackaged) {
      //Set languages path
      seedPath = path.resolve(
        `${process.resourcesPath}/../resources/packaged-resources/seed/mainnetSeed.json`
      );
      //Set binary path
      binaryExecPath = path.resolve(
        `${process.resourcesPath}/../resources/packaged-resources/bin`
      );
    } else {
      seedPath = path.resolve(`${__dirname}/../ad4m/mainnetSeed.json`);
      binaryExecPath = path.resolve(
        `${__dirname}/../resources/${os.platform}/`
      );
    }

    return {
      isQuiting: false,
      iconPath,
      seedPath,
      binaryExecPath,
    } as MainThreadGlobal;
  }
}
