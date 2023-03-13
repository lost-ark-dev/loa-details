import { MeterData } from "meter-core/data";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { IpcMainEvent } from "electron";
import log from "electron-log";
import { promises as fsPromises, unlinkSync, writeFileSync } from "fs";
import path from "path";
import workerFarm from "worker-farm";
import { mainFolder, parsedLogFolder } from "../util/directories";
import { fileParserWorker } from "loa-details-log-parser/worker";

dayjs.extend(customParseFormat);

const LOG_PARSER_VERSION = 14;

export async function parseLogs(
  event: IpcMainEvent,
  splitOnPhaseTransition: boolean,
  meterData: MeterData
) {
  const s = require.resolve("loa-details-log-parser/worker");
  const workers = workerFarm(s, ["fileParserWorker"]);

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
    mainJson = JSON.parse(mainStr);
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
    if (!filename.match(/^LostArk_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}.log$/))
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
          mainJson[filename].logParserVersion < LOG_PARSER_VERSION
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

    //Ignore error (d.ts of workerfarm badly designed)
    //workers["fileParserWorker"]
    //TODO: fix multithreading adding meterData dependency to the fileparser breaks multithreading (we can't pass it as to the child process, probably too big)
    fileParserWorker(
      {
        filename,
        splitOnPhaseTransition,
        mainFolder,
        parsedLogFolder,
        meterData,
      },
      function (error: string, output: string) {
        completedJobs++;
        log.info(error, output);

        if (output === "no encounters found" || output === "empty log") {
          // remove log file if 1 hour or more have passed since it was last modified
          if (
            new Date().getTime() - logStats.mtime.getTime() >
            1 * 60 * 60 * 1000
          ) {
            log.info("removing empty log", filename);
            unlinkSync(path.join(mainFolder, filename));
          }
        } else {
          mainJson[filename] = {
            mtime: new Date(logStats.mtime),
            logParserVersion: LOG_PARSER_VERSION,
          };
        }

        if (event) {
          event.reply("log-parser-status", {
            completedJobs,
            totalJobs,
          });
        }

        if (completedJobs === totalJobs) {
          workerFarm.end(workers);

          writeFileSync(
            path.join(mainFolder, "main.json"),
            JSON.stringify(mainJson)
          );
        }
      }
    );
  }

  if (totalJobs === 0 && event)
    event.reply("log-parser-status", {
      completedJobs: 1,
      totalJobs: 1,
    });
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

      const parsedContents = await JSON.parse(contents, reviver);

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

export async function getLogData(filename: string) {
  try {
    const contents = await fsPromises.readFile(
      path.join(parsedLogFolder, filename),
      "utf-8"
    );
    return await JSON.parse(contents, reviver);
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

function reviver(_key: string, value: any) {
  if (typeof value === "object" && value !== null) {
    if (value.hasOwnProperty("dataType")) {
      if (value.dataType === "Map") return new Map(value.value);
      else if (value.dataType === "Set") return new Set(value.value);
    }
  }
  return value;
}
