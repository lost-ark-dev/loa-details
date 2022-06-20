const workerFarm = require("worker-farm");
import dayjs from "dayjs";
import log from "electron-log";
const { mainFolder, parsedLogFolder } = require("../util/directories");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

export async function parseLogs(event, splitOnPhaseTransition) {
  const workers = workerFarm(
    require.resolve(
      process.env.DEBUGGING
        ? path.resolve(
            __dirname,
            "../../src-electron/log-parser/file-parser-worker.js"
          )
        : path.resolve(__dirname, "log-parser/file-parser-worker.js")
    )
  );

  const unparsedLogs = await fsPromises.readdir(mainFolder);
  const parsedLogs = await fsPromises.readdir(parsedLogFolder);

  let completedJobs = 0,
    totalJobs = 0;

  if (event)
    event.reply("log-parser-status", {
      completedJobs,
      totalJobs: 1,
    });

  for (const filename of unparsedLogs) {
    if (
      filename.startsWith("LostArk_") &&
      filename.endsWith(".log") &&
      filename.length > 12
    ) {
      totalJobs++;

      workers(
        filename,
        parsedLogs,
        splitOnPhaseTransition,
        function (error, output) {
          log.info(error, output);

          completedJobs++;

          if (event)
            event.reply("log-parser-status", {
              completedJobs,
              totalJobs,
            });

          if (completedJobs === totalJobs) {
            workerFarm.end(workers);
          }
        }
      );
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
