import { defineStore } from "pinia";
import _ from "lodash";
import { classes } from "../constants/classes";

const defaultSettings = {
  general: {
    startMainMinimized: false,
  },
  damageMeter: {
    functionality: {
      dontResetOnZoneChange: false,
      autoMinimize: false,
    },
    design: {
      compactDesign: false,
    },
    tabs: {
      dps: {
        name: "DPS/TPS",
        enabled: true,
      },
      damagePercent: {
        name: "D% (Damage Percent)",
        enabled: true,
      },
      damage: {
        name: "Damage Dealt/Taken",
        enabled: true,
      },
      critRate: {
        name: "Crit Rate",
        enabled: true,
      },
      faRate: {
        name: "Front Attack Rate",
        enabled: true,
      },
      baRate: {
        name: "Back Attack Rate",
        enabled: true,
      },
      counterCount: {
        name: "Counter Count",
        enabled: true,
      },
    },
    classes: {},
  },
};

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    settings: {},
  }),
  actions: {
    initSettings() {
      _.merge(this.settings, defaultSettings);
      _.merge(this.settings.damageMeter.classes, classes);
      for (const className of Object.keys(this.settings.damageMeter.classes)) {
        this.settings.damageMeter.classes[className].defaultColor =
          this.settings.damageMeter.classes[className].color;
      }
      console.log(this.settings);
    },
    loadSettings(settingsToLoad) {
      _.merge(this.settings, defaultSettings, settingsToLoad);
      console.log("new settings", this.settings);
    },
  },
});
