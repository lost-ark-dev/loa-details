import log from "electron-log";
import { autoUpdater } from "electron-updater";
import { EventEmitter } from "events";

autoUpdater.logger = log;
log.transports.file.level = "info";

export const updaterEventEmitter = new EventEmitter();

export function checkForUpdates() {
  void autoUpdater.checkForUpdates();
}

export function quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean) {
  autoUpdater.quitAndInstall(isSilent, isForceRunAfter);
}

autoUpdater.on("checking-for-update", () => {
  updaterEventEmitter.emit("event", { message: "checking-for-updates" });
});
autoUpdater.on("update-available", () => {
  updaterEventEmitter.emit("event", { message: "update-available" });
});
autoUpdater.on("update-not-available", () => {
  updaterEventEmitter.emit("event", { message: "update-not-available" });
});
autoUpdater.on("error", (err) => {
  updaterEventEmitter.emit("event", { message: "error", value: err });
});
autoUpdater.on("download-progress", (progressObj) => {
  updaterEventEmitter.emit("event", {
    message: "download-progress",
    value: progressObj,
  });
});
autoUpdater.on("update-downloaded", (info) => {
  updaterEventEmitter.emit("event", {
    message: "update-downloaded",
    value: info,
  });
});
