import { StoreType } from "app/types";

export type tabDisplayKey = keyof StoreType["damageMeter"]["tabs"];

export const tabDisplayName: Record<tabDisplayKey, string> = {
  damage: "Damage/Tanked",
  deathTime: "Death Time",
  damagePercent: "D% (Damage Percent)",
  dps: "DPS/TPS",
  critRate: "Crit Rate",
  dBuffedBySup: "Dmg % dealt during Support buffs",
  dDebuffedBySup: "Dmg % dealt during Support debuffs",
  dPartyBuff: "Dmg % dealt during party synergies",
  dSelfBuff: "Dmg % dealt during self synergies (set, food, engravings, skills)",
  dOtherBuff: "Dmg % dealt during other buffs",
  faRate: "Front Attack Rate",
  baRate: "Back Attack Rate",
  counterCount: "Counter Count",
  hBuffedBySup: "Hit % dealt during Support buffs",
  hDebuffedBySup: "Hit % dealt during Support debuffs",
  hPartyBuff: "Hit % dealt during party synergies",
  hSelfBuff: "Hit % dealt during self synergies (set, food, engravings, skills)",
  hOtherBuff: "Hit % dealt during other buffs",
  maxDmg: "Skill View / Max Damage",
  avgDmg: "Skill View / Average Damage",
  avgCast: "Skill View / Average Damage per Cast",
  totalHits: "Skill View / Total Hits",
  totalCasts: "Skill View / Total Casts",
  hpm: "Skill View / Hits per Minute",
  cpm: "Skill View / Casts per Minute",
  shieldGiven: "Tab: Shield applied to other players",
  shieldGotten: "Tab: Shield gotten from other players",
  eshieldGiven: "Tab: Effective (used up) shield given to other players",
  eshieldGotten: "Tab: Effective (used up) shield gotten from other players",
} as const;

export type headerDisplayKey = keyof StoreType["damageMeter"]["header"];

export const headerDisplayName: Record<headerDisplayKey, string> = {
  damage: "Damage",
  dps: "DPS",
  tank: "Tanked",
  bossHP: "Boss HP",
} as const;
