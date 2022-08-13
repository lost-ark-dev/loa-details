import axios from "axios";
import { getClassIdFromName, guardians } from "./helpers";
import { mainFolder } from "./directories";
import fs from "fs";
import log from "electron-log";

export const upload = async (sessionLog, appSettings) => {
  try {
    const session = reformat(sessionLog);

    if (!session) return undefined;
    validate(session);

    const bosses = getBosses(
      session.damageStatistics.totalDamageDealt,
      session.entities,
      0.2
    );

    session.entities = [
      ...session.entities.filter((e) => e.type === 3), // Players
      ...bosses,
    ];

    const apiUrl = appSettings.uploads.api.value;
    const uploadEndpoint = appSettings.uploads.endpoint.value;
    const uploadKey = appSettings.uploads.uploadKey;
    const includeRegion = appSettings.uploads.includeRegion;

    if (includeRegion) session.region = appSettings.general.server;
    session.unlisted = appSettings.uploads.uploadUnlisted;

    if (process.env.DEBUGGING) {
      fs.writeFile(
        mainFolder + "/debug/" + +new Date() + "-upload.json",
        JSON.stringify(session, null, 2),
        (err) => {
          if (err) log.error(err);
        }
      );
    }

    const upload = { key: uploadKey, data: session };
    const response = await axios.post(`${apiUrl}${uploadEndpoint}`, upload);

    return response.data;
  } catch (e) {
    log.error("Error uploading log: " + e);
    throw new Error(
      "Session upload failed: " + (process.env.DEBUGGING ? e : e.message)
    );
  }
};

export const validate = (session) => {
  if (session.firstPacket <= 0 || session.lastPacket <= 0) {
    throw new Error("Validating upload failed: session duration is invalid");
  }

  const players = session.entities.filter((e) => e.type === 3);
  if (players.length === 0) {
    throw new Error("Validating upload failed: no players found");
  }

  const allPlayersHaveSkills = players.every((e) => e.skills);
  if (!allPlayersHaveSkills) {
    throw new Error(
      "Validating upload failed: some players do not have skills"
    );
  }
};

export const DATA_INTERVAL = 5000;

export const reformat = (oldLog) => {
  if (oldLog.fightStartedOn === 0) return;

  const entities = reformatEntities(oldLog.entities);

  const session = {
    unlisted: oldLog.unlisted ?? true,
    firstPacket: oldLog.fightStartedOn,
    lastPacket: oldLog.lastCombatPacket,
    duration: oldLog.lastCombatPacket - oldLog.fightStartedOn,
    region: "Unknown",
    entities,
    damageStatistics: {
      ...oldLog.damageStatistics,
      dps: 0,
      dpsIntervals: [],
    },
  };

  const intervals = generateIntervals(session.firstPacket, session.lastPacket);
  session.damageStatistics.dpsIntervals = intervals;

  for (const e of session.entities) {
    if (e.type === 3) {
      e.stats.dpsOverTime = getEntityData(intervals, e, session.firstPacket);
      Object.values(e.skills).forEach((s) => delete s.breakdown);
    }
  }

  return session;
};

/**
 * Try to find bosses by checking if they've taken
 * at least `percent`% of the total damage
 *
 * @param {logDamage} total damage dealt during encounter
 * @param {any[]} entities entities from the log
 * @returns {any[]} potential boss entities
 */
export const getBosses = (logDamage, entities, percent = 0.25) => {
  // TODO: Temporary until I add dictionary of all bosses and their IDs

  const bosses = entities.filter(
    (e) => e.type !== 3 && e.stats.damageTaken >= percent * logDamage
  );

  for (const boss of bosses) {
    if (guardians.includes(boss.npcId)) boss.type = 2;
    else boss.type = 1;
  }

  return bosses;
};

