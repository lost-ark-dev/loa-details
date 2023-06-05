import type { ProgressInfo } from "electron-updater";
import type { GameState } from "meter-core/logger/data";
import { GameStateFile, LogParserStatus, ParsedLogInfo } from "src-electron/log-parser/file-parser";

export type MessageEvent =
  | { message: "download-progress"; value: ProgressInfo }
  | {
      message: string;
      value?: unknown;
      async?: boolean;
    };

export interface MessageApi {
  send(channel: string, data: MessageEvent): void;
  receive(channel: "on-settings-change", func: (value: Settings) => void): void;
  receive(channel: "updater-message", func: (eventMessage: MessageEvent) => void): void;
  receive(channel: "on-settings-change", func: (value: Settings) => void): void;
  receive(channel: "pcap-on-state-change", func: (value: GameState) => void): void;
  receive(channel: "pcap-on-message", func: (value: string) => void): void;
  receive(channel: "uploader-message", func: (value: { failed: boolean; message: string }) => void): void;
  receive(channel: "parsed-log", func: (value: GameStateFile) => void): void;
  receive(channel: "log-parser-status", func: (value: LogParserStatus) => void): void;
  receive(channel: "parsed-logs-list", func: (value: ParsedLogInfo[]) => void): void;
  receive(channel: string, func: (...args: unknown[]) => void): void;
}

export interface WindowControlApi {
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  hide: () => void;
  setIgnoreMouseEvents: (ignore: boolean, options: Electron.IgnoreMouseEventsOptions) => void;
}

import type { Settings } from "src-electron/util/settings";

export const shortcutsId = {
  minimizeDamageMeter: "CommandOrControl+Down",
  resetSession: "CommandOrControl+Up",
  pauseDamageMeter: "CommandOrControl+Right",
} as const;

export const headerId = {
  damage: "Damage",
  dps: "DPS",
  tank: "Tanked",
  bossHP: "Boss HP",
} as const;

export const tabId = {
  damage: "Damage/Tanked",
  deathTime: "Death Time",
  damagePercent: "D% (Damage Percent)",
  dps: "DPS/TPS",
  critRate: "Crit Rate",
  dPartyBuff: "Tab: Dmg % dealt during party synergies",
  dSelfBuff: "Tab: Dmg % dealt during self synergies (set, food, engravings, skills)",
  dOtherBuff: "Tab: Dmg % dealt during other buffs",
  faRate: "Front Attack Rate",
  baRate: "Back Attack Rate",
  rdpsSynPercent: "Synergy %",
  counterCount: "Counter Count",
  hPartyBuff: "Tab: Hit % dealt during party synergies",
  hSelfBuff: "Tab: Hit % dealt during self synergies (set, food, engravings, skills)",
  hOtherBuff: "Tab: Hit % dealt during other buffs",
  maxDmg: "Skill View / Max Damage",
  avgDmg: "Skill View / Average Damage",
  avgCast: "Skill View / Average Damage per Cast",
  totalHits: "Skill View / Total Hits",
  totalCasts: "Skill View / Total Casts",
  hpm: "Skill View / Hits per Minute",
  cpm: "Skill View / Casts per Minute",
  rdpsTab: "Tab: Raid DPS/Contribution",
  shieldGiven: "Tab: Shield applied to other players",
  shieldGotten: "Tab: Shield gotten from other players",
  eshieldGiven: "Tab: Effective (used up) shield given to other players",
  eshieldGotten: "Tab: Effective (used up) shield gotten from other players",
} as const;

export const classesId = {
  102: ["Berserker", "#ee2e48"],
  103: ["Destroyer", "#7b9aa2"],
  104: ["Gunlancer", "#E1907E"],
  105: ["Paladin", "#ff9900"],
  112: ["Slayer", "#3c484f"],
  202: ["Arcanist", "#b38915"],
  203: ["Summoner", "#22aa99"],
  204: ["Bard", "#674598"],
  205: ["Sorceress", "#66aa00"],
  302: ["Wardancer", "#aaaa11"],
  303: ["Scrapper", "#990099"],
  304: ["Soulfist", "#316395"],
  305: ["Glaivier", "#f6da6a"],
  312: ["Striker", "#994499"],
  402: ["Deathblade", "#a91a16"],
  403: ["Shadowhunter", "#0099c6"],
  404: ["Reaper", "#109618"],
  502: ["Sharpshooter", "#dd4477"],
  503: ["Deadeye", "#4442a8"],
  504: ["Artillerist", "#33670b"],
  505: ["Machinist", "#3b4292"],
  512: ["Gunslinger", "#6bcec2"],
  602: ["Artist", "#a34af0"],
  603: ["Aeromancer", "#084ba3"],
  604: ["Alchemist", "#3a945e"],
} as const;

export interface ipc {
  getSettings(): Settings;
  onSettingsChanged(callback: (newSettings: Settings) => void): void;
  saveSettings(settings: Settings): void;
  appVersion(): string;
  openExternal(url: string): void;
}

export { Settings };

declare global {
  interface Window {
    messageApi: MessageApi;
    windowControlApi: WindowControlApi;
    helperApi: { getMeterDataPath: () => string };
    ipc: ipc;
  }
}
