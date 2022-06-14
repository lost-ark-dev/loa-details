import { app, BrowserWindow } from "electron";
import { enable } from "@electron/remote/main";
import path from "path";
import { initWindow } from "../util/window-init";
import log from "electron-log";

export function createDamageMeterWindow(logParser, appSettings) {
  let damageMeterWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"),
    show: false,
    width: 512,
    height: 200,
    minWidth: 360,
    minHeight: 124,
    frame: false,
    transparent: true,
    opacity: appSettings?.damageMeter?.design?.opacity || 0.9,
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

  damageMeterWindow.setAlwaysOnTop(true, "normal");

  // Event listeners
  logParser.eventEmitter.on("reset-state", () => {
    try {
      damageMeterWindow.webContents.send("pcap-on-reset-state", "1");
    } catch (e) {
      log.error(e);
    }
  });
  logParser.eventEmitter.on("state-change", (newState) => {
    try {
      if (typeof damageMeterWindow !== "undefined" && damageMeterWindow) {
        damageMeterWindow.webContents.send("pcap-on-state-change", newState);
      }
    } catch (e) {
      log.error(e);
    }
  });
  logParser.eventEmitter.on("message", (val) => {
    try {
      damageMeterWindow.webContents.send("pcap-on-message", val);
    } catch (e) {
      log.error(e);
    }
  });

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
    damageMeterWindow = null;
    app.quit();
  });

  damageMeterWindow.on("restore", () => {
    damageMeterWindow.webContents.send("on-restore-from-taskbar", true);
  });

  return damageMeterWindow;
}