export const reformatEntitySkills = (skills) => {
  const newSkills = {};

  skills = Object.entries(skills);
  for (const [id, skill] of skills) {
    const newSkill = {
      id: skill.id,
      name: skill.name,
      breakdown: skill.breakdown,
      stats: {
        casts: skill.hits.casts,
        hits: skill.hits.total,
        crits: skill.hits.crit,
        backHits: skill.hits.backAttack,
        frontHits: skill.hits.frontAttack,
        counters: skill.hits.counter,
        damageDealt: skill.totalDamage,
        topDamage: skill.maxDamage,
      },
    };
    newSkills[id] = newSkill;
  }

  return newSkills;
};

export const reformatEntities = (entities) => {
  const newEntities = [];

  entities = Object.values(entities);
  for (const entity of entities) {
    const skills = Object.values(entity.skills);
    if (skills.length < 2) continue;

    let classId = entity.classId;
    if (classId === 0) classId = getClassIdFromName(entity.class);

    const newEntity = {
      lastUpdate: entity.lastUpdate,
      id: entity.id,
      npcId: entity.npcId,
      name: entity.name,
      type: entity.isPlayer ? 3 : -1,
      class: entity.class,
      classId,
      gearLevel: entity.gearScore || 0,
      currentHp: entity.currentHp || 0,
      maxHp: entity.maxHp || 0,
      skills: reformatEntitySkills(entity.skills),
      stats: {
        casts: entity.hits.casts,
        hits: entity.hits.total,
        crits: entity.hits.crit,
        backHits: entity.hits.backAttack,
        frontHits: entity.hits.frontAttack,
        counters: entity.hits.counter,
        damageDealt: entity.damageDealt,
        healing: entity.healingDone,
        shielding: entity.shieldDone,
        damageTaken: entity.damageTaken,
        deathTime: entity.deathTime,
        deaths: entity.deaths,
      },
    };
    newEntities.push(newEntity);
  }

  return newEntities;
};

/**
 * Get the total damage dealt during a provided time range
 *
 * @param {number} begin timestamp of the first packet
 * @param {number} end timestamp of the last packet
 * @param {any} entity entity to calculate dps for
 * @returns {number} the dps an entity dealt in the provided time range
 */
export const getEntityDamageInRange = (begin, end, entity) => {
  const skills = Object.values(entity.skills);
  const damageDealtInRange = skills.reduce((acc, skill) => {
    const skillEntries = skill.breakdown.filter(
      (d) => d.timestamp >= begin && d.timestamp <= end
    );
    return acc + skillEntries.reduce((acc, d) => acc + d.damage, 0);
  }, 0);

  if (!damageDealtInRange || isNaN(damageDealtInRange)) return 0;
  return damageDealtInRange;
};

/**
 * Get the DPS of an entity over a duration
 *
 * @param {number} duration duration of the fight in milliseconds
 * @param {number} damage total damage dealt in the fight
 * @returns {string} the dps of the fight
 */
export const getEntityDPS = (duration, damage) => {
  return damage > 0 ? (damage / duration).toFixed(2) : "0";
};

/**
 *
 * @param {number} started - timestamp of the first packet
 * @param {number} ended - timestamp of the last packet
 * @returns {number[]} - array of dps intervals
 */
export const generateIntervals = (started, ended) => {
  const duration = ended - started;
  const intervals = [];

  const parts = duration / DATA_INTERVAL;
  for (let i = 0; i <= Math.floor(parts); i++) {
    if (i === Math.floor(parts)) intervals.push(parts * DATA_INTERVAL);
    else intervals.push(i * DATA_INTERVAL);
  }
  return intervals;
};

/**
 *
 * @param {number[]} intervals array of time intervals
 * @param {any} player player entity
 * @param {number} started timestamp of the first packet
 * @returns {number[]} array of dps values mapped to the intervals array
 */
export const getEntityData = (intervals, player, started) => {
  const data = [];

  intervals.forEach((i) => {
    const damage = getEntityDamageInRange(started, started + i, player);
    const dps = parseFloat(getEntityDPS(i / 1000, damage));
    data.push(dps ?? 0);
  });

  return data;
};
