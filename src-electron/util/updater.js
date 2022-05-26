import { autoUpdater } from "electron-updater";
import { EventEmitter } from "events";
import log from "electron-log";

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

export const updaterEventEmitter = new EventEmitter();

export function checkForUpdates() {
  autoUpdater.checkForUpdates();
}

export function quitAndInstall(options) {
  autoUpdater.quitAndInstall(options);
}

autoUpdater.on("checking-for-update", () => {
  updaterEventEmitter.emit("event", { message: "checking-for-updates" });
});
autoUpdater.on("update-available", (info) => {
  updaterEventEmitter.emit("event", { message: "update-available" });
});
autoUpdater.on("update-not-available", (info) => {
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
