import { cloneDeep } from "lodash";
import log from "electron-log";
import fs from "fs";
import { classes, skills, skillEffects } from './translations/en';
import { encountersFolder } from './log-files/helper';
import { getSettings } from "./util/app-settings";
import { uploadSession } from "./util/uploads";

const classRegex = /(.*)( )\(([^)]+)\)/;

const base64Decode = (str) => {
  return Buffer.from(str, "base64").toString("utf8");
};

const entityTemplate = {
  name: "",
  class: "",
  isPlayer: false,
  damageDealt: 0,
  damageTaken: 0,
  gearScore: 0,
  skills: {},
  hits: {
    total: 0,
    crit: 0,
    backAttack: 0,
    frontAttack: 0,
    counter: 0,
  },
};

const skillTemplate = {
  name: "",
  useCount: 0,
  totalDamage: 0,
};

export class SessionLogLine {
  constructor (line) {
    this.timestamp = parseInt(line[0]);
    this.sourceEntity = line[1];
    this.sourceEntityId = line[2];
    this.sourceEntityType = line[3];
    this.sourceEntityGearScore = line[4];
    this.destinationEntity = line[5];
    this.destinationEntityId = line[6];
    this.destinationEntityType = line[7];
    this.destinationGearScore = line[8];
    this.skillId = line[9] || "0";
    this.skillSubId = line[10] || "0";
    this.skillName = line[11] || "";
    this.damage = line[12];
    this.heal = line[13];
    this.shield = line[14];
    this.stagger = line[15];
    this.critical = line[16];
    this.backAttack = line[17];
    this.frontAttack = line[18];
    this.counter = line[19];
  }
}

export class SessionState {
  constructor() {
    this.dontResetOnZoneChange = false;
    this.eventListenerWindows = {
      stateChange: [],
      resetState: [],
      message: [],
      settings: [],
    };

    this.resetTimer = null;
    this.resetState();

    setInterval(this.broadcastStateChange.bind(this), 250);
  }

  resetState() {
    log.debug("Resetting state");

    if (this.game && this.game.fightStartedOn !== 0) {
      const encounterFile = `${encountersFolder}/encounter-${+new Date()}.json`;
      const encounter = this.reformatStateForUpload(this.game);
      fs.writeFile(encounterFile, JSON.stringify(this.reformatStateForUpload(this.game, true)), (err) => {
        if (err) log.error(err);
      });

      if (getSettings().uploads?.uploadLogs || false) {
        uploadSession(this, encounter).then((success) => {
          log.debug("Upload successful:", success);
        }).catch((err) => {
          log.error(err);
        });
      }
    }

    this.resetTimer = null;

    const curTime = +new Date();

    this.game = {
      startedOn: curTime,
      lastCombatPacket: curTime,
      fightStartedOn: 0,
      entities: {},
      damageStatistics: {
        totalDamageDealt: 0,
        topDamageDealt: 0,
        totalDamageTaken: 0,
        topDamageTaken: 0,
      },
    };

    this.eventListenerWindows.resetState.forEach((wndw) => {
      try {
        wndw.webContents.send("pcap-on-reset-state", "1");
      } catch (e) {
        log.error(e);
      }
    });
  }
  cancelReset() {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = null;
  }

  addEventListenerWindow(event, window) {
    this.eventListenerWindows[event].push(window);
  }

  onMessage(value) {
    log.debug("onMessage:", value);

    this.eventListenerWindows.message.forEach((wndw) => {
      try {
        wndw.webContents.send("pcap-on-message", value);
      } catch (e) {
        log.error(e);
      }
    });
  }

  onNewZone(value) {
    log.debug("New Zone:", value);

    if (this.dontResetOnZoneChange === false && this.resetTimer == null) {
      log.debug("Setting a reset timer.");
      this.resetTimer = setTimeout(this.resetState.bind(this), 5500);
      this.eventListenerWindows.message.forEach((wndw) => {
        try {
          wndw.webContents.send("pcap-on-message", "new-zone");
        } catch (e) {
          log.error(e);
        }
      });
    }
  }

