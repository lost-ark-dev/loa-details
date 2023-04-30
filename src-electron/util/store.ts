import Store, { Schema } from "electron-store";
import { StatusEffectBuffTypeFlags } from "meter-core/logger/data";

type WindowOptions = {
  X: number;
  Y: number;
  width: number;
  height: number;
  zoomFactor: number;
};

export type StoreType = {
  windows: {
    main: WindowOptions;
    damage_meter: WindowOptions;
  };
  general: {
    startMainHidden: boolean;
    startMainMinimized: boolean;
    closeToSystemTray: boolean;
    saveScreenshots: boolean;
    customLogPath: string | null;
    useRawSocket: false;
    listenPort: number;
  };
  shortcuts: {
    minimizeDamageMeter: string | null;
    resetSession: string | null;
    pauseDamageMeter: string | null;
  };
  uploads: {
    uploadLogs: boolean;
    uploadKey: string | null;
    api: string;
    endpoint: string;
    site: string;
    openOnUpload: boolean;
    uploadUnlisted: boolean;
    includeRegion: boolean;
  };
  damageMeter: {
    functionality: {
      dontResetOnZoneChange: boolean;
      pauseOnPhaseTransition: boolean;
      resetAfterPhaseTransition: boolean;
      autoMinimize: boolean;
      autoMinimizeTimer: number;
      minimizeToTaskbar: boolean;
      nameDisplay: string;
      nameDisplayV2: string;
    };
    design: {
      compactDesign: boolean;
      pinUserToTop: boolean;
      transparency: boolean;
      opacity: number;
    };
    header: {
      damage: boolean;
      dps: boolean;
      tank: boolean;
      bossHP: boolean;
    };
    tabs: {
      damage: boolean;
      deathTime: boolean;
      damagePercent: boolean;
      dps: boolean;
      critRate: boolean;
      dBuffedBySup: boolean;
      dDebuffedBySup: boolean;
      dPartyBuff: boolean;
      dSelfBuff: boolean;
      dOtherBuff: boolean;
      faRate: boolean;
      baRate: boolean;
      counterCount: boolean;
      hBuffedBySup: boolean;
      hDebuffedBySup: boolean;
      hPartyBuff: boolean;
      hSelfBuff: boolean;
      hOtherBuff: boolean;
      maxDmg: boolean;
      avgDmg: boolean;
      avgCast: boolean;
      totalHits: boolean;
      totalCasts: boolean;
      hpm: boolean;
      cpm: boolean;
      shieldGiven: boolean;
      shieldGotten: boolean;
      eshieldGiven: boolean;
      eshieldGotten: boolean;
    };
    buffFilter: {
      party: number;
      self: number;
      other: number;
    };
    classes: {
      [key: number]: string;
    };
  };
  logs: {
    minimumSessionDurationInMinutes: number;
    minimumEncounterDurationInMinutes: number;
    minimumDurationInMinutes: number;
    splitOnPhaseTransition: boolean;
    multithreadParsing: boolean;
  };
};

