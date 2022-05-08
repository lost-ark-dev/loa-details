import { defineStore } from "pinia";
import _ from "lodash";

const defaultSettings = {
  general: {
    startMainMinimized: false,
  },
};

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    settings: {},
  }),
  actions: {
    initSettings() {
      _.merge(this.settings, defaultSettings);
    },
    loadSettings(settingsToLoad) {
      _.merge(this.settings, defaultSettings, settingsToLoad);
      console.log("new settings", this.settings);
    },
  },
});
