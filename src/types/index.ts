export type EnvironmentType = 'DEV' | 'QAS' | 'PRD' | 'SBX';
export type LanguageCode = 'ZH' | 'EN' | 'DE';

export interface SAPConnection {
  id: string;
  sid: string;
  name: string;
  env: EnvironmentType;
  client: string;
  user: string;
  password?: string;
  lang: LanguageCode;
  host: string;
  sysnr: string;
  router?: string;
  tcodes: string[];
  pingMs?: number;
  starred?: boolean;
  lastLaunched?: string;
  launchCount?: number;
}

export interface AppSettings {
  fontScale: 'compact' | 'standard' | 'large';
  theme: 'zinc' | 'slate' | 'light';
  hotkey: string;
  mainHotkey: string;
  launchOnBoot: boolean;
  minimizeToTray: boolean;
  lanBroadcast: boolean;
  lang: 'zh' | 'en';
  sapshcutPath: string;
  landscapePath: string;
}

export interface LANDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: number;
}

export interface IpcApi {
  getConnections: () => Promise<SAPConnection[]>;
  saveConnections: (connections: SAPConnection[]) => Promise<boolean>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  launchSAP: (id: string, tcode?: string) => Promise<{ success: boolean; message: string }>;
  testPing: (host: string, sysnr: string) => Promise<{ ok: boolean; latency: number }>;
  scanLandscape: () => Promise<{ success: boolean; count: number; items?: SAPConnection[]; message?: string }>;
  exportData: () => Promise<{ success: boolean; filePath?: string }>;
  importData: () => Promise<{ success: boolean; count: number; message?: string }>;
  scanLANDevices: () => Promise<LANDevice[]>;
  sendConfigToPeer: (peerIp: string, peerPort: number, connectionId: string) => Promise<boolean>;
  minimizeWindow: () => void;
  closeWindow: () => void;
  hideHUD: () => void;
}

declare global {
  interface Window {
    electronAPI: IpcApi;
  }
}
