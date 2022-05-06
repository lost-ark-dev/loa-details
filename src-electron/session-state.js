import { dialog } from "electron";
import { timeout } from "./util/timeout";

export class SessionState {
  constructor() {
    this.resetState();
    this.eventListenerWindows = {
      stateChange: [],
      message: [],
      data: [],
      error: [],
    };

    this.broadcastStateChange();
  }

  resetState() {
    this.game = {
      version: 1,
      lastBroadcastedVersion: 0,
      startedOn: +new Date(),
      fightStartedOn: 0,
      players: {},
      projectiles: {},
      damageStatistics: {
        totalDamageDealt: 0,
        topDamageDealt: 0,
        totalDamageTaken: 0,
        topDamageTaken: 0,
      },
    };
  }
  softResetState() {
    // keep player id's
    const playersCopy = { ...this.game.players };
    this.resetState();
    for (const _player of Object.keys(playersCopy)) {
      this.game.players[_player] = {
        ...playersCopy[_player],
        ...{
          damage: 0,
          damageTaken: 0,
        },
      };
    }
  }

  addEventListenerWindow(event, window) {
    this.eventListenerWindows[event].push(window);
  }

  onMessage(value) {
    /* this.eventListenerWindows.message.forEach((wndw) =>
      wndw.webContents.send("pcap-on-message", value)
    ); */

    console.log("Message:", value);
  }

  getProjectileById(id) {
    if (!Object.keys(this.game.projectiles).includes(id)) return null;
    return this.game.projectiles[id];
  }
  getPlayerById(id) {
    if (!Object.keys(this.game.players).includes(id)) return null;
    return this.game.players[id];
  }
  updatePlayerById(id, newValues) {
    if (!Object.keys(this.game.players).includes(id)) return null;
    for (const _key of Object.keys(newValues)) {
      this.game.players[id][_key] = newValues[_key];
    }
  }

  onData(value) {
    /* this.eventListenerWindows.data.forEach((wndw) =>
      wndw.webContents.send("pcap-on-data", value)
    ); */
    const dataSplit = value.split(",");

    if (dataSplit[0] === "new-instance") {
      // ex message : new-instance
      // description: flag
      this.resetState();
    } else if (dataSplit[0] === "new-player") {
      // ex message : new-player,1    ,$You,UnknwonClass,116887566
      // description: flag      ,isYou,name,class       ,id

      this.game.players[dataSplit[4]] = {
        id: dataSplit[4],
        isUser: dataSplit[1] === "1",
        name: dataSplit[2],
        class: dataSplit[3],
        damage: 0,
        damageTaken: 0,
      };
    } else if (dataSplit[0] === "new-projectile") {
      // ex message : new-projectile,116924174           ,116972014
      // description: flag          ,sourceId (playerId) ,projectileId
      this.game.projectiles[dataSplit[2]] = {
        id: dataSplit[2],
        sourceId: dataSplit[1],
      };
    } else if (dataSplit[0] === "skill-damage-notify") {
      // ex message : skill-damage-notify,116992910                       ,Bard     ,116934798,Sound Shock,1673,0   ,0         ,0
      // description: flag               ,sourceId (projectileId/playerId),className,targetId ,skillName  ,dmg ,crit,backAttack,frontAttack
      let owner = dataSplit[1];
      const projectile = this.getProjectileById(dataSplit[1]);
      const player = this.getPlayerById(dataSplit[1]);
      if (projectile || player) {
        // only players
        if (projectile) owner = this.getPlayerById(projectile.sourceId);
        else if (player) owner = player;

        if (owner) {
          if (
            dataSplit[2] !== "UnknownClass" &&
            owner.class &&
            owner.class !== dataSplit[2]
          ) {
            this.updatePlayerById(owner.id, { class: dataSplit[2] });
          }

          if (owner.id) {
            const damageNum = parseInt(dataSplit[5]) || 0;
            this.game.damageStatistics.totalDamageDealt += damageNum;

            const newDamage = owner.damage + damageNum;
            this.updatePlayerById(owner.id, {
              damage: newDamage,
            });

            this.game.damageStatistics.topDamageDealt = Math.max(
              this.game.damageStatistics.topDamageDealt,
              newDamage
            );
          }

          if (this.game.fightStartedOn === 0)
            this.game.fightStartedOn = +new Date();
        }
      } else {
        // damage taken player
        owner = this.getPlayerById(dataSplit[3]);
        if (owner) {
          const damageNum = parseInt(dataSplit[5]) || 0;
          this.game.damageStatistics.totalDamageTaken += damageNum;

          const newDamage = owner.damageTaken + damageNum;
          this.updatePlayerById(owner.id, {
            damageTaken: newDamage,
          });

          this.game.damageStatistics.topDamageTaken = Math.max(
            this.game.damageStatistics.topDamageTaken,
            newDamage
          );

          if (this.game.fightStartedOn === 0)
            this.game.fightStartedOn = +new Date();
        }
      }
    }

    this.game.version += 1;
  }
  onError(value) {
    this.eventListenerWindows.error.forEach((wndw) =>
      wndw.webContents.send("pcap-on-error", value)
    );

    if (value !== "oodle init failed" && value !== "oodle decompress failed") {
      dialog.showErrorBox("Error", value);
    }
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
