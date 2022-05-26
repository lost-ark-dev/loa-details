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
import { setupBridge, httpServerEventEmitter } from "./http-bridge";

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

import {
  updaterEventEmitter,
  checkForUpdates,
  quitAndInstall,
} from "./util/updater";

import { LogParser } from "./log-parser/main";

import {
  parseLogs,
  getParsedLogs,
  getLogData,
  logFolder,
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

let appSettings = getSettings();

logParser.dontResetOnZoneChange =
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

  setupBridge(appSettings);

  httpServerEventEmitter.on("packet", (value) => {
    logParser.parseLogLine(value);
  });

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

  mainWindow = createMainWindow(appSettings);
  damageMeterWindow = createDamageMeterWindow(logParser);
}

let damageMeterWindowOldSize, damageMeterWindowOldMinimumSize;

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
    damageMeterWindow.webContents.send("on-settings-change", appSettings);
    logParser.dontResetOnZoneChange =
      appSettings.damageMeter.functionality.dontResetOnZoneChange;
  },
  "get-settings": (event, arg) => {
    event.reply("on-settings-change", appSettings);
  },
  "get-parsed-logs": (event, arg) => {
    parseLogs();
    const parsedLogs = getParsedLogs();
    event.reply("parsed-logs-list", parsedLogs);
  },
  "get-parsed-log": (event, arg) => {
    const logData = getLogData(arg.value);
    event.reply("parsed-log", logData);
  },
  "open-log-directory": (event, arg) => {
    shell.openPath(logFolder);
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
  "toggle-damage-meter-minimized-state": (event, arg) => {
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
