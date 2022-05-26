import { parseLogText } from "./parser";

import getPath from "platform-folders";
import dayjs from "dayjs";
import log from "electron-log";

const fs = require("fs");
const path = require("path");

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

export const logFolder = path.join(getPath("documents"), "Lost Ark Logs");
if (!fs.existsSync(logFolder)) {
  fs.mkdirSync(logFolder);
}
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
      const jsonName = filename.slice(0, -4) + ".json";
      if (parsedLogs.includes(jsonName)) continue;
      if (
        filename.startsWith("LostArk_") &&
        filename.endsWith(".log") &&
        filename.length > 12
      ) {
        const contents = fs.readFileSync(
          path.join(logFolder, filename),
          "utf-8"
        );
        const parsedLog = parseLogText(contents);
        fs.writeFileSync(
          path.join(parsedLogFolder, jsonName),
          JSON.stringify(parsedLog)
        );
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
      const stats = fs.statSync(path.join(parsedLogFolder, filename));

      const contents = fs.readFileSync(
        path.join(parsedLogFolder, filename),
        "utf-8"
      );

      const parsedContents = JSON.parse(contents);

      const encounterName = parsedContents.encounters[0].name
        .split("(")[1]
        .split(")")[0];

      res.push({
        filename,
        encounterName,
        date: new Date(dayjs(filename.slice(8, -5), "YYYY-MM-DD-HH-mm-ss")),
        size: stats.size,
      });
    } catch (e) {
      log.error(e);
      continue;
    }
  }

  return res;
}

export function getLogData(filename) {
  const contents = fs.readFileSync(
    path.join(parsedLogFolder, filename),
    "utf-8"
  );
  return JSON.parse(contents);
}
