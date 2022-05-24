import {
  app,
  dialog,
  nativeTheme,
  ipcMain,
  Menu,
  Tray,
  Notification,
  shell,
} from "electron";
import { initialize } from "@electron/remote/main";
import { autoUpdater } from "electron-updater";
import { setupBridge, httpServerEventEmitter } from "./packet-capture-bridge";

import log from "electron-log";
import path from "path";
import os from "os";
import Store from "electron-store";

import {
  createPrelauncherWindow,
  createMainWindow,
  createDamageMeterWindow,
} from "./electron-windows";

import { getSettings, saveSettings } from "./util/app-settings";
import { SessionState } from "./session-state";
import { parseLogs, getParsedLogs, getLogData } from "./log-files/helper";

const store = new Store();

let prelauncherWindow, mainWindow, damageMeterWindow;
let tray = null;
let isQuiting;

const appLockKey = { myKey: "loa-details" };
const gotTheLock = app.requestSingleInstanceLock(appLockKey);
if (!gotTheLock) {
  app.quit();
} else {
  // set up a listener for "second-instance", this will fire if a second instance is requested
  // second instance won't get the lock and it will quit itself, we can also focus on our window
  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

initialize();

const sessionState = new SessionState();

let appSettings = getSettings();
sessionState.dontResetOnZoneChange =
  appSettings?.damageMeter?.functionality?.dontResetOnZoneChange;
appSettings.appVersion = app.getVersion();

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();
try {
  if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
    require("fs").unlinkSync(
      path.join(app.getPath("userData"), "DevTools Extensions")
    );
  }
} catch (_) {}

function updaterMessage(value) {
  log.info(value);

  if (typeof prelauncherWindow != "undefined") {
    prelauncherWindow.webContents.send("updater-message", value);
  } else if (typeof mainWindow != "undefined") {
    mainWindow.webContents.send("updater-message", value);
  }
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
  updaterMessage("Checking for updates...");
});
autoUpdater.on("update-available", (info) => {
  updaterMessage("Found a new update! Starting download...");
});
autoUpdater.on("update-not-available", (info) => {
  updaterMessage("Starting LOA Details!");

  if (typeof mainWindow == "undefined") {
    startApplication();

    prelauncherWindow.close();
    prelauncherWindow = null;
  }
});
autoUpdater.on("error", (err) => {
  updaterMessage("Error during update: " + err);
});
autoUpdater.on("download-progress", (progressObj) => {
  updaterMessage(`Downloading new update (${progressObj.percent.toFixed(0)}%)`);
});
autoUpdater.on("update-downloaded", (info) => {
  updaterMessage("Starting updater...");

  // only apply update with prelauncher, not after manual update checking
  if (typeof prelauncherWindow != "undefined")
    autoUpdater.quitAndInstall(false, true); // isSilent=false, forceRunAfter=true
});

function startApplication() {
  tray = new Tray(
    process.env.DEBUGGING
      ? path.resolve(__dirname, "../../src-electron/icons/icon.png")
      : path.resolve(__dirname, "icons/icon.png")
  );
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show LOA Details",
      click() {
        mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      },
    },
    {
      label: "Quit",
      click() {
        isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("LOA Details");
  tray.setContextMenu(contextMenu);

  setupBridge(appSettings);

  httpServerEventEmitter.on("message", (value) =>
    sessionState.onMessage(value)
  );
  httpServerEventEmitter.on("new-zone", (value) =>
    sessionState.onNewZone(value)
  );
  httpServerEventEmitter.on("combat-event", (value) =>
    sessionState.onCombatEvent(value)
  );
  httpServerEventEmitter.on("debug", (data) => {
    log.info("debug:", data);
  });

  const dontShowPatreonBox = store.get("dont_show_patreon_box");
  if (!dontShowPatreonBox) {
    const userSelection = dialog.showMessageBoxSync(mainWindow, {
      type: "info",
      title: "Support LOA Details",
      message: "Would you like to support this project by donating on Patreon?",
      buttons: ["No", "Yes"],
      defaultId: 0,
      cancelId: 0,
    });

    if (userSelection === 1) {
      shell.openExternal("https://www.patreon.com/loadetails");
    }

    store.set("dont_show_patreon_box", "true");
  }

  mainWindow = createMainWindow(mainWindow, appSettings);
  damageMeterWindow = createDamageMeterWindow(damageMeterWindow, sessionState);

  mainWindow.on("close", function (event) {
    let hideToTray = true; // this is on by default
    if (appSettings?.general?.closeToSystemTray === false) hideToTray = false;

    if (!isQuiting && hideToTray) {
      event.preventDefault();
      mainWindow.hide();

      new Notification({
        title: "LOA Details",
        body: "Main window is hidden to system tray. Right click the icon to restore main window.",
      }).show();

      event.returnValue = false;
    }
  });
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
      let newW = 160,
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
  } else if (arg.message === "get-parsed-logs") {
    parseLogs();
    const parsedLogs = getParsedLogs();
    event.reply("parsed-logs-list", parsedLogs);
  } else if (arg.message === "get-parsed-log") {
    const logData = getLogData(arg.value);
    event.reply("parsed-log", logData);
  } else if (arg.message === "open-link") {
    shell.openExternal(arg.value);
  } else if (arg.message === "check-for-updates") {
    autoUpdater.checkForUpdates();
  } else if (arg.message === "quit-and-install") {
    autoUpdater.quitAndInstall();
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

app.on("before-quit", function () {
  isQuiting = true;
});
