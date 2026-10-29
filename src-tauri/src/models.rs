use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SAPConnection {
    pub id: String,
    pub sid: String,
    pub name: String,
    pub env: String,
    pub client: String,
    pub user: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    pub lang: String,
    pub host: String,
    pub sysnr: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub router: Option<String>,
    pub tcodes: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ping_ms: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub starred: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_launched: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub launch_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub font_scale: String,
    pub theme: String,
    pub hotkey: String,
    pub main_hotkey: String,
    pub launch_on_boot: bool,
    pub minimize_to_tray: bool,
    pub lan_broadcast: bool,
    pub lang: String,
    pub sapshcut_path: String,
    pub landscape_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            font_scale: "standard".to_string(),
            theme: "zinc".to_string(),
            hotkey: "Ctrl+Shift+Space".to_string(),
            main_hotkey: "Ctrl+Alt+Q".to_string(),
            launch_on_boot: false,
            minimize_to_tray: true,
            lan_broadcast: true,
            lang: "zh".to_string(),
            sapshcut_path: "C:\\Program Files (x86)\\SAP\\FrontEnd\\SAPgui\\sapshcut.exe".to_string(),
            landscape_path: "".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LANDevice {
    pub id: String,
    pub name: String,
    pub ip: String,
    pub port: u16,
    pub last_seen: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResult {
    pub ok: bool,
    pub latency: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub success: bool,
    pub count: usize,
    pub items: Vec<SAPConnection>,
    pub message: String,
}
