import {
  app,
  BrowserWindow,
  dialog,
  IgnoreMouseEventsOptions,
  ipcMain,
  Menu,
  nativeTheme,
  shell,
  Tray,
} from "electron";
import log from "electron-log";
import Store from "electron-store";
import { unlinkSync } from "fs";
import { LogParser } from "loa-details-log-parser";
import os from "os";
import path from "path";
import {
  createDamageMeterWindow,
  createMainWindow,
  createPrelauncherWindow,
} from "./electron-windows";
import {
  getLogData,
  getParsedLogs,
  parseLogs,
  wipeParsedLogs,
} from "./log-parser/file-parser";
import { InitLogger, InitMeterData } from "./logger";
import { getSettings, saveSettings } from "./util/app-settings";
import { mainFolder } from "./util/directories";
import { saveScreenshot } from "./util/screenshot";
import {
  initializeShortcuts,
  shortcutEventEmitter,
  updateShortcuts,
} from "./util/shortcuts-manager";
import {
  checkForUpdates,
  quitAndInstall,
  updaterEventEmitter,
} from "./util/updater";
import { adminRelauncher, PktCaptureMode } from "meter-core/pkt-capture";

if (app.commandLine.hasSwitch("disable-hardware-acceleration")) {
  log.info("Hardware acceleration disabled");
  app.disableHardwareAcceleration();
}
//Override console methods for use in dependencies (such as meter-core) instead of passing references to every single functions
//Alternative: singleton custom logger in meter-core ?
//I don't know how bad it is :shrugging:
console.error = log.error;
console.warn = log.warn;
console.info = log.info;
// We keep log/debug for console only

const store = new Store();

let prelauncherWindow: BrowserWindow | null,
  mainWindow: BrowserWindow | null,
  damageMeterWindow: BrowserWindow | null;
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

const meterData = InitMeterData();

const logParser = new LogParser(meterData, true);
logParser.debugLines = true;

let appSettings = getSettings();

logParser.dontResetOnZoneChange =
  appSettings.damageMeter.functionality.dontResetOnZoneChange;

logParser.resetAfterPhaseTransition =
  appSettings.damageMeter.functionality.resetAfterPhaseTransition;

logParser.removeOverkillDamage =
  appSettings.damageMeter.functionality.removeOverkillDamage;

appSettings.appVersion = app.getVersion();

//We relaunch admin as early as possible to be smoother, as -relaunch parameter is set, admin won't be checked again later on
adminRelauncher(
  appSettings.general.useRawSocket
    ? PktCaptureMode.MODE_RAW_SOCKET
    : PktCaptureMode.MODE_PCAP
);
//Note: relauncher doesn't work in dev mode, consider starting as admin
//TODO: disable when in dev ?

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();
try {
  if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
    unlinkSync(path.join(app.getPath("userData"), "DevTools Extensions"));
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
      prelauncherWindow?.close();
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
        mainWindow?.show();
        if (mainWindow?.isMinimized()) mainWindow?.restore();
        mainWindow?.focus();
      },
    },
    {
      label: "Reset Windows",
      submenu: [
        {
          label: "Both",
          click() {
            damageMeterWindow?.setPosition(0, 0);
            store.set("windows.damage_meter.X", 0);
            store.set("windows.damage_meter.Y", 0);
            mainWindow?.setPosition(0, 0);
            store.set("windows.main.X", 0);
            store.set("windows.main.Y", 0);
          }
        },
        {
          label: "Damage Meter",
          click() {
            damageMeterWindow?.setPosition(0, 0);
            store.set("windows.damage_meter.X", 0);
            store.set("windows.damage_meter.Y", 0);
          },
        },
        {
          label: "Main Window",
          click() {
            mainWindow?.setPosition(0, 0);
            store.set("windows.main.X", 0);
            store.set("windows.main.Y", 0);
          },
        },
      ]
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
    mainWindow?.show();
    if (mainWindow?.isMinimized()) mainWindow?.restore();
    mainWindow?.focus();
  });

  mainWindow = createMainWindow(appSettings);
  damageMeterWindow = createDamageMeterWindow(logParser, appSettings);

  try {
    InitLogger(
      logParser,
      meterData,
      appSettings?.general?.useRawSocket,
      appSettings?.general?.listenPort ?? 6040
    );
  } catch (e) {
    log.error(e);
  }

  initializeShortcuts(appSettings);

  shortcutEventEmitter.on("shortcut", (shortcut) => {
    log.debug(shortcut);

    if (shortcut.action === "minimizeDamageMeter") {
      damageMeterWindow?.webContents.send(
        "shortcut-action",
        "toggle-minimized-state"
      );
    } else if (shortcut.action === "resetSession") {
      damageMeterWindow?.webContents.send("shortcut-action", "reset-session");
    } else if (shortcut.action === "pauseDamageMeter") {
      damageMeterWindow?.webContents.send(
        "shortcut-action",
        "pause-damage-meter"
      );
    }
  });
}

let damageMeterWindowOldSize: number[],
  damageMeterWindowOldPosition: number[],
  damageMeterWindowOldMinimumSize: number[],
  damageMeterPositionDifference: number[];

