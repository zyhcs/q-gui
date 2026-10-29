import React, { useState } from 'react'
import { Search, Play, Share2, Copy, Edit3, PlusCircle } from 'lucide-react'
import { SAPConnection, EnvironmentType } from '../types'
import { TranslationKey } from '../i18n'

interface LaunchMatrixProps {
  connections: SAPConnection[];
  onLaunch: (id: string, tcode?: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShare: (id: string) => void;
  onNew: () => void;
  t: (key: TranslationKey) => string;
}

export const LaunchMatrix: React.FC<LaunchMatrixProps> = ({
  connections,
  onLaunch,
  onEdit,
  onDuplicate,
  onShare,
  onNew,
  t
}) => {
  const [activeEnv, setActiveEnv] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const filteredConnections = connections.filter(item => {
    if (activeEnv !== 'ALL' && item.env !== activeEnv) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const match =
        item.sid.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.client.includes(q) ||
        item.user.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-5">
      {/* Top Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full pl-8 pr-12 py-1.5 text-xs rounded-lg bg-zinc-900/60 border border-white/[0.08] focus:outline-none focus:border-white/30 text-zinc-200 placeholder:text-zinc-500 transition-colors"
          />
          <span className="absolute right-2.5 top-2 text-[10px] font-mono text-zinc-500 kbd-tag px-1 rounded bg-zinc-950">
            ⌘F
          </span>
        </div>

        {/* Environment Tabs */}
        <div className="flex items-center gap-1 text-xs">
          {(['ALL', 'DEV', 'QAS', 'PRD'] as const).map(env => {
            const count = env === 'ALL' ? connections.length : connections.filter(c => c.env === env).length
            const labelKey = `env_${env.toLowerCase()}` as TranslationKey
            const isActive = activeEnv === env
            return (
              <button
                key={env}
                onClick={() => setActiveEnv(env)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t(labelKey)} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Systems Grid: Tactile Hardware Chips */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-1">
        {filteredConnections.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-zinc-500 text-xs">
            {t('search_placeholder')}
          </div>
        ) : (
          filteredConnections.map(item => {
            const isDev = item.env === 'DEV'
            const isQas = item.env === 'QAS'
            const isPrd = item.env === 'PRD'

            const glowBorder = isPrd
              ? 'hover:border-rose-500/40 hover:shadow-glow-prd'
              : isQas
              ? 'hover:border-amber-500/40'
              : 'hover:border-emerald-500/40 hover:shadow-glow-dev'

            return (
              <div
                key={item.id}
                className={`chip-surface p-3.5 rounded-xl border border-white/[0.08] transition-all flex flex-col justify-between ${glowBorder} group`}
              >
                {/* Chip Top: Status, SID, Actions */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPrd ? 'bg-rose-500 animate-pulse' : isQas ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                      ></span>
                      <span className="font-mono font-bold text-sm text-zinc-100 tracking-tight">
                        {item.sid}
                      </span>
                      <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-zinc-900 border border-white/10 text-zinc-300">
                        {item.client}
                      </span>
                      {item.router && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30" title={`SAProuter: ${item.router}`}>
                          ROUTER
                        </span>
                      )}
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onShare(item.id)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-sky-400 transition-colors"
                        title={t('share_card_tooltip')}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDuplicate(item.id)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                        title={t('dup_card_tooltip')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEdit(item.id)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                        title="编辑参数"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Name & User Info */}
                  <div className="mt-2">
                    <div className="text-xs font-medium text-zinc-200 truncate" title={item.name}>
                      {item.name}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      {t('user_label')}:{' '}
                      <span className="text-zinc-300 font-semibold">{item.user || '--'}</span>
                      {' • '}
                      {t('lang_label')}: {item.lang}
                    </div>
                  </div>
                </div>

                {/* Chip Bottom: T-Codes & Launch Button */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                  {/* Direct T-Codes Strip */}
                  <div className="flex items-center gap-1">
                    {(item.tcodes || []).slice(0, 2).map(tc => (
                      <button
                        key={tc}
                        onClick={() => onLaunch(item.id, tc)}
                        className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors"
                        title={`以 /${tc} 直达启动`}
                      >
                        /{tc}
                      </button>
                    ))}
                  </div>

                  {/* Main Launch Button */}
                  <button
                    onClick={() => onLaunch(item.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all active:scale-95 shadow-tactile ${
                      isPrd
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-zinc-100 hover:bg-white text-zinc-950'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{t('launch_btn')}</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Hint Bar */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span>{t('shortcut_hint_prefix')}</span>
          <span className="kbd-tag px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300">
            Ctrl + Shift + Space
          </span>
          <span>{t('shortcut_hint_suffix')}</span>
        </div>

        <button
          onClick={onNew}
          className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{t('add_new_system')}</span>
        </button>
      </div>
    </div>
  )
}
