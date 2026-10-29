import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { store } from './store'
import { SapLauncher } from './sapLauncher'
import { NetworkProbe } from './networkProbe'
import { LandscapeScanner } from './landscapeScanner'
import { LANSyncService } from './lanSync'
import { SAPConnection, AppSettings } from '../src/types'

// Disable hardware acceleration issues in some VM / remote desktop environments
// app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
let hudWindow: BrowserWindow | null = null
let tray: Tray | null = null
let lanService: LANSyncService | null = null
let isAppQuitting = false

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 640,
    minWidth: 760,
    minHeight: 580,
    title: 'Q-GUI (极龟)',
    backgroundColor: '#08080a',
    frame: true,
    show: false,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Minimize to tray if configured
  mainWindow.on('close', (event) => {
    const settings = store.getSettings()
    if (settings.minimizeToTray && !isAppQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createHUDWindow() {
  hudWindow = new BrowserWindow({
    width: 620,
    height: 420,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (isDev) {
    hudWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL!}?window=hud`)
  } else {
    hudWindow.loadFile(path.join(__dirname, '../dist/index.html'), { query: { window: 'hud' } })
  }

  // Hide automatically when losing focus
  hudWindow.on('blur', () => {
    hudWindow?.hide()
  })
}

function toggleHUD() {
  if (!hudWindow) return
  if (hudWindow.isVisible()) {
    hudWindow.hide()
  } else {
    // Center at top portion of screen
    hudWindow.center()
    const [x] = hudWindow.getPosition()
    hudWindow.setPosition(x, 140)
    hudWindow.show()
    hudWindow.focus()
  }
}

function setupTray() {
  const iconPath = path.join(__dirname, '../public/icon.png')
  tray = new Tray(iconPath)
  tray.setToolTip('Q-GUI (极龟) - SAP 快捷启动中枢')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主面板 (Open Main)',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    {
      label: '呼出查询条 (Quick Launcher)',
      click: () => toggleHUD(),
    },
    { type: 'separator' },
    {
      label: '退出 (Quit Q-GUI)',
      click: () => {
        isAppQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}

function registerHotkeys() {
  globalShortcut.unregisterAll()
  const settings = store.getSettings()

  // Format hotkey for Electron (e.g. "Ctrl+Shift+Space" or CommandOrControl)
  const hudKey = settings.hotkey || 'Ctrl+Shift+Space'
  try {
    globalShortcut.register(hudKey, () => {
      toggleHUD()
    })
  } catch (err) {
    console.warn(`Failed to register HUD hotkey: ${hudKey}`, err)
  }

  // Main window toggle hotkey
  if (settings.mainHotkey) {
    try {
      globalShortcut.register(settings.mainHotkey, () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow?.show()
          mainWindow?.focus()
        }
      })
    } catch {}
  }
}

// App Life Cycle
app.whenReady().then(() => {
  createMainWindow()
  createHUDWindow()
  setupTray()
  registerHotkeys()

  // Start LAN service
  lanService = new LANSyncService((incomingConn, fromDevice) => {
    mainWindow?.webContents.send('lan-config-received', incomingConn, fromDevice)
  })
  const settings = store.getSettings()
  if (settings.lanBroadcast) {
    lanService.start()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
      createHUDWindow()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  lanService?.stop()
})

// IPC Handlers
ipcMain.handle('get-connections', () => {
  return store.getConnections()
})

ipcMain.handle('save-connections', (_, connections: SAPConnection[]) => {
  store.saveConnections(connections)
  // notify HUD window to reload if needed
  hudWindow?.webContents.send('connections-updated', connections)
  return true
})

ipcMain.handle('get-settings', () => {
  return store.getSettings()
})

ipcMain.handle('save-settings', (_, settings: AppSettings) => {
  store.saveSettings(settings)
  registerHotkeys()
  return true
})

ipcMain.handle('launch-sap', async (_, id: string, tcode?: string) => {
  const conns = store.getConnections()
  const conn = conns.find(c => c.id === id)
  if (!conn) {
    return { success: false, message: '系统连接不存在' }
  }

  const settings = store.getSettings()
  const result = await SapLauncher.launch(conn, tcode, settings.sapshcutPath)

  // Update launch count
  conn.launchCount = (conn.launchCount || 0) + 1
  conn.lastLaunched = '刚刚'
  store.saveConnections(conns)

  return result
})

ipcMain.handle('test-ping', async (_, host: string, sysnr: string) => {
  return NetworkProbe.testPort(host, sysnr)
})

ipcMain.handle('scan-landscape', () => {
  const res = LandscapeScanner.scan()
  if (res.success && res.items.length > 0) {
    const cur = store.getConnections()
    // Merge without duplicates
    const merged = [...res.items.filter(newItem => !cur.some(c => c.sid === newItem.sid && c.client === newItem.client)), ...cur]
    store.saveConnections(merged)
  }
  return res
})

ipcMain.handle('export-data', async () => {
  if (!mainWindow) return { success: false }
  const conns = store.getConnections()
  const res = await dialog.showSaveDialog(mainWindow, {
    title: '导出 Q-GUI 连接配置备份',
    defaultPath: 'q-gui-connections-backup.json',
    filters: [{ name: 'JSON 数据包', extensions: ['json'] }]
  })

  if (!res.canceled && res.filePath) {
    fs.writeFileSync(res.filePath, JSON.stringify(conns, null, 2), 'utf-8')
    return { success: true, filePath: res.filePath }
  }
  return { success: false }
})

ipcMain.handle('import-data', async () => {
  if (!mainWindow) return { success: false, count: 0 }
  const res = await dialog.showOpenDialog(mainWindow, {
    title: '导入 Q-GUI 连接配置',
    filters: [{ name: 'JSON 数据包', extensions: ['json'] }]
  })

  if (!res.canceled && res.filePaths.length > 0) {
    try {
      const raw = fs.readFileSync(res.filePaths[0], 'utf-8')
      const imported = JSON.parse(raw)
      if (Array.isArray(imported)) {
        const cur = store.getConnections()
        const merged = [...imported, ...cur]
        store.saveConnections(merged)
        return { success: true, count: imported.length }
      }
    } catch (err: any) {
      return { success: false, count: 0, message: err.message }
    }
  }
  return { success: false, count: 0 }
})

ipcMain.handle('scan-lan-devices', () => {
  return lanService ? lanService.getPeers() : []
})

ipcMain.handle('send-config-to-peer', async (_, peerIp: string, peerPort: number, connectionId: string) => {
  if (!lanService) return false
  const conns = store.getConnections()
  const target = conns.find(c => c.id === connectionId)
  if (!target) return false
  return lanService.sendConfig(peerIp, peerPort, target)
})

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-close', () => {
  mainWindow?.close()
})

ipcMain.on('hud-hide', () => {
  hudWindow?.hide()
})
