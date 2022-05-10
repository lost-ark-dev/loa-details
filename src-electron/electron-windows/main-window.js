import { app, BrowserWindow } from "electron";
import { enable } from "@electron/remote/main";
import path from "path";

export function createMainWindow(mainWindow) {
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    width: 740,
    height: 600,
    frame: false,
    autoHideMenuBar: true,
    useContentSize: true,
    webPreferences: {
      devTools: process.env.DEBUGGING,
      contextIsolation: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  enable(mainWindow.webContents);
  mainWindow.loadURL(process.env.APP_URL);

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
