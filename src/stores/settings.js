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
        saveScreenshots: true,
        server: "steam",
        customLogPath: null,
      },
      shortcuts: {
        minimizeDamageMeter: {
          value: "CommandOrControl+Down",
          defaultValue: "CommandOrControl+Down",
        },
        resetSession: {
          value: "CommandOrControl+Up",
          defaultValue: "CommandOrControl+Up",
        },
        pauseDamageMeter: {
          value: "CommandOrControl+Right",
          defaultValue: "CommandOrControl+Right",
        },
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
          pauseOnPhaseTransition: true,
          resetAfterPhaseTransition: true,
          autoMinimize: false,
          autoMinimizeTimer: 60,
          minimizeToTaskbar: false,
          nameDisplay: "name+class",
          nameDisplayV2: "name+gear+class",
        },
        design: {
          compactDesign: false,
          pinUserToTop: false,
          opacity: 0.9,
        },
        header: {
          damage: {
            name: "Damage",
            enabled: true,
          },
          dps: {
            name: "DPS",
            enabled: true,
          },
          tank: {
            name: "Tanked",
            enabled: false,
          },
        },
        tabs: {
          damage: {
            name: "Damage/Tanked",
            enabled: true,
          },
          deathTime: {
            name: "Death Time",
            enabled: false,
          },
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
          maxDmg: {
            name: "Skill View / Max Damage",
            enabled: true,
          },
          avgDmg: {
            name: "Skill View / Average Damage",
            enabled: true,
          },
          totalHits: {
            name: "Skill View / Total Hits",
            enabled: true,
          },
          hpm: {
            name: "Skill View / Hits per Minute",
            enabled: true,
          },
        },
        classes: {},
      },
      logs: {
        minimumSessionDurationInMinutes: 1,
        minimumEncounterDurationInMinutes: 0.5,
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
