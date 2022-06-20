import { screenshotsFolder } from "./directories";
import dayjs from "dayjs";

const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const dataRegex = /^data:.+\/(.+);base64,(.*)$/;

export async function saveScreenshot(dataURL) {
  const curDate = dayjs().format("DD-MM-YYYY_HH-mm-ss"); // '25-01-2022_12-00-00'
  const screenshotPath = path.join(screenshotsFolder, `${curDate}.png`);

  var matches = dataURL.match(dataRegex);
  var data = matches[2];
  var buffer = Buffer.from(data, "base64");

  await fsPromises.writeFile(screenshotPath, buffer);
}
