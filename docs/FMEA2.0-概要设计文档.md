# FMEA 2.0 概要设计文档

> **版本**: V1.0  
> **日期**: 2026-05-28  
> **关联文档**: FMEA2.0-需求分析文档 V2.0  

---

## 目录

1. [设计概述](#1-设计概述)
2. [系统架构设计](#2-系统架构设计)
3. [技术选型](#3-技术选型)
4. [模块划分与包结构](#4-模块划分与包结构)
5. [多数据源设计](#5-多数据源设计)
6. [数据库设计](#6-数据库设计)
7. [外部系统集成设计](#7-外部系统集成设计)
8. [AI模型集成设计](#8-ai模型集成设计)
9. [核心业务模块设计](#9-核心业务模块设计)
10. [安全设计](#10-安全设计)
11. [部署架构](#11-部署架构)

---

## 1. 设计概述

### 1.1 设计目标

基于 FMEA 2.0 需求分析文档，设计一套 IT+AI 一体化的 DRBFM 管理平台，支撑从变更点识别、风险评估、DRBFM分析、基线输出、评审审批到基线落地跟踪与入库的全生命周期管理。

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| 模块化 | 业务模块高内聚低耦合，模块间通过接口交互 |
| 可扩展 | AI模型、外部系统集成通过策略模式/适配器模式接入，便于替换和扩展 |
| 数据隔离 | FMEA业务数据与PMS数据通过多数据源物理隔离，互不影响 |
| 简洁优先 | 100人并发规模，架构避免过度设计，单应用即可满足 |

### 1.3 设计约束

| 约束项 | 约束值 |
|--------|--------|
| 技术框架 | Spring Boot + MyBatis Plus |
| 数据源策略 | 多数据源（FMEA主库 + PMS直查库） |
| 外部集成 | 飞书API通过服务类封装；PMS通过数据源直查 |
| 终端 | 仅PC端 |
| 并发规模 | 约100人 |
| 可用性 | 90% |
| 认证 | CAS单点登录 |

---

## 2. 系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           PC Browser                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────┐
│                         Nginx (反向代理/静态资源)                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    FMEA 2.0 Application                              │
│                  (Spring Boot 单体应用)                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Controller Layer                          │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐  │    │
│  │  │评估  │ │分析  │ │基线  │ │评审  │ │入库  │ │看板统计│  │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Service Layer                             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │    │
│  │  │业务Service│ │流程引擎  │ │AI调度    │ │通知调度      │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                 Integration Layer                            │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │    │
│  │  │LarkService│ │AI Client │ │EmailSvc  │ │CAS Auth      │   │    │
│  │  │(飞书封装) │ │(外部API) │ │(SMTP)    │ │(SSO)         │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  Persistence Layer                           │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                 │    │
│  │  │MyBatis Plus      │  │MyBatis Plus      │                 │    │
│  │  │(FMEA DataSource) │  │(PMS DataSource)  │                 │    │
│  │  └──────────────────┘  └──────────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
          │                              │
┌─────────▼──────────┐       ┌──────────▼──────────┐
│   FMEA Database    │       │    PMS Database      │
│   (MySQL 主库)      │       │   (MySQL 只读)       │
└────────────────────┘       └─────────────────────┘
```

### 2.2 架构说明

系统采用 **Spring Boot 单体应用** 架构，基于以下考量：

1. **并发规模小**：约100人并发，单体应用足以支撑
2. **业务内聚性高**：DRBFM全流程紧密关联，不适合微服务拆分
3. **运维简单**：单体部署、监控、排障成本最低
4. **多数据源**：通过 Spring 的 AbstractRoutingDataSource 实现FMEA主库与PMS只读库的切换

架构分为四层：

| 层次 | 职责 | 关键技术 |
|------|------|----------|
| Controller Layer | 接收请求、参数校验、响应封装 | Spring MVC, Validation |
| Service Layer | 业务逻辑、流程编排、事务管理 | Spring Transaction, 状态机 |
| Integration Layer | 外部系统对接封装 | RestTemplate/WebClient, JavaMail |
| Persistence Layer | 数据持久化、多数据源路由 | MyBatis Plus, Dynamic Datasource |

---

## 3. 技术选型

### 3.1 核心技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 基础框架 | Spring Boot | 2.7.x | 主框架 |
| ORM | MyBatis Plus | 3.5.x | 持久层框架，单表CRUD简化 |
| 多数据源 | dynamic-datasource-spring-boot-starter | 3.6.x | MyBatis Plus官方多数据源组件 |
| 数据库 | MySQL | 8.0 | FMEA主库 + PMS只读库 |
| 连接池 | HikariCP | — | Spring Boot默认 |
| 缓存 | Redis | 7.x | 会话缓存、配置缓存、分布式锁 |
| 认证 | Spring Security + CAS | — | SSO单点登录 |
| 任务调度 | Spring Task / Quartz | — | 评审通知定时任务、统计推送 |
| 文件处理 | Apache POI | 5.x | Excel导入导出 |
| 文档处理 | Apache Tika | 2.x | Word/PDF文档内容提取 |
| HTTP客户端 | RestTemplate | — | 飞书API、AI API调用 |
| 邮件 | Spring Boot Mail | — | SMTP邮件发送 |
| 接口文档 | Knife4j (Swagger) | 3.x | API文档自动生成 |
| 日志 | Logback + SLF4J | — | 审计日志、业务日志 |
| 工具库 | Hutool | 5.x | 通用工具 |
| 对象映射 | MapStruct | 1.5.x | DTO/Entity转换 |

### 3.2 前端技术栈（参考）

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3 | SPA前端 |
| UI组件 | Element Plus | 企业级组件库 |
| 图表 | ECharts | 看板统计图表 |
| 画板 | 飞书画板嵌入 | 结构框图通过飞书SDK嵌入 |
| 状态管理 | Pinia | — |

---

## 4. 模块划分与包结构

### 4.1 模块划分

```
fmea-server/
├── fmea-common/                  # 通用模块
│   ├── fmea-common-core/         # 核心工具、通用响应、异常定义
│   ├── fmea-common-security/     # 安全模块（CAS集成、权限校验）
│   └── fmea-common-log/          # 审计日志模块
│
├── fmea-service/                 # 业务服务模块（单体，Maven多模块组织代码）
│   ├── fmea-evaluation/          # DRBFM触发评估
│   ├── fmea-analysis/            # DRBFM分析（结构/功能/失效/措施/SOD）
│   ├── fmea-baseline/            # 基线输出与落地跟踪
│   ├── fmea-review/              # 评审与审批
│   ├── fmea-inbound/             # 入库管理
│   ├── fmea-library/             # 基线库/失效库/措施库/功能库
│   ├── fmea-dashboard/           # 看板与统计
│   ├── fmea-config/              # 系统配置
│   └── fmea-project/             # 项目管理
│
├── fmea-integration/             # 外部集成模块
│   ├── fmea-integration-lark/    # 飞书服务封装
│   ├── fmea-integration-ai/      # AI模型客户端
│   ├── fmea-integration-pms/     # PMS数据直查
│   └── fmea-integration-email/   # 邮件服务
│
└── fmea-app/                     # 启动模块
    └── src/main/java/
        └── com.fmea.FmeaApplication.java
```

### 4.2 包结构规范

每个业务模块遵循统一的包结构：

```
com.fmea.{module}/
├── controller/           # REST接口
├── service/              # 业务逻辑
│   └── impl/
├── mapper/               # MyBatis Mapper接口
├── entity/               # 数据库实体
├── dto/                  # 数据传输对象
│   ├── request/          # 请求DTO
│   └── response/         # 响应DTO
├── enums/                # 枚举定义
├── converter/            # MapStruct转换器
└── config/               # 模块配置
```

### 4.3 模块依赖关系

```
fmea-app
  ├── fmea-service (所有业务模块)
  │     └── fmea-common-core
  ├── fmea-integration-lark
  │     └── fmea-common-core
  ├── fmea-integration-ai
  │     └── fmea-common-core
  ├── fmea-integration-pms
  │     └── fmea-common-core
  ├── fmea-integration-email
  │     └── fmea-common-core
  ├── fmea-common-security
  │     └── fmea-common-core
  └── fmea-common-log
        └── fmea-common-core
```

**依赖规则**：
- 业务模块间可互相依赖（单体应用），但需通过Service接口调用，禁止直接依赖Mapper
- 集成模块不依赖业务模块，仅被业务模块调用
- 通用模块不依赖任何业务模块

---

## 5. 多数据源设计

### 5.1 数据源规划

| 数据源名称 | 用途 | 权限 | 连接池 |
|------------|------|------|--------|
| fmea | FMEA业务主库 | 读写 | HikariCP (max=20) |
| pms | PMS系统数据库 | **只读** | HikariCP (max=5) |

### 5.2 数据源配置

```yaml
spring:
  datasource:
    dynamic:
      primary: fmea
      strict: true
      datasource:
        fmea:
          url: jdbc:mysql://fmea-db:3306/fmea?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
          username: ${FMEA_DB_USER}
          password: ${FMEA_DB_PASS}
          driver-class-name: com.mysql.cj.jdbc.Driver
        pms:
          url: jdbc:mysql://pms-db:3306/pms?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
          username: ${PMS_DB_USER}
          password: ${PMS_DB_PASS}
          driver-class-name: com.mysql.cj.jdbc.Driver
```

### 5.3 数据源切换方式

采用 `@DS` 注解切换数据源：

```java
// FMEA主库（默认，无需注解）
@Service
public class EvaluationServiceImpl implements EvaluationService {
    // 默认使用fmea数据源
}

// PMS只读库
@Service
public class PmsQueryServiceImpl implements PmsQueryService {

    @DS("pms")
    public PmsProjectInfo getProjectInfo(String pmsProjectId) {
        // 通过PMS数据源直查
    }

    @DS("pms")
    public boolean isLevel1Project(String pmsProjectId) {
        // 查询PMS判断是否1级项目
    }
}
```

### 5.4 PMS直查规范

| 规范项 | 说明 |
|--------|------|
| 只读限制 | PMS数据源所有操作仅限SELECT，禁止INSERT/UPDATE/DELETE |
| 查询封装 | PMS查询统一封装在 `fmea-integration-pms` 模块，业务模块不直接操作PMS数据源 |
| SQL管理 | PMS查询SQL写在独立Mapper XML中，与FMEA业务Mapper隔离 |
| 缓存策略 | PMS查询结果按需缓存至Redis（如项目信息缓存30分钟），减少跨库查询 |
| 事务边界 | PMS查询不参与FMEA业务事务，禁止在 `@Transactional` 中混用两个数据源 |

### 5.5 PMS数据查询接口清单

| 查询接口 | 用途 | 缓存时间 |
|----------|------|----------|
| getProjectInfo | 获取项目基本信息、PDTL、TR阶段 | 30min |
| isLevel1Project | 判断是否1级项目 | 30min |
| getProjectMembers | 获取项目成员及角色（权限同步） | 10min |
| getTrNodeTrigger | 获取TR节点触发信息 | 实时 |
| getChangeSourceData | 获取变更来源数据 | 实时 |

---

## 6. 数据库设计

### 6.1 FMEA主库表设计

#### 6.1.1 项目管理域

```sql
-- 项目表
CREATE TABLE fmea_project (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(200) NOT NULL,
    bg              VARCHAR(50) NOT NULL COMMENT 'BG标识',
    pdtl            VARCHAR(100) COMMENT 'PDTL负责人',
    tr_stage        VARCHAR(20) COMMENT '当前TR阶段',
    is_level1       TINYINT(1) DEFAULT 0 COMMENT '是否1级项目(从PMS同步)',
    pms_project_id  VARCHAR(100) COMMENT 'PMS系统项目ID',
    created_by      VARCHAR(64),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by      VARCHAR(64),
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1) DEFAULT 0,
    INDEX idx_pms_project_id (pms_project_id),
    INDEX idx_bg (bg)
) COMMENT '项目表';

-- FMEA分析领域配置表
CREATE TABLE fmea_domain (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    domain_name         VARCHAR(100) NOT NULL,
    domain_desc         VARCHAR(500),
    role                VARCHAR(100),
    role_representative VARCHAR(100),
    created_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted          TINYINT(1) DEFAULT 0
) COMMENT 'FMEA分析领域配置';

-- 项目权限表
CREATE TABLE fmea_permission (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         VARCHAR(64) NOT NULL,
    project_id      BIGINT NOT NULL,
    resource_type   VARCHAR(50) NOT NULL COMMENT '资源类型',
    permission_type VARCHAR(30) NOT NULL COMMENT '权限类型: manage/edit/read/review/approve',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_user_project (user_id, project_id, resource_type, permission_type),
    INDEX idx_project_id (project_id)
) COMMENT '项目权限表(由PMS同步)';
```

#### 6.1.2 DRBFM触发评估域

```sql
-- 变更点清单表
CREATE TABLE fmea_change_list (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id      BIGINT NOT NULL,
    level           VARCHAR(20) NOT NULL COMMENT 'system/part',
    created_by      VARCHAR(64),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1) DEFAULT 0,
    INDEX idx_project_id (project_id)
) COMMENT '变更点清单';

-- 变更点清单项(支持无限层级树结构)
CREATE TABLE fmea_change_list_item (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    change_list_id  BIGINT NOT NULL,
    parent_id       BIGINT DEFAULT 0 COMMENT '父节点ID, 0表示顶级',
    level_num       INT NOT NULL DEFAULT 0 COMMENT '层级深度',
    item_id         VARCHAR(50) NOT NULL COMMENT '业务ID(合并依据)',
    structure_name  VARCHAR(200) NOT NULL,
    dev_type        VARCHAR(50) COMMENT '开发类型(手动输入)',
    imn_option      VARCHAR(10) COMMENT 'I/M/N选项',
    change_point    TEXT COMMENT '变更点描述',
    quality_match   TEXT COMMENT '质量策划匹配内容',
    sort_order      INT DEFAULT 0,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1) DEFAULT 0,
    INDEX idx_change_list_id (change_list_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_item_id (item_id)
) COMMENT '变更点清单项';

-- 质量策划表
CREATE TABLE fmea_quality_plan (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id      BIGINT NOT NULL,
    raw_content     LONGTEXT COMMENT '原始导入内容(markdown)',
    file_name       VARCHAR(200),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1) DEFAULT 0,
    INDEX idx_project_id (project_id)
) COMMENT '质量策划';

-- 评估任务表
CREATE TABLE fmea_evaluation_task (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id      BIGINT NOT NULL,
    level           VARCHAR(20) NOT NULL COMMENT 'system/part',
    status          VARCHAR(30) NOT NULL COMMENT 'draft/submitted/approved/rejected',
    submit_count    INT DEFAULT 0,
    is_withdrawn    TINYINT(1) DEFAULT 0,
    creator         VARCHAR(64),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1) DEFAULT 0,
    INDEX idx_project_level (project_id, level)
) COMMENT '评估任务';

-- 评估项(五维评估)
CREATE TABLE fmea_evaluation_item (
    id                      BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id                 BIGINT NOT NULL,
    change_list_item_id     BIGINT NOT NULL,
    tech_novelty            DECIMAL(5,2) COMMENT '技术新颖性分数',
    impact_scope            DECIMAL(5,2) COMMENT '影响范围分数',
    severity                DECIMAL(5,2) COMMENT '失效严重度分数',
    change_complexity       DECIMAL(5,2) COMMENT '变更复杂度分数',
    history_issue           DECIMAL(5,2) COMMENT '历史问题分数',
    risk_score              DECIMAL(5,2) COMMENT '风险综合评分',
    risk_level              VARCHAR(10) COMMENT 'H/M/L',
    drbfm_suggestion        VARCHAR(50) COMMENT 'DRBFM触发建议',
    drbfm_suggestion_reason TEXT COMMENT '建议理由',
    drbfm_conclusion        VARCHAR(50) COMMENT '最终DRBFM触发结论',
    created_time            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_task_id (task_id)
) COMMENT '评估项(五维评估)';

-- 五维评估选项表
CREATE TABLE fmea_evaluation_dimension_option (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    evaluation_item_id BIGINT NOT NULL,
    dimension       VARCHAR(30) NOT NULL COMMENT '维度: tech_novelty/impact_scope/severity/change_complexity/history_issue',
    risk_level      VARCHAR(10) NOT NULL COMMENT 'high/mid/low',
    option_text     VARCHAR(200) NOT NULL COMMENT '选项描述',
    is_selected     TINYINT(1) DEFAULT NULL COMMENT '是否选中: 1是/0否/null未选',
    sort_order      INT DEFAULT 0,
    INDEX idx_evaluation_item_id (evaluation_item_id)
) COMMENT '五维评估选项';

-- 历史问题表
CREATE TABLE fmea_history_issue (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    evaluation_task_id  BIGINT NOT NULL,
    fault_order_no      VARCHAR(100) COMMENT '故障单号',
    issue_no            VARCHAR(100) COMMENT '问题编号',
    issue_type          VARCHAR(100) COMMENT '问题类型',
    domain              VARCHAR(100) COMMENT '涉及领域',
    product_model       VARCHAR(200) COMMENT '产品型号',
    issue_desc          TEXT NOT NULL COMMENT '问题描述',
    detail_desc         TEXT COMMENT '详细说明',
    solution            TEXT COMMENT '解决方案',
    created_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_evaluation_task_id (evaluation_task_id)
) COMMENT '历史问题';

-- 历史问题库
CREATE TABLE fmea_history_issue_library (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    bg              VARCHAR(50),
    domain          VARCHAR(100),
    fault_order_no  VARCHAR(100),
    issue_no        VARCHAR(100),
    issue_type      VARCHAR(100),
    product_model   VARCHAR(200),
    issue_desc      TEXT NOT NULL,
    detail_desc     TEXT,
    solution        TEXT,
    source_project  VARCHAR(200),
    entry_time      DATETIME,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bg_domain (bg, domain)
) COMMENT '历史问题库';
```

#### 6.1.3 DRBFM分析域

```sql
-- 分析任务表
CREATE TABLE fmea_analysis_task (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id          BIGINT NOT NULL,
    evaluation_task_id  BIGINT NOT NULL,
    level               VARCHAR(20) NOT NULL COMMENT 'system/part',
    status              VARCHAR(30) NOT NULL COMMENT 'structure/function/failure/baseline/review/approval/completed',
    responsible         VARCHAR(64) COMMENT '负责人',
    created_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted          TINYINT(1) DEFAULT 0,
    INDEX idx_project_id (project_id),
    INDEX idx_evaluation_task_id (evaluation_task_id)
) COMMENT '分析任务';

-- 结构框图表
CREATE TABLE fmea_structure_diagram (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_task_id BIGINT NOT NULL,
    lark_doc_id     VARCHAR(100) COMMENT '飞书文档ID',
    lark_board_id   VARCHAR(100) COMMENT '飞书画板ID',
    version         INT DEFAULT 1,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analysis_task_id (analysis_task_id)
) COMMENT '结构框图';

-- 结构节点(无限层级树)
CREATE TABLE fmea_structure_node (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    diagram_id      BIGINT NOT NULL,
    parent_id       BIGINT DEFAULT 0,
    level_num       INT DEFAULT 0,
    name            VARCHAR(200) NOT NULL,
    risk_level      VARCHAR(10) COMMENT 'H/M/L',
    sort_order      INT DEFAULT 0,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_parent_id (parent_id)
) COMMENT '结构节点';

-- 结构边/连接
CREATE TABLE fmea_structure_edge (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    diagram_id      BIGINT NOT NULL,
    source_node_id  BIGINT NOT NULL,
    target_node_id  BIGINT NOT NULL,
    interface_type  VARCHAR(20) NOT NULL COMMENT 'physical/material/energy/signal',
    direction       VARCHAR(20) NOT NULL DEFAULT 'none' COMMENT 'unidirectional/bidirectional/none',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_diagram_id (diagram_id)
) COMMENT '结构边/连接';

-- 接口表格
CREATE TABLE fmea_interface_table (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    diagram_id      BIGINT NOT NULL,
    source_node     VARCHAR(200) NOT NULL,
    target_node     VARCHAR(200) NOT NULL,
    function_desc   VARCHAR(500),
    function_type   VARCHAR(20) COMMENT 'physical/material/energy/signal',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_diagram_id (diagram_id)
) COMMENT '接口表格';

-- 功能矩阵
CREATE TABLE fmea_function_matrix (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_task_id BIGINT NOT NULL,
    version         INT DEFAULT 1,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analysis_task_id (analysis_task_id)
) COMMENT '功能矩阵';

-- 功能项
CREATE TABLE fmea_function_item (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    matrix_id       BIGINT NOT NULL,
    description     VARCHAR(500) NOT NULL,
    owner_node_id   BIGINT COMMENT '所属结构节点',
    abundance_order INT DEFAULT 0 COMMENT '丰度排序(关联接口数)',
    source          VARCHAR(20) DEFAULT 'edge' COMMENT 'edge/ai_attachment',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_matrix_id (matrix_id)
) COMMENT '功能项';

-- 功能-节点映射
CREATE TABLE fmea_function_mapping (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    matrix_id       BIGINT NOT NULL,
    function_id     BIGINT NOT NULL,
    node_id         BIGINT NOT NULL,
    is_related      TINYINT(1) DEFAULT 0,
    risk_level      VARCHAR(10) COMMENT 'H/M/L',
    INDEX idx_matrix_id (matrix_id)
) COMMENT '功能-节点映射';

-- 失效分析
CREATE TABLE fmea_failure_analysis (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_task_id BIGINT NOT NULL,
    version         INT DEFAULT 1,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analysis_task_id (analysis_task_id)
) COMMENT '失效分析';

-- AI生成临时表
CREATE TABLE fmea_ai_generation_temp (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_task_id BIGINT NOT NULL,
    generation_type VARCHAR(30) NOT NULL COMMENT 'failure_mode/failure_cause/failure_effect/preventive/detection/sod',
    content         JSON NOT NULL COMMENT '生成内容(JSON)',
    is_adopted      TINYINT(1) DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analysis_task_type (analysis_task_id, generation_type)
) COMMENT 'AI生成临时表';

-- 失效模式
CREATE TABLE fmea_failure_mode (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_id     BIGINT NOT NULL,
    function_id     BIGINT,
    mode_type       VARCHAR(20) NOT NULL COMMENT 'abnormal/reverse/accompany/excess/reduce/partial/blank',
    description     TEXT NOT NULL,
    source          VARCHAR(20) DEFAULT 'ai' COMMENT 'ai/history/manual',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analysis_id (analysis_id)
) COMMENT '失效模式';

-- 失效原因
CREATE TABLE fmea_failure_cause (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    mode_id         BIGINT NOT NULL,
    cause_dimension VARCHAR(30) NOT NULL COMMENT 'design/manufacture/stress/wear/interaction/composite',
    description     TEXT NOT NULL,
    change_point_ref VARCHAR(200) COMMENT '关联变更点',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mode_id (mode_id)
) COMMENT '失效原因';

-- 失效影响
CREATE TABLE fmea_failure_effect (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    mode_id         BIGINT NOT NULL,
    effect_level    VARCHAR(20) NOT NULL COMMENT 'system/machine/customer',
    description     TEXT NOT NULL,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mode_id (mode_id)
) COMMENT '失效影响';

-- 预防措施
CREATE TABLE fmea_preventive_measure (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    cause_id        BIGINT NOT NULL,
    description     TEXT NOT NULL,
    measure_type    VARCHAR(20) DEFAULT 'design' COMMENT 'design/process/monitor',
    source          VARCHAR(20) DEFAULT 'ai',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cause_id (cause_id)
) COMMENT '预防措施';

-- 探测措施
CREATE TABLE fmea_detection_measure (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    cause_id        BIGINT NOT NULL,
    phase           VARCHAR(100) COMMENT '探测阶段',
    target          VARCHAR(200) COMMENT '探测对象',
    method          VARCHAR(500) COMMENT '探测方法',
    source          VARCHAR(20) DEFAULT 'ai',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cause_id (cause_id)
) COMMENT '探测措施';

-- 优化措施
CREATE TABLE fmea_optimization_measure (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    cause_id        BIGINT NOT NULL,
    description     TEXT NOT NULL,
    source          VARCHAR(20) DEFAULT 'ai',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cause_id (cause_id)
) COMMENT '优化措施';

-- SOD评分
CREATE TABLE fmea_sod_rating (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    failure_mode_id BIGINT NOT NULL,
    severity        INT COMMENT '严重度',
    occurrence      INT COMMENT '发生度',
    detection       INT COMMENT '探测度',
    ap_level        VARCHAR(5) COMMENT 'H/M/L',
    mode_type       TINYINT DEFAULT 2 COMMENT '1=模式1(软件) 2=模式2(硬件)',
    rater           VARCHAR(64),
    ai_suggested_s  INT COMMENT 'AI建议严重度',
    ai_suggested_o  INT COMMENT 'AI建议发生度',
    ai_suggested_d  INT COMMENT 'AI建议探测度',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_failure_mode_id (failure_mode_id)
) COMMENT 'SOD评分';

-- SOD评价标准
CREATE TABLE fmea_sod_standard (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    scope           VARCHAR(20) NOT NULL COMMENT 'company/bg',
    bg_id           VARCHAR(50) COMMENT 'BG标识(scope=bg时)',
    mode_type       TINYINT NOT NULL DEFAULT 2 COMMENT '1=模式1 2=模式2',
    rating_type     VARCHAR(1) NOT NULL COMMENT 'S/O/D',
    level           INT NOT NULL,
    score           INT NOT NULL,
    description     VARCHAR(500),
    INDEX idx_scope_type (scope, bg_id, mode_type, rating_type)
) COMMENT 'SOD评价标准';

-- AP参考表
CREATE TABLE fmea_ap_reference (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    s_range         VARCHAR(10) NOT NULL,
    o_range         VARCHAR(10) NOT NULL,
    d_range         VARCHAR(10) NOT NULL,
    ap_level        VARCHAR(5) NOT NULL COMMENT 'H/M/L'
) COMMENT 'AP参考表(固定100行)';
```

#### 6.1.4 基线与落地跟踪域

```sql
-- 基线
CREATE TABLE fmea_baseline (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_task_id BIGINT NOT NULL,
    version         INT DEFAULT 1,
    output_mode     TINYINT DEFAULT 1 COMMENT '1=模式一 2=模式二',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analysis_task_id (analysis_task_id)
) COMMENT '基线';

-- 基线项
CREATE TABLE fmea_baseline_item (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    baseline_id     BIGINT NOT NULL,
    measure_id      BIGINT NOT NULL,
    measure_type    VARCHAR(20) NOT NULL COMMENT 'preventive/detection/optimization',
    is_landing      TINYINT(1) DEFAULT 1 COMMENT '是否落地',
    landing_owner   VARCHAR(64) COMMENT '落地负责人',
    landing_date    DATE COMMENT '落地时间',
    source          VARCHAR(20) DEFAULT 'ai' COMMENT 'ai/history',
    item_type       VARCHAR(20) DEFAULT 'new' COMMENT 'new/optimize',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_baseline_id (baseline_id)
) COMMENT '基线项';

-- 落地跟踪任务
CREATE TABLE fmea_landing_task (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    baseline_id     BIGINT NOT NULL,
    status          VARCHAR(20) NOT NULL COMMENT 'pending/completed',
    sla_date        DATE COMMENT 'SLA截止日期',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_baseline_id (baseline_id)
) COMMENT '落地跟踪任务';

-- 落地项
CREATE TABLE fmea_landing_item (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    landing_task_id BIGINT NOT NULL,
    baseline_item_id BIGINT NOT NULL,
    landing_status  VARCHAR(20) NOT NULL COMMENT 'completed/failed/unable/delayed',
    new_owner       VARCHAR(64) COMMENT '延期时新负责人',
    new_date        DATE COMMENT '延期时新日期',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_landing_task_id (landing_task_id)
) COMMENT '落地项';

-- 落地审核
CREATE TABLE fmea_landing_audit (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    landing_item_id BIGINT NOT NULL,
    auditor_id      VARCHAR(64) NOT NULL,
    conclusion      VARCHAR(20) NOT NULL COMMENT 'approved/rejected',
    opinion         TEXT,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_landing_item_id (landing_item_id)
) COMMENT '落地审核';
```

#### 6.1.5 评审与审批域

```sql
-- 评审
CREATE TABLE fmea_review (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_task_id    BIGINT NOT NULL,
    status              VARCHAR(20) NOT NULL COMMENT 'pending/in_progress/opinion_closure/completed',
    review_date         DATE NOT NULL COMMENT '评审日期',
    is_level1_project   TINYINT(1) COMMENT '是否1级项目(从PMS获取)',
    opinion_rate        DECIMAL(5,4) COMMENT '意见率',
    ai_minutes          LONGTEXT COMMENT 'AI生成评审纪要',
    created_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analysis_task_id (analysis_task_id)
) COMMENT '评审';

-- 评审人
CREATE TABLE fmea_reviewer (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id       BIGINT NOT NULL,
    role            VARCHAR(50) NOT NULL COMMENT '评审角色',
    user_id         VARCHAR(64) NOT NULL,
    conclusion      VARCHAR(20) COMMENT 'approved/rejected/pending',
    is_closed       TINYINT(1) DEFAULT 0 COMMENT '意见是否闭环',
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_review_id (review_id)
) COMMENT '评审人';

-- 评审意见闭环
CREATE TABLE fmea_review_opinion (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    reviewer_id     BIGINT NOT NULL,
    opinion_content TEXT NOT NULL COMMENT '意见内容',
    response        TEXT COMMENT '负责人答复',
    is_closed       TINYINT(1) DEFAULT 0,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reviewer_id (reviewer_id)
) COMMENT '评审意见闭环';

-- 会议纪要
CREATE TABLE fmea_meeting_minutes (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id       BIGINT NOT NULL,
    content         LONGTEXT NOT NULL,
    upload_time     DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_review_id (review_id)
) COMMENT '会议纪要';

-- 评审通知记录
CREATE TABLE fmea_review_notification (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id       BIGINT NOT NULL,
    reviewer_id     BIGINT NOT NULL,
    notify_type     VARCHAR(20) NOT NULL COMMENT 'one_week/one_day',
    notify_time     DATETIME NOT NULL COMMENT '计划通知时间',
    is_sent         TINYINT(1) DEFAULT 0,
    sent_time       DATETIME COMMENT '实际发送时间',
    INDEX idx_review_id (review_id),
    INDEX idx_notify_time (notify_time, is_sent)
) COMMENT '评审通知记录';

-- 审批
CREATE TABLE fmea_approval (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_task_id BIGINT NOT NULL,
    approval_level  TINYINT NOT NULL COMMENT '1/2/3',
    approver_id     VARCHAR(64) NOT NULL,
    conclusion      VARCHAR(20) COMMENT 'approved/rejected/pending',
    opinion         TEXT,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analysis_task_id (analysis_task_id)
) COMMENT '审批';
```

#### 6.1.6 基线库域

```sql
-- 基线库
CREATE TABLE fmea_baseline_library (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    bg              VARCHAR(50) NOT NULL,
    domain          VARCHAR(100),
    entry_time      DATETIME,
    source_project  VARCHAR(200),
    landing_owner   VARCHAR(64),
    version         INT DEFAULT 1,
    change_desc     VARCHAR(500),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1) DEFAULT 0,
    INDEX idx_bg_domain (bg, domain)
) COMMENT '基线库';

-- 基线库版本记录
CREATE TABLE fmea_baseline_library_version (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    library_id      BIGINT NOT NULL,
    version         INT NOT NULL,
    change_content  TEXT,
    changed_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by      VARCHAR(64),
    INDEX idx_library_id (library_id)
) COMMENT '基线库版本记录';

-- 失效库
CREATE TABLE fmea_failure_library (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    baseline_library_id BIGINT NOT NULL,
    mode                VARCHAR(200),
    cause               TEXT,
    effect              TEXT,
    severity            INT,
    created_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_baseline_library_id (baseline_library_id)
) COMMENT '失效库';

-- 措施库
CREATE TABLE fmea_measure_library (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    failure_library_id  BIGINT NOT NULL,
    description         TEXT NOT NULL,
    measure_type        VARCHAR(20) NOT NULL COMMENT 'preventive/detection/optimization',
    source              VARCHAR(50) COMMENT '来源项目',
    created_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_failure_library_id (failure_library_id)
) COMMENT '措施库';

-- 功能库
CREATE TABLE fmea_function_library (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    domain          VARCHAR(100) NOT NULL,
    description     VARCHAR(500) NOT NULL,
    owner_node_type VARCHAR(100),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_domain (domain)
) COMMENT '功能库';

-- 入库审批
CREATE TABLE fmea_approval_inbound (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    baseline_library_id BIGINT NOT NULL,
    approver_id         VARCHAR(64) NOT NULL,
    conclusion          VARCHAR(20) COMMENT 'approved/rejected/pending',
    opinion             TEXT,
    reject_reason       TEXT,
    created_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_baseline_library_id (baseline_library_id)
) COMMENT '入库审批';
```

#### 6.1.7 系统支撑域

```sql
-- 系统配置
CREATE TABLE fmea_configuration (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_type     VARCHAR(50) NOT NULL COMMENT '配置类型',
    scope           VARCHAR(20) NOT NULL COMMENT 'company/bg/domain',
    scope_id        VARCHAR(50) COMMENT 'BG/域标识',
    config_key      VARCHAR(100) NOT NULL,
    config_value    TEXT,
    description     VARCHAR(500),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_type_scope_key (config_type, scope, scope_id, config_key)
) COMMENT '系统配置';

-- 版本历史
CREATE TABLE fmea_version_history (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       BIGINT NOT NULL,
    version         INT NOT NULL,
    tr_stage        VARCHAR(20),
    change_desc     VARCHAR(500),
    change_snapshot JSON COMMENT '变更快照',
    created_by      VARCHAR(64),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id)
) COMMENT '版本历史';

-- 审计日志
CREATE TABLE fmea_audit_log (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         VARCHAR(64) NOT NULL,
    action          VARCHAR(50) NOT NULL COMMENT 'CREATE/UPDATE/DELETE/APPROVE/REJECT',
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     BIGINT,
    detail          JSON,
    ip_address      VARCHAR(50),
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_time (user_id, created_time),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_time (created_time)
) COMMENT '审计日志';

-- AI采纳率统计
CREATE TABLE fmea_ai_adoption_stat (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_task_id BIGINT NOT NULL,
    generation_type VARCHAR(30) NOT NULL,
    total_count     INT DEFAULT 0,
    adopted_count   INT DEFAULT 0,
    adoption_rate   DECIMAL(5,4),
    stat_date       DATE,
    created_time    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task_type (analysis_task_id, generation_type)
) COMMENT 'AI采纳率统计';
```

### 6.2 数据库设计说明

#### 6.2.1 无限层级树结构

变更点清单项（`fmea_change_list_item`）和结构节点（`fmea_structure_node`）均采用 `parent_id` 方案实现无限层级树结构：

- `parent_id = 0` 表示顶级节点
- `level_num` 记录层级深度，便于查询和排序
- `item_id`（变更点清单项）作为业务ID，是跨协作人合并的依据

#### 6.2.2 枚举字段规范

所有枚举字段使用 VARCHAR 存储枚举字符串，Java侧通过枚举类约束：

| 表 | 字段 | Java枚举 |
|----|------|----------|
| fmea_structure_edge | interface_type | InterfaceType{PHYSICAL, MATERIAL, ENERGY, SIGNAL} |
| fmea_structure_edge | direction | Direction{UNIDIRECTIONAL, BIDIRECTIONAL, NONE} |
| fmea_failure_mode | mode_type | FailureModeType{ABNORMAL, REVERSE, ACCOMPANY, EXCESS, REDUCE, PARTIAL, BLANK} |
| fmea_failure_cause | cause_dimension | CauseDimension{DESIGN, MANUFACTURE, STRESS, WEAR, INTERACTION, COMPOSITE} |
| fmea_failure_effect | effect_level | EffectLevel{SYSTEM, MACHINE, CUSTOMER} |
| fmea_evaluation_item | risk_level | RiskLevel{H, M, L} |

#### 6.2.3 通用字段规范

所有业务表包含以下通用字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT | 主键 |
| created_time | DATETIME | 创建时间 |
| updated_time | DATETIME | 更新时间（部分表） |
| is_deleted | TINYINT(1) | 逻辑删除（部分表） |

---

## 7. 外部系统集成设计

### 7.1 飞书服务封装（LarkService）

飞书API通过 `fmea-integration-lark` 模块统一封装，业务模块仅调用服务接口，不关心API细节。

#### 7.1.1 模块结构

```
com.fmea.integration.lark/
├── LarkService.java              # 飞书服务总接口
├── impl/
│   └── LarkServiceImpl.java      # 实现
├── client/
│   ├── LarkApiClient.java        # 飞书API底层客户端(令牌管理、请求封装)
│   ├── LarkDocClient.java        # 飞书文档API
│   └── LarkBoardClient.java      # 飞书画板API
├── config/
│   └── LarkProperties.java       # 飞书配置(app_id, app_secret等)
├── dto/
│   ├── LarkDocCreateRequest.java
│   ├── LarkBoardCreateRequest.java
│   └── LarkMessageSendRequest.java
└── exception/
    └── LarkApiException.java     # 飞书API异常
```

#### 7.1.2 核心接口

```java
public interface LarkService {

    String createDoc(String title);

    String createBoardInDoc(String docId, String title);

    void updateBoardContent(String boardId, String mermaidContent);

    String getBoardContent(String boardId);

    void sendMessage(String receiveId, String receiveType, String msgType, String content);

    void sendCardMessage(String receiveId, String receiveType, String cardContent);

    byte[] exportBoardAsImage(String boardId);

    byte[] exportDocAsPdf(String docId);
}
```

#### 7.1.3 令牌管理

- 飞书API使用 `tenant_access_token` 认证
- Token缓存至Redis，有效期2小时，提前10分钟自动刷新
- 使用分布式锁避免并发刷新

### 7.2 PMS数据直查

PMS数据查询通过 `fmea-integration-pms` 模块封装，内部使用 `@DS("pms")` 注解切换至PMS只读数据源。

#### 7.2.1 模块结构

```
com.fmea.integration.pms/
├── PmsQueryService.java              # PMS查询服务接口
├── impl/
│   └── PmsQueryServiceImpl.java      # 实现(@DS("pms"))
├── mapper/
│   └── PmsMapper.java                # PMS数据库Mapper
├── dto/
│   ├── PmsProjectInfo.java
│   ├── PmsProjectMember.java
│   └── PmsTrNodeTrigger.java
├── cache/
│   └── PmsDataCache.java             # PMS数据Redis缓存
└── config/
    └── PmsProperties.java
```

#### 7.2.2 核心接口

```java
public interface PmsQueryService {

    PmsProjectInfo getProjectInfo(String pmsProjectId);

    boolean isLevel1Project(String pmsProjectId);

    List<PmsProjectMember> getProjectMembers(String pmsProjectId);

    PmsTrNodeTrigger getTrNodeTrigger(String pmsProjectId);

    List<PmsChangeSource> getChangeSourceData(String pmsProjectId);
}
```

### 7.3 CAS单点登录

#### 7.3.1 集成方式

基于 Spring Security + CAS Client 实现：

```xml
<!-- 依赖 -->
spring-boot-starter-security
cas-client-support-springboot
```

#### 7.3.2 认证流程

```
1. 用户访问FMEA系统 → Spring Security拦截未认证请求
2. 重定向至CAS登录页 → 用户输入账号密码
3. CAS认证成功 → 回调FMEA系统携带ticket
4. FMEA验证ticket → 获取用户信息 → 创建本地会话
5. 后续请求携带session → 无需重复登录
```

#### 7.3.3 用户信息同步

- CAS认证成功后，从CAS返回属性中提取用户ID、姓名、部门等信息
- 本地维护 `fmea_user` 表缓存用户基本信息，定期从CAS同步
- 权限信息从PMS同步，不依赖CAS

### 7.4 邮件服务

#### 7.4.1 模块结构

```
com.fmea.integration.email/
├── EmailService.java
├── impl/
│   └── EmailServiceImpl.java
├── config/
│   └── EmailProperties.java
└── template/
    └── EmailTemplateRenderer.java    # 邮件模板渲染
```

#### 7.4.2 邮件场景

| 场景 | 触发时机 | 收件人 |
|------|----------|--------|
| 评审通知 | 提前一周/一天 | 评审人 |
| 审批通知 | 发起审批时 | 审批人 |
| 审核不通过通知 | 审核不通过时 | 提交人 |
| 统计排行榜 | 每季度/TR节点 | 基线库管理员/PDTL/直属领导 |

---

## 8. AI模型集成设计

### 8.1 架构设计

AI模型通过 `fmea-integration-ai` 模块统一对接外部API，业务模块不直接调用AI接口。

```
┌──────────────────────────────────────────────┐
│              业务Service层                     │
│  (EvaluationService, AnalysisService, etc.)   │
└──────────────┬───────────────────────────────┘
               │ 调用
┌──────────────▼───────────────────────────────┐
│            AiService (统一入口)                │
│  ┌──────────────────────────────────────┐    │
│  │  策略路由: 根据generation_type分发    │    │
│  └──────────────────────────────────────┘    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐   │
│  │风险评估│ │功能  │ │失效  │ │SOD评分   │   │
│  │策略  │ │分析  │ │分析  │ │策略      │   │
│  └──────┘ └──────┘ └──────┘ └──────────┘   │
└──────────────┬───────────────────────────────┘
               │ HTTP/HTTPS
┌──────────────▼───────────────────────────────┐
│          外部AI API (统一接口)                 │
└──────────────────────────────────────────────┘
```

### 8.2 模块结构

```
com.fmea.integration.ai/
├── AiService.java                    # AI服务总接口
├── impl/
│   └── AiServiceImpl.java
├── strategy/
│   ├── AiGenerationStrategy.java         # 策略接口
│   ├── RiskEvaluationStrategy.java       # 五维风险评估
│   ├── FunctionAnalysisStrategy.java     # 功能分析
│   ├── FailureModeStrategy.java          # 失效模式
│   ├── FailureCauseStrategy.java         # 失效原因
│   ├── FailureEffectStrategy.java        # 失效影响
│   ├── PreventiveMeasureStrategy.java    # 预防措施
│   ├── DetectionMeasureStrategy.java     # 探测措施
│   └── SodRatingStrategy.java            # SOD评分建议
├── client/
│   └── AiApiClient.java              # AI API底层客户端
├── config/
│   └── AiProperties.java             # AI配置(api_url, api_key, timeout等)
├── dto/
│   ├── AiRequest.java
│   ├── AiResponse.java
│   └── AiGenerationResult.java
└── exception/
    └── AiServiceException.java
```

### 8.3 调用方式

| 场景 | 调用方式 | 超时 | 说明 |
|------|----------|------|------|
| 五维风险评估建议 | 同步 | 30s | 数据量小，实时返回 |
| 功能分析(AI补充) | 异步 | 60s | 需读取附件，可能较慢 |
| 失效模式/原因/影响生成 | 异步 | 60s | 批量生成，可能较慢 |
| 预防/探测措施生成 | 异步 | 60s | 批量生成 |
| SOD评分建议 | 同步 | 30s | 单条评分 |

### 8.4 异步任务设计

对于异步AI调用，采用以下流程：

```
1. 用户点击"AI生成"按钮
2. 后端创建异步任务，返回task_id
3. 前端轮询任务状态(或SSE推送)
4. AI调用完成后，结果写入fmea_ai_generation_temp表
5. 前端获取结果，用户选择采纳
```

异步任务状态管理：

```java
public enum AiTaskStatus {
    PENDING, PROCESSING, COMPLETED, FAILED
}
```

任务状态存储在Redis中，key格式：`ai:task:{taskId}`，TTL 1小时。

### 8.5 AI生成临时表管理

- 每次AI生成时，先删除该分析任务对应类型的旧临时数据
- 删除与插入在同一事务中
- 用户采纳后，数据从临时表复制到正式业务表

---

## 9. 核心业务模块设计

### 9.1 流程状态机

DRBFM核心流程采用状态机管理，定义在各Service中：

#### 9.1.1 评估任务状态机

```
draft → submitted → approved → scored → confirmed
  ↑         │
  └── withdrawn ← rejected
```

| 状态 | 说明 | 可转换状态 |
|------|------|-----------|
| draft | 草稿 | submitted |
| submitted | 已提交审核 | approved, rejected |
| rejected | 审核不通过 | submitted(重新提交) |
| approved | 审核通过(导入历史问题) | scored |
| scored | 已评分 | confirmed |
| confirmed | 已确认(生成分析任务) | — |

#### 9.1.2 分析任务状态机

```
structure → function → failure → baseline → review → approval → completed
```

| 状态 | 说明 | 对应子任务 |
|------|------|-----------|
| structure | 结构分析 | 结构框图绘制 |
| function | 功能分析 | 功能矩阵 |
| failure | 失效分析 | 失效模式/原因/影响/措施/SOD |
| baseline | 基线输出 | 基线清单 |
| review | 评审 | 评审流程 |
| approval | 审批 | 审批流程 |
| completed | 完成 | — |

### 9.2 评审通知定时任务

```java
@Component
public class ReviewNotificationTask {

    @Scheduled(cron = "0 0 8 * * ?")
    public void checkAndNotify() {
        // 1. 查询7天后到期的评审 → 发送一周提醒
        // 2. 查询1天后到期的评审 → 发送一天提醒
        // 3. 查询今天到期的评审 → 标记未评审人为"自动不通过"
    }
}
```

### 9.3 变更点清单合并算法

部件级评估中，协作人导入的变更点清单需合并：

```
1. TSE上传完整变更点清单 → 写入fmea_change_list_item
2. 协作人上传部分变更点清单 → 按item_id匹配
3. 匹配规则：
   - item_id已存在 → 更新change_point等字段
   - item_id不存在 → 新增记录
4. 合并后保留系统级(LEVEL=0)评估内容不变
```

### 9.4 五维风险评估评分算法

```java
public class RiskScoreCalculator {

    private static final Map<String, BigDecimal> WEIGHTS = Map.of(
        "tech_novelty", new BigDecimal("0.15"),
        "impact_scope", new BigDecimal("0.30"),
        "severity", new BigDecimal("0.30"),
        "change_complexity", new BigDecimal("0.20"),
        "history_issue", new BigDecimal("0.05")
    );

    public BigDecimal calculate(Map<String, BigDecimal> dimensionScores) {
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> entry : dimensionScores.entrySet()) {
            BigDecimal weight = WEIGHTS.get(entry.getKey());
            total = total.add(entry.getValue().multiply(weight));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    public String determineRiskLevel(BigDecimal score) {
        if (score.compareTo(new BigDecimal("8")) >= 0) return "H";
        if (score.compareTo(new BigDecimal("5")) >= 0) return "M";
        return "L";
    }
}
```

维度分数计算规则：每个维度的选项按高/中/低分组，高有3个选项、中有2个选项、低有2个选项。如果"高"组中有任一选项选中，取高分；否则看"中"组；否则看"低"组；均未选则为0。

### 9.5 Excel导入导出设计

#### 9.5.1 导入

- 使用 Apache POI 读取 Excel 文件
- 变更点清单：按标准模板解析，支持无限层级（通过Level列或缩进判断层级关系）
- 质量策划：读取Excel各Sheet，转Markdown后由AI处理
- 历史问题：按固定列格式解析

#### 9.5.2 导出

- FMEA表单导出为Excel，使用POI模板填充方式
- 结构框图导出为图片/PDF，通过飞书API获取
- 统计数据导出为Excel

---

## 10. 安全设计

### 10.1 认证与授权

| 层面 | 方案 |
|------|------|
| 认证 | CAS单点登录，Spring Security集成 |
| 授权 | 项目级RBAC，权限数据从PMS同步 |
| 会话 | Redis集中存储Session |
| 跨域 | Nginx统一域名，无需CORS |

### 10.2 数据安全

| 层面 | 方案 |
|------|------|
| 传输安全 | HTTPS |
| SQL注入 | MyBatis Plus参数化查询 |
| XSS | 前端输入过滤 + 后端输出转义 |
| CSRF | Spring Security CSRF Token |
| 敏感数据 | 暂无加密存储要求 |
| PMS只读 | PMS数据源仅配置SELECT权限账号 |

### 10.3 审计日志

通过AOP切面自动记录关键操作：

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    String action();
    String resourceType();
}
```

记录内容：用户ID、操作类型、资源类型、资源ID、操作详情(JSON)、IP地址、时间戳。

---

## 11. 部署架构

### 11.1 部署拓扑

```
┌─────────────────────────────────────────────────┐
│                   Nginx                          │
│              (反向代理 + 静态资源)                 │
│                 Port: 80/443                     │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              FMEA Application                    │
│           (Spring Boot JAR)                      │
│              Port: 8080                          │
└────────┬──────────────┬──────────────┬──────────┘
         │              │              │
┌────────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐
│  FMEA MySQL   │ │  PMS MySQL │ │    Redis      │
│  (读写)        │ │  (只读)     │ │  (缓存/会话)  │
│  Port: 3306   │ │  Port: 3306│ │  Port: 6379   │
└───────────────┘ └────────────┘ └───────────────┘
```

### 11.2 部署清单

| 组件 | 规格 | 数量 | 说明 |
|------|------|------|------|
| Nginx | 2C4G | 1 | 反向代理 |
| FMEA App | 4C8G | 1 | Spring Boot应用 |
| FMEA MySQL | 4C8G, 100GB SSD | 1 | 主库(已有备份策略) |
| PMS MySQL | — | 0 | 复用PMS现有数据库(只读账号) |
| Redis | 2C4G | 1 | 缓存/会话/分布式锁 |

### 11.3 应用配置

```yaml
server:
  port: 8080
  servlet:
    session:
      timeout: 30m

spring:
  redis:
    host: redis
    port: 6379

fmea:
  lark:
    app-id: ${LARK_APP_ID}
    app-secret: ${LARK_APP_SECRET}
    api-base-url: https://open.feishu.cn/open-apis
  ai:
    api-url: ${AI_API_URL}
    api-key: ${AI_API_KEY}
    timeout: 60
  pms:
    cache-ttl: 1800
  email:
    from: fmea-noreply@company.com
```

---

## 文档变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| V1.0 | 2026-05-28 | 初始版本，基于需求分析文档V2.0编写概要设计 | — |
