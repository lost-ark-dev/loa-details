import { screenshotsFolder } from "./directories";
import { v4 as uuidv4 } from "uuid";

const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const dataRegex = /^data:.+\/(.+);base64,(.*)$/;

export async function saveScreenshot(dataURL) {
  const screenshotPath = path.join(screenshotsFolder, `${uuidv4()}.png`);

  var matches = dataURL.match(dataRegex);
  var data = matches[2];
  var buffer = Buffer.from(data, "base64");

  await fsPromises.writeFile(screenshotPath, buffer);
}
