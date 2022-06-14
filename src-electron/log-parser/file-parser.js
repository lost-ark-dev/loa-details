import dayjs from "dayjs";
import log from "electron-log";
import { LogParser } from "./main";
import { v4 as uuidv4 } from "uuid";
import { mainFolder, parsedLogFolder } from "../util/directories";
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const logParserVersion = 6;

export async function parseLogs(event, splitOnPhaseTransition) {
  const unparsedLogs = await fsPromises.readdir(mainFolder);
  const parsedLogs = await fsPromises.readdir(parsedLogFolder);

  let completedJobs = 0;
  let totalJobs = unparsedLogs.length;
  event.reply("log-parser-status", {
    completedJobs,
    totalJobs,
  });

  for await (const filename of unparsedLogs) {
    try {
      const filenameSlice = filename.slice(0, -4);
      const jsonName = filenameSlice + ".json";
      const logStats = await fsPromises.stat(path.join(mainFolder, filename));

      if (parsedLogs.includes(jsonName)) {
        const { isOutdated } = await verifyLogFile(jsonName, logStats);
        if (isOutdated) {
          log.debug("Deleting old version of parsed log");
          await fsPromises.unlink(path.join(parsedLogFolder, jsonName));
        } else {
          continue;
        }
      }

      if (
        filename.startsWith("LostArk_") &&
        filename.endsWith(".log") &&
        filename.length > 12
      ) {
        const contents = await fsPromises.readFile(
          path.join(mainFolder, filename),
          "utf-8"
        );
        if (!contents) continue;

        const logParser = new LogParser((isLive = false));
        if (splitOnPhaseTransition === true)
          logParser.splitOnPhaseTransition = true;

        logParser.eventEmitter.on("message", (val) => {
          if (
            val === "new-zone" ||
            (splitOnPhaseTransition === true && val === "raid-end")
          ) {
            completedJobs++;
            totalJobs++;
            event.reply("log-parser-status", {
              completedJobs,
              totalJobs,
            });
          }
        });

        const lines = contents.split("\n").filter((x) => x != null && x != "");
        for (const line of lines) {
          await logParser.parseLogLine(line); // TODO: make this an async function?
        }
        logParser.splitEncounter();

        const encounters = logParser.encounters;
        if (encounters.length > 0) {
          const masterLog = {
            logParserVersion,
            mtime: logStats.mtime,
            encounters: [],
          };

          for await (const encounter of encounters) {
            const duration =
              encounter.lastCombatPacket - encounter.fightStartedOn;

            if (duration <= 1000) continue;

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

            await fsPromises.writeFile(
              path.join(parsedLogFolder, encounterFile),
              JSON.stringify({
                ...encounter,
                ...encounterDetails,
              })
            );
          }

          await fsPromises.writeFile(
            path.join(parsedLogFolder, jsonName),
            JSON.stringify(masterLog)
          );

          completedJobs++;
          event.reply("log-parser-status", {
            completedJobs,
            totalJobs,
          });
        }
      }
    } catch (e) {
      log.error(e);
      continue;
    }
  }
}

export async function getParsedLogs() {
  const parsedLogs = await fsPromises.readdir(parsedLogFolder);

  const res = [];

  for await (const filename of parsedLogs) {
    try {
      if (filename.slice(0, -5).endsWith("encounter")) continue;

      const contents = await fsPromises.readFile(
        path.join(parsedLogFolder, filename),
        "utf-8"
      );

      const parsedContents = await JSON.parse(contents);

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

async function verifyLogFile(jsonName, logStats) {
  const logFile = await fsPromises.readFile(
    path.join(parsedLogFolder, jsonName),
    "utf-8"
  );

  const parsedLogFile = await JSON.parse(logFile);

  // if parsed version is less than current version, delete it and re-parse it
  // or if parsed mtime is
  // if not, skip this log
  try {
    if (
      parsedLogFile.logParserVersion < logParserVersion ||
      logStats.mtime > new Date(parsedLogFile.mtime)
    ) {
      return { isOutdated: true };
    } else {
      return { isOutdated: false };
    }
  } catch {
    // possibly doesn't have mtime or broken format, just re-parse it
    return { isOutdated: true };
  }
}

export async function getLogData(filename) {
  try {
    const contents = await fsPromises.readFile(
      path.join(parsedLogFolder, filename),
      "utf-8"
    );
    return await JSON.parse(contents);
  } catch (e) {
    log.error(e);
    return {};
  }
}

export async function wipeParsedLogs() {
  const parsedLogs = await fsPromises.readdir(parsedLogFolder);
  for await (const filename of parsedLogs) {
    await fsPromises.unlink(path.join(parsedLogFolder, filename));
  }
}
