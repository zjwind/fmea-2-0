# AI 中心（Ai_centre / AgentCentre）前端样式指南（基于现有代码）

## 0. 文档说明
- 目标：基于仓库真实代码，梳理 AI 中心相关前端样式体系与可迁移规范。
- 代码范围：`pms-web-app/src/main/resources` 下模板、CSS、JS、静态资源。
- 结论先行：当前已具备完整主题体系（亮/暗）与组件样式体系，**无需新增基础样式功能**，优先复用并做标准化沉淀。

---

## 1. 代码定位清单（模板 / CSS / JS / 静态资源）

### 1.1 模板（Template）
1. `templates/ai/index/index.ftl`
   - AI 中心主入口页面。
   - 引入 AgentCentre 主样式与模块 JS。
   - 初始化 `data-theme`、`localStorage(aac-theme)`、全局配置变量。
2. `templates/ai/index/workbench-agentcentre.ftl`
   - AI 工作台嵌入页（legacy workbench 在 AgentCentre 中的 iframe 页面）。
   - 叠加 `ai-workbench-agentcentre-theme.css` 做视觉桥接。
3. `templates/ai/index/include/include_style.ftl`
   - 引入 EasyUI 亮/暗主题样式。
   - 引入主题桥接脚本。
4. `templates/ai/agent_centre/include/include_theme_sync_bridge.ftl`
   - 主题同步桥接核心（postMessage/storage/iframe 同步）。

### 1.2 CSS
1. AgentCentre 主样式
   - `static/resources/agent_centre/css/main.css`
   - `static/resources/agent_centre/css/components.css`
2. 桥接与隔离
   - `static/resources/agent_centre/css/workbench-legacy-bridge.css`
   - `static/resources/agent_centre/css/easyui-isolation.css`
3. 工作台样式（legacy + 主题桥接）
   - `static/resources/pms/ai/css/ai-workbench.css`
   - `static/resources/pms/ai/css/ai-workbench-extension.css`
   - `static/resources/pms/ai/css/ai-workbench-agentcentre-theme.css`

### 1.3 JS（样式/主题/布局相关核心）
1. `static/resources/agent_centre/js/app.js`
   - 应用入口、导航、主题切换 `applyTheme()`。
2. `static/resources/agent_centre/js/workbench.js`
   - 工作台 iframe 嵌入、主题同步到 iframe。
3. `static/resources/agent_centre/js/help.js`
   - 随亮/暗主题切换帮助页背景图。

### 1.4 静态资源（已定位）
- `static/resources/agent_centre/img/icon-agent.svg`
- `static/resources/agent_centre/img/bg-light.jpg`
- `static/resources/agent_centre/img/bg-dark1.jpg`

---

## 2. 整体设计语言与布局结构

## 2.1 设计语言
- 关键词：**企业后台、卡片化、轻量阴影、蓝色主色、可读性优先**。
- 样式组织方式：
  - AgentCentre 以 `.aac` 命名空间隔离（防止宿主系统污染）。
  - 工作台页面通过 `aac-workbench-theme` + `--ac-*` 变量进行主题桥接。

## 2.2 页面布局
1. AI 中心主入口（`index.ftl`）
   - 顶部导航（Topbar）+ 中心内容区（EasyUI layout north/center）。
   - 内容区内再由 `.app-layout > .main-content > .page-body` 管理各模块 panel。
2. 工作台嵌入结构（`workbench.js`）
   - AgentCentre 页面中嵌入 `workbench-agentcentre.ftl` iframe。
   - 外层卡片容器统一边框、圆角、阴影；内层 legacy 页面再套主题桥接。
3. Workbench 内部三栏（`ai-workbench-agentcentre-theme.css`）
   - `260px | 1fr | 310px`（<=1360px 降为 `230|1fr|280`；<=1100px 单列）。

---

## 3. 设计令牌（色板/字号/间距/圆角/阴影/动效）

