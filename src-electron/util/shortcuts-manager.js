const { app, globalShortcut, dialog } = require("electron");
import EventEmitter from "events";
import log from "electron-log";

export const shortcutEventEmitter = new EventEmitter();

export function updateShortcuts(appSettings) {
  globalShortcut.unregisterAll();
  initializeShortcuts(appSettings);
}

export function initializeShortcuts(appSettings) {
  for (let key in appSettings.shortcuts) {
    const ret = globalShortcut.register(
      appSettings.shortcuts[key].value,
      () => {
        shortcutEventEmitter.emit("shortcut", {
          key: appSettings.shortcuts[key],
          action: key,
        });

        log.debug(`Shortcut ${appSettings.shortcuts[key].value} pressed`);
      }
    );

    if (!ret) {
      dialog.showErrorBox(
        "Shortcut registration failed",
        "Couldn't register the shortcut: CommandOrControl+X+Y, it's probably being used by another program. You can change that shortcut in the settings. You can still use LOA Details."
      );
    }
  }
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
