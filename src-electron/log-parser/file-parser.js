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
          log.debug("Deleting old version of parsed log");
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

/* ASYNC TESTING
export function verifyOldLog(logStats, jsonName) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(parsedLogFolder, jsonName),
      "utf-8",
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          const parsedOldLog = JSON.parse(data);

          // if parsed version is less than current version, delete it and re-parse it
          // or if parsed mtime is
          // if not, skip this log
          if (
            !parsedOldLog.logParserVersion ||
            parsedOldLog.logParserVersion < logParserVersion ||
            logStats.mtime > new Date(parsedOldLog.mtime)
          ) {
            log.debug("Deleting old version of parsed log");
            fs.unlinkSync(path.join(parsedLogFolder, jsonName));
            reject(new Error("Invalid old file, re-parsing"));
          } else {
            resolve("Nothing to do");
          };
        }
      }
    );
  })
}

export function parseLogAsync(logStats, filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(logFolder, filename),
      "utf-8",
      (err, contents) => {
        if (err) {
          log.debug(`Error parsing log: ${filename}, ${err.message}`);
          reject(err);
        } else {
          log.debug(`Parsing individual log: ${filename}`);
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

            const writes = [];
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

              writes.push(new Promise((resolveWrite, rejectWrite) => {
                fs.writeFile(
                  path.join(parsedLogFolder, encounterFile),
                  JSON.stringify({
                    ...encounter,
                    ...encounterDetails,
                  }),
                  (encounterWriteErr) => {
                    if (encounterWriteErr) {
                      log.error(`Error saving parsed log: ${encounterWriteErr.message}`)
                      rejectWrite(encounterWriteErr);
                    } else {
                      resolveWrite();
                    }
                  }
                );
              }));
            }

            Promise.all(writes).then(() => {
              fs.writeFile(
                path.join(parsedLogFolder, jsonName),
                JSON.stringify(masterLog),
                (masterLogWriteErr) => {
                  if (masterLogWriteErr) reject(masterLogWriteErr);
                  else resolve();
                }
              );
            }).catch((err) => {
              log.error(`Error saving parsed log: ${err.message}`)
              reject(err);
            });
          } else {
            resolve();
          }
        }
      }
    );
  })
}

export function parseLogsAsync() {
  return new Promise(async (resolve, reject) => {
    // Not going to async these calls
    const unparsedLogs = fs.readdirSync(logFolder);
    const parsedLogs = fs.readdirSync(parsedLogFolder);

    const operations = []
    for (const filename of unparsedLogs) {
      log.debug(`Parsing ${filename}`);
      const filenameSlice = filename.slice(0, -4);
      const jsonName = filenameSlice + ".json";
      const logStats = fs.statSync(path.join(logFolder, filename));

      if (parsedLogs.includes(jsonName)) {
        try {
          await verifyOldLog(logStats, jsonName)
          log.debug(`Old Log ${jsonName} is valid, skipping`)
          continue;
        } catch (err) {
          log.debug(`Old Log ${jsonName} is invalid, parsing`)
          operations.push(parseLogAsync(logStats, filename));
        }
      } else if (
        filename.startsWith("LostArk_") &&
        filename.endsWith(".log") &&
        filename.length > 12
      ) {
        log.debug(`Parsing log ${filename}`);
        operations.push(parseLogAsync(logStats, filename));
      }
    }
    Promise.all(operations).then(resolve).catch(reject);
  })
}

export function getParsedLogsAsync() {
  return new Promise((resolve, reject) => {
    fs.readdir(parsedLogFolder, (readDirErr, parsedLogs) => {
      if (readDirErr) {
        reject(readDirErr)
      } else {
        const res = [];

        for (const filename of parsedLogs) {
          try {
            if (filename.slice(0, -5).endsWith("encounter")) continue;
            res.push(new Promise((parseResolve, parseReject) => {
              fs.readFile(path.join(parsedLogFolder, filename), "utf-8", (readFileErr, contents) => {
                if (readFileErr) {
                  parseReject(readFileErr)
                } else {
                  const parsedContents = JSON.parse(contents);
                  const data = {
                    filename,
                    parsedContents,
                    date: new Date(dayjs(filename.slice(8, -5), "YYYY-MM-DD-HH-mm-ss")),
                  }
                  parseResolve(data);
                }
              });
            }));
          } catch (e) {
            log.error(e);
            continue;
          }
        }
        Promise.all(res).then((data) => {
          resolve(data)
        }).catch(reject)
      }
    });
  });
}
*/

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
