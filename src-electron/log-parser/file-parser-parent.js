const workerFarm = require("worker-farm");
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

  let completedJobs = 0;
  let totalJobs = unparsedLogs.length;
  /* event.reply("log-parser-status", {
    completedJobs,
    totalJobs,
  }); */

  for await (const filename of unparsedLogs) {
    workers(filename, parsedLogs, splitOnPhaseTransition, function (err, outp) {
      console.log(outp, err);
    });
  }

  workerFarm.end(workers);
}

parseLogs(null, true);
