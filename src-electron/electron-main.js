import { app, dialog, nativeTheme, ipcMain, Menu, Tray, shell } from "electron";
import { initialize } from "@electron/remote/main";
import { setupBridge, httpServerEventEmitter } from "./http-bridge";

import log from "electron-log";
import path from "path";
import os from "os";
import Store from "electron-store";

import {
  shortcutEventEmitter,
  initializeShortcuts,
  updateShortcuts,
} from "./util/shortcuts-manager";

import {
  createPrelauncherWindow,
  createMainWindow,
  createDamageMeterWindow,
} from "./electron-windows";

import { getSettings, saveSettings } from "./util/app-settings";

import {
  updaterEventEmitter,
  checkForUpdates,
  quitAndInstall,
} from "./util/updater";

import { saveScreenshot } from "./util/screenshot";

const { LogParser } = require("loa-details-log-parser");

const { mainFolder } = require("./util/directories");

import {
  parseLogs,
  getParsedLogs,
  getLogData,
  wipeParsedLogs,
} from "./log-parser/file-parser";

const store = new Store();

let prelauncherWindow, mainWindow, damageMeterWindow;
let tray = null;

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

initialize();

const logParser = new LogParser((isLive = true));
logParser.debugLines = true;

let appSettings = getSettings();

logParser.dontResetOnZoneChange =
  appSettings?.damageMeter?.functionality?.dontResetOnZoneChange;

logParser.resetAfterPhaseTransition =
  appSettings?.damageMeter?.functionality?.resetAfterPhaseTransition;

logParser.removeOverkillDamage =
  appSettings?.damageMeter?.functionality?.removeOverkillDamage;

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

app.whenReady().then(() => {
  // Don't create prelauncher if debugging
  if (!process.env.DEBUGGING) {
    prelauncherWindow = createPrelauncherWindow();
    prelauncherWindow.on("show", () => {
      checkForUpdates();
    });
  } else {
    startApplication();
  }
});

let prelauncherStatus = "open";

updaterEventEmitter.on("event", (details) => {
  if (
    typeof prelauncherWindow !== "undefined" &&
    prelauncherWindow &&
    prelauncherWindow.webContents
  ) {
    prelauncherWindow.webContents.send("updater-message", details);
  } else if (
    typeof mainWindow !== "undefined" &&
    mainWindow &&
    mainWindow.webContents
  ) {
    mainWindow.webContents.send("updater-message", details);
  }

  if (
    details.message === "update-not-available" &&
    prelauncherStatus === "open"
  ) {
    startApplication();
    if (typeof prelauncherWindow != "undefined") {
      prelauncherStatus = "closed";
      prelauncherWindow.close();
      prelauncherWindow = null;
    }
  }

  // quitAndInstall only when prelauncher is visible (aka startup of application)
  if (
    details.message === "update-downloaded" &&
    typeof prelauncherWindow != "undefined" &&
    prelauncherWindow
  ) {
    quitAndInstall(false, true); // isSilent=false, forceRunAfter=true
  }
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
        app.quit();
      },
    },
  ]);

  tray.setToolTip("LOA Details");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  setupBridge(appSettings);

  httpServerEventEmitter.on("packet", (value) => {
    logParser.parseLogLine(value);
  });

  httpServerEventEmitter.on("debug", (data) => {
    log.info("debug:", data);
  });

  /*   const dontShowPatreonBox = store.get("dont_show_patreon_box");
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
  } */

  mainWindow = createMainWindow(appSettings);
  damageMeterWindow = createDamageMeterWindow(logParser, appSettings);

  initializeShortcuts(appSettings);

  shortcutEventEmitter.on("shortcut", (shortcut) => {
    log.debug(shortcut);

    if (shortcut.action === "minimizeDamageMeter") {
      damageMeterWindow.webContents.send(
        "shortcut-action",
        "toggle-minimized-state"
      );
    } else if (shortcut.action === "resetSession") {
      damageMeterWindow.webContents.send("shortcut-action", "reset-session");
    } else if (shortcut.action === "pauseDamageMeter") {
      damageMeterWindow.webContents.send(
        "shortcut-action",
        "pause-damage-meter"
      );
    }
  });
}

