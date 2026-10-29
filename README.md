# Q-GUI (极龟) ⚡️🦀

> Ultra-Lightweight Rust & Tauri SAP GUI Launcher & Connection Vault.  
> 专为 SAP 开发者、顾问与实施工程师打造的新一代现代化、触感级 SAP GUI 极速启动与连接保险库。  
> **底层基于 Rust + Tauri 2.0 构建，内存仅 18MB，冷启动毫秒级！**

![Q-GUI Banner](public/icon.png)

---

## ✨ 核心特性

- 🦀 **现代 Rust 系统级后端**
  - 基于 Rust 纯原生调用 Windows API 与 `sapshcut.exe`，彻底告别 Electron 的庞大体积与高内存占用
  - 极轻量：安装包仅 5~10MB，日常待机内存仅 15~20MB
- 🛠️ **启动器路径自由维护 (sapshcut.exe)**
  - 支持自定义维护 SAP GUI `sapshcut.exe` 核心程序路径
  - 具备智能多路径自动探测与原生文件选择器，解决各类非标准盘符/安装目录问题
  - 路径有效性状态呼吸灯实时指示
- ⚡️ **极速启动矩阵 (Launcher Matrix)**
  - 硬件触感晶片式卡片设计，支持按 DEV / QAS / PRD / SANDBOX 自动发光与环境色彩识别
  - 毫秒级直达预设事务码（如 `/SE80`、`/SM50`、`/ST05` 等）
  - 生产环境 (PRD) 安全防误触弹窗与确认机制
  - 卡片快捷克隆与一键连接文本分享
- 🔐 **连接维护保险库 (Connection Vault)**
  - 完备的系统参数配置（SID、Client、Host、SysNr、用户名、语言）
  - 免密密码安全凭据托管，支持明文/密文小眼睛一键切换
  - 实时网络探针：纯 Rust 原生探测 SAP 端口（`3200 + SysNr`）毫秒级网络延迟
  - 底部操作栏单行排布（删除、测试连通、克隆副本、分享连接、保存配置）
- 🔮 **小型极速查询面板 (Raycast Mini HUD)**
  - 全局快捷键呼出（默认 `Ctrl + Shift + Space`）
  - 复合指令智能搜索（例如输入 `s4d se80` 直接定位目标系统与事务码）
  - 键盘上下方向键导航、回车秒开，ESC 或失焦自动隐藏
- 🌐 **局域网共享传输 (Q-AirDrop)**
  - 基于纯 Rust UDP 48765 内网广播雷达自动发现在线同事设备
  - 一键将选中的 SAP 连接安全推送至指定同事设备，告别繁琐的截图与手动敲 IP
- ⚙️ **个性化与生态兼容**
  - **3 款精美主题**：纯黑 Zinc、深蓝 Slate、极简 Light
  - **3 级字号比例**：紧凑 (11.5px)、标准 (13px)、舒适 (14.5px)，实时响应
  - **无缝同步本地配置**：自动扫描解析本地 `SAPUILandscape.xml` 并智能去重合并
  - **数据备份与恢复**：JSON 格式快速导入/导出

---

## 🛠️ 技术栈

- **桌面底座**: Rust 2021 + Tauri 2.0 (原生轻量双窗口、系统托盘、全局热键)
- **前端界面**: React 18 + TypeScript 5 + Vite 6 + Tailwind CSS 3 + Lucide Icons
- **持续集成**: GitHub Actions (Windows x64 自动化构建与 Pre-release 发布)

---

## 🚀 本地开发与构建

### 运行环境要求
- Rust >= 1.77
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### 安装依赖
```bash
pnpm install
```

### 启动开发模式
```bash
pnpm tauri dev
```

### 构建打包
```bash
pnpm tauri build
```

---

## 📦 自动化构建与发布

本项目配置了完整的 GitHub Actions 工作流（`.github/workflows/build-windows.yml`）：
- 提交代码或发布 tag (`v*`) 时自动在 Windows 环境下编译打包。
- 自动生成并上传轻量级安装包工件。
- 打 tag 时自动创建 GitHub Pre-Release 预览发布。

---

## 📄 开源许可

[MIT License](LICENSE)
