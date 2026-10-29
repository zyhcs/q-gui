use crate::models::{LaunchResult, SAPConnection};
use std::path::Path;
#[allow(unused_imports)]
use std::process::Command;

pub struct SapLauncher;

impl SapLauncher {
    /// 自动探测系统中存在的 sapshcut.exe 路径
    pub fn detect_sapshcut(custom_path: &str) -> (bool, String) {
        // 1. 如果用户已设置且存在
        if !custom_path.is_empty() && Path::new(custom_path).exists() {
            return (true, custom_path.to_string());
        }

        // 2. 探测常见 Windows 默认路径
        let common_paths = [
            r"C:\Program Files (x86)\SAP\FrontEnd\SAPgui\sapshcut.exe",
            r"C:\Program Files\SAP\FrontEnd\SAPgui\sapshcut.exe",
            r"C:\SAP\FrontEnd\SAPgui\sapshcut.exe",
            r"D:\Program Files (x86)\SAP\FrontEnd\SAPgui\sapshcut.exe",
            r"D:\Program Files\SAP\FrontEnd\SAPgui\sapshcut.exe",
            r"D:\SAP\FrontEnd\SAPgui\sapshcut.exe",
        ];

        for path in &common_paths {
            if Path::new(path).exists() {
                return (true, path.to_string());
            }
        }

        // 3. 检查系统 PATH
        if let Ok(path_var) = std::env::var("PATH") {
            for entry in std::env::split_paths(&path_var) {
                let candidate = entry.join("sapshcut.exe");
                if candidate.exists() {
                    return (true, candidate.to_string_lossy().to_string());
                }
            }
        }

        (false, if !custom_path.is_empty() { custom_path.to_string() } else { common_paths[0].to_string() })
    }

    /// 格式化 SAP 路由串
    fn format_server_string(conn: &SAPConnection) -> String {
        if let Some(r) = &conn.router {
            let trimmed = r.trim();
            if !trimmed.is_empty() {
                let clean_r = if trimmed.starts_with('/') {
                    trimmed.trim_end_matches('/')
                } else {
                    &format!("/H/{}", trimmed.trim_end_matches('/'))
                };
                return format!("{}/H/{}", clean_r, conn.host.trim());
            }
        }
        conn.host.clone()
    }

    /// 启动 SAP GUI 连接
    pub fn launch(conn: &SAPConnection, tcode: Option<&str>, configured_sapshcut: &str) -> LaunchResult {
        let (found, executable) = Self::detect_sapshcut(configured_sapshcut);
        let server_target = Self::format_server_string(conn);

        #[cfg(target_os = "windows")]
        {
            if found {
                let mut cmd = Command::new(&executable);
                cmd.arg(format!("-system={}", conn.sid));
                cmd.arg(format!("-client={}", conn.client));
                cmd.arg(format!("-sysnumber={}", conn.sysnr));
                cmd.arg(format!("-server={}", server_target));
                cmd.arg(format!("-language={}", conn.lang));

                if !conn.user.is_empty() {
                    cmd.arg(format!("-user={}", conn.user));
                }

                if let Some(pw) = &conn.password {
                    if !pw.is_empty() {
                        cmd.arg(format!("-pw={}", pw));
                    }
                }

                let final_tcode = tcode.unwrap_or("").trim();
                if !final_tcode.is_empty() {
                    let cmd_str = if final_tcode.starts_with('/') {
                        final_tcode.to_string()
                    } else {
                        format!("*{}", final_tcode)
                    };
                    cmd.arg(format!("-command={}", cmd_str));
                }

                match cmd.spawn() {
                    Ok(_) => LaunchResult {
                        success: true,
                        message: format!("已通过 sapshcut.exe 成功唤起 SAP GUI 实例: {}", conn.sid),
                    },
                    Err(e) => Self::launch_via_sap_shortcut_file(conn, tcode, &format!("sapshcut 拉起失败: {}", e)),
                }
            } else {
                Self::launch_via_sap_shortcut_file(conn, tcode, "未找到 sapshcut.exe，尝试以快捷方式拉起")
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            let _ = found;
            LaunchResult {
                success: true,
                message: format!(
                    "[开发预览模式] 非 Windows 环境模拟启动 SAP 系统: {} (Client: {}) 目标: {} 事务码: {:?} (配置路径: {})",
                    conn.sid,
                    conn.client,
                    server_target,
                    tcode,
                    executable
                ),
            }
        }
    }

    /// 备用机制：生成临时 .sap 文件并用系统默认程序拉起
    #[allow(dead_code)]
    fn launch_via_sap_shortcut_file(conn: &SAPConnection, tcode: Option<&str>, reason: &str) -> LaunchResult {
        let _ = reason;
        let temp_dir = std::env::temp_dir();
        let sap_file = temp_dir.join(format!("qgui_{}_{}.sap", conn.sid, conn.client));

        let tcode_str = tcode.unwrap_or("").trim();
        let command_line = if !tcode_str.is_empty() {
            if tcode_str.starts_with('/') {
                tcode_str.to_string()
            } else {
                format!("*{}", tcode_str)
            }
        } else {
            "".to_string()
        };

        let gui_parm = if let Some(r) = &conn.router {
            let trimmed = r.trim();
            if !trimmed.is_empty() {
                let clean_r = if trimmed.starts_with('/') {
                    trimmed.trim_end_matches('/')
                } else {
                    &format!("/H/{}", trimmed.trim_end_matches('/'))
                };
                format!("{}/H/{}/S/32{}", clean_r, conn.host.trim(), conn.sysnr.trim())
            } else {
                format!("/H/{}/S/32{}", conn.host.trim(), conn.sysnr.trim())
            }
        } else {
            format!("/H/{}/S/32{}", conn.host.trim(), conn.sysnr.trim())
        };

        let content = format!(
            "[System]\r\nName={sid}\r\nClient={client}\r\n[User]\r\nName={user}\r\nLanguage={lang}\r\n[Function]\r\nTitle={name}\r\nCommand={command}\r\nType=Transaction\r\n[Configuration]\r\nGuiParm=\"{guiparm}\"\r\n",
            sid = conn.sid,
            client = conn.client,
            user = conn.user,
            lang = conn.lang,
            name = conn.name,
            command = command_line,
            guiparm = gui_parm
        );

        if let Ok(_) = std::fs::write(&sap_file, content) {
            #[cfg(target_os = "windows")]
            {
                let open_res = Command::new("cmd")
                    .args(["/C", "start", "", &sap_file.to_string_lossy()])
                    .spawn();

                if open_res.is_ok() {
                    return LaunchResult {
                        success: true,
                        message: format!("已通过 SAP 快捷启动文件拉起: {} ({})", conn.sid, reason),
                    };
                }
            }
        }

        LaunchResult {
            success: false,
            message: format!("启动失败: 无法定位 sapshcut.exe，且无法生成/拉起快捷方式。请在系统设置中指定 sapshcut.exe 路径。"),
        }
    }
}
