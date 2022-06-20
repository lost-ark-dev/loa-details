const workerFarm = require("worker-farm");
const log = require("electron-log");
const dayjs = require("dayjs");
const { mainFolder, parsedLogFolder } = require("../util/directories");
const fs = require("fs");
const fsPromises = fs.promises;

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

async function parseLogs(event, splitOnPhaseTransition) {
  const workers = workerFarm(require.resolve("./file-parser-worker"));

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

parseLogs(null, true);
