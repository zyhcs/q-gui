use crate::models::{SAPConnection, ScanResult};
use quick_xml::events::Event;
use quick_xml::Reader;
use std::collections::HashMap;
use std::path::PathBuf;

pub struct LandscapeScanner;

impl LandscapeScanner {
    pub fn get_default_path() -> PathBuf {
        #[cfg(windows)]
        {
            if let Ok(appdata) = std::env::var("APPDATA") {
                return PathBuf::from(appdata).join(r"SAP\Common\SAPUILandscape.xml");
            }
        }
        PathBuf::from("SAPUILandscape.xml")
    }

    pub fn scan(custom_path: &str) -> ScanResult {
        let path = if !custom_path.is_empty() {
            PathBuf::from(custom_path)
        } else {
            Self::get_default_path()
        };

        if !path.exists() {
            return ScanResult {
                success: false,
                count: 0,
                items: Vec::new(),
                message: format!("未找到 SAP 官方配置文件: {}", path.display()),
            };
        }

        let content = match std::fs::read_to_string(&path) {
            Ok(c) => c,
            Err(e) => {
                return ScanResult {
                    success: false,
                    count: 0,
                    items: Vec::new(),
                    message: format!("读取配置文件失败: {}", e),
                }
            }
        };

        let items = Self::parse_xml(&content);
        let count = items.len();

        ScanResult {
            success: true,
            count,
            items,
            message: format!("成功解析本地 Landscape 记录 {} 条", count),
        }
    }

    fn parse_xml(xml: &str) -> Vec<SAPConnection> {
        let mut reader = Reader::from_str(xml);
        reader.config_mut().trim_text(true);

        let mut connections = Vec::new();
        let mut buf = Vec::new();

        // 存储 Router 映射: uuid -> router string (例如 /H/SAPROUTER.dreame.tech)
        let mut routers: HashMap<String, String> = HashMap::new();
        // 存储 Service 映射: uuid -> (systemid, server, sysnr, Option<router_uuid>)
        let mut services: HashMap<String, (String, String, String, Option<String>)> = HashMap::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Empty(ref e)) | Ok(Event::Start(ref e)) => {
                    let name = e.name();
                    if name.as_ref() == b"Router" {
                        let mut uuid = String::new();
                        let mut router_str = String::new();

                        for attr in e.attributes().flatten() {
                            match attr.key.as_ref() {
                                b"uuid" => uuid = String::from_utf8_lossy(&attr.value).to_string(),
                                b"router" => router_str = String::from_utf8_lossy(&attr.value).to_string(),
                                _ => {}
                            }
                        }
                        if !uuid.is_empty() && !router_str.is_empty() {
                            routers.insert(uuid, router_str);
                        }
                    } else if name.as_ref() == b"Service" {
                        let mut id = String::new();
                        let mut system_id = String::new();
                        let mut server = String::new();
                        let mut sysnr = "00".to_string();
                        let mut router_id = None;

                        for attr in e.attributes().flatten() {
                            match attr.key.as_ref() {
                                b"uuid" => id = String::from_utf8_lossy(&attr.value).to_string(),
                                b"systemid" => system_id = String::from_utf8_lossy(&attr.value).to_string(),
                                b"server" => server = String::from_utf8_lossy(&attr.value).to_string(),
                                b"sysnr" => sysnr = String::from_utf8_lossy(&attr.value).to_string(),
                                b"routerid" => router_id = Some(String::from_utf8_lossy(&attr.value).to_string()),
                                _ => {}
                            }
                        }
                        if !id.is_empty() {
                            services.insert(id, (system_id, server, sysnr, router_id));
                        }
                    } else if name.as_ref() == b"Connection" {
                        let mut service_id = String::new();
                        let mut conn_name = String::new();
                        let mut client = "100".to_string();
                        let mut router_id = None;

                        for attr in e.attributes().flatten() {
                            match attr.key.as_ref() {
                                b"serviceid" => service_id = String::from_utf8_lossy(&attr.value).to_string(),
                                b"name" => conn_name = String::from_utf8_lossy(&attr.value).to_string(),
                                b"client" => client = String::from_utf8_lossy(&attr.value).to_string(),
                                b"routerid" => router_id = Some(String::from_utf8_lossy(&attr.value).to_string()),
                                _ => {}
                            }
                        }

                        if let Some((sid, server, sysnr, svc_router)) = services.get(&service_id) {
                            let env = if sid.ends_with('P') || conn_name.contains("PRD") || conn_name.contains("生产") {
                                "PRD".to_string()
                            } else if sid.ends_with('Q') || conn_name.contains("QAS") || conn_name.contains("测试") {
                                "QAS".to_string()
                            } else {
                                "DEV".to_string()
                            };

                            let matched_router_uuid = router_id.or_else(|| svc_router.clone());
                            let final_router = matched_router_uuid.and_then(|ruuid| routers.get(&ruuid).cloned());

                            connections.push(SAPConnection {
                                id: format!("imported_{}_{}", sid, client),
                                sid: sid.clone(),
                                name: if conn_name.is_empty() { format!("SAP {}", sid) } else { conn_name },
                                env,
                                client,
                                user: "".to_string(),
                                password: None,
                                lang: "ZH".to_string(),
                                host: server.clone(),
                                sysnr: sysnr.clone(),
                                router: final_router,
                                tcodes: vec!["SE80".to_string(), "SM50".to_string()],
                                ping_ms: None,
                                starred: Some(false),
                                last_launched: None,
                                launch_count: Some(0),
                            });
                        }
                    }
                }
                Ok(Event::Eof) => break,
                Err(_) => break,
                _ => {}
            }
            buf.clear();
        }

        connections
    }
}
