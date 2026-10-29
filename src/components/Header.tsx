import React from 'react'
import { Zap, Sliders, Settings2, Languages, Minus, X } from 'lucide-react'
import { TranslationKey } from '../i18n'
import { api } from '../services/api'

interface HeaderProps {
  currentMode: 'launcher' | 'config' | 'settings';
  onModeChange: (mode: 'launcher' | 'config' | 'settings') => void;
  lang: 'zh' | 'en';
  onToggleLang: () => void;
  t: (key: TranslationKey) => string;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  lang,
  onToggleLang,
  t
}) => {
  const handleMinimize = () => {
    api.minimizeWindow()
  }

  const handleClose = () => {
    api.closeWindow()
  }

  return (
    <header className="h-12 border-b border-white/[0.08] px-4 flex items-center justify-between select-none shrink-0 bg-white/[0.02]">
      {/* Brand & Traffic lights */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button onClick={handleClose} className="w-2.5 h-2.5 rounded-full bg-zinc-700 hover:bg-rose-500 transition-colors" title="关闭"></button>
          <button onClick={handleMinimize} className="w-2.5 h-2.5 rounded-full bg-zinc-700 hover:bg-amber-500 transition-colors" title="最小化"></button>
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 hover:bg-emerald-500 transition-colors"></div>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10 mx-1"></div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-900 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 shadow-xs">
            Q
          </div>
          <span className="text-xs font-bold tracking-wider text-zinc-100 font-mono">
            {t('app_title')}
          </span>
          <span className="text-xs font-medium text-zinc-400">
            {t('app_subtitle')}
          </span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-white/10 ml-0.5">
            v2.0
          </span>
        </div>
      </div>

      {/* Segmented Controls (3 Modes) */}
      <div className="flex items-center p-0.5 rounded-lg bg-zinc-950/70 border border-white/[0.08] text-xs">
        <button
          onClick={() => onModeChange('launcher')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
            currentMode === 'launcher'
              ? 'text-zinc-100 bg-zinc-800/90 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('seg_launcher')}</span>
        </button>

        <button
          onClick={() => onModeChange('config')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
            currentMode === 'config'
              ? 'text-zinc-100 bg-zinc-800/90 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('seg_config')}</span>
        </button>

        <button
          onClick={() => onModeChange('settings')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
            currentMode === 'settings'
              ? 'text-zinc-100 bg-zinc-800/90 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t('seg_settings')}</span>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Language Switch */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition-colors shadow-xs"
          title="切换中英文 / Switch Language"
        >
          <Languages className="w-3.5 h-3.5 text-zinc-400" />
          <span>{lang.toUpperCase()}</span>
        </button>

        {/* SAP GUI Status Pill */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SAPGUI OK</span>
        </div>
      </div>
    </header>
  )
}
