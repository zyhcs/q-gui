import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { SAPConnection, AppSettings } from '../src/types'

const defaultSettings: AppSettings = {
  fontScale: 'standard',
  theme: 'zinc',
  hotkey: 'Ctrl+Shift+Space',
  mainHotkey: 'Ctrl+Alt+Q',
  launchOnBoot: false,
  minimizeToTray: true,
  lanBroadcast: true,
  lang: 'zh',
  sapshcutPath: '',
  landscapePath: '',
}

const defaultConnections: SAPConnection[] = [
  {
    id: 's4d-300',
    sid: 'S4D',
    name: 'ZM-DEV 开发主系统 300',
    env: 'DEV',
    client: '300',
    user: '021569',
    lang: 'ZH',
    host: '10.20.10.41',
    sysnr: '01',
    router: '',
    tcodes: ['SE80', 'SM50', 'ST05', 'SPRO'],
    pingMs: 8,
    starred: true,
    launchCount: 42,
    lastLaunched: '刚刚'
  },
  {
    id: 's4d-200',
    sid: 'S4D',
    name: 'ZM-DEV 业务配置客户端 200',
    env: 'DEV',
    client: '200',
    user: '021569',
    lang: 'ZH',
    host: '10.20.10.41',
    sysnr: '01',
    router: '',
    tcodes: ['SPRO', 'SM30'],
    pingMs: 8,
    starred: true,
    launchCount: 18,
    lastLaunched: '昨天'
  },
  {
    id: 's4h-400',
    sid: 'S4H',
    name: 'DEMO-S400 全功能沙箱',
    env: 'DEV',
    client: '400',
    user: 'KN090',
    lang: 'ZH',
    host: '10.20.10.40',
    sysnr: '00',
    router: '',
    tcodes: ['SE38', 'MM03', 'VA03'],
    pingMs: 12,
    starred: false,
    launchCount: 10,
    lastLaunched: '3天前'
  },
  {
    id: 's4q-600',
    sid: 'S4Q',
    name: 'ZM-QAS 测试与质量验收',
    env: 'QAS',
    client: '600',
    user: '021569',
    lang: 'ZH',
    host: '10.20.10.42',
    sysnr: '00',
    router: '',
    tcodes: ['STMS', 'SM12'],
    pingMs: 15,
    starred: false,
    launchCount: 5,
    lastLaunched: '上周'
  },
  {
    id: 's4p-888',
    sid: 'S4P',
    name: 'ZM-PRD 集团核心生产系统',
    env: 'PRD',
    client: '888',
    user: '021569',
    lang: 'ZH',
    host: '10.20.10.50',
    sysnr: '00',
    router: '/H/vpn.corp.com/S/3299/H/',
    tcodes: ['SM50', 'ST22'],
    pingMs: 24,
    starred: false,
    launchCount: 2,
    lastLaunched: '2周前'
  }
]

interface StoreData {
  connections: SAPConnection[];
  settings: AppSettings;
}

class StorageManager {
  private filePath: string;
  private data: StoreData;

  constructor() {
    const userData = app.getPath('userData')
    this.filePath = path.join(userData, 'q-gui-store.json')
    this.data = this.load()
  }

  private load(): StoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        return {
          connections: parsed.connections || defaultConnections,
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
        }
      }
    } catch (err) {
      console.error('Failed to load store, using defaults:', err)
    }
    return {
      connections: defaultConnections,
      settings: defaultSettings,
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save store:', err)
    }
  }

  public getConnections(): SAPConnection[] {
    return this.data.connections
  }

  public saveConnections(conns: SAPConnection[]) {
    this.data.connections = conns
    this.save()
  }

  public getSettings(): AppSettings {
    return this.data.settings
  }

  public saveSettings(settings: AppSettings) {
    this.data.settings = { ...this.data.settings, ...settings }
    this.save()
  }
}

export const store = new StorageManager()
