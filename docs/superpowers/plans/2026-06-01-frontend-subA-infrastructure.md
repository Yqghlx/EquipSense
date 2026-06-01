# Phase 1 前端 — 子计划 A：项目骨架 + 基础设施 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建 React 19 + TypeScript 前端项目，完成 Vite 初始化、API 客户端、SignalR 实时连接、Zustand 状态管理、双主题、国际化、布局组件和登录页。完成后能登录并看到空白的布局框架。

**Architecture:** Vite 项目初始化后分层构建基础设施：lib/（API/SignalR 工具层）→ stores/（Zustand 全局状态）→ hooks/（React Hooks 封装）→ components/layout/（布局组件）→ pages/LoginPage.tsx。前端通过 Vite proxy 连接后端 8080 端口。

**Tech Stack:** React 19, TypeScript strict, Vite 6, TailwindCSS 4, shadcn/ui, Zustand, TanStack Query v5, @microsoft/signalr, Axios, React Router v7, i18next, React Hook Form + Zod

**Spec:** `docs/superpowers/specs/2026-06-01-phase1-frontend-design.md`

---

## 文件结构（子计划 A）

```
新增文件：

frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.ts
├── components.json (shadcn/ui)
├── index.html
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── lib/
    │   ├── api.ts
    │   ├── queryClient.ts
    │   ├── signalr.ts
    │   └── utils.ts
    ├── stores/
    │   ├── authStore.ts
    │   └── notificationStore.ts
    ├── hooks/
    │   ├── useSignalR.ts
    │   └── useTheme.ts
    ├── i18n/
    │   ├── index.ts
    │   ├── zh.json
    │   └── en.json
    ├── types/
    │   └── index.ts
    ├── components/
    │   ├── ui/           — shadcn/ui 组件（按需 init）
    │   └── layout/
    │       ├── AuthLayout.tsx
    │       ├── AppLayout.tsx
    │       ├── Sidebar.tsx
    │       ├── Header.tsx
    │       └── NotificationToast.tsx
    └── pages/
        └── LoginPage.tsx
```

---

### Task 1: Vite 项目初始化 + TailwindCSS + shadcn/ui

**Files:**
- Create: `frontend/` 整个目录（Vite 脚手架生成）
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/components.json`

- [ ] **Step 1: 使用 Vite 创建 React + TypeScript 项目**

在项目根目录（不是 frontend/ 内）执行：
```bash
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: 安装核心依赖**

```bash
cd frontend && npm install react-router-dom @tanstack/react-query zustand axios @microsoft/signalr echarts echarts-for-react react-hook-form @hookform/resolvers zod i18next react-i18next lucide-react
```

```bash
cd frontend && npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: 配置 TailwindCSS 4**

替换 `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/hubs': { target: 'http://localhost:8080', ws: true, changeOrigin: true },
    },
  },
})
```

替换 `frontend/src/index.css`（删除 Vite 默认样式，只保留 TailwindCSS 导入）：
```css
@import "tailwindcss";
```

删除 `frontend/src/App.css`（后续按需添加）。

- [ ] **Step 4: 初始化 shadcn/ui**

```bash
cd frontend && npx shadcn@latest init -d
```

这会创建 `components.json` 并配置好路径别名。初始化后安装常用的 UI 组件：
```bash
cd frontend && npx shadcn@latest add button input label card dialog dropdown-menu table badge tabs select separator sheet sonner avatar breadcrumb tooltip
```

- [ ] **Step 5: 清理 Vite 默认文件**

删除 `frontend/src/assets/` 目录和 `frontend/public/vite.svg`。

替换 `frontend/src/App.tsx` 为空壳：
```tsx
function App() {
  return <div className="min-h-screen bg-background text-foreground">EquipSense</div>
}

export default App
```

- [ ] **Step 6: 添加 favicon**

创建 `frontend/public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#3b82f6"/><text x="50" y="68" font-size="50" font-weight="bold" text-anchor="middle" fill="white">E</text></svg>
```

- [ ] **Step 7: 验证开发服务器启动**

```bash
cd frontend && npm run dev
```
Expected: 服务器在 5173 端口启动，页面显示 "EquipSense" 文本。

- [ ] **Step 8: 提交**

```bash
cd frontend
git add .
git commit -m "feat: initialize React frontend with Vite, TailwindCSS and shadcn/ui

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: 创建类型定义文件**

