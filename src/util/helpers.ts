// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import PCData from "/meter-data/databases/PCData.json";

import {
  EntityState,
  EntitySkills,
  Hits,
  StatusEffect,
} from "meter-core/logger/data";

export type EntryData = {
  hits: Hits;
  damageDealt: number;
  damageDealtDebuffedBy: Map<number, number>;
  damageDealtBuffedBy: Map<number, number>;
};
export type tabNames =
  | "dmg"
  | "tank"
  | "heal"
  | "shield_given"
  | "shield_gotten"
  | "eshield_gotten"
  | "eshield_given"
  | "party_buff_dmg"
  | "self_buff_dmg"
  | "other_buff_dmg"
  | "party_buff_hit"
  | "self_buff_hit"
  | "other_buff_hit";

export type EntityExtended = EntityState & {
  damagePercentageTotal?: string;
  damagePercentageTop?: string;
  tankPercentageTotal?: string;
  tankPercentageTop?: string;
  healPercentageTotal?: string;
  healPercentageTop?: string;
  shieldGivenPercentageTotal?: string;
  shieldGivenPercentageTop?: string;
  hits: Hits;
  shieldGottenPercentageTotal?: string;
  shieldGottenPercentageTop?: string;
  eshieldGivenPercentageTotal?: string;
  eshieldGivenPercentageTop?: string;
  eshieldGottenPercentageTotal?: string;
  eshieldGottenPercentageTop?: string;
};
export type EntitySkillsExtended = EntitySkills & {
  damagePercent?: string;
  relativePercent?: string;
};

export type DamageType =
  | "dmg"
  | "tank"
  | "heal"
  | "party_buff_dmg"
  | "party_buff_hit"
  | "self_buff_dmg"
  | "self_buff_hit"
  | "other_buff_dmg"
  | "other_buff_hit"
  | "shield_given"
  | "shield_gotten"
  | "eshield_given"
  | "eshield_gotten";

export function getShieldTableEntry(
  data: EntityExtended,
  damageType: DamageType,
  columnData: Map<number, StatusEffect>
): number {
  let ret = 0;
  if (damageType === "shield_given") {
    columnData.forEach((se, id) => {
      ret += data.shieldDoneBy.get(id) ?? 0;
    });
  } else if (damageType === "shield_gotten") {
    columnData.forEach((se, id) => {
      ret += data.shieldReceivedBy.get(id) ?? 0;
    });
  } else if (damageType === "eshield_given") {
    columnData.forEach((se, id) => {
      ret += data.damagePreventedWithShieldOnOthersBy.get(id) ?? 0;
    });
  } else if (damageType === "eshield_gotten") {
    columnData.forEach((se, id) => {
      ret += data.damagePreventedByShieldBy.get(id) ?? 0;
    });
  }
  return ret;
}

export function getBuffPercent(
  data: EntryData,
  damageType: DamageType,
  columnData: Map<number, StatusEffect>
) {
  const ret = new Map<number, number>();
  let totalPercent = 0;
  columnData.forEach((statusEffect, id) => {
    let val = 0;
    if (statusEffect.category === "buff" && damageType.includes("dmg")) {
      // Buff dmg
      val = ((data.damageDealtBuffedBy.get(id) ?? 0) / data.damageDealt) * 100;
    } else if (statusEffect.category === "buff" && damageType.includes("hit")) {
      // Buff hits

      val = ((data.hits.hitsBuffedBy.get(id) ?? 0) / data.hits.total) * 100;
    } else if (
      statusEffect.category === "debuff" &&
      damageType.includes("dmg")
    ) {
      // Debuff dmg

      val =
        ((data.damageDealtDebuffedBy.get(id) ?? 0) / data.damageDealt) * 100;
    } else if (
      statusEffect.category === "debuff" &&
      damageType.includes("hit")
    ) {
      // Debuff hits

      val = ((data.hits.hitsDebuffedBy.get(id) ?? 0) / data.hits.total) * 100;
    }
    totalPercent += val;
    ret.set(id, val);
  });
  ret.forEach((v, k, m) => {
    if (v === 0) m.delete(k);
  });
  ret.set(-1, totalPercent);
  return ret;
}
export function getIconPath(iconName: string | undefined): string {
  if (iconName) {
    const meterDataPath = window.helperApi.getMeterDataPath();
    return `${meterDataPath}/images/${iconName}`;
    //return new URL(`/meter-data/images/${iconName}`, import.meta.url).href;
  } else {
    return new URL("../assets/images/skills/unknown.png", import.meta.url).href;
  }
}

export function getClassName(id: number | undefined): string {
  return id ? PCData[id] ?? "" : "";
}
