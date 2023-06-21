import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { IpcMainEvent } from "electron";
import log from "electron-log";
import { promises as fsPromises, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { mainFolder, parsedLogFolder } from "../util/directories";
import { ReplayLogger } from "meter-core/logger/logger";
import { Parser } from "meter-core/logger/parser";
import { MeterData } from "meter-core/data";
import { GameState, PARSED_LOG_VERSION } from "meter-core/logger/data";
import { randomUUID } from "crypto";

dayjs.extend(customParseFormat);
export type LogParserStatus = {
  completedJobs: number;
  totalJobs: number;
};
export type MasterLog = {
  encounters: Encounter[];
};
export type GameStateFile = {
  duration: number;
  mostDamageTakenEntity: {
    name: string;
    damageTaken: number;
    isPlayer: boolean;
  };
} & GameState;
export async function parseLogs(
  event: IpcMainEvent,
  clientId: string,
  splitOnPhaseTransition: boolean,
  meterData: MeterData,
  liveLogName: string
) {
  const unparsedLogs = await fsPromises.readdir(mainFolder);
  const parsedLogs = await fsPromises.readdir(parsedLogFolder);

  let mainJson: { [key: string]: { mtime: Date; logParserVersion: number } } = {
    /*
    "example.log":{
      mtime: ...,
      logParserVersion: ...
    }
    */
  };

  if (unparsedLogs.includes("main.json")) {
    const mainStr = await fsPromises.readFile(
      path.join(mainFolder, "main.json"),
      "utf-8"
    );
    mainJson = JSON.parse(mainStr) as {
      [key: string]: { mtime: Date; logParserVersion: number };
    };
  }

  let completedJobs = 0,
    totalJobs = 0;

  if (event)
    event.reply("log-parser-status", {
      completedJobs,
      totalJobs: 1,
    });

  for (const filename of unparsedLogs) {
    // Check if filename fits the format "LostArk_2020-01-01-00-00-00.log"
    if (!filename.match(/^LostArk_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}.raw$/))
      continue;

    const filenameSlice = filename.slice(0, -4);
    const jsonName = filenameSlice + ".json";
    const logStats = await fsPromises.stat(path.join(mainFolder, filename));

    // If file is parsed before, verify the validity of it
    if (parsedLogs.includes(jsonName)) {
      let shouldUnlink = false;
      if (Object.keys(mainJson).includes(filename)) {
        if (
          new Date(mainJson[filename].mtime).getTime() <
            new Date(logStats.mtime).getTime() ||
          mainJson[filename].logParserVersion < PARSED_LOG_VERSION
        ) {
          shouldUnlink = true;
        }
      } else {
        shouldUnlink = true;
      }

      if (shouldUnlink) {
        log.info("removing old log", jsonName);
        await fsPromises.unlink(path.join(parsedLogFolder, jsonName));
      } else {
        log.info("log already parsed and valid, skipping it", jsonName);
        continue;
      }
    }

    totalJobs++;

    const logger = new ReplayLogger();

    const parser = new Parser(logger, meterData, clientId, {
      isLive: false,
      splitOnPhaseTransition,
    });
    logger.on("fileEnd", (endEvent: string) => {
      completedJobs++;
      const encounters = parser.encounters;
      const output = parseLog(encounters, parsedLogFolder, filenameSlice);

      if (endEvent === "closed") {
        log.info("invalid log file: ", filename);
      } else if (output === "no encounters found" || endEvent === "closed") {
        // remove log file if not current file
        if (filename !== liveLogName) {
          log.info("removing empty log", filename);
          unlinkSync(path.join(mainFolder, filename));
        }
      } else {
        mainJson[filename] = {
          mtime: new Date(logStats.mtime),
          logParserVersion: PARSED_LOG_VERSION,
        };
      }

      if (event) {
        event.reply("log-parser-status", {
          completedJobs,
          totalJobs,
        });
      }

      if (completedJobs === totalJobs) {
        writeFileSync(
          path.join(mainFolder, "main.json"),
          JSON.stringify(mainJson)
        );
      }
    });

    logger.readLogByChunk(path.join(mainFolder, filename));
  }

  if (totalJobs === 0 && event)
    event.reply("log-parser-status", {
      completedJobs: 1,
      totalJobs: 1,
    });
}