`frontend/src/types/index.ts`:
```typescript
// 通用分页
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PagedQuery {
  page: number;
  pageSize: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 认证
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  role: string;
  tenantId: string;
}

// 设备
export interface Device {
  id: string;
  deviceCode: string;
  name: string;
  deviceType: string;
  status: string;
  location?: string;
  lastCommunicatedAt?: string;
  createdAt: string;
}

export interface CreateDeviceRequest {
  deviceCode: string;
  name: string;
  deviceType: string;
  location?: string;
}

export interface DeviceTelemetry {
  deviceId: string;
  metric: string;
  value: number;
  timestamp: string;
}

// 告警
export interface Alert {
  id: string;
  alertCode: string;
  deviceId: string;
  deviceName?: string;
  metric: string;
  value: number;
  severity: string;
  status: string;
  ruleId?: string;
  ruleName?: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  deviceType?: string;
  deviceId?: string;
  metric: string;
  ruleType: string;
  operator?: string;
  threshold?: number;
  conditions?: string;
  baselineStddevMultiplier?: number;
  severity: string;
  cooldownSeconds: number;
  autoCreateWorkorder: boolean;
  enabled: boolean;
  createdAt: string;
}

export interface CreateAlertRuleRequest {
  name: string;
  deviceType?: string;
  deviceId?: string;
  metric: string;
  ruleType: string;
  operator?: string;
  threshold?: number;
  conditions?: string;
  baselineStddevMultiplier?: number;
  severity: string;
  cooldownSeconds: number;
  autoCreateWorkorder: boolean;
  enabled: boolean;
}

// 工单
export interface WorkOrder {
  id: string;
  workOrderCode: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  deviceId: string;
  alertId?: string;
  analysisId?: string;
  rootCause?: string;
  resolution?: string;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateWorkOrderRequest {
  title: string;
  type: string;
  priority: string;
  deviceId: string;
  alertId?: string;
  rootCause?: string;
  description?: string;
  dueDate?: string;
}

export interface AssignWorkOrderRequest {
  assignedTo: string;
  note?: string;
}

export interface CompleteWorkOrderRequest {
  resolution: string;
}

export interface WorkOrderLog {
  id: string;
  workOrderId: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  operatorId?: string;
  note?: string;
  createdAt: string;
}

// 分析
export interface Analysis {
  id: string;
  alertId: string;
  deviceId: string;
  level: string;
  status: string;
  confidence?: number;
  dataQualityScore?: number;
  rootCause?: string;
  suggestion?: string;
  processingTimeMs?: number;
  completedAt?: string;
  createdAt: string;
}

export interface CreateAnalysisRequest {
  alertId: string;
}

// 通知
export interface Notification {
  id: string;
  type: 'alert' | 'workorder' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
}
```

- [ ] **Step 2: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add frontend/src/types/
git commit -m "feat: add TypeScript type definitions for all API entities

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: API 客户端 + Query 配置

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/queryClient.ts`
- Create: `frontend/src/lib/utils.ts`

- [ ] **Step 1: 创建 API 客户端**

`frontend/src/lib/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动注入 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 时跳转登录
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

- [ ] **Step 2: 创建 Query 客户端配置**

`frontend/src/lib/queryClient.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
```

- [ ] **Step 3: 创建工具函数**

`frontend/src/lib/utils.ts`（shadcn/ui init 可能已创建此文件，检查后补充）:
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

注意：如果 shadcn/ui init 已生成此文件且包含 `cn` 函数，则跳过此步骤。

- [ ] **Step 4: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/lib/
git commit -m "feat: add API client, TanStack Query config and utility functions

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Zustand Stores（authStore + notificationStore）

**Files:**
- Create: `frontend/src/stores/authStore.ts`
- Create: `frontend/src/stores/notificationStore.ts`

- [ ] **Step 1: 创建 authStore**

`frontend/src/stores/authStore.ts`:
```typescript
import { create } from 'zustand';
import type { UserInfo } from '../types';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },
}));
```

- [ ] **Step 2: 创建 notificationStore**

`frontend/src/stores/notificationStore.ts`:
```typescript
import { create } from 'zustand';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  push: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  push: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50),
    }));
  },

  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  clearAll: () => {
    const now = Date.now();
    set((state) => ({
      notifications: state.notifications.filter(
        (n) => !n.read || now - n.timestamp < 3600_000,
      ),
    }));
  },
}));
```

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/stores/
git commit -m "feat: add Zustand auth and notification stores

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: 主题系统 + 国际化

