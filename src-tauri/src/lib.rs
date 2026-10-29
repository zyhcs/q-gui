pub mod commands;
pub mod lan_sync;
pub mod landscape_scanner;
pub mod models;
pub mod network_probe;
pub mod sap_launcher;
pub mod store;

use commands::*;
use lan_sync::LANSyncService;
use std::sync::{Arc, Mutex};
use store::StoreManager;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let store_manager = Arc::new(Mutex::new(StoreManager::new()));
    let lan_service = Arc::new(LANSyncService::new());
    lan_service.start();

    let app_state = AppState {
        store: Arc::clone(&store_manager),
        lan: Arc::clone(&lan_service),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(app_state)
        .setup(move |app| {
            let handle = app.handle();

            // 1. 设置系统托盘
            setup_tray(handle)?;

            // 2. 注册全局唤出快捷键
            let settings = store_manager.lock().unwrap().get_settings();
            let hotkey_str = if settings.hotkey.is_empty() {
                "Ctrl+Shift+Space"
            } else {
                &settings.hotkey
            };

            if let Ok(shortcut) = hotkey_str.parse::<Shortcut>() {
                let app_handle_shortcut = handle.clone();
                let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _sc, _ev| {
                    toggle_hud(app_handle_shortcut.clone());
                });
            }

            // 3. 监听 HUD 窗口失焦自动隐藏
            if let Some(hud) = app.get_webview_window("hud") {
                let hud_clone = hud.clone();
                hud.on_window_event(move |event| {
                    if let WindowEvent::Focused(false) = event {
                        let _ = hud_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_connections,
            save_connections,
            get_settings,
            save_settings,
            launch_sap,
            test_ping,
            scan_landscape,
            detect_sapshcut,
            export_data,
            import_data,
            scan_lan_devices,
            send_config_to_peer,
            minimize_window,
            close_window,
            hide_hud,
            toggle_hud,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let open_i = MenuItem::with_id(app, "open", "显示主面板 (Open Main)", true, None::<&str>)?;
    let hud_i = MenuItem::with_id(app, "hud", "呼出查询条 (Quick Launcher)", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "退出 (Quit Q-GUI)", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open_i, &hud_i, &quit_i])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Q-GUI (极龟) - SAP 快捷启动中枢")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            "hud" => {
                toggle_hud(app.clone());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    if let Ok(is_visible) = win.is_visible() {
                        if is_visible {
                            let _ = win.hide();
                        } else {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
