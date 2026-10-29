// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // 捕获任何未知 Panic，并在 Windows 上弹出清晰的错误弹窗，防止静默闪退
    std::panic::set_hook(Box::new(|info| {
        let err_msg = format!("Q-GUI 发生致命异常 (Fatal Error):\n{}", info);
        #[cfg(windows)]
        {
            use std::ffi::OsStr;
            use std::iter::once;
            use std::os::windows::ffi::OsStrExt;
            let wide_msg: Vec<u16> = OsStr::new(&err_msg).encode_wide().chain(once(0)).collect();
            let wide_title: Vec<u16> = OsStr::new("Q-GUI 启动异常").encode_wide().chain(once(0)).collect();
            unsafe {
                windows::Win32::UI::WindowsAndMessaging::MessageBoxW(
                    None,
                    windows::core::PCWSTR(wide_msg.as_ptr()),
                    windows::core::PCWSTR(wide_title.as_ptr()),
                    windows::Win32::UI::WindowsAndMessaging::MB_OK | windows::Win32::UI::WindowsAndMessaging::MB_ICONERROR,
                );
            }
        }
        eprintln!("{}", err_msg);
    }));

    q_gui_lib::run();
}
