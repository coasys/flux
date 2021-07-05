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
  builtInLangPath: string;
  binaryExecPath: string;
  iconPath: string;

  constructor() {
    let iconPath;
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      iconPath = `${process.env.PWD}/public/img/icons/favicon-32x32.png`;
    } else {
      iconPath = `${__dirname}/img/icons/favicon-32x32.png`;
    }

    let builtInLangPath;
    let binaryExecPath;
    if (app.isPackaged) {
      //Set languages path
      builtInLangPath = path.resolve(
        `${process.resourcesPath}/../resources/packaged-resources/languages`
      );
      //Set binary path
      binaryExecPath = path.resolve(
        `${process.resourcesPath}/../resources/packaged-resources/bin`
      );
    } else {
      builtInLangPath = path.resolve(`${__dirname}/../ad4m/languages`);
      binaryExecPath = path.resolve(
        `${__dirname}/../resources/${os.platform}/`
      );
    }

    return {
      isQuiting: false,
      iconPath,
      builtInLangPath,
      binaryExecPath,
    } as MainThreadGlobal;
  }
}
