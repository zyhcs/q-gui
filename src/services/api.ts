import { invoke } from '@tauri-apps/api/core';
import { AppSettings, LANDevice, LaunchResult, PingResult, SAPConnection, ScanResult } from '../types';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const api = {
  async getConnections(): Promise<SAPConnection[]> {
    if (isTauri) {
      return await invoke<SAPConnection[]>('get_connections');
    }
    return [];
  },

  async saveConnections(connections: SAPConnection[]): Promise<boolean> {
    if (isTauri) {
      return await invoke<boolean>('save_connections', { connections });
    }
    return true;
  },

  async getSettings(): Promise<AppSettings> {
    if (isTauri) {
      return await invoke<AppSettings>('get_settings');
    }
    return {
      fontScale: 'standard',
      theme: 'zinc',
      hotkey: 'Ctrl+Shift+Space',
      mainHotkey: 'Ctrl+Alt+Q',
      launchOnBoot: false,
      minimizeToTray: true,
      lanBroadcast: true,
      lang: 'zh',
      sapshcutPath: 'C:\\Program Files (x86)\\SAP\\FrontEnd\\SAPgui\\sapshcut.exe',
      landscapePath: '',
    };
  },

  async saveSettings(settings: AppSettings): Promise<boolean> {
    if (isTauri) {
      return await invoke<boolean>('save_settings', { settings });
    }
    return true;
  },

  async launchSAP(id: string, tcode?: string): Promise<LaunchResult> {
    if (isTauri) {
      return await invoke<LaunchResult>('launch_sap', { id, tcode: tcode || null });
    }
    return { success: true, message: `[Mock] 模拟启动 SAP 系统: ${id} ${tcode || ''}` };
  },

  async testPing(host: string, sysnr: string): Promise<PingResult> {
    if (isTauri) {
      return await invoke<PingResult>('test_ping', { host, sysnr });
    }
    return { ok: true, latency: 18 };
  },

  async scanLandscape(customPath?: string): Promise<ScanResult> {
    if (isTauri) {
      return await invoke<ScanResult>('scan_landscape', { customPath: customPath || null });
    }
    return { success: false, count: 0, items: [], message: '非 Tauri 环境' };
  },

  // 重点：自动探测与校验 sapshcut.exe 路径
  async detectSapshcut(customPath?: string): Promise<[boolean, string]> {
    if (isTauri) {
      return await invoke<[boolean, string]>('detect_sapshcut', { customPath: customPath || null });
    }
    return [true, 'C:\\Program Files (x86)\\SAP\\FrontEnd\\SAPgui\\sapshcut.exe'];
  },

  async exportData(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    if (isTauri) {
      try {
        const filePath = await invoke<string>('export_data');
        return { success: true, filePath };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    }
    return { success: true, filePath: 'C:\\Users\\Mock\\Downloads\\qgui_backup.json' };
  },

  async importData(jsonContent: string): Promise<{ success: boolean; count?: number; error?: string }> {
    if (isTauri) {
      try {
        const count = await invoke<number>('import_data', { jsonContent });
        return { success: true, count };
      } catch (e: any) {
        return { success: false, error: String(e) };
      }
    }
    return { success: true, count: 5 };
  },

  async scanLANDevices(): Promise<LANDevice[]> {
    if (isTauri) {
      return await invoke<LANDevice[]>('scan_lan_devices');
    }
    return [];
  },

  async sendConfigToPeer(peerIp: string, peerPort: number, connectionId: string): Promise<boolean> {
    if (isTauri) {
      return await invoke<boolean>('send_config_to_peer', { peerIp, peerPort, connectionId });
    }
    return true;
  },

  async minimizeWindow(): Promise<void> {
    if (isTauri) {
      await invoke('minimize_window');
    }
  },

  async closeWindow(): Promise<void> {
    if (isTauri) {
      await invoke('close_window');
    }
  },

  async hideHUD(): Promise<void> {
    if (isTauri) {
      await invoke('hide_hud');
    }
  },

  async toggleHUD(): Promise<void> {
    if (isTauri) {
      await invoke('toggle_hud');
    }
  },
};