const storeSchema: Schema<StoreType> = {
  windows: {
    type: "object",
    properties: {
      main: {
        type: "object",
        properties: {
          X: { type: "number" },
          Y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          zoomFactor: { type: "number" },
        },
        default: {},
      },
      damage_meter: {
        type: "object",
        properties: {
          X: { type: "number" },
          Y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          zoomFactor: { type: "number" },
        },
        default: {},
      },
    },
    default: {},
  },
  general: {
    type: "object",
    properties: {
      startMainHidden: { type: "boolean", default: false },
      startMainMinimized: { type: "boolean", default: false },
      closeToSystemTray: { type: "boolean", default: true },
      saveScreenshots: { type: "boolean", default: true },
      customLogPath: { type: ["string", "null"], default: null },
      useRawSocket: { type: "boolean", default: false },
      listenPort: { type: "number", default: 6040 },
    },
    default: {},
  },
  shortcuts: {
    type: "object",
    properties: {
      minimizeDamageMeter: { type: ["string", "null"], default: null },
      resetSession: { type: ["string", "null"], default: null },
      pauseDamageMeter: { type: ["string", "null"], default: null },
    },
    default: {},
  },
  uploads: {
    type: "object",
    properties: {
      uploadLogs: { type: "boolean", default: false },
      uploadKey: { type: ["string", "null"], default: null },
      api: { type: "string", default: process.env.UPLOADS_API_URL },
      endpoint: { type: "string", default: process.env.UPLOADS_ENDPOINT },
      site: { type: "string", default: process.env.UPLOADS_LOGIN_URL },
      openOnUpload: { type: "boolean", default: false },
      uploadUnlisted: { type: "boolean", default: true },
      includeRegion: { type: "boolean", default: false },
    },
    default: {},
  },
  damageMeter: {
    type: "object",
    properties: {
      functionality: {
        type: "object",
        properties: {
          dontResetOnZoneChange: { type: "boolean", default: false },
          pauseOnPhaseTransition: { type: "boolean", default: true },
          resetAfterPhaseTransition: { type: "boolean", default: true },
          autoMinimize: { type: "boolean", default: false },
          autoMinimizeTimer: { type: "number", default: 60 },
          minimizeToTaskbar: { type: "boolean", default: false },
          nameDisplay: { type: "string", default: "name+class" },
          nameDisplayV2: { type: "string", default: "name+gear+class" },
        },
        default: {},
      },
      design: {
        type: "object",
        properties: {
          compactDesign: { type: "boolean", default: false },
          pinUserToTop: { type: "boolean", default: false },
          transparency: { type: "boolean", default: true },
          opacity: { type: "number", default: 0.9 },
        },
        default: {},
      },
      header: {
        type: "object",
        properties: {
          damage: { type: "boolean", default: true },
          dps: { type: "boolean", default: true },
          tank: { type: "boolean", default: false },
          bossHP: { type: "boolean", default: false },
        },
        default: {},
      },
      tabs: {
        type: "object",
        properties: {
          damage: { type: "boolean", default: true },
          deathTime: { type: "boolean", default: false },
          damagePercent: { type: "boolean", default: true },
          dps: { type: "boolean", default: true },
          critRate: { type: "boolean", default: true },
          dBuffedBySup: { type: "boolean", default: false },
          dDebuffedBySup: { type: "boolean", default: false },
          dPartyBuff: { type: "boolean", default: true },
          dSelfBuff: { type: "boolean", default: true },
          dOtherBuff: { type: "boolean", default: false },
          faRate: { type: "boolean", default: true },
          baRate: { type: "boolean", default: true },
          counterCount: { type: "boolean", default: true },
          hBuffedBySup: { type: "boolean", default: false },
          hDebuffedBySup: { type: "boolean", default: false },
          hPartyBuff: { type: "boolean", default: false },
          hSelfBuff: { type: "boolean", default: false },
          hOtherBuff: { type: "boolean", default: false },
          maxDmg: { type: "boolean", default: true },
          avgDmg: { type: "boolean", default: true },
          avgCast: { type: "boolean", default: false },
          totalHits: { type: "boolean", default: true },
          totalCasts: { type: "boolean", default: false },
          hpm: { type: "boolean", default: true },
          cpm: { type: "boolean", default: false },
          shieldGiven: { type: "boolean", default: true },
          shieldGotten: { type: "boolean", default: false },
          eshieldGiven: { type: "boolean", default: true },
          eshieldGotten: { type: "boolean", default: false },
        },
        default: {},
      },
      buffFilter: {
        type: "object",
        properties: {
          party: {
            type: "number",
            default:
              StatusEffectBuffTypeFlags.DMG |
              StatusEffectBuffTypeFlags.CRIT |
              StatusEffectBuffTypeFlags.ATKSPEED |
              StatusEffectBuffTypeFlags.COOLDOWN,
          },
          self: {
            type: "number",
            default:
              StatusEffectBuffTypeFlags.DMG |
              StatusEffectBuffTypeFlags.CRIT |
              StatusEffectBuffTypeFlags.ATKSPEED |
              StatusEffectBuffTypeFlags.COOLDOWN,
          },
          other: { type: "number", default: StatusEffectBuffTypeFlags.ANY },
        },
        default: {},
      },
      classes: {
        type: "object",
        patternProperties: {
          "^[0-9]+$": { type: "string" },
        },
        default: {
          [102]: "#ee2e48",
          [103]: "#7b9aa2",
          [104]: "#e1907e",
          [105]: "#ff9900",
          [112]: "#3c484f",
          [202]: "#b38915",
          [203]: "#22aa99",
          [204]: "#674598",
          [205]: "#66aa00",
          [302]: "#aaaa11",
          [303]: "#990099",
          [304]: "#316395",
          [305]: "#f6da6a",
          [312]: "#994499",
          [402]: "#a91a16",
          [403]: "#0099c6",
          [404]: "#109618",
          [502]: "#dd4477",
          [503]: "#4442a8",
          [504]: "#33670b",
          [505]: "#3b4292",
          [512]: "#6bcec2",
          [602]: "#a34af0",
          [603]: "#084ba3",
          [604]: "#3a945e",
        },
      },
    },
    default: {},
  },
  logs: {
    type: "object",
    properties: {
      minimumSessionDurationInMinutes: { type: "number", default: 1 },
      minimumEncounterDurationInMinutes: { type: "number", default: 0.5 },
      minimumDurationInMinutes: { type: "number", default: 0.0 },
      splitOnPhaseTransition: { type: "boolean", default: true },
      multithreadParsing: { type: "boolean", default: true },
    },
    default: {},
  },
};

