import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readConfig, writeConfig } from "./config.mjs";
import { listApprovals, resolveApproval, spineStatus, startSpine, stopSpine } from "./mcp.mjs";
import { generateCode, listTools, runTool } from "./tools.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");
const developmentRepositoryRoot = path.resolve(root, "..");
const configPath = () => path.join(app.getPath("userData"), "config.json");
const spineRoot = () => app.isPackaged ? process.resourcesPath : developmentRepositoryRoot;
let mainWindow;

async function getState() {
  const config = await readConfig(configPath());
  const workflows = JSON.parse(await fs.readFile(path.join(root, "workflows/agent-mint-workflows.json"), "utf8"));
  return { version: app.getVersion(), platform: process.platform, config, tools: listTools(config), workflows, spine: await spineStatus(config) };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#080b12",
    title: "THESIS Agent Desktop",
    webPreferences: {
      preload: path.join(directory, "preload.mjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) event.preventDefault();
  });
  mainWindow.loadFile(path.join(root, "renderer/index.html"));
}

ipcMain.handle("desktop:get-state", getState);
ipcMain.handle("desktop:update-config", async (_event, input) => {
  const config = await writeConfig(configPath(), input);
  return { config, tools: listTools(config), spine: await spineStatus(config) };
});
ipcMain.handle("desktop:health-check", async () => {
  const config = await readConfig(configPath());
  return { ok: true, desktop: "THESIS Agent Desktop", spine: await spineStatus(config) };
});
ipcMain.handle("desktop:spine-status", async () => spineStatus(await readConfig(configPath())));
ipcMain.handle("desktop:spine-start", async () => startSpine(await readConfig(configPath()), spineRoot(), app.isPackaged));
ipcMain.handle("desktop:spine-stop", async () => stopSpine(await readConfig(configPath())));
ipcMain.handle("desktop:approvals-list", async () => listApprovals(await readConfig(configPath())));
ipcMain.handle("desktop:approval-resolve", async (_event, request) => resolveApproval(await readConfig(configPath()), request?.approvalId, request?.decision));
ipcMain.handle("desktop:open-builder", async () => {
  const config = await readConfig(configPath());
  if (!config.builderAppUrl) throw new Error("Builder URL is not configured.");
  await shell.openExternal(config.builderAppUrl);
  return { ok: true, url: config.builderAppUrl };
});
ipcMain.handle("desktop:list-tools", async () => listTools(await readConfig(configPath())));
ipcMain.handle("desktop:run-tool", async (_event, request) => runTool(await readConfig(configPath()), request?.tool, request?.input));
ipcMain.handle("desktop:generate-code", async (_event, request) => ({ ok: true, code: generateCode(request) }));
ipcMain.handle("desktop:save-text", async (_event, request) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: String(request?.suggestedName || "artifact.txt").replace(/[^a-zA-Z0-9._-]/g, "_"),
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  await fs.writeFile(result.filePath, String(request?.content || ""), "utf8");
  return { ok: true, filePath: result.filePath };
});

app.whenReady().then(async () => {
  const config = await readConfig(configPath());
  if (config.mcpAutostart) startSpine(config, spineRoot(), app.isPackaged).catch((error) => { process.stderr.write(`${error.message}\n`); });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("before-quit", () => { readConfig(configPath()).then(stopSpine).catch(() => {}); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
