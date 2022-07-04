const workerFarm = require("worker-farm");
import dayjs from "dayjs";
import log from "electron-log";
const { mainFolder, parsedLogFolder } = require("../util/directories");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const LOG_PARSER_VERSION = 11;

export async function parseLogs(event, splitOnPhaseTransition) {
  const workers = workerFarm(require.resolve("loa-details-log-parser/worker"));

  const unparsedLogs = await fsPromises.readdir(mainFolder);
  const parsedLogs = await fsPromises.readdir(parsedLogFolder);

  let mainJson = {
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

    workers(
      filename,
      splitOnPhaseTransition,
      mainFolder,
      parsedLogFolder,
      function (error, output) {
        completedJobs++;
        log.info(error, output);

        if (output === "no encounters found" || output === "empty log") {
          // remove log file if 1 hour or more have passed since it was last modified
          if (new Date().getTime() - logStats.mtime > 1 * 60 * 60 * 1000) {
            log.info("removing empty log", filename);
            fs.unlinkSync(path.join(mainFolder, filename));
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

          fs.writeFileSync(
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
