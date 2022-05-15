import { cloneDeep } from "lodash";
import log from "electron-log";
import fs from "fs";
import { classes, skills, skillEffects } from './translations/en';
import { encountersFolder } from './log-files/helper';
import { saveSettings, getSettings } from "./util/app-settings";
import { Gzip } from "./util/compression";
import axios from "axios";
import { shell } from "electron";
import { mainWindow } from "./electron-main";

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
  useCount: 0,
  totalDamage: 0,
};

export class SessionLogLine {
  constructor (line) {
    this.timestamp = parseInt(line[0]);
    this.sourceEntity = line[1];
    this.sourceEntityId = line[2];
    this.destinationEntity = line[3];
    this.destinationEntityId = line[4];
    this.skillId = line[5] || "0";
    this.skillSubId = line[6] || "0";
    this.skillName = line[7] || "";
    this.damage = line[8];
    this.heal = line[9];
    this.shield = line[10];
    this.stagger = line[11];
    this.critical = line[12];
    this.backAttack = line[13];
    this.frontAttack = line[14];
    this.counter = line[15];
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
      fs.writeFileSync(encounterFile, JSON.stringify(encounter));

      if (getSettings().uploads?.uploadLogs || false) {
        this.uploadSession(encounter).then((success) => {
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
      this.resetTimer = setTimeout(this.resetState.bind(this), 5000);
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
        classId: this.getClassIdFromName(player[3]),
        isPlayer,
      };
    } else {
      return { name: value || "Unknown Entity", class: "", isPlayer };
    }
  }

  onCombatEvent(value) {
    // log.debug("Combat Event");

    const logLine = new SessionLogLine(value.split(";"));
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

    if (!(logLine.skillId in this.game.entities[dmgOwner.name].skills))
      this.game.entities[dmgOwner.name].skills[logLine.skillId] = {
        ...cloneDeep(skillTemplate),
        ...{ name: logLine.skillName },
      };

    try {
      logLine.damage = parseInt(logLine.damage);
    } catch {
      logLine.damage = 0;
    }

    const critCount = logLine.critical === "1" ? 1 : 0;
    const backAttackCount = logLine.backAttack === "1" ? 1 : 0;
    const frontAttackCount = logLine.frontAttack === "1" ? 1 : 0;
    const counterCount = logLine.counter === "1" ? 1 : 0;

    if (this.game.entities[dmgOwner.name].skills[logLine.skillId].timestamps)
      this.game.entities[dmgOwner.name].skills[logLine.skillId].timestamps.push(logLine.timestamp);
    else
      this.game.entities[dmgOwner.name].skills[logLine.skillId].timestamps = [logLine.timestamp];

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
      encounter: "Unknown",
      entities: [],
      damageStatistics: clone.damageStatistics,
    }

    Object.entries(clone.entities).forEach(([entityName, content]) => {
      if (!content.isPlayer && !includeNonPlayers) return;

      reformatted.entities.push({
        name: entityName,
        class: parseInt(this.getClassIdFromName(content.class)),
        isPlayer: content.isPlayer,
        damageDealt: content.damageDealt,
        damageTaken: content.damageTaken,
        skills: Object.entries(content.skills).map(([skillId, skill]) => {
          return {
            id: parseInt(skillId),
            useCount: skill.useCount,
            totalDamage: skill.totalDamage,
            timestamps: skill.timestamps,
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

  uploadSession (session, compress = false) {
    return new Promise(async (resolve, reject) => {
      const settings = getSettings();
      try {
        const { uploadKey, apiUrl, loginUrl, uploadEndpoint, openOnUpload } = settings.uploads;
        const apiKey = uploadKey;
        if (!apiKey || apiKey === "" || apiKey.length !== 32) {
          log.error("No upload key found");
          reject(new Error("Invalid API Key"));
        } else {
          const upload = JSON.stringify({ key: apiKey, data: session })
          const uploadUrl = apiUrl + uploadEndpoint;
          let httpOptions = {
            url: uploadUrl,
            method: "PUT",
            responseType: 'json',
            headers: {
              "Content-Type": "application/json",
              "Content-Length": upload.length,
            },
            data: upload,
          }

          if (compress) {
            const compressed = await Gzip.compressString(upload);
            httpOptions.headers = { 'Content-Type': 'application/octet-stream' };
            httpOptions.data = compressed
          }
          log.debug(`Uploading session`);

          axios(httpOptions).then((response) => {
            log.debug(`Uploaded session to ${uploadUrl}: ${JSON.stringify(response.data)}`);

            this.onMessage({ name: "session-upload", message: `Uploaded Session: ${loginUrl}/logs/${response.data.id}`});
            if (openOnUpload) shell.openExternal(`${loginUrl}/logs/${response.data.id}`);

            if (settings.uploads.recentSessions.length > 24) settings.uploads.recentSessions.shift();
            settings.uploads.recentSessions.push({ id: response.data.id, time: +Date.now() });
            this.broadcastSettingsChange(settings);

            resolve(response.data);
          }).catch((httpErr) => {
            log.error(httpErr);
            this.onMessage({ name: "session-upload", message: `Session Upload Failed`, failed: true });
            reject(new Error(`Failed to upload session`));
          })
        }
      } catch (uploadErr) {
        log.error(uploadErr);
        this.onMessage("pcap-on-message", { name: "session-upload", message: `Session Upload Failed`, failed: true });
        reject(new Error(`Failed to upload session: ${uploadErr.message}`));
      }
    })
  }
}
