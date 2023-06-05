import { app, BrowserWindow, shell } from "electron";
import log from "electron-log";
import type { GameState } from "meter-core/logger/data";
import { Parser } from "meter-core/logger/parser";
import path from "path";
import { settings } from "../util/settings";
import { upload } from "../util/uploads";
import { initWindow } from "../util/window-init";

export function createDamageMeterWindow(liveParser: Parser) {
  let damageMeterWindow: BrowserWindow | null = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"),
    show: false,
    width: 512,
    height: 200,
    minWidth: 360,
    minHeight: 124,
    frame: false,
    transparent: settings.store.damageMeter.design.transparency ?? true,
    opacity: settings.store.damageMeter.design.opacity || 0.9,
    resizable: true,
    autoHideMenuBar: true,
    fullscreenable: false,
    alwaysOnTop: true,
    useContentSize: true,
    // TODO: backgroundMaterial: "acrylic",
    webPreferences: {
      devTools: process.env.DEBUGGING,
      contextIsolation: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  void damageMeterWindow.loadURL(process.env.APP_URL + "#/damage-meter").then(() => {
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
  liveParser.on("reset-state", (state: GameState) => {
    try {
      damageMeterWindow?.webContents.send("pcap-on-reset-state", "1");

      const uploadsEnabled = settings.store.uploads.uploadLogs;
      log.debug("uploadsEnabled", uploadsEnabled);
      if (uploadsEnabled) {
        log.info("Starting an upload");

        const openInBrowser = settings.store.uploads.openOnUpload;
        upload(state)
          .then((response) => {
            if (!response) return;

            damageMeterWindow?.webContents.send("uploader-message", {
              failed: false,
              message: "Encounter uploaded",
            });

            if (openInBrowser) {
              const url = `${settings.store.uploads.site}/logs/${response.id}`;
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
  liveParser.on("state-change", (newState: GameState) => {
    try {
      if (typeof damageMeterWindow !== "undefined" && damageMeterWindow) {
        damageMeterWindow.webContents.send("pcap-on-state-change", newState);
      }
    } catch (e) {
      log.error(e);
    }
  });
  liveParser.on("message", (msg: string) => {
    try {
      damageMeterWindow?.webContents.send("pcap-on-message", msg);
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
