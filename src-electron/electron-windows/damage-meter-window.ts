import { app, BrowserWindow, shell } from "electron";
import { enable } from "@electron/remote/main";
import path from "path";
import { initWindow } from "../util/window-init";
import log from "electron-log";
import { upload } from "../util/uploads";
import { Settings } from "../util/app-settings";
import { Game, LogParser } from "loa-details-log-parser";

export function createDamageMeterWindow(
  logParser: LogParser,
  appSettings: Settings
) {
  let damageMeterWindow: BrowserWindow | null = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"),
    show: false,
    width: 512,
    height: 200,
    minWidth: 360,
    minHeight: 124,
    frame: false,
    transparent: appSettings?.damageMeter?.design?.transparency ?? true,
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
    if (!damageMeterWindow) return;
    if (process.env.DEBUGGING) {
      damageMeterWindow.webContents.openDevTools();
    } else {
      damageMeterWindow.webContents.on("devtools-opened", () => {
        damageMeterWindow?.webContents.closeDevTools();
      });
    }
    damageMeterWindow.show();

    initWindow(damageMeterWindow, "damage_meter");
  });

  damageMeterWindow.setAlwaysOnTop(true, "normal");

  // Event listeners
  logParser.on("reset-state", (state: Game) => {
    try {
      damageMeterWindow?.webContents.send("pcap-on-reset-state", "1");

      const uploadsEnabled = appSettings.uploads.uploadLogs;
      log.debug("uploadsEnabled", uploadsEnabled);
      if (uploadsEnabled) {
        log.info("Starting an upload");

        const openInBrowser = appSettings.uploads.openOnUpload;

        upload(state, appSettings)
          .then((response) => {
            if (!response) return;

            damageMeterWindow?.webContents.send("uploader-message", {
              failed: false,
              message: "Encounter uploaded",
            });

            if (openInBrowser) {
              const url = `${appSettings.uploads.site.value}/logs/${response.id}`;
              shell.openExternal(url);
            }
          })
          .catch((e) => {
            log.error(e);
            damageMeterWindow?.webContents.send("uploader-message", {
              failed: true,
              message: e.message,
            });
          });
      }
    } catch (e) {
      log.error(e);
    }
  });
  logParser.on("state-change", (newState: unknown) => {
    try {
      if (typeof damageMeterWindow !== "undefined" && damageMeterWindow) {
        damageMeterWindow.webContents.send("pcap-on-state-change", newState);
      }
    } catch (e) {
      log.error(e);
    }
  });
  logParser.on("message", (val: unknown) => {
    try {
      damageMeterWindow?.webContents.send("pcap-on-message", val);
    } catch (e) {
      log.error(e);
    }
  });

  damageMeterWindow.on("focus", () => {
    damageMeterWindow?.setIgnoreMouseEvents(false);
  });

  damageMeterWindow.on("closed", () => {
    damageMeterWindow = null;
    app.quit();
  });

  damageMeterWindow.on("restore", () => {
    damageMeterWindow?.webContents.send("on-restore-from-taskbar", true);
  });

  return damageMeterWindow;
}
