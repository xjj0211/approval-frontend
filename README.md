# 🏢 企业级审批系统 (前端) | Enterprise Approval System

> 基于 React + TypeScript + Ant Design 开发的企业审批管理平台，实现了动态表单渲染、RBAC 角色权限控制及完整的工作流处理。

## 🔗 在线演示
**👉 [点击查看演示 Demo](https://approval-frontend-zeta.vercel.app/)**
*(注：后端部署在 Render 免费节点，首次加载可能需要 1 分钟唤醒服务器，请耐心等待)*

## 📚 项目介绍
本项目是一个面向 B 端生产场景的审批系统 [cite: 3]，模拟了真实企业内部的请假、采购等审批流程。项目采用前后端分离架构，前端负责交互逻辑与界面渲染，通过 RESTful API 与 NestJS 后端交互。

### ✨ 核心亮点 (Project Highlights)
**🎭 动态表单引擎**：摒弃硬编码，支持通过后端 Schema 动态渲染表单组件（Input/Select/Date...），实现低代码能力的初步探索 [cite: 81]。
**🔐 角色权限管理 (RBAC)**：支持“申请人”与“审批员”双角色无缝切换，不同角色拥有严格的操作权限隔离（如仅审批员可见通过/驳回按钮）[cite: 32]。
**📂 附件全流程支持**：实现了图片预览、多文件上传、Excel 模板下载及 Base64 数据流转 [cite: 58]。
**📱 响应式与交互**：深度定制 Ant Design 组件样式，实现了抽屉式详情页 (Drawer) 与 复杂的筛选级联交互。

## 🛠️ 技术栈
* **核心框架**: React 18, TypeScript, Vite
* **UI 组件库**: Ant Design v5
* **路由管理**: React Router v6
* **网络请求**: Axios (封装拦截器与 BaseUrl)
* **时间处理**: Day.js
* **部署托管**: Vercel

## 📸 功能截图
| 审批列表页 |
<img width="2560" height="1305" alt="ScreenShot_2025-12-01_172322_444" src="https://github.com/user-attachments/assets/b49a2623-d0fe-4e22-8408-997d472074fc" />
| 新建审批页 |
<img width="2560" height="1305" alt="ScreenShot_2025-12-01_172538_615" src="https://github.com/user-attachments/assets/da9525a4-554c-4f22-b553-5d89987d3d07" />


## 🚀 本地运行

1. **克隆项目**
\`\`\`bash
git clone https://github.com/xjj/approval-system.git
cd approval-system
\`\`\`

2. **安装依赖**
\`\`\`bash
npm install
\`\`\`

3. **启动开发服务器**
\`\`\`bash
npm run dev
\`\`\`
打开浏览器访问 `http://localhost:5173`。

## 📂 目录结构
\`\`\`text
src/
├── components/    # 公共组件
├── pages/         # 页面视图 (ApprovalList, ApprovalForm)
├── services/      # API 接口封装 (api.ts)
├── types/         # TypeScript 类型定义
├── mock/          # 模拟数据 (早期开发使用)
└── App.tsx        # 路由与全局布局
\`\`\`

## 📝 进阶任务完成情况
- [x] 基础任务：列表页、新建页、详情页、角色切换
- [x] 进阶任务1：Node.js 后端服务对接 (NestJS)
- [x] 进阶任务2：附件上传 (图片预览 + Excel)
- [x] 进阶任务3：动态表单 Schema 渲染 

---
*Created by [李进]*