export const store = new Store({
  name: "test",
  schema: storeSchema,
  migrations: {
    // kill me
    "*": (store) => {
      const oldSettings = store.get("settings") as string;
      if (oldSettings) {
        try {
          const settings = JSON.parse(oldSettings);
          const oldGeneral = settings?.general ?? {};
          const general: StoreType["general"] = {
            startMainHidden: oldGeneral?.startMainHidden ?? false,
            startMainMinimized: oldGeneral?.startMainMinimized ?? false,
            closeToSystemTray: oldGeneral?.closeToSystemTray ?? true,
            saveScreenshots: oldGeneral?.saveScreenshots ?? true,
            customLogPath: oldGeneral?.customLogPath ?? null,
            useRawSocket: oldGeneral?.useRawSocket ?? false,
            listenPort: oldGeneral?.listenPort ?? 6040,
          };
          store.set("general", general);
          const oldShortcuts = settings?.shortcuts ?? {};
          const shortcuts: StoreType["shortcuts"] = {
            minimizeDamageMeter: oldShortcuts?.minimizeDamageMeter?.value ?? null,
            resetSession: oldShortcuts?.resetSession?.value ?? null,
            pauseDamageMeter: oldShortcuts?.pauseDamageMeter?.value ?? null,
          };
          store.set("shortcuts", shortcuts);
          const oldUploads = settings?.uploads ?? {};
          const uploads: StoreType["uploads"] = {
            uploadLogs: oldUploads?.uploadLogs ?? false,
            uploadKey: oldUploads?.uploadKey ? (oldUploads?.uploadKey === "" ? null : oldUploads?.uploadKey) : null,
            api: oldUploads?.api?.value ?? process.env.UPLOADS_API_URL,
            endpoint: oldUploads?.endpoint?.value ?? process.env.UPLOADS_ENDPOINT,
            site: oldUploads?.site?.value ?? process.env.UPLOADS_SITE,
            openOnUpload: oldUploads?.openOnUpload ?? false,
            uploadUnlisted: oldUploads?.uploadUnlisted ?? false,
            includeRegion: oldUploads?.includeRegion ?? false,
          };
          store.set("uploads", uploads);
          const oldDamageMeter = settings?.damageMeter ?? {};
          const oldDamageMeterFunctionality = oldDamageMeter?.functionality ?? {};
          const oldDamageMeterDesign = oldDamageMeter?.design ?? {};
          const oldDamageMeterHeader = oldDamageMeter?.header ?? {};
          const oldDamageMeterTabs = oldDamageMeter?.tabs ?? {};
          const oldDamageMeterBuffFilter = settings?.buffFilter ?? {};
          const damageMeter: StoreType["damageMeter"] = {
            functionality: {
              dontResetOnZoneChange: oldDamageMeterFunctionality?.dontResetOnZoneChange ?? false,
              pauseOnPhaseTransition: oldDamageMeterFunctionality?.pauseOnPhaseTransition ?? true,
              resetAfterPhaseTransition: oldDamageMeterFunctionality?.resetAfterPhaseTransition ?? true,
              autoMinimize: oldDamageMeterFunctionality?.autoMinimize ?? false,
              autoMinimizeTimer: oldDamageMeterFunctionality?.autoMinimizeTimer ?? 60,
              minimizeToTaskbar: oldDamageMeterFunctionality?.minimizeToTaskbar ?? false,
              nameDisplay: oldDamageMeterFunctionality?.nameDisplay ?? "name+class",
              nameDisplayV2: oldDamageMeterFunctionality?.nameDisplayV2 ?? "name+gear+class",
            },
            design: {
              compactDesign: oldDamageMeterDesign?.compactDesign ?? false,
              pinUserToTop: oldDamageMeterDesign?.pinUserToTop ?? false,
              transparency: oldDamageMeterDesign?.transparency ?? true,
              opacity: oldDamageMeterDesign?.opacity ?? 0.9,
            },
            header: {
              damage: oldDamageMeterHeader?.damage?.enabled ?? true,
              dps: oldDamageMeterHeader?.dps?.enabled ?? true,
              tank: oldDamageMeterHeader?.tank?.enabled ?? false,
              bossHP: oldDamageMeterHeader?.bossHP?.enabled ?? false,
            },
            tabs: {
              damage: oldDamageMeterTabs?.damage?.enabled ?? true,
              deathTime: oldDamageMeterTabs?.deathTime?.enabled ?? false,
              damagePercent: oldDamageMeterTabs?.damagePercent?.enabled ?? true,
              dps: oldDamageMeterTabs?.dps?.enabled ?? true,
              critRate: oldDamageMeterTabs?.critRate?.enabled ?? true,
              dBuffedBySup: oldDamageMeterTabs?.dBuffedBySup?.enabled ?? false,
              dDebuffedBySup: oldDamageMeterTabs?.dDebuffedBySup?.enabled ?? false,
              dPartyBuff: oldDamageMeterTabs?.dPartyBuff?.enabled ?? true,
              dSelfBuff: oldDamageMeterTabs?.dSelfBuff?.enabled ?? true,
              dOtherBuff: oldDamageMeterTabs?.dOtherBuff?.enabled ?? false,
              faRate: oldDamageMeterTabs?.faRate?.enabled ?? true,
              baRate: oldDamageMeterTabs?.baRate?.enabled ?? true,
              counterCount: oldDamageMeterTabs?.counterCount?.enabled ?? true,
              hBuffedBySup: oldDamageMeterTabs?.hBuffedBySup?.enabled ?? false,
              hDebuffedBySup: oldDamageMeterTabs?.hDebuffedBySup?.enabled ?? false,
              hPartyBuff: oldDamageMeterTabs?.hPartyBuff?.enabled ?? false,
              hSelfBuff: oldDamageMeterTabs?.hSelfBuff?.enabled ?? false,
              hOtherBuff: oldDamageMeterTabs?.hOtherBuff?.enabled ?? false,
              maxDmg: oldDamageMeterTabs?.maxDmg?.enabled ?? true,
              avgDmg: oldDamageMeterTabs?.avgDmg?.enabled ?? true,
              avgCast: oldDamageMeterTabs?.avgCast?.enabled ?? false,
              totalHits: oldDamageMeterTabs?.totalHits?.enabled ?? true,
              totalCasts: oldDamageMeterTabs?.totalCasts?.enabled ?? false,
              hpm: oldDamageMeterTabs?.hpm?.enabled ?? true,
              cpm: oldDamageMeterTabs?.cpm?.enabled ?? false,
              shieldGiven: oldDamageMeterTabs?.shieldGiven?.enabled ?? true,
              shieldGotten: oldDamageMeterTabs?.shieldGotten?.enabled ?? false,
              eshieldGiven: oldDamageMeterTabs?.eshieldGiven?.enabled ?? true,
              eshieldGotten: oldDamageMeterTabs?.eshieldGotten?.enabled ?? false,
            },
            buffFilter: {
              party:
                oldDamageMeterBuffFilter?.party ??
                StatusEffectBuffTypeFlags.DMG |
                  StatusEffectBuffTypeFlags.CRIT |
                  StatusEffectBuffTypeFlags.ATKSPEED |
                  StatusEffectBuffTypeFlags.COOLDOWN,
              self:
                oldDamageMeterBuffFilter?.self ??
                StatusEffectBuffTypeFlags.DMG |
                  StatusEffectBuffTypeFlags.CRIT |
                  StatusEffectBuffTypeFlags.ATKSPEED |
                  StatusEffectBuffTypeFlags.COOLDOWN,
              other: oldDamageMeterBuffFilter?.other ?? StatusEffectBuffTypeFlags.ANY,
            },
            classes: {},
          };
          const oldDamageMeterClasses: Record<string, { color: string }> = settings?.classes ?? {};
          const oldClassesMapping: Record<string, [string, number]> = {
            Berserker: ["#ee2e48", 102],
            Destroyer: ["#7b9aa2", 103],
            Gunlancer: ["#e1907e", 104],
            Paladin: ["#ff9900", 105],
            Slayer: ["#3c484f", 112],
            Arcanist: ["#b38915", 202],
            Summoner: ["#22aa99", 203],
            Bard: ["#674598", 204],
            Sorceress: ["#66aa00", 205],
            Wardancer: ["#aaaa11", 302],
            Scrapper: ["#990099", 303],
            Soulfist: ["#316395", 304],
            Glaivier: ["#f6da6a", 305],
            Striker: ["#994499", 312],
            Deathblade: ["#a91a16", 402],
            Shadowhunter: ["#0099c6", 403],
            Reaper: ["#109618", 404],
            Sharpshooter: ["#dd4477", 502],
            Deadeye: ["#4442a8", 503],
            Artillerist: ["#33670b", 504],
            Machinist: ["#3b4292", 505],
            Gunslinger: ["#6bcec2", 512],
            Artist: ["#a34af0", 602],
            Aeromancer: ["#084ba3", 603],
            Alchemist: ["#3a945e", 604],
          };
          for (const [key, value] of Object.entries(oldDamageMeterClasses)) {
            const colorAndId = oldClassesMapping[key];
            if (colorAndId) {
              const [color, id] = colorAndId;
              damageMeter.classes[id] = value?.color ?? color;
            }
          }
          store.set("damageMeter", damageMeter);
          const oldLogs = settings?.logs ?? {};
          const logs: StoreType["logs"] = {
            minimumSessionDurationInMinutes: oldLogs?.minimumSessionDurationInMinutes ?? 1,
            minimumEncounterDurationInMinutes: oldLogs?.minimumEncounterDurationInMinutes ?? 0.5,
            minimumDurationInMinutes: oldLogs?.minimumDurationInMinutes ?? 0.0,
            splitOnPhaseTransition: oldLogs?.splitOnPhaseTransition ?? true,
            multithreadParsing: oldLogs?.multithreadParsing ?? true,
          };
          store.set("logs", logs);
        } catch (e) {}
        // @ts-ignore
        store.delete("settings");
      }
    },
  },
});
