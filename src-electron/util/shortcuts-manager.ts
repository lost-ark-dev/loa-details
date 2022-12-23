import { app, globalShortcut, dialog } from "electron";
import EventEmitter from "events";
import log from "electron-log";
import { Settings } from "./app-settings";

export const shortcutEventEmitter = new EventEmitter();

export function updateShortcuts(appSettings: Settings) {
  globalShortcut.unregisterAll();
  initializeShortcuts(appSettings);
}

export function initializeShortcuts(appSettings: Settings) {
  for (const [action, key] of Object.entries(appSettings.shortcuts)) {
    const ret = globalShortcut.register(key.value, () => {
      shortcutEventEmitter.emit("shortcut", {
        key,
        action,
      });

      log.debug(`Shortcut ${key.value} pressed`);
    });

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
