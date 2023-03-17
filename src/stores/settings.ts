import { defineStore } from "pinia";
import { classes } from "../constants/classes";
import { merge } from "lodash";
import { ClassSettings, Settings } from "../../src-electron/util/app-settings";
import { StatusEffectBuffTypeFlags } from "loa-details-log-parser/data";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    settings: {
      appVersion: "",
      general: {
        startMainHidden: false,
        startMainMinimized: false,
        closeToSystemTray: true,
        saveScreenshots: true,
        server: "steam",
        customLogPath: null,
        useRawSocket: false,
        listenPort: 6040,
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
        api: {
          value: process.env.UPLOADS_API_URL,
          defaultValue: process.env.UPLOADS_API_URL,
        },
        endpoint: {
          value: process.env.UPLOADS_ENDPOINT,
          defaultValue: process.env.UPLOADS_ENDPOINT,
        },
        site: {
          value: process.env.UPLOADS_LOGIN_URL,
          defaultValue: process.env.UPLOADS_LOGIN_URL,
        },
        openOnUpload: false,
        uploadUnlisted: true,
        includeRegion: false,
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
          transparency: false,
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
          bossHP: {
            name: "Boss HP",
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
          dBuffedBySup: {
            name: "Dmg % dealt during Support buffs",
            enabled: false,
          },
          dDebuffedBySup: {
            name: "Dmg % dealt during Support debuffs",
            enabled: false,
          },
          dPartyBuff: {
            name: "Dmg % dealt during party synergies",
            enabled: true,
          },
          dSelfBuff: {
            name: "Dmg % dealt during self synergies (set, food, engravings, skills)",
            enabled: true,
          },
          dOtherBuff: {
            name: "Dmg % dealt during other buffs",
            enabled: false,
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
          hBuffedBySup: {
            name: "Hit % dealt during Support buffs",
            enabled: false,
          },
          hDebuffedBySup: {
            name: "Hit % dealt during Support debuffs",
            enabled: false,
          },
          hPartyBuff: {
            name: "Hit % dealt during party synergies",
            enabled: false,
          },
          hSelfBuff: {
            name: "Hit % dealt during self synergies (set, food, engravings, skills)",
            enabled: false,
          },
          hOtherBuff: {
            name: "Hit % dealt during other buffs",
            enabled: false,
          },
          maxDmg: {
            name: "Skill View / Max Damage",
            enabled: true,
          },
          avgDmg: {
            name: "Skill View / Average Damage",
            enabled: true,
          },
          avgCast: {
            name: "Skill View / Average Damage per Cast",
            enabled: false,
          },
          totalHits: {
            name: "Skill View / Total Hits",
            enabled: true,
          },
          totalCasts: {
            name: "Skill View / Total Casts",
            enabled: false,
          },
          hpm: {
            name: "Skill View / Hits per Minute",
            enabled: true,
          },
          cpm: {
            name: "Skill View / Casts per Minute",
            enabled: false,
          },
          shieldGiven: {
            name: "Tab: Shield applied to other players",
            enabled: true,
          },
          shieldGotten: {
            name: "Tab: Shield gotten from other players",
            enabled: false,
          },
          eshieldGiven: {
            name: "Tab: Effective (used up) shield given to other players",
            enabled: true,
          },
          eshieldGotten: {
            name: "Tab: Effective (used up) shield gotten from other players",
            enabled: false,
          },
        },
        buffFilter: {
          party:
            StatusEffectBuffTypeFlags.DMG |
            StatusEffectBuffTypeFlags.CRIT |
            StatusEffectBuffTypeFlags.ATKSPEED |
            StatusEffectBuffTypeFlags.COOLDOWN,
          self:
            StatusEffectBuffTypeFlags.DMG |
            StatusEffectBuffTypeFlags.CRIT |
            StatusEffectBuffTypeFlags.ATKSPEED |
            StatusEffectBuffTypeFlags.COOLDOWN,
          other: StatusEffectBuffTypeFlags.ANY,
        },
        classes: {},
      },
      logs: {
        minimumSessionDurationInMinutes: 1,
        minimumEncounterDurationInMinutes: 0.5,
        minimumDurationInMinutes: 0.0,
        splitOnPhaseTransition: true,
      },
    } as Settings,
  }),
  getters: {
    getClassColor(state) {
      return (className: string) => {
        if (className in state?.settings?.damageMeter?.classes)
          return state.settings.damageMeter.classes[className].color;
        return "#353535";
      };
    },
  },
  actions: {
    initSettings() {
      merge(this.settings.damageMeter.classes, classes);
      for (const classSetting of Object.values(
        this.settings.damageMeter.classes
      ) as [ClassSettings]) {
        classSetting.defaultColor = classSetting.color;
      }
    },
    loadSettings(settingsToLoad: Settings) {
      merge(this.settings, settingsToLoad);
    },
    saveSettings() {
      window.messageApi.send("window-to-main", {
        message: "save-settings",
        value: JSON.stringify(this.settings),
      });
    },
  },
});
