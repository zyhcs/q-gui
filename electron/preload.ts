import { contextBridge, ipcRenderer } from 'electron'
import { SAPConnection, AppSettings } from '../src/types'

contextBridge.exposeInMainWorld('electronAPI', {
  getConnections: () => ipcRenderer.invoke('get-connections'),
  saveConnections: (connections: SAPConnection[]) => ipcRenderer.invoke('save-connections', connections),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('save-settings', settings),
  launchSAP: (id: string, tcode?: string) => ipcRenderer.invoke('launch-sap', id, tcode),
  testPing: (host: string, sysnr: string) => ipcRenderer.invoke('test-ping', host, sysnr),
  scanLandscape: () => ipcRenderer.invoke('scan-landscape'),
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),
  scanLANDevices: () => ipcRenderer.invoke('scan-lan-devices'),
  sendConfigToPeer: (peerIp: string, peerPort: number, connectionId: string) => ipcRenderer.invoke('send-config-to-peer', peerIp, peerPort, connectionId),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  hideHUD: () => ipcRenderer.send('hud-hide'),
})
