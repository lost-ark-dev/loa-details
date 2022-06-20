import { screenshotsFolder } from "./directories";
import dayjs from "dayjs";

const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const dataRegex = /^data:.+\/(.+);base64,(.*)$/;

export async function saveScreenshot(dataURL) {
  const curDate = dayjs().format("YYYY-MM-DD_HH-mm-ss"); // '2022-01-25_12-00-00'
  const screenshotPath = path.join(screenshotsFolder, `${curDate}.png`);

  var matches = dataURL.match(dataRegex);
  var data = matches[2];
  var buffer = Buffer.from(data, "base64");

  await fsPromises.writeFile(screenshotPath, buffer);
}