## 3.1 色板（核心）
### AgentCentre（`main.css`）
- 主色：`--primary #4f6ef7`
- 主色深：`#3b56d9`
- 主色浅背景：`#eef0fe`
- 成功/警告/危险：`#22c55e / #f59e0b / #ef4444`
- 边框：`#e5e7eb`
- 文本：`#3f454a / #5a6178 / #323437`
- 背景：`--bg-app #f4f5f8`，`--bg-surface #fff`

### Workbench 桥接（`ai-workbench-agentcentre-theme.css`）
- 主色：`--ac-primary #4f6ef7`
- 背景：`--ac-bg-app #f4f5f8`，面板 `--ac-bg-surface #fff`
- 文本：`--ac-text-primary #1a1d2e`，次级 `#5a6178`

## 3.2 字号
- 全局基线：`14px`（AgentCentre）。
- 辅助文字：`11/12/13px`。
- 标题：`14/15/16/18/22px`（页面层级递进）。
- 数值强化：统计值可到 `24px`。

## 3.3 间距
- 常用间距：`4/6/8/10/12/14/16/20/24px`。
- 卡片内边距主值：`16~20px`。
- 页面 body padding：`24px`（小屏降至 16px）。

## 3.4 圆角
- 基础圆角：`8px`（`--radius`）。
- 大圆角：`12px`（`--radius-lg`）。
- 胶囊态：`999px`（按钮、tag、进度条等）。

## 3.5 阴影
- 普通：`0 2px 8px rgba(0,0,0,.08)`。
- 强调：`0 8px 24px rgba(0,0,0,.12)`。
- 夜间对应加深（透明度更高）。

## 3.6 动效
- 统一过渡：大量使用 `all .2s ease`。
- 微交互：hover 上浮 `translateY(-1px|-2px)`。
- Toast 动画：`aac-slideInRight`、`aac-fadeOut`。
- 主题切换防抖：`aac-theme-switching` 临时禁用 transition/animation（双 rAF 后恢复）。

---

## 4. 组件样式特征（可复用）

## 4.1 按钮
- 主按钮：主色实底 + 白字（hover 变深）。
- 次按钮：白底 + 灰边。
- 危险按钮：白底红边红字。
- 轻按钮/幽灵按钮：透明底，hover 主色浅底。

## 4.2 卡片
- `bg-surface + border + radius-lg` 为基础范式。
- hover 可带轻阴影/轻位移，提升可点击感。

## 4.3 输入框/搜索框/表单
- 统一 1px 边框 + 8px 圆角。
- focus：主色边框 + `0 0 0 3px` 的轻外发光。
- 占位符统一弱化色（muted）。

## 4.4 列表/表格
- 表头浅底、12px 强调字。
- 行 hover 使用浅背景色。
- 状态通过 badge（圆角胶囊 + 语义色）表达。

## 4.5 导航
- 顶部导航项 active：主色文字 + 主色下划线。
- 左侧导航项 active：主色浅底 + 主色文字。

## 4.6 标签/徽标（Tag/Badge）
- tag：小圆角、浅底、细边框。
- badge：小胶囊 + 小圆点伪元素（`::before`）。

## 4.7 弹窗/提示（Modal/Toast）
- Modal：固定层，圆角大、阴影强、头体脚分区。
- Toast：右上角栈式通知，左侧语义色边线。

---

## 5. 日间/夜间模式差异与切换机制

## 5.1 机制
1. 存储键：`localStorage['aac-theme']`。
2. 主题标记：
   - `html[data-theme="light|dark"]`
   - `.aac[data-theme="light|dark"]`（双写，兼容嵌入场景）
3. 切换入口：`App.toggleTheme()` → `App.applyTheme()`。
4. 广播机制：`window.dispatchEvent('aac-theme-change')`。
5. iframe 同步：
   - 父页 `workbench.js` 同步 attr + postMessage `ac_set_theme`
   - 子页 `include_theme_sync_bridge.ftl` 监听 message/storage 并回写主题。

