import { app, dialog } from "electron";
import { createServer } from "http";
import { EventEmitter } from "events";
import { spawn } from "child_process";
import fs from "fs";
import log from "electron-log";
import path from "path";

export const httpServerEventEmitter = new EventEmitter();

let httpServer;
let packetCapturerProcess;

const validHosts = [];
function checkHost(requestHost) {
  if (!requestHost) return false;
  return validHosts.includes(requestHost);
}

export function setupBridge(appSettings) {
  httpServer = createServer((req, res) => {
    const isHostValid = checkHost(req.headers.host);
    if (!isHostValid) {
      log.info("Request from invalid host: " + req.headers.host);
      res.writeHead(403, { "Content-Type": "text/html" });
      return res.end("Forbidden");
    }

    if (req.method === "POST") {
      // Handle data
      let body = [];

      req.on("data", (chunk) => {
        body.push(chunk);
      });

      req.on("end", function () {
        const parsedBody = Buffer.concat(body).toString();
        httpServerEventEmitter.emit("packet", parsedBody);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("Ok!");
      });
    }
  });

  httpServer.listen(0, "localhost", () => {
    log.info(`Server listening on port ${httpServer.address().port}`);
    validHosts.push(
      `localhost:${httpServer.address().port}`,
      `127.0.0.1:${httpServer.address().port}`
    );
    httpServerEventEmitter.emit("listen");
    spawnPacketCapturer(appSettings, httpServer.address().port);
  });
}

function spawnPacketCapturer(appSettings, serverPort) {
  const args = ["--Port", serverPort];

  if (appSettings?.general?.customLogPath !== null)
    args.push("--CustomLogPath", appSettings?.general?.customLogPath);

  if (appSettings?.general?.useWinpcap) args.push("--UseNpcap");

  if (appSettings?.general?.server === "russia")
    args.push("--Region", "Russia");
  else if (appSettings?.general?.server === "korea")
    args.push("--Region", "Korea");

  try {
    let binaryFolder;
    if (process.env.DEBUGGING) {
      binaryFolder = path.resolve(__dirname, "../../binary/");
    } else {
      binaryFolder = path.resolve("./binary/");
    }

    const binaryFiles = fs.readdirSync(binaryFolder);
    for (const binaryFile of binaryFiles) {
      if (binaryFile.endsWith(".exe")) {
        packetCapturerProcess = spawn(
          path.resolve(binaryFolder, binaryFile),
          args
        );
        break;
      }
    }

    log.info("Started Logger!");
  } catch (e) {
    log.error("Error while trying to open packet capturer: " + e);

    dialog.showErrorBox(
      "Error while trying to open packet capturer",
      "Error: " + e.message
    );

    log.info("Exiting app...");
    app.exit();
  }

  packetCapturerProcess.on("exit", function (code, signal) {
    log.error(
      `The connection to the Lost Ark Packet Capture was lost for some reason:\n
      Code: ${code} and Signal: ${signal}`
    );

    dialog.showErrorBox(
      "Error",
      `The connection to the Lost Ark Packet Capture was lost for some reason:\n
      Code: ${code} and Signal: ${signal}\n
      Exiting app...`
    );

    log.info("Exiting app...");
    app.exit();
  });
}
