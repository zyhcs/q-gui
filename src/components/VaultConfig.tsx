import React, { useState, useEffect } from 'react'
import { Plus, Activity, Trash2, Radio, Copy, Share2, Eye, EyeOff } from 'lucide-react'
import { SAPConnection, EnvironmentType, LanguageCode } from '../types'
import { TranslationKey } from '../i18n'

interface VaultConfigProps {
  connections: SAPConnection[];
  selectedId: string;
  onSelectId: (id: string) => void;
  onSave: (conn: SAPConnection) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShare: (id: string) => void;
  onTestPing: (host: string, sysnr: string) => void;
  onPingAll: () => void;
  t: (key: TranslationKey) => string;
}

export const VaultConfig: React.FC<VaultConfigProps> = ({
  connections,
  selectedId,
  onSelectId,
  onSave,
  onDelete,
  onDuplicate,
  onShare,
  onTestPing,
  onPingAll,
  t
}) => {
  const [formData, setFormData] = useState<Partial<SAPConnection>>({
    sid: '',
    name: '',
    env: 'DEV',
    client: '100',
    host: '',
    sysnr: '00',
    user: '',
    lang: 'ZH',
    password: '',
    tcodes: ['SE80', 'SM50']
  })

  const [tcodesInput, setTcodesInput] = useState<string>('SE80, SM50')
  const [showPassword, setShowPassword] = useState<boolean>(false)

  // Sync form when selectedId changes
  useEffect(() => {
    const item = connections.find(c => c.id === selectedId)
    if (item) {
      setFormData({ ...item })
      setTcodesInput((item.tcodes || []).join(', '))
      setShowPassword(false)
    } else {
      // Default new form
      setFormData({
        id: '',
        sid: '',
        name: '',
        env: 'DEV',
        client: '100',
        host: '',
        sysnr: '00',
        user: '',
        lang: 'ZH',
        password: '',
        tcodes: ['SE80', 'SM50']
      })
      setTcodesInput('SE80, SM50')
      setShowPassword(false)
    }
  }, [selectedId, connections])

  const handleCreateNew = () => {
    onSelectId('')
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.sid || !formData.name || !formData.client || !formData.host) {
      alert(t('field_sid') + ' & ' + t('field_name') + ' & ' + t('field_client') + ' & ' + t('field_host'))
      return
    }

    const tcodeList = tcodesInput
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)

    const payload: SAPConnection = {
      id: formData.id || 'c_' + Date.now(),
      sid: formData.sid.trim().toUpperCase(),
      name: formData.name.trim(),
      env: (formData.env as EnvironmentType) || 'DEV',
      client: formData.client.trim(),
      host: formData.host.trim(),
      sysnr: (formData.sysnr || '00').trim(),
      user: (formData.user || '').trim().toUpperCase(),
      lang: (formData.lang as LanguageCode) || 'ZH',
      router: formData.router ? formData.router.trim() : undefined,
      password: formData.password || '',
      tcodes: tcodeList.length ? tcodeList : ['SE80'],
      pingMs: formData.pingMs || 10,
      starred: formData.starred || false,
    }

    onSave(payload)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Config Sidebar */}
      <div className="w-60 border-r border-white/[0.08] bg-zinc-950/40 flex flex-col shrink-0 p-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {t('system_list_title')}
          </span>
          <button
            onClick={handleCreateNew}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="添加新系统"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of Connections */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {connections.map(item => {
            const isSelected = item.id === selectedId
            return (
              <button
                key={item.id}
                onClick={() => onSelectId(item.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                <div className="truncate">
                  <span className="font-mono font-bold">{item.sid}</span>
                  <span className="text-[10px] text-zinc-500 font-mono ml-1">{item.client}</span>
                  <div className="text-[10px] text-zinc-400 truncate">{item.name}</div>
                </div>

                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1 ${
                    item.env === 'PRD'
                      ? 'bg-rose-500'
                      : item.env === 'QAS'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                ></span>
              </button>
            )
          })}
        </div>

        {/* Ping Test All */}
        <div className="pt-2 border-t border-white/[0.06]">
          <button
            onClick={onPingAll}
            className="w-full py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/[0.06] text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('ping_all_btn')}</span>
          </button>
        </div>
      </div>

      {/* Right Config Form */}
      <div className="flex-1 overflow-y-auto p-5 bg-zinc-950/20 flex flex-col justify-between">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-semibold text-zinc-100">
              {formData.id ? `编辑系统: ${formData.sid} (${formData.name})` : t('add_new_system')}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">{t('form_subtitle')}</p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium mb-1 text-zinc-400">{t('field_sid')}</label>
              <input
                type="text"
                value={formData.sid || ''}
                onChange={e => setFormData({ ...formData, sid: e.target.value })}
                placeholder="例: S4D"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 font-mono uppercase text-zinc-100"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-zinc-400">{t('field_name')}</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: ZM-DEV 开发主系统"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 text-zinc-100"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-zinc-400">{t('field_env')}</label>
              <select
                value={formData.env || 'DEV'}
                onChange={e => setFormData({ ...formData, env: e.target.value as EnvironmentType })}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 text-zinc-100"
              >
                <option value="DEV">DEV - 开发环境 (Emerald)</option>
                <option value="QAS">QAS - 测试/质量 (Amber)</option>
                <option value="PRD">PRD - 生产环境 (Rose 护栏保护)</option>
                <option value="SBX">SBX - 沙箱环境 (Blue)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1 text-zinc-400">{t('field_client')}</label>
              <input
                type="text"
                value={formData.client || ''}
                onChange={e => setFormData({ ...formData, client: e.target.value })}
                placeholder="例: 300"
                maxLength={3}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 font-mono text-zinc-100"
              />
            </div>

            <div className="col-span-2 grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-medium mb-1 text-zinc-400">{t('field_host')}</label>
                <input
                  type="text"
                  value={formData.host || ''}
                  onChange={e => setFormData({ ...formData, host: e.target.value })}
                  placeholder="例: 10.20.10.41 或 172.26.190.125"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 font-mono text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-zinc-400">{t('field_sysnr')}</label>
                <input
                  type="text"
                  value={formData.sysnr || ''}
                  onChange={e => setFormData({ ...formData, sysnr: e.target.value })}
                  placeholder="例: 00"
                  maxLength={2}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 font-mono text-zinc-100"
                />
              </div>
            </div>

            {/* SAProuter 字符串 */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-400">{t('field_router')}</label>
                <span className="text-[10px] text-zinc-500 font-normal">{t('router_sub')}</span>
              </div>
              <input
                type="text"
                value={formData.router || ''}
                onChange={e => setFormData({ ...formData, router: e.target.value })}
                placeholder="例: /H/SAPROUTER.dreame.tech 或 /H/1.2.3.4"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 font-mono text-zinc-100"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-zinc-400">{t('field_user')}</label>
              <input
                type="text"
                value={formData.user || ''}
                onChange={e => setFormData({ ...formData, user: e.target.value })}
                placeholder="例: 021569"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 font-mono uppercase text-zinc-100"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-zinc-400">{t('field_lang')}</label>
              <select
                value={formData.lang || 'ZH'}
                onChange={e => setFormData({ ...formData, lang: e.target.value as LanguageCode })}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 text-zinc-100"
              >
                <option value="ZH">ZH - 中文</option>
                <option value="EN">EN - English</option>
                <option value="DE">DE - Deutsch</option>
              </select>
            </div>

            {/* Password with Eye Toggle */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-400">{t('field_password')}</label>
                <span className="text-[10px] text-zinc-500">{t('password_hint')}</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-3 pr-10 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 font-mono text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-200 transition-colors p-0.5"
                  title="显示/隐藏密码"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Initial T-Codes */}
            <div className="col-span-2">
              <label className="block font-medium mb-1 text-zinc-400">{t('field_tcodes')}</label>
              <input
                type="text"
                value={tcodesInput}
                onChange={e => setTcodesInput(e.target.value)}
                placeholder="例: SE80, SM50, ST05, SPRO"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.1] focus:outline-none focus:border-white/30 font-mono uppercase text-zinc-100"
              />
            </div>
          </div>
        </form>

        {/* Bottom Actions Bar (Strict single line, no wrapping) */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between mt-4 shrink-0">
          {/* Left: Danger Action */}
          <button
            type="button"
            onClick={() => formData.id && onDelete(formData.id)}
            disabled={!formData.id}
            className="h-8 px-2.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('delete_conn_btn')}</span>
          </button>

          {/* Right: Utility & Save */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Test Ping */}
            <button
              type="button"
              onClick={() => onTestPing(formData.host || '', formData.sysnr || '00')}
              className="h-8 px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{t('test_ping_btn')}</span>
            </button>

            {/* Clone Duplicate */}
            <button
              type="button"
              onClick={() => formData.id && onDuplicate(formData.id)}
              disabled={!formData.id}
              className="h-8 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/[0.08] disabled:opacity-30 disabled:pointer-events-none text-xs font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              title="基于当前系统创建副本"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{t('duplicate_btn')}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => formData.id && onShare(formData.id)}
              disabled={!formData.id}
              className="h-8 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/[0.08] disabled:opacity-30 disabled:pointer-events-none text-xs font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              title="复制连接参数到剪贴板分享"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('share_btn')}</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="h-8 px-4 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-xs transition-all shadow-md ml-1 whitespace-nowrap shrink-0"
            >
              {t('save_config_btn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