  onRaidEnd(value) {
    log.debug("Raid ended:" , value);

    if (value !== "PKTRaidResult" && this.resetTimer == null) {
      log.debug("Resetting on raid end.");
      this.resetTimer = setTimeout(this.resetState.bind(this), 5500);
      this.eventListenerWindows.message.forEach((wndw) => {
        try {
          wndw.webContents.send("pcap-on-message", "raid-end");
        } catch (e) {
          log.error(e);
        }
      });
    }
  }

  disassembleEntityFromPacket(value) {
    const isPlayer = value.includes("("); // has class name

    if (isPlayer) {
      const player = classRegex.exec(value);
      const [ gearScore, className ] = player[3].split(" ")
      return {
        name: player[1] || "Unknown Entity",
        class: className,
        classId: this.getClassIdFromName(className),
        gearScore,
        isPlayer,
      };
    } else {
      return { name: value || "Unknown Entity", class: "", isPlayer };
    }
  }

  onCombatEvent(value) {
    log.debug("Combat Event");
    try {
      const decoded = base64Decode(value);
      const logLine = new SessionLogLine(decoded.split(";"));
      log.debug(decoded);

      const dmgOwner = this.disassembleEntityFromPacket(logLine.sourceEntity)
      const dmgTarget = this.disassembleEntityFromPacket(logLine.destinationEntity);

      if (!(dmgOwner.name in this.game.entities))
        this.game.entities[dmgOwner.name] = {
          ...cloneDeep(entityTemplate),
          ...dmgOwner,
        };

      if (!(dmgTarget.name in this.game.entities))
        this.game.entities[dmgTarget.name] = {
          ...cloneDeep(entityTemplate),
          ...dmgTarget,
        };

      if (
        dmgOwner.class &&
        dmgOwner.name in this.game.entities &&
        dmgOwner.class !== this.game.entities[dmgOwner.name].class
      ) {
        this.game.entities[dmgOwner.name].class = dmgOwner.class;
        this.game.entities[dmgOwner.name].isPlayer = true;
      }

      if (logLine.skillId === "0" && logLine.skillSubId !== "0") {
        let id = logLine.skillSubId.substring(0, logLine.skillSubId.length-1);
        if (dmgOwner.isPlayer && !this.classSkillExists(dmgOwner.classId, id)) {
          log.debug(`Skill ${logLine.skillSubId} is a skill effect`);
          // Is most likely a skill effect
          id = logLine.skillSubId;
          logLine.skillName = skillEffects[id];
        }
        logLine.skillId = id !== "0" ? id : "0";
      }

      if (!(logLine.skillId in this.game.entities[dmgOwner.name].skills)) {
        this.game.entities[dmgOwner.name].skills[logLine.skillId] = {
          ...cloneDeep(skillTemplate),
          ...{ name: logLine.skillName },
        };
      }

      try {
        logLine.damage = parseInt(logLine.damage);
      } catch {
        logLine.damage = 0;
      }

      const critCount = logLine.critical === "1" ? 1 : 0;
      const backAttackCount = logLine.backAttack === "1" ? 1 : 0;
      const frontAttackCount = logLine.frontAttack === "1" ? 1 : 0;
      const counterCount = logLine.counter === "1" ? 1 : 0;

      const skillEntry = {
        isCrit: critCount === 1,
        isBackAttack: backAttackCount === 1,
        isFrontAttack: frontAttackCount === 1,
        isCounter: counterCount === 1,
        damage: logLine.damage,
        timestamp: logLine.timestamp,
      };

      if (this.game.entities[dmgOwner.name].skills[logLine.skillId].history) {
        this.game.entities[dmgOwner.name].skills[logLine.skillId].history.push(skillEntry);
      } else {
        this.game.entities[dmgOwner.name].skills[logLine.skillId].history = [skillEntry];
      }

      this.game.entities[dmgOwner.name].skills[logLine.skillId].totalDamage += logLine.damage;
      this.game.entities[dmgOwner.name].skills[logLine.skillId].useCount += 1;
      this.game.entities[dmgOwner.name].damageDealt += logLine.damage;

      this.game.entities[dmgTarget.name].damageTaken += logLine.damage;

      if (logLine.skillName !== "Bleed") {
        this.game.entities[dmgOwner.name].hits.total += 1;
        this.game.entities[dmgOwner.name].hits.crit += critCount;
        this.game.entities[dmgOwner.name].hits.backAttack += backAttackCount;
        this.game.entities[dmgOwner.name].hits.frontAttack += frontAttackCount;
        this.game.entities[dmgOwner.name].hits.counter += counterCount;
      }

      if (dmgOwner.isPlayer) {
        this.game.damageStatistics.totalDamageDealt += logLine.damage;
        this.game.damageStatistics.topDamageDealt = Math.max(
          this.game.damageStatistics.topDamageDealt,
          this.game.entities[dmgOwner.name].damageDealt
        );
      }

      if (dmgTarget.isPlayer) {
        this.game.damageStatistics.totalDamageTaken += logLine.damage;
        this.game.damageStatistics.topDamageTaken = Math.max(
          this.game.damageStatistics.topDamageTaken,
          this.game.entities[dmgTarget.name].damageTaken
        );
      }

      const curTime = +new Date();
      if (this.game.fightStartedOn === 0) {
        this.game.startedOn = curTime;
        this.game.fightStartedOn = curTime;
      }
      this.game.lastCombatPacket = curTime;
    } catch (logErr) {
      log.error(logErr);
    }
  }