**Files:**
- Create: `frontend/src/hooks/useTheme.ts`
- Create: `frontend/src/i18n/index.ts`
- Create: `frontend/src/i18n/zh.json`
- Create: `frontend/src/i18n/en.json`
- Modify: `frontend/src/index.css` — 添加主题 CSS 变量

- [ ] **Step 1: 添加主题 CSS 变量**

在 `frontend/src/index.css` 的 `@import "tailwindcss";` 之后添加：
```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
  --sidebar-bg: 220 20% 96%;
  --chart-1: 221.2 83.2% 53.3%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
  --sidebar-bg: 222.2 84% 6%;
  --chart-1: 217.2 91.2% 59.8%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}

body {
  @apply bg-background text-foreground;
}
```

- [ ] **Step 2: 创建 useTheme Hook**

`frontend/src/hooks/useTheme.ts`:
```typescript
import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored ?? 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
```

- [ ] **Step 3: 创建 i18next 配置**

`frontend/src/i18n/zh.json`:
```json
{
  "common": {
    "appName": "EquipSense",
    "loading": "加载中...",
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "create": "新建",
    "search": "搜索",
    "filter": "筛选",
    "export": "导出",
    "confirm": "确认",
    "actions": "操作",
    "status": "状态",
    "createdAt": "创建时间",
    "noData": "暂无数据",
    "success": "操作成功",
    "error": "操作失败"
  },
  "auth": {
    "login": "登录",
    "username": "用户名",
    "password": "密码",
    "loginError": "用户名或密码错误",
    "logout": "退出登录"
  },
  "nav": {
    "dashboard": "仪表盘",
    "devices": "设备管理",
    "alerts": "告警中心",
    "alertRules": "告警规则",
    "workOrders": "工单管理",
    "analyses": "AI 分析",
    "settings": "系统设置"
  },
  "device": {
    "title": "设备管理",
    "deviceCode": "设备编码",
    "name": "设备名称",
    "type": "设备类型",
    "location": "位置",
    "lastCommunicatedAt": "最后通讯",
    "online": "在线",
    "offline": "离线",
    "maintenance": "维护中"
  },
  "alert": {
    "title": "告警中心",
    "alertCode": "告警编码",
    "metric": "指标",
    "value": "当前值",
    "severity": "级别",
    "critical": "紧急",
    "high": "高",
    "normal": "普通",
    "low": "低",
    "active": "活跃",
    "acknowledged": "已确认",
    "resolved": "已解决",
    "acknowledge": "确认",
    "resolve": "解决"
  },
  "workorder": {
    "title": "工单管理",
    "code": "工单编码",
    "priority": "优先级",
    "assign": "派工",
    "start": "开始执行",
    "complete": "完成",
    "accept": "验收通过",
    "reject": "验收不通过",
    "close": "关闭",
    "cancel": "取消"
  },
  "analysis": {
    "title": "AI 分析",
    "level": "分析级别",
    "confidence": "置信度",
    "rootCause": "根因",
    "suggestion": "建议"
  },
  "settings": {
    "title": "系统设置",
    "users": "用户管理",
    "roles": "角色权限",
    "llm": "LLM 配置",
    "system": "系统参数"
  }
}
```

`frontend/src/i18n/en.json`:
```json
{
  "common": {
    "appName": "EquipSense",
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "confirm": "Confirm",
    "actions": "Actions",
    "status": "Status",
    "createdAt": "Created At",
    "noData": "No data",
    "success": "Success",
    "error": "Error"
  },
  "auth": {
    "login": "Login",
    "username": "Username",
    "password": "Password",
    "loginError": "Invalid username or password",
    "logout": "Logout"
  },
  "nav": {
    "dashboard": "Dashboard",
    "devices": "Devices",
    "alerts": "Alerts",
    "alertRules": "Alert Rules",
    "workOrders": "Work Orders",
    "analyses": "AI Analysis",
    "settings": "Settings"
  },
  "device": {
    "title": "Device Management",
    "deviceCode": "Device Code",
    "name": "Name",
    "type": "Type",
    "location": "Location",
    "lastCommunicatedAt": "Last Communication",
    "online": "Online",
    "offline": "Offline",
    "maintenance": "Maintenance"
  },
  "alert": {
    "title": "Alert Center",
    "alertCode": "Alert Code",
    "metric": "Metric",
    "value": "Value",
    "severity": "Severity",
    "critical": "Critical",
    "high": "High",
    "normal": "Normal",
    "low": "Low",
    "active": "Active",
    "acknowledged": "Acknowledged",
    "resolved": "Resolved",
    "acknowledge": "Acknowledge",
    "resolve": "Resolve"
  },
  "workorder": {
    "title": "Work Orders",
    "code": "Code",
    "priority": "Priority",
    "assign": "Assign",
    "start": "Start",
    "complete": "Complete",
    "accept": "Accept",
    "reject": "Reject",
    "close": "Close",
    "cancel": "Cancel"
  },
  "analysis": {
    "title": "AI Analysis",
    "level": "Level",
    "confidence": "Confidence",
    "rootCause": "Root Cause",
    "suggestion": "Suggestion"
  },
  "settings": {
    "title": "Settings",
    "users": "Users",
    "roles": "Roles & Permissions",
    "llm": "LLM Configuration",
    "system": "System Parameters"
  }
}
```