## 5.2 视觉差异
- 背景：浅色 `#f4f5f8` → 深色 `#0d1324`。
- 面板：白色 → 深蓝灰（`#141c31`）。
- 文本：深色系 → 浅色系（提升对比度）。
- 边框/阴影：夜间模式增强边界与阴影对比。

---

## 6. 现有功能复用判断（是否需要新增）

## 6.1 现状分析
- 主题能力：完整（亮/暗 + iframe 跨层同步）。
- 组件能力：完整（按钮、卡片、表单、表格、标签、弹窗、提示）。
- 布局能力：完整（主框架 + 多模块 panel + 响应式）。

## 6.2 结论
- **不建议新增一套 UI 基础能力**。
- 建议直接复用 `main.css + components.css + 主题切换机制`，工作台场景复用 `workbench-legacy-bridge.css + ai-workbench-agentcentre-theme.css`。

---

## 7. 架构与性能评估（架构师视角）

1. 优点
   - CSS 变量驱动主题切换，重绘成本低于整套 class 替换。
   - `.aac` 命名空间有效隔离宿主冲突。
   - 通过桥接脚本处理 iframe 主题一致性，工程可维护性较好。

2. 风险点
   - 存在双主题变量体系（`--primary` 与 `--ac-*`），长期可能分叉。
   - `iframe + postMessage + EasyUI` 组合下，主题切换链路较长。
   - `main.css` 中 `--grey-light:grey-light1;` 看起来是异常值（疑似笔误）。

3. 性能建议
   - 优先统一 Design Token 来源（建议沉淀单一 token 层）。
   - 控制 `all` 级别过渡范围，减少非必要属性动画。
   - 保持 bridge 中“仅必要时重排 datagrid”的策略，避免闪烁。

---

## 8. 可复用落地规范与迁移建议（前后端协同）

## 8.1 前端落地
1. 新页面根节点统一加 `.aac`。
2. 统一使用 token（禁止硬编码颜色/圆角/阴影）。
3. 保留 `localStorage(aac-theme)` 与 `data-theme` 双写机制。
4. 若嵌入 legacy 页面，复用 `workbench-legacy-bridge.css` + postMessage 同步。

## 8.2 后端/模板协同
1. 在 FTL 首屏脚本中提前写入 `html[data-theme]`，避免首屏闪烁。
2. 通过模板统一注入：
   - `AGENT_CENTRE_BASE_PATH`
   - `AGENT_CENTRE_LEGACY_WORKBENCH_URL`
   - 当前用户权限信息（用于导航和菜单裁剪）。
3. 主题桥接 include（`include_theme_sync_bridge.ftl`）保持集中复用，不建议每页重复实现。

## 8.3 迁移分步
1. 第一步：仅迁移 `.aac + main.css + components.css`。
2. 第二步：接入 `app.js` 主题切换/导航骨架。
3. 第三步：再接 iframe 桥接与 legacy 页面。

---

## 9. 待确认项（请补充）
1. `main.css` 中 `--grey-light:grey-light1;` 是否为历史遗留笔误？
2. `supperUser` 在 `index.ftl` 的赋值逻辑是否符合预期（当前看起来始终 false）。
3. AI 中心“官方设计基线”是否已有独立 Figma/设计规范文档（当前代码可反推，但未看到单独设计源）。
4. `agent_centre/css` 下如 `api_key.css / my_tasks.css / skill_market.css` 的样式是否已完全并入主样式，还是仍在局部页面启用（需业务确认）。

---

## 10. 本次完成内容总结
- 已定位 AI 中心相关模板、CSS、JS、静态资源。
- 已基于真实代码输出 UI 风格、设计令牌、组件样式、亮暗主题机制。
- 已给出“无需新增、优先复用”的落地方案及迁移建议，并标注待确认项。
