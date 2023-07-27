/* eslint-disable */
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import child_process from "node:child_process";
import type { GameState } from "meter-core/logger/data";
import type { Settings } from "./util/app-settings";
import { Parser } from "meter-core/logger/parser";

const executablePath = () => {
  return "./ldn/build_release/release/ldn.exe";
};
function replacer(key:any, value:any) {
  if (value instanceof Map) {
    return Array.from(value.entries()).reduce(
      (acc, val) => ({
        ...acc,
        [val[0]]: val[1],
      }),
      {}
    );
  } else {
    return value;
  }
}
class Ldn {
  started: boolean;
  socket: net.Server | null;
  client: net.Socket | null;
  process: child_process.ChildProcess | null;
  constructor() {
    this.socket = null;
    this.started = false;
    this.client = null;
    this.process = null;
  }
  handler(data: GameState) {
    if (this.client) {
      this.client.write(
        "d:" + JSON.stringify({ type: "data", data }, replacer) + "\n"
      );
    }
  }
  start(liveParser: Parser, appSettings: Settings, cb: () => void): void {
    if (this.started) return;

    this.started = true;
    liveParser.on("state-change", (data) => this.handler(data));
    liveParser.on("message", (data: string) => {
      if (this.client)
        this.client.write(
          "m:" + JSON.stringify({ type: "message", data }) + "\n"
        );
    });
    liveParser.on("reset-state", (data: GameState) => {
      if (this.client)
        this.client.write(
          "m:" + JSON.stringify({ type: "message", data: "reset-state" }) + "\n"
        );
    });
    this.socket = net.createServer((connection) => {
      if (this.client !== null) {
        connection.destroy();
        return;
      }
      console.log("meter connected", appSettings);
      this.client = connection;
      //this.client.write("m:" + JSON.stringify({ type: "settings", appSettings }));
      connection.on("error", () => {
        console.log("error");
        this.client = null;
      });
      connection.on("data", d => {
        try{
            const {action} = JSON.parse(d.toString());
            if(action === "reset-session")
              liveParser.reset();
        }catch(err) {
            console.error(err)
        }
      })
      connection.on("close", () => {
        console.log("close");
      });
    });
    this.socket.listen({ port: 0, host: "127.0.0.1" }, () => {
      console.log(
        (this.socket?.address() as net.AddressInfo).port,
        process.cwd()
      );
      this.process = child_process.execFile(
        executablePath(),
        ["port", `${(this.socket?.address() as net.AddressInfo).port}`],
        {},
        (
          error: child_process.ExecFileException | null,
          stdout: string | Buffer,
          stderr: string | Buffer
        ) => {
          void stderr;
          void stdout;
          if (error) console.log(error);
        }
      );
      this.process.on("error", (err) => console.log(err));
      this.process.on("exit", () => {
        this.socket?.close();
        this.socket = null;
        this.started = false;
        this.client = null;
        this.process?.kill();
        this.process = null;
        cb();
      });
    });
  }
}
export default Ldn;
