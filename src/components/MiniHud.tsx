import React, { useState, useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import { SAPConnection } from '../types'
import { translations, TranslationKey } from '../i18n'
import { api } from '../services/api'

export const MiniHud: React.FC = () => {
  const [connections, setConnections] = useState<SAPConnection[]>([])
  const [query, setQuery] = useState<string>('')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const inputRef = useRef<HTMLInputElement>(null)

  const t = (key: TranslationKey) => translations[lang][key] || key

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()

    api.getConnections().then(data => setConnections(data))
    api.getSettings().then(st => setLang(st.lang || 'zh'))
  }, [])

  // Composite search: e.g. "s4d se80"
  const parts = query.trim().split(' ').filter(Boolean)
  const systemQ = parts[0] ? parts[0].toLowerCase() : ''
  const directTcode = parts[1] || ''

  const filtered = connections.filter(item => {
    if (!systemQ) return true
    return (
      item.sid.toLowerCase().includes(systemQ) ||
      item.name.toLowerCase().includes(systemQ) ||
      item.client.includes(systemQ) ||
      item.user.toLowerCase().includes(systemQ) ||
      (item.tcodes && item.tcodes.some(tc => tc.toLowerCase().includes(systemQ)))
    )
  })

  const handleLaunch = (conn: SAPConnection) => {
    if (conn.env === 'PRD') {
      const ok = confirm(`⚠️ 生产环境防护 / PRD Warning:\n确认启动【${conn.name} (${conn.sid} Client: ${conn.client})】吗？`)
      if (!ok) return
    }

    api.launchSAP(conn.id, directTcode)
    api.hideHUD()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      api.hideHUD()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (selectedIndex < filtered.length - 1) {
        setSelectedIndex(selectedIndex + 1)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleLaunch(filtered[selectedIndex])
      }
    }
  }

  const injectTcode = (tc: string) => {
    const curSys = parts[0] || ''
    setQuery(curSys ? `${curSys} ${tc}` : tc)
    inputRef.current?.focus()
  }

  return (
    <div className="w-full h-screen p-2 flex items-start justify-center select-none bg-transparent">
      <div
        className="w-full max-w-xl rounded-2xl border border-white/[0.12] bg-zinc-900/95 shadow-2xl overflow-hidden flex flex-col"
        style={{ boxShadow: '0 30px 70px -10px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.12)' }}
      >
        {/* Top Input */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-zinc-200">
            <Terminal className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('hud_search_placeholder')}
            className="w-full bg-transparent text-sm placeholder:text-zinc-500 text-zinc-100 focus:outline-none font-sans"
            autoFocus
          />
          <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
            <span className="kbd-tag px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">ESC</span>
          </div>
        </div>

        {/* Quick T-Codes tags */}
        <div className="px-4 py-1.5 bg-black/30 border-b border-white/[0.04] flex items-center gap-2 overflow-x-auto text-[11px] text-zinc-400 font-mono">
          <span className="text-zinc-500 font-sans">{t('direct_keys')}</span>
          {['SE80', 'SM50', 'ST05', 'SPRO'].map(tc => (
            <button
              key={tc}
              onClick={() => injectTcode(tc)}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              /{tc}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[260px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-xs">
              未找到系统，按 ESC 退出
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex
              const isPrd = item.env === 'PRD'

              return (
                <div
                  key={item.id}
                  onClick={() => handleLaunch(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-lg bg-zinc-950 border border-white/10 flex items-center justify-center font-mono font-bold text-xs ${
                        isPrd ? 'text-rose-400' : 'text-zinc-200'
                      }`}
                    >
                      {item.sid}
                    </span>
                    <div>
                      <div className="text-xs font-medium flex items-center gap-1.5">
                        <span className={isSelected ? 'text-white font-semibold' : ''}>{item.name}</span>
                        <span
                          className={`text-[9px] font-mono px-1 rounded ${
                            isPrd ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {item.env}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        Client: <strong className="text-zinc-300">{item.client}</strong> • 用户: {item.user || '--'}
                        {directTcode && (
                          <span className="text-emerald-400 font-semibold ml-1">
                            -&gt; 直达 /{directTcode.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                      <span className="kbd-tag px-1 rounded bg-zinc-700 text-zinc-200">↵ {t('kbd_enter')}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Bottom Hint */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-black/40 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="kbd-tag px-1 rounded bg-zinc-800 text-zinc-300">↑↓</kbd> {t('kbd_nav')}
            </span>
            <span>
              <kbd className="kbd-tag px-1 rounded bg-zinc-800 text-zinc-300">↵</kbd> {t('kbd_enter')}
            </span>
          </div>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {t('vault_ready')}
          </span>
        </div>
      </div>
    </div>
  )
}
