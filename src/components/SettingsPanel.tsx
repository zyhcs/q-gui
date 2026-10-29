import React, { useState } from 'react'
import {
  Palette,
  Keyboard,
  Database,
  Radio,
  FolderCog,
  RefreshCw,
  Download,
  Upload,
  Laptop,
  Monitor,
  Send,
  Shield
} from 'lucide-react'
import { AppSettings, LANDevice } from '../types'
import { TranslationKey } from '../i18n'

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  lanDevices: LANDevice[];
  onRefreshLANDevices: () => void;
  onSendConfigToLAN: (peer: LANDevice) => void;
  onScanLandscape: () => void;
  onExportData: () => void;
  onImportData: () => void;
  t: (key: TranslationKey) => string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  lanDevices,
  onRefreshLANDevices,
  onSendConfigToLAN,
  onScanLandscape,
  onExportData,
  onImportData,
  t
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'appearance' | 'hotkeys' | 'data' | 'lan'>('appearance')
  const [isRecordingKey, setIsRecordingKey] = useState<boolean>(false)

  const handleRecordKey = () => {
    setIsRecordingKey(true)
    setTimeout(() => {
      onUpdateSettings({ hotkey: 'Ctrl+Space' })
      setIsRecordingKey(false)
    }, 1500)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Settings Sub-Tabs */}
      <div className="w-52 border-r border-white/[0.08] bg-zinc-950/40 flex flex-col shrink-0 p-3 select-none">
        <div className="pb-2 mb-2 border-b border-white/[0.06] text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          {t('settings_title')}
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setActiveSubTab('appearance')}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'appearance'
                ? 'text-zinc-100 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>{t('st_appearance')}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hotkeys')}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'hotkeys'
                ? 'text-zinc-100 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <span>{t('st_hotkeys')}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('data')}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'data'
                ? 'text-zinc-100 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Database className="w-4 h-4 text-sky-400" />
            <span>{t('st_data')}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('lan')}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'lan'
                ? 'text-zinc-100 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-400" />
            <span>{t('st_lan')}</span>
          </button>
        </nav>

        <div className="mt-auto pt-3 border-t border-white/[0.06] text-[10px] font-mono text-zinc-500">
          <div>Q-GUI Core v2.0.4</div>
          <div className="text-zinc-600">Engine: SAPGUI Interop</div>
        </div>
      </div>

      {/* Right Settings Content Panes */}
      <div className="flex-1 overflow-y-auto p-5 bg-zinc-950/20">
        {/* SUBTAB 1: Appearance */}
        {activeSubTab === 'appearance' && (
          <div className="space-y-5 text-xs">
            <div className="border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">{t('st_app_title')}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">{t('st_app_subtitle')}</p>
            </div>

            {/* Font Scaling */}
            <div className="space-y-2">
              <label className="block font-medium text-zinc-300">{t('st_font_size')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'standard', 'large'] as const).map(scale => {
                  const isActive = settings.fontScale === scale
                  const labelKey = `font_${scale}` as TranslationKey
                  return (
                    <button
                      key={scale}
                      onClick={() => onUpdateSettings({ fontScale: scale })}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isActive
                          ? 'border-emerald-500/40 bg-zinc-800'
                          : 'border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-800'
                      }`}
                    >
                      <div className={`font-semibold text-xs ${isActive ? 'text-zinc-100' : 'text-zinc-200'}`}>
                        {t(labelKey)}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {scale === 'compact' ? '高密度精炼' : scale === 'standard' ? '默认黄金比例' : '大字更清晰'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Theme Variants */}
            <div className="space-y-2">
              <label className="block font-medium text-zinc-300">{t('st_theme_palette')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdateSettings({ theme: 'zinc' })}
                  className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                    settings.theme === 'zinc'
                      ? 'border-emerald-500/40 bg-zinc-900'
                      : 'border-white/[0.08] bg-zinc-900/60 hover:bg-zinc-900'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-zinc-100">纯黑碳晶 (Zinc)</div>
                    <div className="text-[10px] text-zinc-500">Impeccable 极客黑</div>
                  </div>
                  <span className="w-3 h-3 rounded-full bg-zinc-200 border border-zinc-700"></span>
                </button>

                <button
                  onClick={() => onUpdateSettings({ theme: 'slate' })}
                  className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                    settings.theme === 'slate'
                      ? 'border-emerald-500/40 bg-[#0c1220]'
                      : 'border-white/[0.08] bg-[#0c1220]/60 hover:bg-[#0c1220]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-zinc-200">深蓝夜空 (Slate)</div>
                    <div className="text-[10px] text-zinc-500">沉浸 Fiori 深蓝</div>
                  </div>
                  <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                </button>

                <button
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                    settings.theme === 'light'
                      ? 'border-emerald-500/40 bg-zinc-200'
                      : 'border-white/[0.08] bg-zinc-200/60 hover:bg-zinc-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-zinc-900">极简明亮 (Light)</div>
                    <div className="text-[10px] text-zinc-600">日间高对比度</div>
                  </div>
                  <span className="w-3 h-3 rounded-full bg-white border border-zinc-400"></span>
                </button>
              </div>
            </div>

            {/* Window Behaviors */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="block font-medium text-zinc-300">{t('st_window_behavior')}</label>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-white/[0.06] cursor-pointer">
                  <div>
                    <div className="font-medium text-zinc-200">{t('opt_boot_launch')}</div>
                    <div className="text-[10px] text-zinc-500">{t('opt_boot_launch_sub')}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.launchOnBoot}
                    onChange={e => onUpdateSettings({ launchOnBoot: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-white/[0.06] cursor-pointer">
                  <div>
                    <div className="font-medium text-zinc-200">{t('opt_tray_min')}</div>
                    <div className="text-[10px] text-zinc-500">{t('opt_tray_min_sub')}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.minimizeToTray}
                    onChange={e => onUpdateSettings({ minimizeToTray: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Hotkeys */}
        {activeSubTab === 'hotkeys' && (
          <div className="space-y-5 text-xs">
            <div className="border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">{t('st_hotkeys_title')}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">{t('st_hotkeys_subtitle')}</p>
            </div>

            {/* HUD Hotkey */}
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.08] flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-200">{t('hk_hud_label')}</div>
                <div className="text-[10px] text-zinc-500">{t('hk_hud_desc')}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs px-2.5 py-1 rounded-md bg-zinc-950 border border-white/10 font-semibold kbd-tag ${
                    isRecordingKey ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                  }`}
                >
                  {isRecordingKey ? '请在键盘按下按键...' : settings.hotkey || 'Ctrl + Shift + Space'}
                </span>
                <button
                  onClick={handleRecordKey}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
                >
                  {t('btn_change_key')}
                </button>
              </div>
            </div>

            {/* Main Window Hotkey */}
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.08] flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-200">{t('hk_main_label')}</div>
                <div className="text-[10px] text-zinc-500">{t('hk_main_desc')}</div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-zinc-950 border border-white/10 text-zinc-300 kbd-tag">
                {settings.mainHotkey || 'Ctrl + Alt + Q'}
              </span>
            </div>

            {/* Behaviors */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="block font-medium text-zinc-300">{t('hk_behavior_title')}</label>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.06] space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">{t('opt_double_click')}</span>
                  <span className="font-mono text-zinc-400">直接调起 sapshcut 登录启动</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">{t('opt_prd_confirm')}</span>
                  <span className="font-semibold text-rose-400">强制防误触弹窗校验</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Data & Local Landscape */}
        {activeSubTab === 'data' && (
          <div className="space-y-5 text-xs">
            <div className="border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">{t('st_data_title')}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">{t('st_data_subtitle')}</p>
            </div>

            {/* Landscape XML File */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderCog className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-zinc-200">{t('gui_path_title')}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 路径有效
                </span>
              </div>

              <div className="font-mono text-[11px] px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-zinc-400 truncate">
                {settings.landscapePath || 'C:\\Users\\Admin\\AppData\\Roaming\\SAP\\Common\\SAPUILandscape.xml'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onScanLandscape}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('btn_read_gui')}</span>
                </button>
              </div>
            </div>

            {/* Backup & Export */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="block font-medium text-zinc-300">{t('backup_section_title')}</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-200">导出配置文件</div>
                    <div className="text-[10px] text-zinc-500">保存为 JSON 数据包</div>
                  </div>
                  <button
                    onClick={onExportData}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>导出</span>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-200">导入恢复配置</div>
                    <div className="text-[10px] text-zinc-500">从本地备份合并</div>
                  </div>
                  <button
                    onClick={onImportData}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>导入</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: LAN Sync (Q-AirDrop) */}
        {activeSubTab === 'lan' && (
          <div className="space-y-5 text-xs">
            <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">{t('st_lan_title')}</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">{t('st_lan_subtitle')}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">{t('broadcast_label')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.lanBroadcast}
                    onChange={e => onUpdateSettings({ lanBroadcast: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Peer Devices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="font-semibold text-zinc-200">{t('lan_active_devices')}</span>
                </div>
                <button
                  onClick={onRefreshLANDevices}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('btn_refresh_radar')}</span>
                </button>
              </div>

              {/* Device cards */}
              <div className="space-y-2">
                {lanDevices.map(peer => (
                  <div
                    key={peer.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200">
                        {peer.name.includes('MacBook') ? <Laptop className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-200">{peer.name}</div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {peer.ip} • Q-GUI 就绪
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSendConfigToLAN(peer)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-indigo-600 text-zinc-200 hover:text-white border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>{t('btn_push_config')}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Security Hint */}
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                <span>{t('lan_security_tip')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
