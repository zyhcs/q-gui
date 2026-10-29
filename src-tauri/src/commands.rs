use crate::landscape_scanner::LandscapeScanner;
use crate::models::{AppSettings, LANDevice, LaunchResult, PingResult, SAPConnection, ScanResult};
use crate::network_probe::NetworkProbe;
use crate::sap_launcher::SapLauncher;
use crate::store::StoreManager;
use crate::lan_sync::LANSyncService;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

pub struct AppState {
    pub store: Arc<Mutex<StoreManager>>,
    pub lan: Arc<LANSyncService>,
}

#[tauri::command]
pub fn get_connections(state: tauri::State<'_, AppState>) -> Vec<SAPConnection> {
    state.store.lock().unwrap().get_connections()
}

#[tauri::command]
pub fn save_connections(connections: Vec<SAPConnection>, state: tauri::State<'_, AppState>) -> bool {
    state.store.lock().unwrap().save_connections(&connections)
}

#[tauri::command]
pub fn get_settings(state: tauri::State<'_, AppState>) -> AppSettings {
    state.store.lock().unwrap().get_settings()
}

#[tauri::command]
pub fn save_settings(settings: AppSettings, state: tauri::State<'_, AppState>) -> bool {
    state.store.lock().unwrap().save_settings(&settings)
}

#[tauri::command]
pub fn launch_sap(id: String, tcode: Option<String>, state: tauri::State<'_, AppState>) -> LaunchResult {
    let store = state.store.lock().unwrap();
    let conns = store.get_connections();
    let settings = store.get_settings();

    if let Some(target) = conns.iter().find(|c| c.id == id) {
        SapLauncher::launch(target, tcode.as_deref(), &settings.sapshcut_path)
    } else {
        LaunchResult {
            success: false,
            message: format!("未找到指定的 SAP 连接配置: {}", id),
        }
    }
}

#[tauri::command]
pub fn test_ping(host: String, sysnr: String) -> PingResult {
    NetworkProbe::ping(&host, &sysnr)
}

#[tauri::command]
pub fn scan_landscape(custom_path: Option<String>) -> ScanResult {
    LandscapeScanner::scan(&custom_path.unwrap_or_default())
}

#[tauri::command]
pub fn detect_sapshcut(custom_path: Option<String>) -> (bool, String) {
    SapLauncher::detect_sapshcut(&custom_path.unwrap_or_default())
}

#[tauri::command]
pub fn export_data(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let store = state.store.lock().unwrap();
    let conns = store.get_connections();
    let settings = store.get_settings();

    let export_obj = serde_json::json!({
        "version": "2.0",
        "exportedAt": chrono::Utc::now().to_rfc3339(),
        "connections": conns,
        "settings": settings,
    });

    let json_str = serde_json::to_string_pretty(&export_obj).map_err(|e| e.to_string())?;

    let download_dir = dirs_next_download().unwrap_or_else(|| std::path::PathBuf::from("."));
    let target_file = download_dir.join(format!("qgui_backup_{}.json", chrono::Local::now().format("%Y%m%d_%H%M%S")));

    std::fs::write(&target_file, json_str).map_err(|e| e.to_string())?;
    Ok(target_file.to_string_lossy().to_string())
}

#[tauri::command]
pub fn import_data(json_content: String, state: tauri::State<'_, AppState>) -> Result<usize, String> {
    let val: serde_json::Value = serde_json::from_str(&json_content).map_err(|e| format!("无效的 JSON 格式: {}", e))?;
    
    if let Some(conns_val) = val.get("connections") {
        let conns: Vec<SAPConnection> = serde_json::from_value(conns_val.clone()).map_err(|e| format!("连接数据反序列化失败: {}", e))?;
        let count = conns.len();
        state.store.lock().unwrap().save_connections(&conns);
        Ok(count)
    } else {
        Err("备份文件中未包含有效的 connections 键值".to_string())
    }
}

#[tauri::command]
pub fn scan_lan_devices(state: tauri::State<'_, AppState>) -> Vec<LANDevice> {
    state.lan.get_devices()
}

#[tauri::command]
pub fn send_config_to_peer(peer_ip: String, peer_port: u16, connection_id: String, state: tauri::State<'_, AppState>) -> bool {
    let store = state.store.lock().unwrap();
    let conns = store.get_connections();
    if let Some(conn) = conns.iter().find(|c| c.id == connection_id) {
        state.lan.send_config(&peer_ip, peer_port, conn)
    } else {
        false
    }
}

#[tauri::command]
pub fn minimize_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}

#[tauri::command]
pub fn close_window(app: AppHandle, state: tauri::State<'_, AppState>) {
    let settings = state.store.lock().unwrap().get_settings();
    if let Some(window) = app.get_webview_window("main") {
        if settings.minimize_to_tray {
            let _ = window.hide();
        } else {
            let _ = window.close();
        }
    }
}

#[tauri::command]
pub fn hide_hud(app: AppHandle) {
    if let Some(hud) = app.get_webview_window("hud") {
        let _ = hud.hide();
    }
}

#[tauri::command]
pub fn toggle_hud(app: AppHandle) {
    if let Some(hud) = app.get_webview_window("hud") {
        if let Ok(is_visible) = hud.is_visible() {
            if is_visible {
                let _ = hud.hide();
            } else {
                let _ = hud.center();
                if let Ok(pos) = hud.outer_position() {
                    let _ = hud.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: pos.x, y: 150 }));
                }
                let _ = hud.show();
                let _ = hud.set_focus();
            }
        }
    }
}

fn dirs_next_download() -> Option<std::path::PathBuf> {
    #[cfg(windows)]
    {
        std::env::var_os("USERPROFILE").map(|u| std::path::PathBuf::from(u).join("Downloads"))
    }
    #[cfg(not(windows))]
    {
        std::env::var_os("HOME").map(|h| std::path::PathBuf::from(h).join("Downloads"))
    }
}
