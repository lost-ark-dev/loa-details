const tryParseInt = require("../util/helpers").tryParseInt;

// logId = 0
class LogMessage {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.message = lineSplit[2];
  }
}
module.exports.LogMessage = LogMessage;

// logId = 1
class LogInitEnv {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.playerId = lineSplit[2];
  }
}
module.exports.LogInitEnv = LogInitEnv;

// logId = 2
class LogPhaseTransition {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.phaseCode = tryParseInt(lineSplit[2]);
  }
}
module.exports.LogPhaseTransition = LogPhaseTransition;

// logId = 3
class LogNewPc {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.classId = tryParseInt(lineSplit[4]);
    this.class = lineSplit[5] || "UnknownClass";
    /* this.level = tryParseInt(lineSplit[6]); */
    this.gearScore = lineSplit[7];
    this.currentHp = tryParseInt(lineSplit[8]);
    this.maxHp = tryParseInt(lineSplit[9]);
  }
}
module.exports.LogNewPc = LogNewPc;

// logId = 4
class LogNewNpc {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    //this.npcId = tryParseInt(lineSplit[3]);
    this.name = lineSplit[4] || "Unknown Entity";
    this.currentHp = tryParseInt(lineSplit[5]);
    this.maxHp = tryParseInt(lineSplit[6]);
  }
}
module.exports.LogNewNpc = LogNewNpc;

// logId = 5
class LogDeath {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.killerId = lineSplit[4];
    this.killerName = lineSplit[5] || "Unknown Entity";
  }
}
module.exports.LogDeath = LogDeath;

// logId = 6
class LogSkillStart {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.skillId = lineSplit[4];
    this.skillName = lineSplit[5] || "Unknown Skill";
  }
}
module.exports.LogSkillStart = LogSkillStart;

// logId = 7
class LogSkillStage {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.skillId = lineSplit[4];
    this.skillName = lineSplit[5] || "Unknown Skill";
    this.skillStage = lineSplit[6];
  }
}
module.exports.LogSkillStage = LogSkillStage;

// logId = 8
class LogDamage {
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
module.exports.LogDamage = LogDamage;

// logId = 9
class LogHeal {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.healAmount = tryParseInt(lineSplit[4]);
    //this.currentHp = tryParseInt(lineSplit[5]);
  }
}
module.exports.LogHeal = LogHeal;

// logId = 10
class LogBuff {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.buffId = lineSplit[4];
    this.buffName = lineSplit[5];
    this.isNew = lineSplit[6] == 1;
    this.sourceId = lineSplit[7];
    this.sourceName = lineSplit[8] || "Unknown Entity";
    this.shieldAmount = tryParseInt(lineSplit[9]);
  }
}
module.exports.LogBuff = LogBuff;

// logId = 11
class LogCounterattack {
  constructor(lineSplit) {
    this.timestamp = new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    /* this.targetId = lineSplit[4];
    this.targetName = lineSplit[5] || "Unknown Entity"; */
  }
}
module.exports.LogCounterattack = LogCounterattack;
