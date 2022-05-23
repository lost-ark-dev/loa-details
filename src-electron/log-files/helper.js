import { parseLogText } from "./parser";

import getPath from "platform-folders";
import dayjs from "dayjs";

const fs = require("fs");
const path = require("path");

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const mainFolder = path.join(getPath("documents"), "LOA Details");
if (!fs.existsSync(mainFolder)) {
  fs.mkdirSync(mainFolder);
}
const logFolder = path.join(mainFolder, "Logs");
if (!fs.existsSync(logFolder)) {
  fs.mkdirSync(logFolder);
}
const parsedLogFolder = path.join(logFolder, "parsed");
if (!fs.existsSync(parsedLogFolder)) {
  fs.mkdirSync(parsedLogFolder);
}

export function parseLogs() {
  const unparsedLogs = fs.readdirSync(logFolder);
  const parsedLogs = fs.readdirSync(parsedLogFolder);

  for (const filename of unparsedLogs) {
    const jsonName = filename.slice(0, -4) + ".json";
    if (parsedLogs.includes(jsonName)) continue;
    if (
      filename.startsWith("LostArk_") &&
      filename.endsWith(".log") &&
      filename.length > 12
    ) {
      const contents = fs.readFileSync(path.join(logFolder, filename), "utf-8");
      const parsedLog = parseLogText(contents);
      fs.writeFileSync(
        path.join(parsedLogFolder, jsonName),
        JSON.stringify(parsedLog)
      );
    }
  }
}

export function getParsedLogs() {
  const parsedLogs = fs.readdirSync(parsedLogFolder);

  const res = [];

  for (const filename of parsedLogs) {
    const stats = fs.statSync(path.join(parsedLogFolder, filename));

    res.push({
      filename,
      date: new Date(dayjs(filename.slice(8, -5), "YYYY-MM-DD-HH-mm-ss")),
      size: stats.size,
    });
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