`frontend/src/i18n/index.ts`:
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './zh.json';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: localStorage.getItem('language') || 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 4: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/index.css frontend/src/hooks/useTheme.ts frontend/src/i18n/
git commit -m "feat: add theme system with dark/light mode and i18n with zh/en

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: SignalR 连接 + useSignalR Hook

**Files:**
- Create: `frontend/src/lib/signalr.ts`
- Create: `frontend/src/hooks/useSignalR.ts`

- [ ] **Step 1: 创建 SignalR 连接管理**

`frontend/src/lib/signalr.ts`:
```typescript
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

let connection: HubConnection | null = null;

export function getConnection(): HubConnection | null {
  return connection;
}

export async function startConnection(): Promise<HubConnection> {
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl('/hubs/industrial')
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Information)
    .build();

  await connection.start();
  return connection;
}

export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}
```

- [ ] **Step 2: 创建 useSignalR Hook**

`frontend/src/hooks/useSignalR.ts`:
```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { startConnection, stopConnection, getConnection } from '../lib/signalr';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

export function useSignalR() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const push = useNotificationStore((s) => s.push);
  const started = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || started.current) return;
    started.current = true;

    startConnection().then((conn) => {
      conn.on('OnAlertTriggered', (data: { alertId: string; alertCode: string; deviceId: string; metric: string; value: number; severity: string }) => {
        push({
          type: 'alert',
          title: `告警：${data.metric}`,
          message: `${data.metric} = ${data.value}（${data.severity}）`,
          link: `/alerts`,
        });
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      });

      conn.on('OnAlertResolved', (alertId: string) => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      });

      conn.on('OnTelemetryUpdate', (deviceId: string, metric: string, value: number) => {
        queryClient.invalidateQueries({ queryKey: ['telemetry', deviceId] });
      });
    }).catch(console.error);

    return () => {
      started.current = false;
      stopConnection();
    };
  }, [isAuthenticated]);
}
```

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/lib/signalr.ts frontend/src/hooks/useSignalR.ts
git commit -m "feat: add SignalR connection manager and useSignalR hook

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: 布局组件（AuthLayout + AppLayout + Sidebar + Header）

**Files:**
- Create: `frontend/src/components/layout/AuthLayout.tsx`
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: 创建 AuthLayout**

`frontend/src/components/layout/AuthLayout.tsx`:
```tsx
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">EquipSense</h1>
          <p className="mt-2 text-sm text-muted-foreground">工业设备智能监控平台</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 Sidebar**

`frontend/src/components/layout/Sidebar.tsx`:
```tsx
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/devices', icon: Wrench, labelKey: 'nav.devices' },
  { path: '/alerts', icon: AlertTriangle, labelKey: 'nav.alerts' },
  { path: '/work-orders', icon: ClipboardList, labelKey: 'nav.workOrders' },
  { path: '/analyses', icon: Brain, labelKey: 'nav.analyses' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-[var(--sidebar-bg)] transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        {!collapsed && <span className="text-lg font-bold text-primary">EquipSense</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('rounded p-1.5 text-muted-foreground hover:text-foreground', collapsed && 'mx-auto')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ path, icon: Icon, labelKey }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t(labelKey)}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: 创建 Header**

`frontend/src/components/layout/Header.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Sun, Moon, Globe, LogOut, User } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useState } from 'react';

export function Header() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notifications = useNotificationStore((s) => s.notifications);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="text-sm text-muted-foreground">EquipSense</div>

      <div className="flex items-center gap-2">
        {/* 通知铃铛 */}
        <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">{t('common.noData')}</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 主题切换 */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* 语言切换 */}
        <Button variant="ghost" size="icon" onClick={toggleLanguage}>
          <Globe className="h-4 w-4" />
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-medium">{user?.username}</div>
            <div className="px-2 text-xs text-muted-foreground">{user?.role}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: 创建 AppLayout**

`frontend/src/components/layout/AppLayout.tsx`:
```tsx
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../stores/authStore';
import { useSignalR } from '../../hooks/useSignalR';

