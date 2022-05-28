/*
  The purpouse of this script is to save the size and position stats
  of windows to be loaded back on next open.
*/
import Store from "electron-store";

const store = new Store();

export function initWindow(window, name) {
  const windowOptions = store.get(`windows.` + name);

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
  }

  window.on(`moved`, () => {
    const curPos = window.getPosition();
    store.set(`windows.${name}.X`, curPos[0]);
    store.set(`windows.${name}.Y`, curPos[1]);
  });

  window.on(`resized`, () => {
    const curSize = window.getSize();
    store.set(`windows.${name}.width`, curSize[0]);
    store.set(`windows.${name}.height`, curSize[1]);
  });
}
