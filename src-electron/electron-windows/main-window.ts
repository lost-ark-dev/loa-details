import { app, BrowserWindow } from "electron";
import path from "path";
import { store } from "../util/store";
import { initWindow } from "../util/window-init";

export function createMainWindow() {
  let mainWindow: BrowserWindow | null = new BrowserWindow({
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
  if (store.get("general").startMainHidden) startHidden = true;

  let startMinimized = false;
  if (store.get("general")?.startMainMinimized) startMinimized = true;

  mainWindow.loadURL(process.env.APP_URL + "#/").then(() => {
    if (!mainWindow) return;
    if (process.env.DEBUGGING) {
      // if on DEV or Production with debug enabled
      mainWindow.webContents.openDevTools();
    } else {
      // we're on production; no access to devtools pls
      mainWindow.webContents.on("devtools-opened", () => {
        mainWindow?.webContents.closeDevTools();
      });
    }
    if (!startHidden) mainWindow.show();
    if (startMinimized) mainWindow.minimize();

    initWindow(mainWindow, "main");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
  });

  return mainWindow;
}
