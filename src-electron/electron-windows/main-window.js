import { app, BrowserWindow } from "electron";
import { enable } from "@electron/remote/main";
import path from "path";
import { initWindow } from "../util/window-init";

export function createMainWindow(appSettings) {
  let mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    show: false,
    width: 974,
    height: 614,
    minWidth: 974,
    minHeight: 614,
    frame: false,
    //transparent: true,
    roundedCorners: false,
    hasShadow: true,
    autoHideMenuBar: true,
    resizable: true,
    useContentSize: true,
    webPreferences: {
      devTools: process.env.DEBUGGING,
      contextIsolation: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  let startHidden = false;
  if (appSettings?.general?.startMainHidden) startHidden = true;

  let startMinimized = false;
  if (appSettings?.general?.startMainMinimized) startMinimized = true;

  enable(mainWindow.webContents);
  mainWindow.loadURL(process.env.APP_URL + "#/").then(() => {
    if (!startHidden) mainWindow.show();
    if (startMinimized) mainWindow.minimize();

    initWindow(mainWindow, "main");
  });

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
  });

  return mainWindow;
}
