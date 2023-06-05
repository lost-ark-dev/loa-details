import { headerId, tabId } from "app/shared";
import Store, { Schema } from "electron-store";
import { StatusEffectBuffTypeFlags } from "meter-core/logger/data";

type WindowOptions = {
  X: number;
  Y: number;
  width: number;
  height: number;
  zoomFactor: number;
};

export type Settings = {
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
    minimizeDamageMeter: string;
    resetSession: string;
    pauseDamageMeter: string;
  };
  uploads: {
    uploadLogs: boolean;
    uploadKey: string;
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
      displayEsther: boolean;
      estherColor: string;
      estherIncludeInTotal: boolean;
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
    header: (keyof typeof headerId)[];
    tabs: (keyof typeof tabId)[];
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

const schema: Schema<Settings> = {
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
      minimizeDamageMeter: { type: "string", default: "CommandOrControl+Down" },
      resetSession: { type: "string", default: "CommandOrControl+Up" },
      pauseDamageMeter: { type: "string", default: "CommandOrControl+Right" },
    },
    default: {},
  },
  uploads: {
    type: "object",
    properties: {
      uploadLogs: { type: "boolean", default: false },
      uploadKey: { type: "string", default: "" },
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
          nameDisplay: { type: "string", default: "name+gear+class" },
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
        type: "array",
        default: ["damage", "dps"],
      },
      tabs: {
        type: "array",
        default: [
          "damage",
          "damagePercent",
          "dps",
          "critRate",
          "dPartyBuff",
          "dSelfBuff",
          "faRate",
          "baRate",
          "rdpsSynPercent",
          "counterCount",
          "maxDmg",
          "avgDmg",
          "totalHits",
          "hpm",
          "rdpsTab",
          "shieldGiven",
          "eshieldGiven",
        ],
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
          102: "#ee2e48",
          103: "#7b9aa2",
          104: "#E1907E",
          105: "#ff9900",
          112: "#3c484f",
          202: "#b38915",
          203: "#22aa99",
          204: "#674598",
          205: "#66aa00",
          302: "#aaaa11",
          303: "#990099",
          304: "#316395",
          305: "#f6da6a",
          312: "#994499",
          402: "#a91a16",
          403: "#0099c6",
          404: "#109618",
          502: "#dd4477",
          503: "#4442a8",
          504: "#33670b",
          505: "#3b4292",
          512: "#6bcec2",
          602: "#a34af0",
          603: "#084ba3",
          604: "#3a945e",
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

export const settings = new Store<Settings>({
  name: "settings",
  schema,
  migrations: {},
});

// settings.clear();
