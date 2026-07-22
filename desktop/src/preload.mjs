import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("thesisDesktop", Object.freeze({
  getState: () => ipcRenderer.invoke("desktop:get-state"),
  updateConfig: (config) => ipcRenderer.invoke("desktop:update-config", config),
  healthCheck: () => ipcRenderer.invoke("desktop:health-check"),
  spineStatus: () => ipcRenderer.invoke("desktop:spine-status"),
  startSpine: () => ipcRenderer.invoke("desktop:spine-start"),
  stopSpine: () => ipcRenderer.invoke("desktop:spine-stop"),
  listApprovals: () => ipcRenderer.invoke("desktop:approvals-list"),
  resolveApproval: (approvalId, decision) => ipcRenderer.invoke("desktop:approval-resolve", { approvalId, decision }),
  openBuilder: () => ipcRenderer.invoke("desktop:open-builder"),
  listTools: () => ipcRenderer.invoke("desktop:list-tools"),
  runTool: (tool, input) => ipcRenderer.invoke("desktop:run-tool", { tool, input }),
  generateCode: (request) => ipcRenderer.invoke("desktop:generate-code", request),
  saveText: (request) => ipcRenderer.invoke("desktop:save-text", request),
}));
