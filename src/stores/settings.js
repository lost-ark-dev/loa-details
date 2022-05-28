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
        apiUrl: process.env.UPLOADS_API_URL,
        uploadEndpoint: "/logs/upload",
        loginUrl: process.env.UPLOADS_LOGIN_URL,
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
      logs: {
        minimumDurationInMinutes: 0.0,
        splitOnPhaseTransition: true,
      },
    },
  }),
  getters: {
    getClassColor(state) {
      return (className) => {
        if (className in state?.settings?.damageMeter?.classes)
          return state.settings.damageMeter.classes[className].color;
        return "#353535";
      };
    },
  },
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
    },
  },
});