function parseLog(
  encounters: GameState[],
  parsedLogFolder: string,
  filenameSlice: string
): "log parsed" | "no encounters found" | "log parser error" {
  try {
    if (encounters.length > 0) {
      const masterLog: MasterLog = { encounters: [] };

      for (const encounter of encounters) {
        const duration = encounter.lastCombatPacket - encounter.fightStartedOn;

        if (duration <= 1000) continue;

        let mostDamageTakenEntity = {
          name: "",
          damageTaken: 0,
          isPlayer: false,
        };

        encounter.entities.forEach((i) => {
          if (i.damageTaken > mostDamageTakenEntity.damageTaken) {
            mostDamageTakenEntity = {
              name: i.name,
              damageTaken: i.damageTaken,
              isPlayer: i.isPlayer,
            };
          }
        });

        const encounterDetails = {
          duration,
          mostDamageTakenEntity,
        };

        const encounterId = randomUUID();
        const encounterFile = `${filenameSlice}_${encounterId}_encounter.json`;
        masterLog.encounters.push({
          encounterId,
          encounterFile,
          ...encounterDetails,
        });

        writeFileSync(
          path.join(parsedLogFolder, encounterFile),
          JSON.stringify(
            {
              ...encounter,
              ...encounterDetails,
            },
            replacer
          )
        );
      }

      writeFileSync(
        path.join(parsedLogFolder, filenameSlice + ".json"),
        JSON.stringify(masterLog)
      );

      return "log parsed";
    }

    return "no encounters found";
  } catch (e) {
    return "log parser error";
  }
}
export type ParsedLogInfo = {
  filename: string;
  parsedContents: MasterLog;
  date: Date;
};
export async function getParsedLogs(): Promise<ParsedLogInfo[]> {
  const parsedLogs = await fsPromises.readdir(parsedLogFolder);

  const res = [];

  for await (const filename of parsedLogs) {
    try {
      if (filename.slice(0, -5).endsWith("encounter")) continue;

      const contents = await fsPromises.readFile(
        path.join(parsedLogFolder, filename),
        "utf-8"
      );

      const parsedContents = (await JSON.parse(contents, reviver)) as MasterLog;

      res.push({
        filename,
        parsedContents,
        date: new Date(
          dayjs(filename.slice(8, -5), "YYYY-MM-DD-HH-mm-ss").toDate()
        ),
      });
    } catch (e) {
      log.error(e);
      continue;
    }
  }

  return res;
}

export async function getLogData(
  filename: string
): Promise<GameStateFile | Record<string, never>> {
  try {
    const contents = await fsPromises.readFile(
      path.join(parsedLogFolder, filename),
      "utf-8"
    );
    return (await JSON.parse(contents, reviver)) as GameStateFile;
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
/* eslint-disable */
function reviver(_key: string, value: any) {
  if (typeof value === "object" && value !== null) {
    if (value.hasOwnProperty("dataType")) {
      if (value.dataType === "Map") return new Map(value.value);
      else if (value.dataType === "Set") return new Set(value.value);
    }
  }
  return value;
}

function replacer(_key: any, value: any) {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()),
    };
  } else if (value instanceof Set) {
    return {
      dataType: "Set",
      value: Array.from(value.values()),
    };
  } else {
    return value;
  }
}
/* eslint-enable */

type Encounter = {
  encounterId: string;
  encounterFile: string;
  duration: number;
  mostDamageTakenEntity: {
    name: string;
    damageTaken: number;
    isPlayer: boolean;
  };
};
