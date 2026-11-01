use crate::models::{LaunchResult, SAPConnection};
use std::path::{Path, PathBuf};
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

    /// 自动探测与 sapshcut.exe 同目录的 sapgui.exe
    #[allow(dead_code)]
    fn detect_sapgui(sapshcut_path: &str) -> Option<PathBuf> {
        let path = Path::new(sapshcut_path);
        if let Some(parent) = path.parent() {
            let sapgui = parent.join("sapgui.exe");
            if sapgui.exists() {
                return Some(sapgui);
            }
        }

        let common_gui_paths = [
            r"C:\Program Files (x86)\SAP\FrontEnd\SAPgui\sapgui.exe",
            r"C:\Program Files\SAP\FrontEnd\SAPgui\sapgui.exe",
            r"C:\SAP\FrontEnd\SAPgui\sapgui.exe",
            r"D:\Program Files (x86)\SAP\FrontEnd\SAPgui\sapgui.exe",
            r"D:\Program Files\SAP\FrontEnd\SAPgui\sapgui.exe",
            r"D:\SAP\FrontEnd\SAPgui\sapgui.exe",
        ];

        for p in &common_gui_paths {
            let pb = PathBuf::from(p);
            if pb.exists() {
                return Some(pb);
            }
        }

        None
    }

    /// 构建标准独立的 SAP GUI 连接串 (脱离 SAP Logon 核心):
    /// 无论是否有 SAP Logon，只要传入此串即可秒连目标系统。
    /// - 局域网直连: /H/<host>/S/32<sysnr>
    /// - 路由代理跳板: /H/<router>/S/3299/H/<host>/S/32<sysnr>
    pub fn build_standalone_connection_string(conn: &SAPConnection) -> String {
        let clean_host = conn.host.trim().trim_start_matches("/H/").trim_end_matches('/');
        let sys_num = if conn.sysnr.trim().is_empty() {
            "00"
        } else {
            conn.sysnr.trim()
        };
        let port = format!("32{:0>2}", sys_num);

        if let Some(r) = &conn.router {
            let trimmed_r = r.trim();
            if !trimmed_r.is_empty() {
                let r_str = if trimmed_r.starts_with('/') {
                    trimmed_r.to_string()
                } else {
                    format!("/H/{}", trimmed_r)
                };
                let r_str = r_str.trim_end_matches('/');

                // 若 router 串已显式含有 /S/ 端口则保持，否则自动补充默认 3299 端口
                let router_part = if r_str.contains("/S/") {
                    r_str.to_string()
                } else {
                    format!("{}/S/3299", r_str)
                };

                return format!("{}/H/{}/S/{}", router_part, clean_host, port);
            }
        }

        format!("/H/{}/S/{}", clean_host, port)
    }

    /// 启动 SAP GUI 连接 (多轨自适应独立启动引擎)
    pub fn launch(conn: &SAPConnection, tcode: Option<&str>, configured_sapshcut: &str) -> LaunchResult {
        let (found_shcut, shcut_executable) = Self::detect_sapshcut(configured_sapshcut);
        let conn_string = Self::build_standalone_connection_string(conn);
        let desc = if conn.name.trim().is_empty() {
            conn.sid.trim()
        } else {
            conn.name.trim()
        };

        #[cfg(target_os = "windows")]
        {
            // 轨道 1: 使用完全独立参数调用 sapshcut.exe (带 -desc 与完整 -server/-guiparm)
            if found_shcut {
                let mut cmd = Command::new(&shcut_executable);
                cmd.arg(format!("-system={}", conn.sid.trim()));
                // 核心修复: 传递 -desc 描述，杜绝 “系统描述未知”
                cmd.arg(format!("-desc={}", desc));
                cmd.arg(format!("-client={}", conn.client.trim()));
                cmd.arg(format!("-sysnumber={}", conn.sysnr.trim()));
                // 核心修复: 传递完整的路由端口串，杜绝 “GUI 启动参数未知”
                cmd.arg(format!("-server={}", conn_string));
                cmd.arg(format!("-guiparm={}", conn_string));
                cmd.arg(format!("-language={}", conn.lang.trim()));
                cmd.arg("-maxgui");

                if !conn.user.trim().is_empty() {
                    cmd.arg(format!("-user={}", conn.user.trim()));
                }

                if let Some(pw) = &conn.password {
                    if !pw.trim().is_empty() {
                        cmd.arg(format!("-pw={}", pw.trim()));
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
                    Ok(_) => return LaunchResult {
                        success: true,
                        message: format!("已通过独立参数启动 SAP GUI: {} (目标: {})", conn.sid, conn_string),
                    },
                    Err(e) => {
                        eprintln!("sapshcut 启动失败: {}, 降级到快捷方式机制", e);
                    }
                }
            }

            // 轨道 2: 降级到动态独立 .sap 快捷方式文件启动
            let shortcut_res = Self::launch_via_sap_shortcut_file(conn, tcode, &conn_string, desc);
            if shortcut_res.success {
                return shortcut_res;
            }

            // 轨道 3: 终极降级到 sapgui.exe 原生直连启动 (100% 独立唤起)
            if let Some(sapgui_path) = Self::detect_sapgui(&shcut_executable) {
                let mut gui_cmd = Command::new(&sapgui_path);
                gui_cmd.arg(&conn_string);
                if let Ok(_) = gui_cmd.spawn() {
                    return LaunchResult {
                        success: true,
                        message: format!("已通过 sapgui.exe 原生直连唤起系统登录界面: {} (目标: {})", conn.sid, conn_string),
                    };
                }
            }

            shortcut_res
        }

        #[cfg(not(target_os = "windows"))]
        {
            let _ = (found_shcut, tcode);
            LaunchResult {
                success: true,
                message: format!(
                    "[开发预览模式] 独立无Logon启动模拟: {} (描述: {}) 目标: {} (路径: {})",
                    conn.sid,
                    desc,
                    conn_string,
                    shcut_executable
                ),
            }
        }
    }

    /// 备用机制：生成包含完整 [System] Description 和 [Configuration] GuiParm 的临时 .sap 文件
    #[allow(dead_code)]
    fn launch_via_sap_shortcut_file(
        conn: &SAPConnection,
        tcode: Option<&str>,
        conn_string: &str,
        desc: &str,
    ) -> LaunchResult {
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

        // 构造标准合规的 SAP 快捷方式，确保包含 Description 与完整的 GuiParm
        let content = format!(
            "[System]\r\nName={sid}\r\nDescription={desc}\r\nClient={client}\r\n[User]\r\nName={user}\r\nLanguage={lang}\r\n[Function]\r\nTitle={desc}\r\nCommand={command}\r\nType=Transaction\r\n[Configuration]\r\nGuiParm=\"{guiparm}\"\r\n[Shortcut]\r\nProgram=sapgui.exe\r\n",
            sid = conn.sid.trim(),
            desc = desc,
            client = conn.client.trim(),
            user = conn.user.trim(),
            lang = conn.lang.trim(),
            command = command_line,
            guiparm = conn_string
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
                        message: format!("已通过独立 .sap 快捷方式文件成功拉起: {}", conn.sid),
                    };
                }
            }
        }

        LaunchResult {
            success: false,
            message: format!("启动失败: 无法通过 sapshcut 或 sapgui 拉起连接，请检查 SAP GUI 是否正确安装。"),
        }
    }
}
