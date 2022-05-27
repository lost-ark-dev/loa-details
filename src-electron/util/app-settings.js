import Store from "electron-store";
import log from "electron-log";
import { cloneDeep } from "lodash";

const store = new Store();

export function getSettings() {
  let appSettings = {};

  try {
    let settingsStr = store.get("settings");

    if (typeof settingsStr === "object") appSettings = cloneDeep(settingsStr);
    else if (typeof settingsStr === "string")
      appSettings = JSON.parse(settingsStr);

    log.info("Found and applied settings.");
  } catch (e) {
    log.info("Setting retrieval failed: " + e);
  }

  return appSettings;
}

export function saveSettings(settings) {
  if (typeof settings === "object")
    store.set("settings", JSON.stringify(settings));
  else store.set("settings", settings);

  log.info(`Saved settings: ${settings}`);
}
