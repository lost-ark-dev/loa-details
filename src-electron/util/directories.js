import getPath from "platform-folders";
const fs = require("fs");
const path = require("path");

export const mainFolder = path.join(getPath("documents"), "Lost Ark Logs");
if (!fs.existsSync(mainFolder)) {
  fs.mkdirSync(mainFolder);
}

export const parsedLogFolder = path.join(mainFolder, "parsed");
if (!fs.existsSync(parsedLogFolder)) {
  fs.mkdirSync(parsedLogFolder);
}

export const screenshotsFolder = path.join(mainFolder, "screenshots");
if (!fs.existsSync(screenshotsFolder)) {
  fs.mkdirSync(screenshotsFolder);
}
