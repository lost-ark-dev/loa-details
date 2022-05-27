import { defineStore } from "pinia";
import { classes } from "../constants/classes";
import { merge } from "lodash";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    settings: {
      appVersion: "",
      general: {
        startMainHidden: false,
        startMainMinimized: false,
        closeToSystemTray: true,
        useWinpcap: false,
        server: "steam",
      },
      uploads: {
        uploadLogs: false,
        uploadKey: "",
        apiUrl: process.env.DEBUGGING ? "http://localhost" : "https://api.dps.arsha.io",
        uploadEndpoint: "/logs/upload",
        loginUrl: process.env.DEBUGGING ? "http://localhost:8080" : "https://dps.arsha.io",
        region: "",
        server: "",
        openOnUpload: false,
        recentSessions: [],
      },
      damageMeter: {
        functionality: {
          dontResetOnZoneChange: false,
          removeOverkillDamage: true,
          pauseOnPhaseTransition: false,
          autoMinimize: false,
          autoMinimizeTimer: 60,
        },
        design: {
          compactDesign: false,
          pinUserToTop: false,
          opacity: 0.9,
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
      merge(this.settings.damageMeter.classes, classes);
      for (const className of Object.keys(this.settings.damageMeter.classes)) {
        this.settings.damageMeter.classes[className].defaultColor =
          this.settings.damageMeter.classes[className].color;
      }
    },
    loadSettings(settingsToLoad) {
      merge(this.settings, settingsToLoad);
      console.log("new settings", settingsToLoad);
    },
  },
});
