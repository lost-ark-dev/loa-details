import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import { screenshotsFolder } from "./directories";

const fsPromises = fs.promises;

const dataRegex = /^data:.+\/(.+);base64,(.*)$/;

export async function saveScreenshot(dataURL: string) {
  const curDate = dayjs().format("YYYY-MM-DD_HH-mm-ss"); // '2022-01-25_12-00-00'
  const screenshotPath = path.join(screenshotsFolder, `${curDate}.png`);

  const matches = dataURL.match(dataRegex);
  if (!matches) return;
  const data = matches[2];
  const buffer = Buffer.from(data, "base64");

  await fsPromises.writeFile(screenshotPath, buffer);
}
