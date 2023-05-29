/*
  The purpouse of this script is to save the size and position stats
  of windows to be loaded back on next open.
*/
import { BrowserWindow } from "electron";
import Store from "electron-store";

const store = new Store();
type WindowOptions = {
  X: number;
  Y: number;
  width: number;
  height: number;
  zoomFactor: number;
};
export function initWindow(window: BrowserWindow, name: string) {
  const windowOptions = store.get("windows." + name) as WindowOptions;

  if (windowOptions) {
    if (windowOptions.width && windowOptions.height) {
      window.setSize(windowOptions.width, windowOptions.height);
    }

    if (
      typeof windowOptions.X === "number" &&
      typeof windowOptions.Y === "number" &&
      !isNaN(windowOptions.X) &&
      !isNaN(windowOptions.Y)
    ) {
      window.setPosition(windowOptions.X, windowOptions.Y);
    }

    void window.webContents.setVisualZoomLevelLimits(1, 5);
    if (windowOptions.zoomFactor) {
      window.webContents.setZoomFactor(windowOptions.zoomFactor);
    }
  }

  window.on("moved", () => {
    const curPos = window.getPosition();
    store.set(`windows.${name}.X`, curPos[0]);
    store.set(`windows.${name}.Y`, curPos[1]);
  });

  window.on("resized", () => {
    const curSize = window.getSize();
    store.set(`windows.${name}.width`, curSize[0]);
    store.set(`windows.${name}.height`, curSize[1]);
  });

  window.webContents.on("zoom-changed", (event, zoomDirection) => {
    const currentZoom = window.webContents.getZoomFactor();

    if (zoomDirection === "in") {
      const newZoom = currentZoom + 0.2;
      window.webContents.zoomFactor = newZoom;
    }
    if (zoomDirection === "out") {
      const newZoom = currentZoom - 0.2;
      window.webContents.zoomFactor = Math.max(newZoom, 0.2);
    }

    store.set(`windows.${name}.zoomFactor`, window.webContents.zoomFactor);
  });
}
