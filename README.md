# Q-GUI (极龟) ⚡️

> Next-Gen Modern SAP GUI Launcher & Connection Vault.  
> 专为 SAP 开发者、顾问与实施工程师打造的新一代现代化、触感级 SAP GUI 极速启动与连接保险库。

![Q-GUI Banner](public/icon.png)

---

## ✨ 核心特性

- ⚡️ **极速启动矩阵 (Launcher Matrix)**
  - 硬件触感晶片式卡片设计，支持按 DEV / QAS / PRD / SANDBOX 自动发光与环境色彩识别
  - 毫秒级直达预设事务码（如 `/SE80`、`/SM50`、`/ST05` 等）
  - 生产环境 (PRD) 安全防误触弹窗与确认机制
  - 卡片快捷克隆与一键连接文本分享
- 🛠️ **连接维护保险库 (Connection Vault)**
  - 完备的系统参数配置（SID、Client、Host、SysNr、用户名、语言）
  - 免密密码安全凭据托管，支持明文/密文小眼睛一键切换
  - 实时网络探针：自动检测 SAP 端口（`3200 + SysNr`）毫秒级网络延迟
  - 底部操作栏单行排布（删除、测试连通、克隆副本、分享连接、保存配置）
- 🔮 **小型极速查询面板 (Raycast Mini HUD)**
  - 全局快捷键呼出（默认 `Ctrl + Shift + Space`）
  - 复合指令智能搜索（例如输入 `s4d se80` 直接定位目标系统与事务码）
  - 键盘上下方向键导航、回车秒开，ESC 或失焦自动隐藏
- 🌐 **局域网共享传输 (Q-AirDrop)**
  - 基于 UDP 48765 内网广播发现局域网内的在线同事设备
  - 一键将选中的 SAP 连接安全推送至指定同事设备，告别繁琐的截图与手动敲 IP
- ⚙️ **个性化与生态兼容**
  - **3 款精美主题**：纯黑 Zinc、深蓝 Slate、极简 Light
  - **3 级字号比例**：紧凑 (11.5px)、标准 (13px)、舒适 (14.5px)，实时响应
  - **无缝同步本地配置**：自动检测 `SAPUILandscape.xml` 路径并一键全量导入
  - **数据备份与恢复**：JSON 格式快速导入/导出

---

## 🛠️ 技术栈

- **框架**: Electron 33 + Vite 6 + React 18 + TypeScript 5
- **样式**: Tailwind CSS 3 + Lucide Icons + 纯粹 CSS 变量驱动的硬件质感设计
- **打包**: electron-builder (输出 Windows NSIS 安装包与 Portable 便携版)

---

## 🚀 本地开发与构建

### 运行环境要求
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Windows 10/11 (用于直接拉起 SAP GUI)

### 安装依赖
```bash
pnpm install
```

### 启动开发模式
```bash
pnpm run dev
```

### 构建 Windows 安装包
```bash
# 生成 NSIS 安装包与免安装 Portable 版（位于 release 目录）
pnpm run build:win
```

---

## 📦 自动化构建与发布

本项目配置了完整的 GitHub Actions 工作流（`.github/workflows/build-windows.yml`）：
- 提交代码或发布 tag (`v*`) 时自动在 Windows 环境下编译打包。
- 自动生成并上传 `.exe` 安装包工件 (Artifacts)。
- 打 tag 时自动创建 GitHub Pre-Release 预览发布。

---

## 📄 开源许可

[MIT License](LICENSE)
