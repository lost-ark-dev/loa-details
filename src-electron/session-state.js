import { cloneDeep } from "lodash";
import log from "electron-log";

const classRegex = /(.*)( )\(([^)]+)\)/;

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
    counter: 0,
  },
};

export class SessionState {
  constructor() {
    this.dontResetOnZoneChange = false;

    this.eventListenerWindows = {
      stateChange: [],
      resetState: [],
      message: [],
    };

    this.resetTimer = null;
    this.resetState();

    setInterval(this.broadcastStateChange.bind(this), 250);
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
      this.resetTimer = setTimeout(this.resetState.bind(this), 6000);
      this.eventListenerWindows.message.forEach((wndw) => {
        try {
          wndw.webContents.send("pcap-on-message", "new-zone");
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
      return {
        name: player[1] || "Unknown Entity",
        class: player[3],
        isPlayer,
      };
    } else {
      return { name: value || "Unknown Entity", class: "", isPlayer };
    }
  }

  onCombatEvent(value) {
    log.debug("Combat Event:", value);

    const dataSplit = value.split("|#|");

    const dmgOwner = this.disassembleEntityFromPacket(dataSplit[0]),
      dmgTarget = this.disassembleEntityFromPacket(dataSplit[1]);

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

    const skillName = dataSplit[2] || "Unknown";
    if (!(skillName in this.game.entities[dmgOwner.name].skills))
      this.game.entities[dmgOwner.name].skills[skillName] = {
        ...cloneDeep(skillTemplate),
        ...{ name: skillName },
      };

    let damage;
    try {
      damage = parseInt(dataSplit[3]);
    } catch {
      damage = 0;
    }

    const critCount = dataSplit[4] === "1" ? 1 : 0;
    const backAttackCount = dataSplit[5] === "1" ? 1 : 0;
    const frontAttackCount = dataSplit[6] === "1" ? 1 : 0;
    const counterCount = dataSplit[7] === "1" ? 1 : 0;

    this.game.entities[dmgOwner.name].skills[skillName].totalDamage += damage;
    if (damage > this.game.entities[dmgOwner.name].skills[skillName].maxDamage)
      this.game.entities[dmgOwner.name].skills[skillName].maxDamage = damage;

    this.game.entities[dmgOwner.name].damageDealt += damage;
    this.game.entities[dmgTarget.name].damageTaken += damage;

    if (dataSplit[2] !== "Bleed") {
      this.game.entities[dmgOwner.name].hits.total += 1;
      this.game.entities[dmgOwner.name].hits.crit += critCount;
      this.game.entities[dmgOwner.name].hits.backAttack += backAttackCount;
      this.game.entities[dmgOwner.name].hits.frontAttack += frontAttackCount;
      this.game.entities[dmgOwner.name].hits.counter += counterCount;

      this.game.entities[dmgOwner.name].skills[skillName].hits.total += 1;
      this.game.entities[dmgOwner.name].skills[skillName].hits.crit +=
        critCount;
      this.game.entities[dmgOwner.name].skills[skillName].hits.backAttack +=
        backAttackCount;
      this.game.entities[dmgOwner.name].skills[skillName].hits.frontAttack +=
        frontAttackCount;
      this.game.entities[dmgOwner.name].skills[skillName].hits.counter +=
        counterCount;
    }

    if (dmgOwner.isPlayer) {
      this.game.damageStatistics.totalDamageDealt += damage;
      this.game.damageStatistics.topDamageDealt = Math.max(
        this.game.damageStatistics.topDamageDealt,
        this.game.entities[dmgOwner.name].damageDealt
      );
    }

    if (dmgTarget.isPlayer) {
      this.game.damageStatistics.totalDamageTaken += damage;
      this.game.damageStatistics.topDamageTaken = Math.max(
        this.game.damageStatistics.topDamageTaken,
        this.game.entities[dmgTarget.name].damageTaken
      );
    }

    const curTime = +new Date();
    if (this.game.fightStartedOn === 0) this.game.fightStartedOn = curTime;
    this.game.lastCombatPacket = curTime;
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
}
