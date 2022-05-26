import getPath from "platform-folders";
import dayjs from "dayjs";
import log from "electron-log";
import { LogParser } from "./main";
import { v4 as uuidv4 } from "uuid";

const fs = require("fs");
const path = require("path");

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

export const logFolder = path.join(getPath("documents"), "Lost Ark Logs");
if (!fs.existsSync(logFolder)) {
  fs.mkdirSync(logFolder);
}

const logParserVersion = 1;
const parsedFolderName = "parsed";
const parsedLogFolder = path.join(logFolder, parsedFolderName);
if (!fs.existsSync(parsedLogFolder)) {
  fs.mkdirSync(parsedLogFolder);
}

export function parseLogs() {
  const unparsedLogs = fs.readdirSync(logFolder);
  const parsedLogs = fs.readdirSync(parsedLogFolder);

  for (const filename of unparsedLogs) {
    try {
      const filenameSlice = filename.slice(0, -4);
      const jsonName = filenameSlice + ".json";
      const logStats = fs.statSync(path.join(logFolder, filename));

      if (parsedLogs.includes(jsonName)) {
        const oldParsedLog = fs.readFileSync(
          path.join(parsedLogFolder, jsonName),
          "utf-8"
        );
        const parsedOldLog = JSON.parse(oldParsedLog);

        // if parsed version is less than current version, delete it and re-parse it
        // or if parsed mtime is
        // if not, skip this log
        if (
          !parsedOldLog.logParserVersion ||
          parsedOldLog.logParserVersion < logParserVersion ||
          logStats.mtime > new Date(parsedOldLog.mtime)
        ) {
          log.info("Deleting old version of parsed log");
          fs.unlinkSync(path.join(parsedLogFolder, jsonName));
        } else continue;
      }

      if (
        filename.startsWith("LostArk_") &&
        filename.endsWith(".log") &&
        filename.length > 12
      ) {
        const contents = fs.readFileSync(
          path.join(logFolder, filename),
          "utf-8"
        );
        if (!contents) continue;

        const logParser = new LogParser((isLive = false));

        const lines = contents.split("\n").filter((x) => x != null && x != "");
        for (const line of lines) {
          logParser.parseLogLine(line);
        }
        logParser.splitEncounter();
        const encounters = logParser.encounters;
        if (encounters.length > 0) {
          const masterLog = {
            logParserVersion,
            mtime: logStats.mtime,
            encounters: [],
          };
          for (const encounter of encounters) {
            const duration =
              encounter.lastCombatPacket - encounter.fightStartedOn;

            let mostDamageTakenEntity = {
              name: "",
              damageTaken: 0,
              isPlayer: false,
            };

            for (const i of Object.values(encounter.entities)) {
              if (i.damageTaken > mostDamageTakenEntity.damageTaken) {
                mostDamageTakenEntity = {
                  name: i.name,
                  damageTaken: i.damageTaken,
                  isPlayer: i.isPlayer,
                };
              }
            }

            const encounterDetails = {
              duration,
              mostDamageTakenEntity,
            };

            const encounterId = uuidv4();
            const encounterFile = `${filenameSlice}_${encounterId}_encounter.json`;
            masterLog.encounters.push({
              encounterId,
              encounterFile,
              ...encounterDetails,
            });

            fs.writeFileSync(
              path.join(parsedLogFolder, encounterFile),
              JSON.stringify({
                ...encounter,
                ...encounterDetails,
              })
            );
          }

          fs.writeFileSync(
            path.join(parsedLogFolder, jsonName),
            JSON.stringify(masterLog)
          );
        }
      }
    } catch (e) {
      log.error(e);
      continue;
    }
  }
}

export function getParsedLogs() {
  const parsedLogs = fs.readdirSync(parsedLogFolder);

  const res = [];

  for (const filename of parsedLogs) {
    try {
      if (filename.slice(0, -5).endsWith("encounter")) continue;

      const contents = fs.readFileSync(
        path.join(parsedLogFolder, filename),
        "utf-8"
      );

      const parsedContents = JSON.parse(contents);

      res.push({
        filename,
        parsedContents,
        date: new Date(dayjs(filename.slice(8, -5), "YYYY-MM-DD-HH-mm-ss")),
      });
    } catch (e) {
      log.error(e);
      continue;
    }
  }

  return res;
}

export function getLogData(filename) {
  try {
    const contents = fs.readFileSync(
      path.join(parsedLogFolder, filename),
      "utf-8"
    );
    return JSON.parse(contents);
  } catch (e) {
    log.error(e);
    return {};
  }
}
