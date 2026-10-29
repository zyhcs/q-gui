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
  sapshcutPath: string; // 维护 sapshcut.exe 路径
  landscapePath: string;
}

export interface LANDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: number;
}

export interface LaunchResult {
  success: boolean;
  message: string;
}

export interface PingResult {
  ok: boolean;
  latency: number;
}

export interface ScanResult {
  success: boolean;
  count: number;
  items: SAPConnection[];
  message: string;
}
