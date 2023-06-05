import { app, dialog, globalShortcut } from "electron";
import log from "electron-log";
import EventEmitter from "events";
import { settings } from "./settings";

export const shortcutEventEmitter = new EventEmitter();

export function updateShortcuts() {
  globalShortcut.unregisterAll();
  initializeShortcuts();
}

export function initializeShortcuts() {
  for (const [action, key] of Object.entries(settings.store.shortcuts)) {
    console.log(action, key);

    const ret = globalShortcut.register(key, () => {
      shortcutEventEmitter.emit("shortcut", {
        key,
        action,
      });

      log.debug(`Shortcut ${key} pressed`);
    });

    if (!ret) {
      dialog.showErrorBox(
        "Shortcut registration failed",
        `Couldn\`t register the shortcut: ${key}, it\`s probably being used by another program. You can change that shortcut in the settings. You can still use LOA Details.`
      );
    }
  }
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
