import type { StoreType } from "app/src-electron/util/store";
import type { ProgressInfo } from "electron-updater";
import type { GameState } from "meter-core/logger/data";

export type MessageEvent =
  | { message: "download-progress"; value: ProgressInfo }
  | { message: string; value?: unknown; async?: boolean };

export interface MessageApi {
  send(channel: string, data: MessageEvent): void;
  receive(channel: "on-settings-change", func: () => void): void;
  receive(channel: "updater-message", func: (eventMessage: MessageEvent) => void): void;
  receive(channel: "pcap-on-state-change", func: (value: GameState) => void): void;
  receive(channel: "pcap-on-message", func: (value: string) => void): void;
  receive(channel: "uploader-message", func: (value: { failed: boolean; message: string }) => void): void;
  receive(channel: string, func: (...args: unknown[]) => void): void;
}

export interface WindowControlApi {
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  hide: () => void;
  setIgnoreMouseEvents: (ignore: boolean, options: Electron.IgnoreMouseEventsOptions) => void;
}

export interface appVersionApi {
  get: () => string;
}

export interface StoreApi {
  get<Key extends keyof StoreType>(key: Key): StoreType[Key];
  set<Key extends keyof StoreType>(key: Key, value: StoreType[Key]): void;
  has<Key extends keyof StoreType>(key: Key): boolean;
  reset<Key extends keyof StoreType>(key: Key): void;
  delete<Key extends keyof StoreType>(key: Key): void;
  clear(): void;
}

export { StoreType };

declare global {
  interface Window {
    messageApi: MessageApi;
    windowControlApi: WindowControlApi;
    appVersionApi: appVersionApi;
    storeApi: StoreApi;
  }
}
