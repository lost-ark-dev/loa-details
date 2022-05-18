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
import { parseLogs, getParsedLogs, getLogData } from "./log-files/helper";

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
  prelauncherMessage({ error: { message: "Failed To Update", reason: err.message }});

  let counter = 0;
  const startTimer = setInterval(() => {
    prelauncherMessage({ error: { message: "Failed To Update", reason: `Starting in ${6 - counter} seconds...` }});
    if (counter >= 5) {
      clearInterval(startTimer);

      startApplication();

      prelauncherWindow.close();
      prelauncherWindow = null;
    }
    counter++;
  }, 1000)
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

  try {
    const params = [];
    if (appSettings?.general?.useWinpcap) params.push("useWinpcap");
    if (appSettings?.general?.server === "russia") params.push("russiaClient");
    if (appSettings?.general?.server === "korea") params.push("koreaClient");

    log.debug(`DEBUGGING?: ${process.env.DEBUGGING}`);
    if (process.env.DEBUGGING) {
      connection = new ConnectionBuilder()
        .connectTo(
          path.resolve(__dirname, "../../binary/LostArkLogger.exe"),
          ...params
        )
        .build();
    } else {
      connection = new ConnectionBuilder()
        .connectTo("LostArkLogger.exe", ...params)
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
  connection.on("raid-end", (value) => sessionState.onRaidEnd(value));
  connection.on("combat-event", (value) => sessionState.onCombatEvent(value));
  connection.onDisconnect = () => {
    log.error(
      "The connection to the Lost Ark Packet Capture was lost for some reason. Exiting app..."
    );

    // dialog.showErrorBox(
    //   "Error",
    //   "The connection to the Lost Ark Packet Capture was lost for some reason. Exiting app..."
    // );

    log.info("Exiting app...");
    app.exit();
  };

  mainWindow = createMainWindow(mainWindow, appSettings);
  damageMeterWindow = createDamageMeterWindow(damageMeterWindow, sessionState, appSettings);

  sessionState.addEventListenerWindow("settings", mainWindow);

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
  log.debug("window-to-main");
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

    damageMeterWindow.setOpacity(appSettings.damageMeter.design.opacity);
    damageMeterWindow.webContents.send("on-settings-change", appSettings);
    if (arg.source) mainWindow.webContents.send("on-settings-change", appSettings); // Update main window when logs are toggled

    sessionState.dontResetOnZoneChange = appSettings.damageMeter.functionality.dontResetOnZoneChange;
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
  } else if (arg.message === "open-url") {
    shell.openExternal(arg.value);
    // event.reply("open-url-success", true);
    log.debug(`Opened external link ${arg.value}`);
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
