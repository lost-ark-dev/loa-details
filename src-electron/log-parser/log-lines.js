import { tryParseInt } from "../util/helpers";

// logId = 0
export class LogMessage {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.message = lineSplit[2];
  }
}

// logId = 1
export class LogInitEnv {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.playerId = lineSplit[2];
  }
}

// logId = 2
export class LogPhaseTransition {
  constructor(lineSplit) {
    // TODO:
  }
}

// logId = 3
export class LogNewPc {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.classId = tryParseInt(lineSplit[4]);
    this.class = lineSplit[5] || "UnknownClass";
    /* this.level = tryParseInt(lineSplit[6]); */
    this.currentHp = tryParseInt(lineSplit[7]);
    this.maxHp = tryParseInt(lineSplit[8]);
  }
}

// logId = 4
export class LogNewNpc {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    //this.npcId = tryParseInt(lineSplit[3]);
    this.name = lineSplit[4] || "Unknown Entity";
    this.currentHp = tryParseInt(lineSplit[5]);
    this.maxHp = tryParseInt(lineSplit[6]);
  }
}

// logId = 5
export class LogDeath {
  constructor(lineSplit) {
    // TODO:
  }
}

// logId = 6
export class LogSkillStart {
  constructor(lineSplit) {
    // TODO:
  }
}

// logId = 7
export class LogSkillStage {
  constructor(lineSplit) {
    // TODO:
  }
}

// logId = 8
export class LogDamage {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.skillId = tryParseInt(lineSplit[4]);
    this.skillName = lineSplit[5] || "Unknown Skill";
    this.skillEffectId = tryParseInt(lineSplit[6]);
    this.skillEffect = lineSplit[7];
    this.targetId = lineSplit[8];
    this.targetName = lineSplit[9] || "Unknown Entity";
    this.damage = tryParseInt(lineSplit[10]);
    this.damageModifier = lineSplit[11] == 1;
    this.isCrit = lineSplit[12] == 1;
    this.isBackAttack = lineSplit[13] == 1;
    this.isFrontAttack = lineSplit[14] == 1;
    this.currentHp = tryParseInt(lineSplit[15]);
    this.maxHp = tryParseInt(lineSplit[16]);
  }
}

// logId = 9
export class LogHeal {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.healAmount = tryParseInt(lineSplit[4]);
    //this.currentHp = tryParseInt(lineSplit[5]);
  }
}

// logId = 10
export class LogBuff {
  constructor(lineSplit) {
    // TODO:
  }
}

// logId = 11
export class LogCounterattack {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    /* this.targetId = lineSplit[4];
    this.targetName = lineSplit[5] || "Unknown Entity"; */
  }
}
