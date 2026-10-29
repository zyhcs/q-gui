import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { shell } from 'electron'
import { SAPConnection } from '../src/types'

export class SapLauncher {
  /**
   * Resolve sapshcut.exe default path in Windows
   */
  public static findSapshcutPath(customPath?: string): string | null {
    if (customPath && fs.existsSync(customPath)) {
      return customPath
    }

    if (process.platform !== 'win32') {
      return null
    }

    const candidatePaths = [
      'C:\\Program Files\\SAP\\FrontEnd\\SAPgui\\sapshcut.exe',
      'C:\\Program Files (x86)\\SAP\\FrontEnd\\SAPgui\\sapshcut.exe',
      'C:\\SAP\\FrontEnd\\SAPgui\\sapshcut.exe',
      path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'SAP\\FrontEnd\\SAPgui\\sapshcut.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'SAP\\FrontEnd\\SAPgui\\sapshcut.exe'),
    ]

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p
      }
    }

    return null
  }

  /**
   * Launch a SAP connection using sapshcut.exe or fallback to .sap shortcut file
   */
  public static async launch(conn: SAPConnection, explicitTcode?: string, customPath?: string): Promise<{ success: boolean; message: string }> {
    const tcode = explicitTcode || (conn.tcodes && conn.tcodes[0]) || ''
    
    // Check if on Windows
    if (process.platform === 'win32') {
      const exePath = this.findSapshcutPath(customPath)

      if (exePath) {
        // Prepare sapshcut arguments
        const args: string[] = []
        if (conn.sid) args.push(`-system=${conn.sid}`)
        if (conn.client) args.push(`-client=${conn.client}`)
        if (conn.user) args.push(`-user=${conn.user}`)
        if (conn.password) args.push(`-pw=${conn.password}`)
        if (conn.lang) args.push(`-language=${conn.lang}`)
        if (conn.sysnr) args.push(`-sysnumber=${conn.sysnr}`)
        if (conn.name) args.push(`-title=${conn.name}`)

        // If host is provided
        if (conn.host) {
          const serverStr = conn.router ? `${conn.router}/H/${conn.host}/S/32${conn.sysnr.padStart(2, '0')}` : conn.host
          args.push(`-server=${serverStr}`)
        }

        if (tcode) {
          // E.g. /nSE80 or SE80
          const formattedTcode = tcode.startsWith('/') ? tcode : `*${tcode}`
          args.push(`-command=${formattedTcode}`)
        }

        try {
          const child = spawn(exePath, args, {
            detached: true,
            stdio: 'ignore'
          })
          child.unref()
          return { success: true, message: `已成功调起 SAP GUI 客户端 (${conn.sid}-${conn.client})` }
        } catch (err: any) {
          console.warn('Direct sapshcut.exe execution failed, trying .sap shortcut fallback:', err)
        }
      }

      // Fallback: Generate a temporary .sap shortcut file and shell execute it
      try {
        const tempSapPath = this.generateTempSapShortcut(conn, tcode)
        await shell.openPath(tempSapPath)
        return { success: true, message: `已通过 .sap 快捷方式调起 SAP GUI (${conn.sid}-${conn.client})` }
      } catch (err: any) {
        return { success: false, message: `唤起失败: ${err.message || '无法打开 SAP GUI'}` }
      }
    }

    // Simulation for Non-Windows (Mac / Linux preview)
    return {
      success: true,
      message: `[预览模式] 已成功模拟唤起: sapshcut -system=${conn.sid} -client=${conn.client} -user=${conn.user || 'DEV'} ${tcode ? '-command=' + tcode : ''}`
    }
  }

  /**
   * Generate standard SAP Shortcut (.sap file)
   */
  private static generateTempSapShortcut(conn: SAPConnection, tcode: string): string {
    const tempDir = os.tmpdir()
    const filePath = path.join(tempDir, `qgui_${conn.sid}_${conn.client}_${Date.now()}.sap`)

    const content = 
`[System]
Name=${conn.sid}
Client=${conn.client}
[User]
Name=${conn.user || ''}
Language=${conn.lang || 'ZH'}
[Function]
Command=${tcode ? (tcode.startsWith('/') ? tcode : `/n${tcode}`) : ''}
Title=${conn.name}
Type=Transaction
[Configuration]
GuiParm=/H/${conn.host}/S/32${conn.sysnr.padStart(2, '0')}
`
    fs.writeFileSync(filePath, content, { encoding: 'latin1' })
    return filePath
  }
}
