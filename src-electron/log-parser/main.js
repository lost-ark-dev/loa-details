import { cloneDeep } from "lodash";
import log from "electron-log";
import { EventEmitter } from "events";

import * as LogLines from "./log-lines";
import { tryParseInt } from "../util/helpers";

const REMOVE_OVERKILL_DAMAGE = true; // TODO: add this to settings

const entityTemplate = {
  name: "",
  class: "",
  isPlayer: false,
  damageDealt: 0,
  damageTaken: 0,
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
  totalDamage: 0,
  maxDamage: 0,
  hits: {
    total: 0,
    crit: 0,
    backAttack: 0,
    frontAttack: 0,
  },
};

export class LogParser {
  constructor(isLive = false) {
    this.eventEmitter = new EventEmitter();
    this.isLive = isLive;
    this.resetTimer = null;
    this.dontResetOnZoneChange = false;
    this.resetState();
    this.encounters = [];

    if (this.isLive) {
      setInterval(this.broadcastStateChange.bind(this), 100);
    }
  }

  resetState() {
    log.debug("Resetting state");

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

    this.eventEmitter.emit("reset-state");
  }
  cancelReset() {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = null;
  }
  softReset() {
    const entitiesCopy = cloneDeep(this.game.entities);
    this.resetState();
    for (const entity of Object.keys(entitiesCopy)) {
      this.updateEntity(entity, {
        name: entitiesCopy[entity].name,
        class: entitiesCopy[entity].class,
        isPlayer: entitiesCopy[entity].isPlayer,
      });
    }
  }
  splitEncounter() {
    const curState = cloneDeep(this.game);
    if (
      curState.fightStartedOn != 0 && // no combat packets
      (curState.damageStatistics.totalDamageDealt != 0 ||
        curState.damageStatistics.totalDamageTaken) // no player damage dealt OR taken
    )
      this.encounters.push(curState);
    this.resetState();
  }

  broadcastStateChange() {
    this.eventEmitter.emit("state-change", this.game);
  }

  parseLogLine(line) {
    if (!line) return;

    const lineSplit = line.trim().split("|");
    if (lineSplit.length < 1 || !lineSplit[0]) return;

    const logType = tryParseInt(lineSplit[0]);

    switch (logType) {
      case 0:
        this.onMessage(lineSplit);
        break;
      case 1:
        this.onInitEnv(lineSplit);
        break;
      /* case 2:
        this.onPhaseTransition(lineSplit);
        break; */
      case 3:
        this.onNewPc(lineSplit);
        break;
      case 4:
        this.onNewNpc(lineSplit);
        break;
      /* case 5:
        this.onDeath(lineSplit);
        break; */
      /* case 6:
        this.onSkillStart(lineSplit);
        break;
      case 7:
        this.onSkillStage(lineSplit);
        break; */
      case 8:
        this.onDamage(lineSplit);
        break;
      case 9:
        this.onHeal(lineSplit);
        break;
      /* case 10:
        this.onBuff(lineSplit);
        break; */
      case 11:
        this.onCounterattack(lineSplit);
        break;
    }
  }

  updateEntity(entityId, values) {
    if (!(entityId in this.game.entities)) {
      this.game.entities[entityId] = {
        ...cloneDeep(entityTemplate),
        ...values,
      };
    } else {
      this.game.entities[entityId] = {
        ...this.game.entities[entityId],
        ...values,
      };
    }
  }

  // logId = 0
  onMessage(lineSplit) {
    const logLine = new LogLines.LogMessage(lineSplit);
    log.info(`onMessage: ${logLine.message}`);

    if (!logLine.message.startsWith("Arguments:")) {
      this.eventEmitter.emit("message", logLine.message);
    }
  }

  // logId = 1
  onInitEnv(lineSplit) {
    // const logLine = new LogLines.LogInitEnv(lineSplit);
    log.debug("onInitEnv");

    if (this.isLive) {
      if (this.dontResetOnZoneChange === false && this.resetTimer == null) {
        log.debug("Setting a reset timer");
        this.resetTimer = setTimeout(this.resetState.bind(this), 6000);
        this.eventEmitter.emit("message", "new-zone");
      }
    } else {
      this.splitEncounter();
    }
  }

  /* // logId = 2
  onPhaseTransition(lineSplit) {
    // TODO: encounter end?
  } */

  // logId = 3
  onNewPc(lineSplit) {
    const logLine = new LogLines.LogNewPc(lineSplit);
    log.debug(
      `onNewPc: ${logLine.id}, ${logLine.name}, ${logLine.classId}, ${logLine.class}`
    );

    this.updateEntity(logLine.id, {
      name: logLine.name,
      class: logLine.class,
      isPlayer: true,
    });
  }