let damageMeterWindowOldSize,
  damageMeterWindowOldPosition,
  damageMeterWindowOldMinimumSize,
  damageMeterPositionDifference;

const ipcFunctions = {
  "reset-session": (event, arg) => {
    logParser.softReset();
  },
  "cancel-reset-session": (event, arg) => {
    if (logParser.resetTimer) {
      logParser.cancelReset();
    }
  },
  "save-settings": (event, arg) => {
    appSettings = JSON.parse(arg.value);
    saveSettings(arg.value);

    updateShortcuts(appSettings);

    mainWindow.webContents.send("on-settings-change", appSettings);
    damageMeterWindow.webContents.send("on-settings-change", appSettings);

    logParser.dontResetOnZoneChange =
      appSettings.damageMeter.functionality.dontResetOnZoneChange;

    logParser.removeOverkillDamage =
      appSettings.damageMeter.functionality.removeOverkillDamage;

    logParser.resetAfterPhaseTransition =
      appSettings?.damageMeter?.functionality?.resetAfterPhaseTransition;

    damageMeterWindow.setOpacity(appSettings.damageMeter.design.opacity);
  },
  "get-settings": (event, arg) => {
    event.reply("on-settings-change", appSettings);
  },
  "parse-logs": async (event, arg) => {
    await parseLogs(event, appSettings?.logs?.splitOnPhaseTransition);
  },
  "get-parsed-logs": async (event, arg) => {
    const parsedLogs = await getParsedLogs();
    await event.reply("parsed-logs-list", parsedLogs);
  },
  "get-parsed-log": async (event, arg) => {
    const logData = await getLogData(arg.value);
    await event.reply("parsed-log", logData);
  },
  "wipe-parsed-logs": async (event, args) => {
    await wipeParsedLogs();
  },
  "open-log-directory": (event, arg) => {
    shell.openPath(mainFolder);
  },
  "check-for-updates": (event, arg) => {
    checkForUpdates();
  },
  "quit-and-install": (event, arg) => {
    quitAndInstall();
  },
  "open-link": (event, arg) => {
    shell.openExternal(arg.value);
  },
  "save-screenshot": async (event, arg) => {
    await saveScreenshot(arg.value);
  },
  "select-log-path-folder": async (event, arg) => {
    const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return;
    event.reply("selected-log-path-folder", res.filePaths[0]);
  },
  "toggle-damage-meter-minimized-state": (event, arg) => {
    if (appSettings.damageMeter.functionality.minimizeToTaskbar) {
      if (arg.value) damageMeterWindow.minimize();
      else damageMeterWindow.restore();
    } else {
      if (arg.value) {
        let newW = 160,
          newH = 64;

        damageMeterWindowOldSize = damageMeterWindow.getSize();
        damageMeterWindowOldMinimumSize = damageMeterWindow.getMinimumSize();
        damageMeterWindowOldPosition = damageMeterWindow.getPosition();

        damageMeterPositionDifference = [
          damageMeterWindowOldPosition[0] + damageMeterWindowOldSize[0] - newW,
          damageMeterWindowOldPosition[1] + damageMeterWindowOldSize[1] - newH,
        ];

        damageMeterWindow.setResizable(false);
        damageMeterWindow.setMinimumSize(newW, newH);
        damageMeterWindow.setSize(newW, newH);
        damageMeterWindow.setPosition(
          damageMeterPositionDifference[0],
          damageMeterPositionDifference[1]
        );
      } else {
        damageMeterWindow.setResizable(true);
        damageMeterWindow.setMinimumSize(
          damageMeterWindowOldMinimumSize[0],
          damageMeterWindowOldMinimumSize[1]
        );
        damageMeterWindow.setSize(
          damageMeterWindowOldSize[0],
          damageMeterWindowOldSize[1]
        );
        damageMeterWindow.setPosition(
          damageMeterWindowOldPosition[0],
          damageMeterWindowOldPosition[1]
        );
      }
    }
  },
};

ipcMain.on("window-to-main", (event, arg) => {
  const ipcFunction =
    ipcFunctions[arg.message] ||
    (() => {
      log.error("Unknown winodw-to-main message: " + arg.message);
    });
  ipcFunction(event, arg);
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow(appSettings);
  }
});
