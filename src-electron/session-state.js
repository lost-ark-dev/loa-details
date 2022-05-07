import { timeout } from "./util/timeout";
const _ = require("lodash");

const classRegex = /(.*)( )\(([^)]+)\)/;

const entityTemplate = {
  name: "",
  class: "",
  isPlayer: false,
  damageDealt: 0,
  damageTaken: 0,
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
    this.resetState();

    this.eventListenerWindows = {
      stateChange: [],
      message: [],
    };

    this.broadcastStateChange();
  }

  resetState() {
    this.game = {
      version: 1,
      lastBroadcastedVersion: 0,
      startedOn: +new Date(),
      fightStartedOn: 0,
      entities: {},
      damageStatistics: {
        totalDamageDealt: 0,
        topDamageDealt: 0,
        totalDamageTaken: 0,
        topDamageTaken: 0,
      },
    };
  }

  addEventListenerWindow(event, window) {
    this.eventListenerWindows[event].push(window);
  }

  onMessage(value) {
    console.log("Message:", value);

    this.eventListenerWindows.message.forEach((wndw) =>
      wndw.webContents.send("pcap-on-message", value)
    );
  }

  onNewZone(value) {
    console.log("New Zone:", value);

    this.resetState();
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
    console.log("Combat Event:", value);

    const dataSplit = value.split(",");

    const dmgOwner = this.disassembleEntityFromPacket(dataSplit[1]),
      dmgTarget = this.disassembleEntityFromPacket(dataSplit[2]);

    if (!Object.keys(this.game.entities).includes(dmgOwner.name))
      this.game.entities[dmgOwner.name] = {
        ..._.cloneDeep(entityTemplate),
        ...dmgOwner,
      };

    if (!Object.keys(this.game.entities).includes(dmgTarget.name))
      this.game.entities[dmgTarget.name] = {
        ..._.cloneDeep(entityTemplate),
        ...dmgTarget,
      };

    //const skillName = dataSplit[3]; // might use it later

    let damage;
    try {
      damage = parseInt(dataSplit[4]);
    } catch {
      damage = 0;
    }

    const critCount = dataSplit[5] === "1" ? 1 : 0;
    const backAttackCount = dataSplit[6] === "1" ? 1 : 0;
    const frontAttackCount = dataSplit[7] === "1" ? 1 : 0;
    const counterCount = dataSplit[8] === "1" ? 1 : 0;

    this.game.entities[dmgOwner.name].damageDealt += damage;
    this.game.entities[dmgTarget.name].damageTaken += damage;

    this.game.entities[dmgOwner.name].hits.total += 1;
    this.game.entities[dmgOwner.name].hits.crit += critCount;
    this.game.entities[dmgOwner.name].hits.backAttack += backAttackCount;
    this.game.entities[dmgOwner.name].hits.frontAttack += frontAttackCount;
    this.game.entities[dmgOwner.name].hits.counter += counterCount;

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

    if (this.game.fightStartedOn === 0) this.game.fightStartedOn = +new Date();

    this.game.version += 1;
  }

  async broadcastStateChange() {
    const ver = this.game.version;

    if (this.game.lastBroadcastedVersion != ver) {
      this.game.lastBroadcastedVersion = ver;

      this.eventListenerWindows.stateChange.forEach((wndw) =>
        wndw.webContents.send("pcap-on-state-change", this.game)
      );
    }

    await timeout(100);
    this.broadcastStateChange();
  }
}
