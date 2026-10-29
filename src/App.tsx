import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LaunchMatrix } from './components/LaunchMatrix';
import { VaultConfig } from './components/VaultConfig';
import { SettingsPanel } from './components/SettingsPanel';
import { ToastContainer, ToastMessage } from './components/Toast';
import { SAPConnection, AppSettings, LANDevice } from './types';
import { t as i18nT, TranslationKey } from './i18n';

export const App: React.FC = () => {
  const [connections, setConnections] = useState<SAPConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings>({
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
  });
  const [currentMode, setCurrentMode] = useState<'launcher' | 'config' | 'settings'>('launcher');
  const [lanDevices, setLanDevices] = useState<LANDevice[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const lang = settings.lang || 'zh';
  const translate = useCallback((key: TranslationKey) => i18nT(key, lang), [lang]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 初始化加载数据
  useEffect(() => {
    const initData = async () => {
      if (window.electronAPI) {
        try {
          const [conns, sets] = await Promise.all([
            window.electronAPI.getConnections(),
            window.electronAPI.getSettings(),
          ]);

          if (conns && conns.length > 0) {
            setConnections(conns);
            setSelectedId(conns[0].id);
          }
          if (sets) {
            setSettings(sets);
          }
        } catch (e) {
          console.error('Failed to load initial data:', e);
        }
      }
    };

    initData();
  }, []);

  // 应用主题与字号到根节点
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);

    // 移除旧字号类
    root.classList.remove('font-compact', 'font-normal', 'font-relaxed');
    const scaleClass =
      settings.fontScale === 'compact'
        ? 'font-compact'
        : settings.fontScale === 'large'
        ? 'font-relaxed'
        : 'font-normal';
    root.classList.add(scaleClass);
  }, [settings.theme, settings.fontScale]);

  // 语言切换
  const handleToggleLang = async () => {
    const newLang: 'zh' | 'en' = lang === 'zh' ? 'en' : 'zh';
    const updated: AppSettings = { ...settings, lang: newLang };
    setSettings(updated);
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(updated);
    }
  };

  // 启动 SAP GUI
  const handleLaunch = async (id: string, tcode?: string) => {
    const target = connections.find((c) => c.id === id);
    if (!target) return;

    if (target.env === 'PRD') {
      const confirmLaunch = window.confirm(
        lang === 'zh'
          ? `⚠️ 生产环境安全保护:\n您确定要直连【${target.name} (${target.sid} 客户端: ${target.client})】吗？`
          : `⚠️ Production Protection:\nAre you sure you want to launch [${target.name} (${target.sid} Client: ${target.client})]?`
      );
      if (!confirmLaunch) return;
    }

    if (window.electronAPI) {
      const res = await window.electronAPI.launchSAP(id, tcode);
      if (res.success) {
        showToast(
          `${translate('launch_toast')}${target.sid}${tcode ? ` -> ${tcode}` : ''}`,
          'success'
        );
        // 更新最后启动与次数
        const updated = connections.map((c) =>
          c.id === id
            ? { ...c, lastLaunched: new Date().toISOString(), launchCount: (c.launchCount || 0) + 1 }
            : c
        );
        setConnections(updated);
        await window.electronAPI.saveConnections(updated);
      } else {
        showToast(res.message, 'error');
      }
    } else {
      showToast(`${translate('launch_toast')}${target.sid} (Preview Mode)`, 'success');
    }
  };

  // 复制连接信息分享
  const handleShare = async (id: string) => {
    const conn = connections.find((c) => c.id === id);
    if (!conn) return;

    const shareText = `【SAP Connection】\nSID: ${conn.sid}\nDescription: ${conn.name}\nHost: ${conn.host}\nSysNr: ${conn.sysnr}\nClient: ${conn.client}\nUser: ${conn.user}\nLanguage: ${conn.lang}`;
    await navigator.clipboard.writeText(shareText);
    showToast(translate('copied_share_toast'), 'success');
  };

  // 克隆连接
  const handleDuplicate = async (id: string) => {
    const original = connections.find((c) => c.id === id);
    if (!original) return;

    const cloned: SAPConnection = {
      ...original,
      id: 'conn_' + Date.now(),
      name: `${original.name} (Copy)`,
      starred: false,
    };

    const updated = [cloned, ...connections];
    setConnections(updated);
    setSelectedId(cloned.id);
    if (window.electronAPI) {
      await window.electronAPI.saveConnections(updated);
    }
    showToast(`${translate('duplicated_toast')}${cloned.name}`, 'success');
  };

  // 新增连接
  const handleCreateNew = () => {
    const newConn: SAPConnection = {
      id: 'conn_' + Date.now(),
      sid: 'NEW',
      name: lang === 'zh' ? '新建 SAP 快捷系统' : 'New SAP System',
      env: 'DEV',
      client: '100',
      host: '10.0.0.1',
      sysnr: '00',
      user: '',
      password: '',
      lang: 'ZH',
      tcodes: ['SE80', 'SM50'],
    };

    const updated = [newConn, ...connections];
    setConnections(updated);
    setSelectedId(newConn.id);
    setCurrentMode('config');
    if (window.electronAPI) {
      window.electronAPI.saveConnections(updated);
    }
  };

  // 保存连接配置
  const handleSaveConnection = async (conn: SAPConnection) => {
    const updated = connections.map((c) => (c.id === conn.id ? conn : c));
    setConnections(updated);
    if (window.electronAPI) {
      await window.electronAPI.saveConnections(updated);
    }
    showToast(`${translate('saved_toast')}${conn.sid}`, 'success');
  };

  // 删除连接
  const handleDeleteConnection = async (id: string) => {
    const updated = connections.filter((c) => c.id !== id);
    setConnections(updated);
    if (selectedId === id) {
      setSelectedId(updated.length > 0 ? updated[0].id : '');
    }
    if (window.electronAPI) {
      await window.electronAPI.saveConnections(updated);
    }
    showToast(translate('deleted_toast'), 'info');
  };

  // 测试单端口连通性
  const handleTestPing = async (host: string, sysnr: string) => {
    if (window.electronAPI) {
      const res = await window.electronAPI.testPing(host, sysnr);
      if (res.ok) {
        showToast(`${translate('ping_ok')} ${res.latency}ms)`, 'success');
      } else {
        showToast(lang === 'zh' ? '网络探测超时或端口不可达' : 'Connection timeout / unreachable', 'error');
      }
    } else {
      showToast(`${translate('ping_ok')} 16ms)`, 'success');
    }
  };

  // 探测全部端口延迟
  const handlePingAll = async () => {
    showToast(lang === 'zh' ? '正在并发探测所有 SAP Dispatcher 端口...' : 'Probing all SAP instances...', 'info');
    if (window.electronAPI) {
      const probes = await Promise.all(
        connections.map(async (c) => {
          const res = await window.electronAPI.testPing(c.host, c.sysnr);
          return { id: c.id, pingMs: res.ok ? res.latency : undefined };
        })
      );
      const pingMap = new Map(probes.map((p) => [p.id, p.pingMs]));
      const updated = connections.map((c) => ({
        ...c,
        pingMs: pingMap.get(c.id),
      }));
      setConnections(updated);
      showToast(translate('ping_all_ok'), 'success');
    } else {
      showToast(translate('ping_all_ok'), 'success');
    }
  };

  // 更新全局设置
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(merged);
    }
    showToast(lang === 'zh' ? '偏好设置已更新' : 'Settings updated', 'success');
  };

  // 扫描本地 Landscape
  const handleScanLandscape = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.scanLandscape();
      if (res.success && res.items && res.items.length > 0) {
        // 合并去重
        const existingKeys = new Set(connections.map((c) => `${c.sid}_${c.client}_${c.host}`));
        const toAdd = res.items.filter((item) => !existingKeys.has(`${item.sid}_${item.client}_${item.host}`));
        if (toAdd.length > 0) {
          const merged = [...connections, ...toAdd];
          setConnections(merged);
          await window.electronAPI.saveConnections(merged);
          showToast(
            lang === 'zh' ? `成功导入 ${toAdd.length} 个本地 SAP GUI 连接` : `Imported ${toAdd.length} connections`,
            'success'
          );
        } else {
          showToast(lang === 'zh' ? '未发现未收录的新连接' : 'No new connections found', 'info');
        }
      } else {
        showToast(res.message || '未扫描到配置项', 'warning');
      }
    }
  };

  // 导出配置备份
  const handleExportData = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.exportData();
      if (res.success) {
        showToast(lang === 'zh' ? `备份已成功导出到: ${res.filePath}` : `Backup exported: ${res.filePath}`, 'success');
      }
    }
  };

  // 导入备份恢复
  const handleImportData = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.importData();
      if (res.success) {
        const fresh = await window.electronAPI.getConnections();
        setConnections(fresh);
        showToast(res.message || '配置导入成功', 'success');
      }
    }
  };

  // 刷新局域网在线同事设备
  const handleRefreshLANDevices = async () => {
    if (window.electronAPI) {
      const devices = await window.electronAPI.scanLANDevices();
      setLanDevices(devices);
      showToast(lang === 'zh' ? `已发现 ${devices.length} 台内网设备` : `Found ${devices.length} LAN peers`, 'info');
    }
  };

  // 向指定同事设备推送配置
  const handleSendConfigToLAN = async (peer: LANDevice) => {
    if (!selectedId) {
      showToast(lang === 'zh' ? '请先选择需要分享的系统连接' : 'Please select a system first', 'warning');
      return;
    }
    if (window.electronAPI) {
      const ok = await window.electronAPI.sendConfigToPeer(peer.ip, peer.port, selectedId);
      if (ok) {
        showToast(lang === 'zh' ? `已安全推送连接配置至【${peer.name}】` : `Pushed config to ${peer.name}`, 'success');
      } else {
        showToast(lang === 'zh' ? '推送失败，请确认对方网络通畅' : 'Push failed', 'error');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden select-none bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* 顶部导航 */}
      <Header
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        lang={lang}
        onToggleLang={handleToggleLang}
        t={translate}
      />

      {/* 主视图渲染区 */}
      <main className="flex-1 overflow-hidden relative">
        {currentMode === 'launcher' && (
          <LaunchMatrix
            connections={connections}
            onLaunch={handleLaunch}
            onEdit={(id) => {
              setSelectedId(id);
              setCurrentMode('config');
            }}
            onDuplicate={handleDuplicate}
            onShare={handleShare}
            onNew={handleCreateNew}
            t={translate}
          />
        )}

        {currentMode === 'config' && (
          <VaultConfig
            connections={connections}
            selectedId={selectedId}
            onSelectId={setSelectedId}
            onSave={handleSaveConnection}
            onDelete={handleDeleteConnection}
            onDuplicate={handleDuplicate}
            onShare={handleShare}
            onTestPing={handleTestPing}
            onPingAll={handlePingAll}
            t={translate}
          />
        )}

        {currentMode === 'settings' && (
          <SettingsPanel
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            lanDevices={lanDevices}
            onRefreshLANDevices={handleRefreshLANDevices}
            onSendConfigToLAN={handleSendConfigToLAN}
            onScanLandscape={handleScanLandscape}
            onExportData={handleExportData}
            onImportData={handleImportData}
            t={translate}
          />
        )}
      </main>

      {/* 全局 Toast 通知 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