const ipcFunctions: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (event: Electron.IpcMainEvent, arg: any) => void;
} = {
  "reset-session": () => {
    logParser.softReset();
  },
  "cancel-reset-session": () => {
    if (logParser.resetTimer) {
      logParser.cancelReset();
    }
  },
  "save-settings": (event, arg: { value: string }) => {
    appSettings = JSON.parse(arg.value);
    saveSettings(arg.value);

    updateShortcuts(appSettings);

    mainWindow?.webContents.send("on-settings-change", appSettings);
    damageMeterWindow?.webContents.send("on-settings-change", appSettings);

    logParser.dontResetOnZoneChange =
      appSettings.damageMeter.functionality.dontResetOnZoneChange;

    logParser.removeOverkillDamage =
      appSettings.damageMeter.functionality.removeOverkillDamage;

    logParser.resetAfterPhaseTransition =
      appSettings.damageMeter.functionality.resetAfterPhaseTransition;

    damageMeterWindow?.setOpacity(appSettings.damageMeter.design.opacity);
  },
  "get-settings": (event) => {
    event.reply("on-settings-change", appSettings);
  },
  "parse-logs": async (event) => {
    await parseLogs(event, appSettings.logs.splitOnPhaseTransition, meterData);
  },
  "get-parsed-logs": async (event) => {
    const parsedLogs = await getParsedLogs();
    await event.reply("parsed-logs-list", parsedLogs);
  },
  "get-parsed-log": async (event, arg) => {
    const logData = await getLogData(arg.value);
    await event.reply("parsed-log", logData);
  },
  "wipe-parsed-logs": async () => {
    await wipeParsedLogs();
  },
  "open-log-directory": () => {
    shell.openPath(mainFolder);
  },
  "check-for-updates": () => {
    checkForUpdates();
  },
  "quit-and-install": () => {
    quitAndInstall();
  },
  "open-link": (event, arg) => {
    shell.openExternal(arg.value);
  },
  "save-screenshot": async (event, arg) => {
    await saveScreenshot(arg.value);
  },
  "select-log-path-folder": async (event) => {
    const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return;
    event.reply("selected-log-path-folder", res.filePaths[0]);
  },
  "reset-damage-meter-position": async () => {
    damageMeterWindow?.setPosition(0, 0);
    store.set("windows.damage_meter.X", 0);
    store.set("windows.damage_meter.Y", 0);
  },
  "toggle-damage-meter-minimized-state": (event, arg) => {
    if (appSettings.damageMeter.functionality.minimizeToTaskbar) {
      if (arg.value) damageMeterWindow?.minimize();
      else damageMeterWindow?.restore();
    } else {
      if (arg.value) {
        const newW = 160,
          newH = 64;

        damageMeterWindowOldSize = damageMeterWindow?.getSize() || [0, 0];
        damageMeterWindowOldMinimumSize =
          damageMeterWindow?.getMinimumSize() || [0, 0];
        damageMeterWindowOldPosition = damageMeterWindow?.getPosition() || [
          0, 0,
        ];

        damageMeterPositionDifference = [
          damageMeterWindowOldPosition[0] + damageMeterWindowOldSize[0] - newW,
          damageMeterWindowOldPosition[1] + damageMeterWindowOldSize[1] - newH,
        ];

        damageMeterWindow?.setResizable(false);
        damageMeterWindow?.setMinimumSize(newW, newH);
        damageMeterWindow?.setSize(newW, newH);
        damageMeterWindow?.setPosition(
          damageMeterPositionDifference[0],
          damageMeterPositionDifference[1]
        );
      } else {
        damageMeterWindow?.setResizable(true);
        damageMeterWindow?.setMinimumSize(
          damageMeterWindowOldMinimumSize[0],
          damageMeterWindowOldMinimumSize[1]
        );
        damageMeterWindow?.setSize(
          damageMeterWindowOldSize[0],
          damageMeterWindowOldSize[1]
        );
        damageMeterWindow?.setPosition(
          damageMeterWindowOldPosition[0],
          damageMeterWindowOldPosition[1]
        );
      }
    }
  },
};

ipcMain.on("get-meter-data-path", (event) => {
  if (process.env.DEBUGGING) event.returnValue = "./meter-data";
  else event.returnValue = path.resolve("./meter-data");
});
ipcMain.on("minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("toggleMaximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});

ipcMain.on("close", () => {
  mainWindow?.close();
});

ipcMain.on("hide", () => {
  mainWindow?.hide();
});

ipcMain.on(
  "setIgnoreMouseEvents",
  (event, ignore: boolean, options?: IgnoreMouseEventsOptions) => {
    damageMeterWindow?.setIgnoreMouseEvents(ignore, options);
  }
);

ipcMain.on("window-to-main", (event, arg) => {
  const ipcFunction =
    ipcFunctions[arg.message] ||
    (() => {
      log.error("Unknown window-to-main message: " + arg.message);
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

process.on("uncaughtException", (e) => {
  log.error(console.trace("stack"));
});

process.on("exit", (code) => {
  log.log(`about to exit with code: ${code}`);
});
