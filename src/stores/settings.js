import { defineStore } from "pinia";
import { classes } from "../constants/classes";
import _ from "lodash";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    settings: {
      general: {
        startMainMinimized: false,
        useWinpcap: false,
      },
      damageMeter: {
        functionality: {
          dontResetOnZoneChange: false,
          autoMinimize: false,
        },
        design: {
          compactDesign: false,
          pinUserToTop: false,
        },
        tabs: {
          damagePercent: {
            name: "D% (Damage Percent)",
            enabled: true,
          },
          dps: {
            name: "DPS/TPS",
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
    },
  }),
  actions: {
    initSettings() {
      _.merge(this.settings.damageMeter.classes, classes);
      for (const className of Object.keys(this.settings.damageMeter.classes)) {
        this.settings.damageMeter.classes[className].defaultColor =
          this.settings.damageMeter.classes[className].color;
      }
    },
    loadSettings(settingsToLoad) {
      _.merge(this.settings, settingsToLoad);
      console.log("new settings", settingsToLoad);
    },
  },
});
