/* eslint-disable @typescript-eslint/no-misused-promises */
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
import { Parser } from "meter-core/logger/parser";
import { Settings } from "./util/app-settings";
import Ldn from "./ldn"


if (app.commandLine.hasSwitch("disable-hardware-acceleration")) {
  log.info("Hardware acceleration disabled");
  app.disableHardwareAcceleration();
}
//Override console methods for use in dependencies (such as meter-core) instead of passing references to every single functions
//Alternative: singleton custom logger in meter-core ?
//I don't know how bad it is :shrugging:
console.error = log.error.bind(log);
console.warn = log.warn.bind(log);
console.info = log.info.bind(log);
// We keep log/debug for console only

const store = new Store();
const ldn:Ldn = new Ldn();

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

let appSettings = getSettings();

// log file stuff
const padTo2Digits = (num: number) => num.toString().padStart(2, "0");
const date = new Date();
const filename =
  "LostArk_" +
  [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
    padTo2Digits(date.getHours()),
    padTo2Digits(date.getMinutes()),
    padTo2Digits(date.getSeconds()),
  ].join("-") +
  ".raw";
const meterData = InitMeterData();
let liveParser: Parser;
try {
  liveParser = InitLogger(
    meterData,
    appSettings?.general?.useRawSocket,
    appSettings?.general?.listenPort ?? 6040,
    filename,
    appSettings.clientId,
    {
      isLive: true,
      dontResetOnZoneChange:
        appSettings.damageMeter.functionality.dontResetOnZoneChange,
      resetAfterPhaseTransition:
        appSettings.damageMeter.functionality.resetAfterPhaseTransition,
      splitOnPhaseTransition: appSettings.logs.splitOnPhaseTransition,
    }
  );
} catch (e) {
  log.error(e);
}

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

void app.whenReady().then(() => {
  if (process.env.DEBUGGING) {
    import("electron-devtools-installer")
      .then(({ default: installExtension, VUEJS_DEVTOOLS }) => {
        installExtension
          .default(VUEJS_DEVTOOLS)
          .then((name) => console.log(`Added Extension:  ${name}`))
          .catch((err) => console.log("An error occurred: ", err));
      })
      .catch((err) => console.log("An error occurred: ", err));
  }

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

updaterEventEmitter.on(
  "event",
  (details: { message: string; value: unknown }) => {
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
      (details.message === "update-not-available" ||
        details.message === "error") && // Still start meter if autoupdate fails
      prelauncherStatus === "open"
    ) {
      setTimeout(
        () => {
          startApplication();
          if (typeof prelauncherWindow != "undefined") {
            prelauncherStatus = "closed";
            prelauncherWindow?.close();
            prelauncherWindow = null;
          }
        },
        details.message === "error" ? 10000 : 0 //If we got an error, starting 10s after
      );
    }

    // quitAndInstall only when prelauncher is visible (aka startup of application)
    if (
      details.message === "update-downloaded" &&
      typeof prelauncherWindow != "undefined" &&
      prelauncherWindow
    ) {
      quitAndInstall(false, true); // isSilent=false, forceRunAfter=true
    }
  }
);

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
          },
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
      ],
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
  damageMeterWindow = createDamageMeterWindow(liveParser, appSettings);

  initializeShortcuts(appSettings);

  shortcutEventEmitter.on(
    "shortcut",
    (shortcut: { key: unknown; action: string }) => {
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
    }
  );
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
    liveParser.reset();
  },
  "cancel-reset-session": () => {
    liveParser.cancelReset();
  },
  "save-settings": (event, arg: { value: string }) => {
    appSettings = JSON.parse(arg.value) as Settings;
    saveSettings(arg.value);

    updateShortcuts(appSettings);

    mainWindow?.webContents.send("on-settings-change", appSettings);
    damageMeterWindow?.webContents.send("on-settings-change", appSettings);
    liveParser.updateOptions({
      dontResetOnZoneChange:
        appSettings.damageMeter.functionality.dontResetOnZoneChange,
      resetAfterPhaseTransition:
        appSettings.damageMeter.functionality.resetAfterPhaseTransition,
      splitOnPhaseTransition: appSettings.logs.splitOnPhaseTransition,
    });

    damageMeterWindow?.setOpacity(appSettings.damageMeter.design.opacity);
    damageMeterWindow?.setAlwaysOnTop(appSettings.damageMeter.design.alwaysOnTop, "normal");
  },
  "get-settings": (event) => {
    event.reply("on-settings-change", appSettings);
  },
  "parse-logs": async (event) => {
    await parseLogs(
      event,
      appSettings.clientId,
      appSettings.logs.splitOnPhaseTransition,
      meterData,
      filename
    );
  },
  "get-parsed-logs": async (event) => {
    const parsedLogs = await getParsedLogs();
    await event.reply("parsed-logs-list", parsedLogs);
  },
  "get-parsed-log": async (event, arg: { message: string; value: string }) => {
    const logData = await getLogData(arg.value);
    await event.reply("parsed-log", logData);
  },
  "wipe-parsed-logs": async () => {
    await wipeParsedLogs();
  },
  "open-log-directory": () => {
    void shell.openPath(mainFolder);
  },
  "check-for-updates": () => {
    checkForUpdates();
  },
  "quit-and-install": () => {
    quitAndInstall();
  },
  "open-link": (event, arg: { message: string; value: string }) => {
    void shell.openExternal(arg.value);
  },
  "save-screenshot": async (event, arg: { message: string; value: string }) => {
    await saveScreenshot(arg.value);
  },
  "select-log-path-folder": async (event) => {
    const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return;
    event.reply("selected-log-path-folder", res.filePaths[0]);
  },
  "reset-damage-meter-position": () => {
    damageMeterWindow?.setPosition(0, 0);
    store.set("windows.damage_meter.X", 0);
    store.set("windows.damage_meter.Y", 0);
  },
  "enable-ldn": (   event,
    arg: { message: string; value: boolean }) => {
    if(damageMeterWindow){
      damageMeterWindow.close();
      damageMeterWindow = null;
    }
    if(mainWindow)
      mainWindow.hide();
    ldn.start(liveParser, appSettings, () => {
      damageMeterWindow = createDamageMeterWindow(liveParser, appSettings);
      if(mainWindow)
        mainWindow.show();
    })

  },
  "toggle-damage-meter-minimized-state": (
    event,
    arg: { message: string; value: boolean }
  ) => {
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

ipcMain.on(
  "window-to-main",
  (event, arg: { message: string; value: unknown }) => {
    const ipcFunction =
      ipcFunctions[arg.message] ||
      (() => {
        log.error("Unknown window-to-main message: " + arg.message);
      });
    ipcFunction(event, arg);
  }
);

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

process.on("uncaughtException", (error) => {
  console.log(error)
  log.error(console.trace("stack"));
});

process.on("exit", (code) => {
  log.log(`about to exit with code: ${code}`);
});
