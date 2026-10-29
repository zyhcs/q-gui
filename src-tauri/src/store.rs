use crate::models::{AppSettings, SAPConnection};
use std::fs;
use std::path::PathBuf;

pub struct StoreManager {
    data_dir: PathBuf,
}

impl StoreManager {
    pub fn new() -> Self {
        let base = dirs_next().unwrap_or_else(|| PathBuf::from("."));
        let data_dir = base.join("Q-GUI");
        let _ = fs::create_dir_all(&data_dir);
        Self { data_dir }
    }

    fn connections_path(&self) -> PathBuf {
        self.data_dir.join("connections.json")
    }

    fn settings_path(&self) -> PathBuf {
        self.data_dir.join("settings.json")
    }

    pub fn get_connections(&self) -> Vec<SAPConnection> {
        let path = self.connections_path();
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(conns) = serde_json::from_str::<Vec<SAPConnection>>(&content) {
                    return conns;
                }
            }
        }
        self.get_default_connections()
    }

    pub fn save_connections(&self, conns: &[SAPConnection]) -> bool {
        let path = self.connections_path();
        if let Ok(json) = serde_json::to_string_pretty(conns) {
            return fs::write(path, json).is_ok();
        }
        false
    }

    pub fn get_settings(&self) -> AppSettings {
        let path = self.settings_path();
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(settings) = serde_json::from_str::<AppSettings>(&content) {
                    return settings;
                }
            }
        }
        AppSettings::default()
    }

    pub fn save_settings(&self, settings: &AppSettings) -> bool {
        let path = self.settings_path();
        if let Ok(json) = serde_json::to_string_pretty(settings) {
            return fs::write(path, json).is_ok();
        }
        false
    }

    fn get_default_connections(&self) -> Vec<SAPConnection> {
        vec![
            SAPConnection {
                id: "conn_demo_s4h".to_string(),
                sid: "S4H".to_string(),
                name: "DEMO-S400 全功能沙箱".to_string(),
                env: "DEV".to_string(),
                client: "400".to_string(),
                user: "KN090".to_string(),
                password: Some("DemoPass@2026".to_string()),
                lang: "ZH".to_string(),
                host: "10.20.10.35".to_string(),
                sysnr: "00".to_string(),
                router: None,
                tcodes: vec!["SE80".to_string(), "SE38".to_string(), "SPRO".to_string()],
                ping_ms: Some(18),
                starred: Some(true),
                last_launched: None,
                launch_count: Some(12),
            },
            SAPConnection {
                id: "conn_zm_dev_300".to_string(),
                sid: "S4D".to_string(),
                name: "ZM-DEV 开发主系统 300".to_string(),
                env: "DEV".to_string(),
                client: "300".to_string(),
                user: "021569".to_string(),
                password: Some("DevSecret#88".to_string()),
                lang: "ZH".to_string(),
                host: "10.20.10.41".to_string(),
                sysnr: "01".to_string(),
                router: None,
                tcodes: vec!["SE80".to_string(), "SM50".to_string(), "ST05".to_string(), "SPRO".to_string()],
                ping_ms: Some(24),
                starred: Some(true),
                last_launched: None,
                launch_count: Some(45),
            },
            SAPConnection {
                id: "conn_zm_dev_200".to_string(),
                sid: "S4D".to_string(),
                name: "ZM-DEV 业务配置客户端 200".to_string(),
                env: "DEV".to_string(),
                client: "200".to_string(),
                user: "021569".to_string(),
                password: None,
                lang: "ZH".to_string(),
                host: "10.20.10.41".to_string(),
                sysnr: "01".to_string(),
                router: None,
                tcodes: vec!["SPRO".to_string(), "SCC4".to_string(), "SM30".to_string()],
                ping_ms: Some(24),
                starred: Some(false),
                last_launched: None,
                launch_count: Some(8),
            },
            SAPConnection {
                id: "conn_zm_qas_600".to_string(),
                sid: "S4Q".to_string(),
                name: "ZM-QAS 测试与质量验收".to_string(),
                env: "QAS".to_string(),
                client: "600".to_string(),
                user: "021569".to_string(),
                password: None,
                lang: "ZH".to_string(),
                host: "10.20.10.42".to_string(),
                sysnr: "02".to_string(),
                router: None,
                tcodes: vec!["VA03".to_string(), "MM03".to_string(), "STMS".to_string()],
                ping_ms: Some(36),
                starred: Some(false),
                last_launched: None,
                launch_count: Some(19),
            },
            SAPConnection {
                id: "conn_zm_prd_888".to_string(),
                sid: "S4P".to_string(),
                name: "ZM-PRD 集团核心生产系统".to_string(),
                env: "PRD".to_string(),
                client: "888".to_string(),
                user: "021569".to_string(),
                password: None,
                lang: "ZH".to_string(),
                host: "10.20.10.50".to_string(),
                sysnr: "00".to_string(),
                router: None,
                tcodes: vec!["SM50".to_string(), "ST22".to_string(), "SM21".to_string()],
                ping_ms: Some(15),
                starred: Some(false),
                last_launched: None,
                launch_count: Some(5),
            },
        ]
    }
}

fn dirs_next() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        std::env::var_os("APPDATA").map(PathBuf::from)
    }
    #[cfg(not(windows))]
    {
        std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config"))
    }
}