export function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useSignalR();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/components/layout/
git commit -m "feat: add AuthLayout, AppLayout, Sidebar and Header components

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: LoginPage + NotificationToast + App 路由 + main.tsx

**Files:**
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/components/layout/NotificationToast.tsx`
- Modify: `frontend/src/App.tsx` — 路由定义
- Modify: `frontend/src/main.tsx` — Provider 包裹

- [ ] **Step 1: 创建 LoginPage**

`frontend/src/pages/LoginPage.tsx`:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponse } from '../types';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      setAuth(response.data.token, response.data.user);
      navigate('/dashboard', { replace: true });
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.login')}</CardTitle>
        <CardDescription>登录到工业设备智能监控平台</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t('auth.username')}</Label>
            <Input id="username" {...register('username')} placeholder={t('auth.username')} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" {...register('password')} placeholder={t('auth.password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.login')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 创建 NotificationToast**

`frontend/src/components/layout/NotificationToast.tsx`:
```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore';
import { X } from 'lucide-icon';

export function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read);
  const latest = unread[0];

  useEffect(() => {
    if (!latest) return;
    const timer = setTimeout(() => {
      markRead(latest.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [latest, markRead]);

  if (!latest) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-80 cursor-pointer rounded-lg border border-border bg-card p-4 shadow-lg transition-all"
      onClick={() => {
        markRead(latest.id);
        if (latest.link) navigate(latest.link);
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">{latest.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{latest.message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            markRead(latest.id);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 更新 App.tsx — 路由定义**

`frontend/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthLayout } from './components/layout/AuthLayout';
import { AppLayout } from './components/layout/AppLayout';
import { NotificationToast } from './components/layout/NotificationToast';
import LoginPage from './pages/LoginPage';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

function AppRoutes() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<div className="text-muted-foreground">仪表盘（子计划 B 实现）</div>} />
        <Route path="/devices" element={<div className="text-muted-foreground">设备管理（子计划 B 实现）</div>} />
        <Route path="/devices/:id" element={<div className="text-muted-foreground">设备详情（子计划 B 实现）</div>} />
        <Route path="/alerts" element={<div className="text-muted-foreground">告警中心（子计划 B 实现）</div>} />
        <Route path="/alert-rules" element={<div className="text-muted-foreground">告警规则（子计划 B 实现）</div>} />
        <Route path="/work-orders" element={<div className="text-muted-foreground">工单管理（子计划 C 实现）</div>} />
        <Route path="/work-orders/:id" element={<div className="text-muted-foreground">工单详情（子计划 C 实现）</div>} />
        <Route path="/analyses" element={<div className="text-muted-foreground">AI 分析（子计划 C 实现）</div>} />
        <Route path="/settings" element={<div className="text-muted-foreground">系统设置（子计划 C 实现）</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <NotificationToast />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: 更新 main.tsx**

`frontend/src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: 启动验证**

```bash
cd frontend && npm run dev
```
Expected: 页面显示登录表单，可输入用户名和密码。布局框架正常（侧边栏、Header）。

- [ ] **Step 6: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 7: 提交**

```bash
git add frontend/src/
git commit -m "feat: add LoginPage, NotificationToast, routing and app entry point

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## 自检清单

| 规格要求 | 对应任务 |
|---------|---------|
| Vite 初始化 + TailwindCSS + shadcn/ui | Task 1 |
| TypeScript 类型定义 | Task 2 |
| API 客户端（Axios + JWT） | Task 3 |
| TanStack Query 配置 | Task 3 |
| authStore（Zustand） | Task 4 |
| notificationStore（Zustand） | Task 4 |
| 主题系统（深色/浅色） | Task 5 |
| 国际化（i18next 中英文） | Task 5 |
| SignalR 连接管理 | Task 6 |
| useSignalR Hook | Task 6 |
| AuthLayout | Task 7 |
| AppLayout | Task 7 |
| Sidebar（固定侧边栏） | Task 7 |
| Header（通知/主题/语言/用户） | Task 7 |
| LoginPage（登录表单） | Task 8 |
| NotificationToast | Task 8 |
| 路由定义（React Router） | Task 8 |
| main.tsx（入口 + Provider） | Task 8 |
