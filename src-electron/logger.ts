import log from "electron-log";
import { readFileSync } from "fs";
import { MeterData } from "meter-core/data";
import { Decompressor } from "meter-core/decompressor";
import { PktCaptureAll, PktCaptureMode } from "meter-core/pkt-capture";
import type { GameTrackerOptions } from "meter-core/logger/data";
import { PKTStream } from "meter-core/pkt-stream";
import { join } from "path";
import { mainFolder } from "./util/directories.js";
import { LiveLogger } from "meter-core/logger/logger";
import { Parser } from "meter-core/logger/parser";

export function InitMeterData() {
  // create MeterData and read data
  const meterData = new MeterData(require.resolve("meter-core/data"));
  meterData.loadDbs("./meter-data/databases");
  return meterData;
}

export function InitLogger(
  meterData: MeterData,
  useRawSocket: boolean,
  listenPort: number,
  filename: string,
  options: Partial<GameTrackerOptions>
): Parser {
  // create Decompressor
  const oodle_state = readFileSync("./meter-data/oodle_state.bin");
  const xorTable = readFileSync("./meter-data/xor.bin");
  const compressor = new Decompressor(oodle_state, xorTable);

  // create Decompressor & LegacyLogger
  const stream = new PKTStream(compressor);

  const logger = new LiveLogger(stream, compressor, join(mainFolder, filename));
  const parser = new Parser(logger, meterData, options);

  // finaly create packet capture
  const capture = new PktCaptureAll(
    useRawSocket ? PktCaptureMode.MODE_RAW_SOCKET : PktCaptureMode.MODE_PCAP,
    listenPort
  );
  log.info(
    `Listening on ${capture.captures.size} devices(s): ${Array.from(
      capture.captures.keys()
    ).join(", ")}`
  );
  capture.on("packet", (buf) => {
    try {
      const badPkt = stream.read(buf);
      if (badPkt === false) log.error(`bad pkt ${buf.toString("hex")}`);
    } catch (e) {
      log.error(e);
    }
  });
  return parser;
}
