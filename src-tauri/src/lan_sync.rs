use crate::models::{LANDevice, SAPConnection};
use std::collections::HashMap;
use std::io::Write;
use std::net::{TcpStream, UdpSocket};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

const UDP_PORT: u16 = 48765;
const TCP_PORT: u16 = 48766;

#[derive(Clone)]
pub struct LANSyncService {
    devices: Arc<Mutex<HashMap<String, LANDevice>>>,
    local_id: String,
    local_name: String,
}

impl LANSyncService {
    pub fn new() -> Self {
        let hostname = whoami_hostname();
        let local_id = format!("device_{:x}", rand_u64());

        Self {
            devices: Arc::new(Mutex::new(HashMap::new())),
            local_id,
            local_name: hostname,
        }
    }

    pub fn start(&self) {
        let devices = Arc::clone(&self.devices);
        let my_id = self.local_id.clone();
        let _my_name = self.local_name.clone();

        // 1. 启动 UDP 监听线程
        std::thread::spawn(move || {
            if let Ok(socket) = UdpSocket::bind(format!("0.0.0.0:{}", UDP_PORT)) {
                let _ = socket.set_broadcast(true);
                let mut buf = [0u8; 1024];

                loop {
                    if let Ok((len, src)) = socket.recv_from(&mut buf) {
                        if let Ok(msg) = std::str::from_utf8(&buf[..len]) {
                            // 消息格式: "QGUI_PING:{id}:{name}"
                            if let Some(content) = msg.strip_prefix("QGUI_PING:") {
                                let parts: Vec<&str> = content.split(':').collect();
                                if parts.len() >= 2 {
                                    let peer_id = parts[0].to_string();
                                    let peer_name = parts[1].to_string();

                                    if peer_id != my_id {
                                        let now = now_epoch();
                                        let mut lock = devices.lock().unwrap();
                                        lock.insert(
                                            peer_id.clone(),
                                            LANDevice {
                                                id: peer_id,
                                                name: peer_name,
                                                ip: src.ip().to_string(),
                                                port: TCP_PORT,
                                                last_seen: now,
                                            },
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // 2. 启动 UDP 定时广播线程
        let broadcast_id = self.local_id.clone();
        let broadcast_name = self.local_name.clone();
        std::thread::spawn(move || {
            if let Ok(socket) = UdpSocket::bind("0.0.0.0:0") {
                let _ = socket.set_broadcast(true);
                let ping_msg = format!("QGUI_PING:{}:{}", broadcast_id, broadcast_name);

                loop {
                    let _ = socket.send_to(ping_msg.as_bytes(), format!("255.255.255.255:{}", UDP_PORT));
                    std::thread::sleep(std::time::Duration::from_secs(5));
                }
            }
        });
    }

    pub fn get_devices(&self) -> Vec<LANDevice> {
        let now = now_epoch();
        let mut lock = self.devices.lock().unwrap();
        // 清理 20 秒未心跳的下线设备
        lock.retain(|_, d| now.saturating_sub(d.last_seen) < 20);
        lock.values().cloned().collect()
    }

    pub fn send_config(&self, peer_ip: &str, peer_port: u16, conn: &SAPConnection) -> bool {
        let addr = format!("{}:{}", peer_ip, peer_port);
        if let Ok(mut stream) = TcpStream::connect_timeout(
            &addr.parse().unwrap_or_else(|_| "127.0.0.1:48766".parse().unwrap()),
            std::time::Duration::from_millis(2000),
        ) {
            if let Ok(json) = serde_json::to_string(conn) {
                let msg = format!("QGUI_SYNC:{}\n", json);
                return stream.write_all(msg.as_bytes()).is_ok();
            }
        }
        false
    }
}

fn now_epoch() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn whoami_hostname() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "SAP-Colleague".to_string())
}

fn rand_u64() -> u64 {
    now_epoch() ^ 0x9e3779b97f4a7c15
}
