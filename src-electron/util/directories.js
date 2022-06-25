const platformFolders = require("platform-folders");
const fs = require("fs");
const path = require("path");
const { getSettings } = require("./app-settings");

const appSettings = getSettings();
const customPath = appSettings.general.customLogPath;

const documentsFolder = platformFolders.getDocumentsFolder();

const mainFolder =
  customPath === null
    ? path.join(documentsFolder, "Lost Ark Logs")
    : customPath;
if (!fs.existsSync(mainFolder)) {
  fs.mkdirSync(mainFolder);
}
module.exports.mainFolder = mainFolder;

const parsedLogFolder = path.join(mainFolder, "parsed");
if (!fs.existsSync(parsedLogFolder)) {
  fs.mkdirSync(parsedLogFolder);
}
module.exports.parsedLogFolder = parsedLogFolder;

const screenshotsFolder = path.join(mainFolder, "screenshots");
if (!fs.existsSync(screenshotsFolder)) {
  fs.mkdirSync(screenshotsFolder);
}
module.exports.screenshotsFolder = screenshotsFolder;
