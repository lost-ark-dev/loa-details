import Store from "electron-store";
import log from "electron-log";

const store = new Store();

export function getSettings() {
  let appSettings = {};

  try {
    const settingsStr = store.get("settings");
    if (settingsStr) appSettings = JSON.parse(store.get("settings"));

    log.info("Found and applied settings.");
  } catch (e) {
    log.info("Setting retrieval failed: " + e);
  }

  return appSettings;
}

export function saveSettings(settings) {
  store.set("settings", settings);
}
