import { app, dialog, nativeTheme, ipcMain } from "electron";
import { initialize } from "@electron/remote/main";
import { autoUpdater } from "electron-updater";
import { ConnectionBuilder } from "electron-cgi";
import log from "electron-log";
import path from "path";
import os from "os";

import {
  createPrelauncherWindow,
  createMainWindow,
  createDamageMeterWindow,
} from "./electron-windows";

import { getSettings, saveSettings } from "./util/app-settings";
import { SessionState } from "./session-state";

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

initialize();

const sessionState = new SessionState();

let appSettings = getSettings();
sessionState.dontResetOnZoneChange =
  appSettings?.damageMeter?.functionality?.dontResetOnZoneChange;
appSettings.appVersion = app.getVersion();

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

let prelauncherWindow, mainWindow, damageMeterWindow;

function prelauncherMessage(value) {
  log.info(value);
  prelauncherWindow.webContents.send("prelauncher-message", value);
}

app.whenReady().then(() => {
  // Don't create prelauncher if debugging
  if (!process.env.DEBUGGING) {
    prelauncherWindow = createPrelauncherWindow(prelauncherWindow);
    prelauncherWindow.on("show", () => {
      autoUpdater.checkForUpdates();
    });
  } else {
    startApplication();
  }
});

autoUpdater.on("checking-for-update", () => {
  prelauncherMessage("Checking for updates...");
});
autoUpdater.on("update-available", (info) => {
  prelauncherMessage("Found a new update! Starting download...");
});
autoUpdater.on("update-not-available", (info) => {
  prelauncherMessage("Starting LOA Details!");

  startApplication();

  prelauncherWindow.close();
  prelauncherWindow = null;
});
autoUpdater.on("error", (err) => {
  prelauncherMessage("Error during update: " + err);
});
autoUpdater.on("download-progress", (progressObj) => {
  prelauncherMessage(
    `Downloading new update (${progressObj.percent.toFixed(0)}%)`
  );
});
autoUpdater.on("update-downloaded", (info) => {
  prelauncherMessage("Starting updater...");
  autoUpdater.quitAndInstall(false, true); // isSilent=false, forceRunAfter=true
});

function startApplication() {
  try {
    const params = appSettings?.general?.useWinpcap ? "useWinpcap" : "";

    if (process.env.DEBUGGING) {
      connection = new ConnectionBuilder()
        .connectTo(
          path.resolve(__dirname, "../../binary/LostArkLogger.exe"),
          params
        )
        .build();
    } else {
      connection = new ConnectionBuilder()
        .connectTo("LostArkLogger.exe", params)
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
  damageMeterWindow = createDamageMeterWindow(damageMeterWindow, sessionState);
}

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
    saveSettings(arg.value);
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