  broadcastStateChange() {
    this.eventListenerWindows.stateChange.forEach((wndw) => {
      try {
        wndw.webContents.send("pcap-on-state-change", this.game);
      } catch (e) {
        log.error(e);
      }
    });
  }

  broadcastSettingsChange(settings) {
    this.eventListenerWindows.settings.forEach((window) => {
      try {
        window.webContents.send("on-settings-change", settings);
      } catch (er) {
        log.error(er);
      }
    })
  }

  reformatStateForUpload (state, includeNonPlayers = false) {
    const clone = cloneDeep(state);
    const settings = getSettings();

    let reformatted = {
      started: clone.fightStartedOn,
      ended: clone.lastCombatPacket,
      server: settings?.uploads?.server ?? "Unknown",
      region: settings?.uploads?.region ?? "Unknown",
      entities: [],
      damageStatistics: clone.damageStatistics,
    }

    Object.entries(clone.entities).forEach(([entityName, content]) => {
      if (!content.isPlayer && !includeNonPlayers) return;
      if (includeNonPlayers && !content.isPlayer && entityName === "Unknown Entity") return; // Skip unknown entities

      reformatted.entities.push({
        name: entityName,
        class: content.isPlayer ? parseInt(this.getClassIdFromName(content.class)) : entityName,
        isPlayer: content.isPlayer,
        damageDealt: content.damageDealt,
        damageTaken: content.damageTaken,
        gearScore: content.gearScore || 0,
        skills: Object.entries(content.skills).map(([skillId, skill]) => {
          return {
            id: parseInt(skillId),
            useCount: skill.useCount,
            totalDamage: skill.totalDamage,
            history: skill.history,
          };
        }),
        stats: {
          totalHits: content.hits.total,
          crits: content.hits.crit,
          backAttacks: content.hits.backAttack,
          frontAttacks: content.hits.frontAttack,
          counters: content.hits.counter,
        },
      })
    })

    return reformatted;
  }

  getClassIdFromName (className) {
    try {
      return parseInt(Object.entries(classes).find(([id, name]) => name === className)[0]);
    } catch(err) {
      log.debug(err);
      return 0;
    }
  }

  classSkillExists (classId, skillId) {
    try {
      let classSkills = Object.keys(skills[classId]);
      if (classSkills.includes(skillId)) return true;
      return false;
    } catch {
      return false;
    }
  }
}
