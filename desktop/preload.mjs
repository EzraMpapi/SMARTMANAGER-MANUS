import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("smartManagerDesktop", {
  platform: process.platform,
  isDesktop: true,
});