  // logId = 4
  onNewNpc(lineSplit) {
    const logLine = new LogLines.LogNewNpc(lineSplit);
    log.debug(`onNewNpc: ${logLine.id}, ${logLine.name}`);

    this.updateEntity(logLine.id, {
      name: logLine.name,
      isPlayer: false,
    });
  }

  /* // logId = 5
  onDeath(lineSplit) {
    // TODO:
  } */

  /* // logId = 6
  onSkillStart(lineSplit) {
    // TODO:
  }

  // logId = 7
  onSkillStage(lineSplit) {
    // TODO:
  } */

  // logId = 8
  onDamage(lineSplit) {
    if (lineSplit.length < 16) return;

    const logLine = new LogLines.LogDamage(lineSplit);
    log.debug(
      `onDamage: ${logLine.id}, ${logLine.name}, ${logLine.skillId}, ${logLine.skillName}, ${logLine.skillEffectId}, ${logLine.skillEffect}, ${logLine.targetId}, ${logLine.targetName}, ${logLine.damage}`
    );

    this.updateEntity(logLine.id, {
      name: logLine.name,
    });

    this.updateEntity(logLine.targetId, {
      name: logLine.targetName,
    });

    if (!(logLine.skillName in this.game.entities[logLine.id].skills)) {
      this.game.entities[logLine.id].skills[logLine.skillName] = {
        ...cloneDeep(skillTemplate),
        ...{ name: logLine.skillName },
      };
    }

    // TODO: Not sure if this is fixed in the logger
    if (logLine.skillName === "Bleed" && logLine.damage > 10000000) return;

    const critCount = logLine.isCrit ? 1 : 0;
    const backAttackCount = logLine.isBackAttack ? 1 : 0;
    const frontAttackCount = logLine.isFrontAttack ? 1 : 0;

    this.game.entities[logLine.id].skills[logLine.skillName].totalDamage +=
      logLine.damage;
    if (
      logLine.damage >
      this.game.entities[logLine.id].skills[logLine.skillName].maxDamage
    )
      this.game.entities[logLine.id].skills[logLine.skillName].maxDamage =
        logLine.damage;

    this.game.entities[logLine.id].damageDealt += logLine.damage;
    this.game.entities[logLine.targetId].damageTaken += logLine.damage;

    if (logLine.skillName !== "Bleed") {
      this.game.entities[logLine.id].hits.total += 1;
      this.game.entities[logLine.id].hits.crit += critCount;
      this.game.entities[logLine.id].hits.backAttack += backAttackCount;
      this.game.entities[logLine.id].hits.frontAttack += frontAttackCount;

      this.game.entities[logLine.id].skills[logLine.skillName].hits.total += 1;
      this.game.entities[logLine.id].skills[logLine.skillName].hits.crit +=
        critCount;
      this.game.entities[logLine.id].skills[
        logLine.skillName
      ].hits.backAttack += backAttackCount;
      this.game.entities[logLine.id].skills[
        logLine.skillName
      ].hits.frontAttack += frontAttackCount;
    }

    const damageOwner = this.game.entities[logLine.id],
      damageTarget = this.game.entities[logLine.targetId];

    if (damageOwner.isPlayer) {
      this.game.damageStatistics.totalDamageDealt += logLine.damage;
      this.game.damageStatistics.topDamageDealt = Math.max(
        this.game.damageStatistics.topDamageDealt,
        damageOwner.damageDealt
      );
    }

    if (damageTarget.isPlayer) {
      this.game.damageStatistics.totalDamageTaken += logLine.damage;
      this.game.damageStatistics.topDamageTaken = Math.max(
        this.game.damageStatistics.topDamageTaken,
        damageTarget.damageTaken
      );
    }

    if (this.game.fightStartedOn === 0)
      this.game.fightStartedOn = +logLine.timestamp;
    this.game.lastCombatPacket = +logLine.timestamp;
  }

  // logId = 9
  onHeal(lineSplit) {
    // TODO:
  }

  /* // logId = 10
  onBuff(lineSplit) {
    // TODO:
  } */

  // logId = 11
  onCounterattack(lineSplit) {
    const logLine = new LogLines.LogCounterattack(lineSplit);
    log.debug(`onCounterattack: ${logLine.id}, ${logLine.name}`);

    this.updateEntity(logLine.id, {
      name: logLine.name,
    });

    // TODO: Add skill name from logger
    this.game.entities[logLine.id].hits.counter += 1;
  }
}
