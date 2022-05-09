import { app, dialog, nativeTheme, ipcMain } from "electron";
import { initialize } from "@electron/remote/main";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import path from "path";
import os from "os";
const Store = require("electron-store");

import { SessionState } from "./session-state";

import { createMainWindow, createDamageMeterWindow } from "./windows";

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

initialize();
log.info("App starting...");

const sessionState = new SessionState();
log.info("Created new session state.");

const store = new Store();

let appSettings = {};
try {
  const settingsStr = store.get("settings");
  if (settingsStr) appSettings = JSON.parse(store.get("settings"));
  sessionState.dontResetOnZoneChange =
    appSettings.damageMeter.functionality.dontResetOnZoneChange;

  log.info("Found and applied settings.");
} catch (e) {
  log.info("Setting retrieval failed: " + e);
}

const { ConnectionBuilder } = require("electron-cgi");
let connection = null; // reserved for electron-cgi connection

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
    require("fs").unlinkSync(
      path.join(app.getPath("userData"), "DevTools Extensions")
    );
  }
} catch (_) {}

let mainWindow, damageMeterWindow;

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();

  try {
    if (process.env.DEBUGGING) {
      connection = new ConnectionBuilder()
        .connectTo(path.resolve(__dirname, "../../binary/LostArkLogger.exe"))
        .build();
    } else {
      connection = new ConnectionBuilder()
        .connectTo("LostArkLogger.exe")
        .build();
    }
    log.info("Started LostArkLogger.exe");
  } catch (e) {
    log.error("Error while trying to open packet capturer: " + e);

    dialog.showErrorBox(
      "Error while trying to open packet capturer",
      "Error: " + e.message
    );

    log.info("Exiting app...");
    app.exit();
  }

  connection.on("message", (value) => sessionState.onMessage(value));
  connection.on("new-zone", (value) => sessionState.onNewZone(value));
  connection.on("combat-event", (value) => sessionState.onCombatEvent(value));
  connection.onDisconnect = () => {
    log.error(
      "The connection to the Lost Ark Packet Capture was lost for some reason. Exiting app..."
    );

    dialog.showErrorBox(
      "Error",
      "The connection to the Lost Ark Packet Capture was lost for some reason. Exiting app..."
    );

    log.info("Exiting app...");
    app.exit();
  };

  mainWindow = createMainWindow(mainWindow);
  damageMeterWindow = createDamageMeterWindow(
    damageMeterWindow,
    store,
    sessionState
  );
});

let damageMeterWindowOldSize, damageMeterWindowOldMinimumSize;

ipcMain.on("window-to-main", (event, arg) => {
  if (arg.message === "reset-session") {
    sessionState.resetState();
  } else if (arg.message === "cancel-reset-session") {
    if (sessionState.resetTimer) {
      sessionState.cancelReset();
    }
  } else if (arg.message === "toggle-damage-meter-minimized-state") {
    if (arg.value) {
      let newW = 150,
        newY = 64;

      damageMeterWindowOldSize = damageMeterWindow.getSize();
      damageMeterWindowOldMinimumSize = damageMeterWindow.getMinimumSize();

      damageMeterWindow.setMinimumSize(newW, newY);
      damageMeterWindow.setSize(newW, newY);
      damageMeterWindow.setResizable(false);
    } else {
      damageMeterWindow.setMinimumSize(
        damageMeterWindowOldMinimumSize[0],
        damageMeterWindowOldMinimumSize[1]
      );
      damageMeterWindow.setSize(
        damageMeterWindowOldSize[0],
        damageMeterWindowOldSize[1]
      );
      damageMeterWindow.setResizable(true);
    }
  } else if (arg.message === "save-settings") {
    appSettings = JSON.parse(arg.value);
    store.set("settings", arg.value);
    damageMeterWindow.webContents.send("on-settings-change", appSettings);
    sessionState.dontResetOnZoneChange =
      appSettings.damageMeter.functionality.dontResetOnZoneChange;
  } else if (arg.message === "get-settings") {
    event.reply("on-settings-change", appSettings);
  } else if (arg.message === "minimize-main-window") {
    mainWindow.minimize();
  }
});

app.on("window-all-closed", () => {
  log.info("Window-all-closed fired");
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  log.info("activate fired");
  if (mainWindow === null) {
    createMainWindow(mainWindow);
  }
});
