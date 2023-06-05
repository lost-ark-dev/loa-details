import { app } from "electron";
import fs from "fs";
import path from "path";
import { settings } from "./settings";

const customPath = settings.store.general.customLogPath;

const documentsFolder = app.getPath("documents");

export const mainFolder = customPath === null ? path.join(documentsFolder, "Lost Ark Logs") : customPath;
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
