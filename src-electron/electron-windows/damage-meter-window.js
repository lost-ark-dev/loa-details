import { app, BrowserWindow } from "electron";
import { enable } from "@electron/remote/main";
import path from "path";
import { initWindow } from "../util/window-init";

export function createDamageMeterWindow(sessionState) {
  let damageMeterWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"),
    show: false,
    width: 512,
    height: 200,
    minWidth: 360,
    minHeight: 124,
    frame: false,
    transparent: true,
    resizable: true,
    autoHideMenuBar: true,
    fullscreenable: false,
    alwaysOnTop: true,
    useContentSize: true,
    webPreferences: {
      devTools: process.env.DEBUGGING,
      contextIsolation: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  enable(damageMeterWindow.webContents);
  damageMeterWindow.loadURL(process.env.APP_URL + "#/damage-meter").then(() => {
    damageMeterWindow.show();

    initWindow(damageMeterWindow, "damage_meter");
  });
  damageMeterWindow.setAlwaysOnTop(true, "level");

  // Event listeners
  sessionState.addEventListenerWindow("message", damageMeterWindow);
  sessionState.addEventListenerWindow("stateChange", damageMeterWindow);
  sessionState.addEventListenerWindow("resetState", damageMeterWindow);

  if (process.env.DEBUGGING) {
    damageMeterWindow.webContents.openDevTools();
  } else {
    damageMeterWindow.webContents.on("devtools-opened", () => {
      damageMeterWindow.webContents.closeDevTools();
    });
  }

  damageMeterWindow.on("focus", () => {
    damageMeterWindow.setIgnoreMouseEvents(false);
  });

  damageMeterWindow.on("closed", () => {
    app.quit();
  });

  return damageMeterWindow;
}
