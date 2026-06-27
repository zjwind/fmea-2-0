# 多人协作表格编辑器 - FMEA评估原型

基于 TanStack Table 风格 + Yjs 实时协作 + Node.js + PostgreSQL 的多人协作表格编辑原型。

## 技术栈

- **前端**: 原生 JavaScript + Yjs + TanStack Table 风格 UI
- **实时协作**: Yjs (CRDT算法) + WebSocket
- **后端**: Node.js + Express + ws
- **数据库**: PostgreSQL
- **AI功能**: 智能生成评估表 + 失效模式分析

## 功能特性

### 👥 实时多人协作
- 基于 Yjs 的 CRDT 算法，支持多人同时编辑
- 实时数据同步，无冲突合并
- 在线用户显示，用户头像和颜色标识
- 连接状态实时显示

### 🤖 AI 智能生成
- 一键生成评估数据（10条变更项）
- 智能五维评分（技术新颖性、影响范围、失效严重度、变更复杂度、历史问题）
- 自动计算综合评分（1-12分）和风险等级（H/M/L）
- 智能生成评估结论

### 📊 表格功能
- 类 TanStack Table 的高性能表格
- 列固定（左侧冻结列）
- 行层级展示（level 0/1/2）
- 单元格双击编辑
- 右键菜单（插入/删除行）
- 数据导出（JSON格式）
- 五维评估大表展示

### 🎨 UI 设计
- 企业后台风格设计
- 卡片化布局
- 蓝色主色调 (#4f6ef7)
- 圆角设计 + 轻量阴影
- 响应式布局

## 项目结构

```
fmea-prototype-v2/
├── collab-demo.html              # 协作表格演示入口
├── pages/
│   └── collab-table.html         # 协作表格主页面
├── css/
│   └── custom.css               # 全局样式
└── js/
    └── common.js                # 公共脚本（已更新菜单）

collab-table-server/
├── package.json                  # 后端依赖
├── server.js                     # 主服务器（Express + WebSocket + Yjs）
├── database.js                   # 数据库操作
└── ai-service.js                 # AI生成服务
```

## 快速开始

### 方式一：直接打开前端页面（本地模拟模式）

直接在浏览器中打开：
```
fmea-prototype-v2/collab-demo.html
```

无需后端服务，页面会自动使用本地模拟数据，可以体验：
- 表格编辑功能
- AI生成功能（本地模拟）
- 用户设置
- 数据导出

### 方式二：完整后端模式

#### 1. 安装 PostgreSQL

确保已安装 PostgreSQL 并创建数据库：

```sql
CREATE DATABASE fmea_collab;
```

#### 2. 配置环境变量（可选）

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=fmea_collab
export DB_USER=postgres
export DB_PASSWORD=postgres
export PORT=3001
```

#### 3. 安装依赖并启动后端

```bash
cd collab-table-server
npm install
npm start
```

服务启动后：
- WebSocket: `ws://localhost:3001`
- API: `http://localhost:3001`

#### 4. 打开前端页面

在浏览器中打开：
```
fmea-prototype-v2/collab-demo.html
```

或直接访问：
```
fmea-prototype-v2/pages/collab-table.html?docId=demo-001&docName=演示文档
```

## API 接口

### 文档管理

- `GET /api/documents?type=evaluation` - 获取文档列表
- `POST /api/documents` - 创建新文档
- `GET /api/documents/:id` - 获取文档信息

### AI 功能

- `POST /api/ai/generate-evaluation` - 生成评估表数据
  - 请求体: `{ docId, changeCount, createdBy }`
- `POST /api/ai/analyze-failure` - 失效模式分析
  - 请求体: `{ changeItem }`

### 健康检查

- `GET /api/health` - 服务健康状态

## 数据库表结构

### documents 文档表
- `id` - 文档ID (主键)
- `name` - 文档名称
- `type` - 文档类型 (evaluation/analysis等)
- `ydoc` - Yjs文档二进制数据
- `created_at` - 创建时间
- `updated_at` - 更新时间

### users 用户表
- `id` - 用户ID (主键)
- `name` - 用户名
- `avatar` - 头像
- `color` - 用户颜色
- `last_seen` - 最后在线时间

### ai_generations AI生成记录表
- `id` - 记录ID
- `doc_id` - 关联文档ID
- `prompt` - 提示词
- `result` - 生成结果 (JSON)
- `created_by` - 创建人
- `created_at` - 创建时间

## 五维评估模型

| 维度 | 权重 | 高(10分) | 中(5分) | 低(1分) |
|------|------|----------|---------|---------|
| 技术新颖性 | 15% | 全新技术 | 改进技术 | 成熟技术 |
| 影响范围 | 30% | 系统级 | 模块级 | 部件级 |
| 失效严重度 | 30% | 致命 | 严重 | 轻微 |
| 变更复杂度 | 20% | 高复杂 | 中复杂 | 低复杂 |
| 历史问题 | 5% | 多次发生 | 偶发 | 无 |

**综合评分**: 加权求和后映射至 1-12 分
**风险等级**: H(≥8分) / M(5-7分) / L(<5分)

## 操作说明

### 表格操作
- **双击单元格**: 进入编辑模式
- **右键点击行**: 显示上下文菜单（插入/删除行）
- **点击添加行按钮**: 在末尾添加新行

### 编辑操作
- **Enter**: 确认编辑
- **Escape**: 取消编辑
- **点击其他区域**: 确认并退出编辑

### 列类型
- **等级列**: 下拉选择 (高/中/低)
- **得分列**: 自动计算，不可编辑
- **状态列**: 下拉选择 (草稿/进行中/已提交等)
- **普通列**: 文本输入

## 与现有系统集成

协作表格已集成到 FMEA 原型系统菜单中：
- 位置: 评估任务 → 协作表格(AI)
- 入口: [common.js](file:///workspace/fmea-prototype-v2/js/common.js) 菜单配置

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 注意事项

1. **本地模拟模式**: 后端服务未连接时，数据仅保存在浏览器内存中，刷新后丢失
2. **完整模式**: 需要 PostgreSQL 数据库支持，数据持久化存储
3. **多人协作**: 需要在多个浏览器窗口/标签页中打开同一文档ID体验
4. **AI功能**: 当前为模拟生成，实际使用可接入真实AI API

## 开发计划

- [ ] 接入真实 AI API（如 GPT-4、文心一言等）
- [ ] 增加表格列宽调整
- [ ] 增加行拖拽排序
- [ ] 增加评论和批注功能
- [ ] 增加版本历史和回溯
- [ ] 增加单元格级别的用户光标显示
- [ ] 增加更多导出格式（Excel、CSV）
