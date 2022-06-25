const dayjs = require("dayjs");
const LogParser = require("./main");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const logParserVersion = 8;

module.exports = function (
  filename,
  parsedLogs,
  splitOnPhaseTransition,
  mainFolder,
  parsedLogFolder,
  callback
) {
  try {
    const filenameSlice = filename.slice(0, -4);
    const jsonName = filenameSlice + ".json";
    const logStats = fs.statSync(path.join(mainFolder, filename));

    if (parsedLogs.includes(jsonName)) {
      const { isOutdated } = verifyLogFile(jsonName, logStats, parsedLogFolder);
      if (isOutdated) {
        fs.unlinkSync(path.join(parsedLogFolder, jsonName));
      } else {
        return callback(null, "log already parsed");
      }
    }

    const contents = fs.readFileSync(path.join(mainFolder, filename), "utf-8");
    if (!contents) return callback(null, "empty log");

    const logParser = new LogParser((isLive = false));
    if (splitOnPhaseTransition === true)
      logParser.splitOnPhaseTransition = true;

    /* logParser.eventEmitter.on("message", (val) => {
      if (
        val === "new-zone" ||
        (splitOnPhaseTransition === true && val === "raid-end")
      ) {
        event.reply("log-parser-status", {
            completedJobs,
            totalJobs,
          });
      }
    }); */

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
        const duration = encounter.lastCombatPacket - encounter.fightStartedOn;

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

      return callback(null, "log parsed");
    }

    return callback(null, "no encounters found");
  } catch (e) {
    return callback(e, "log parser error");
  }
};

function verifyLogFile(jsonName, logStats, parsedLogFolder) {
  const logFile = fs.readFileSync(
    path.join(parsedLogFolder, jsonName),
    "utf-8"
  );

  const parsedLogFile = JSON.parse(logFile);

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
