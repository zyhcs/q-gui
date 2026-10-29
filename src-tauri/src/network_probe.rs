use crate::models::PingResult;
use std::net::{TcpStream, ToSocketAddrs};
use std::time::{Duration, Instant};

pub struct NetworkProbe;

impl NetworkProbe {
    pub fn ping(host: &str, sysnr: &str) -> PingResult {
        let nr: u16 = sysnr.parse().unwrap_or(0);
        let port = 3200 + nr;
        let addr_str = format!("{}:{}", host, port);

        let timeout = Duration::from_millis(1500);
        let start = Instant::now();

        // DNS 解析与连接
        if let Ok(mut addrs) = addr_str.to_socket_addrs() {
            if let Some(addr) = addrs.next() {
                if let Ok(_) = TcpStream::connect_timeout(&addr, timeout) {
                    let elapsed = start.elapsed().as_millis() as u64;
                    return PingResult {
                        ok: true,
                        latency: elapsed.max(1),
                    };
                }
            }
        }

        PingResult {
            ok: false,
            latency: 0,
        }
    }
}
