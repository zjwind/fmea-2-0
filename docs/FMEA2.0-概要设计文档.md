# FMEA 2.0 概要设计文档

> **版本**: V1.2  
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
7. [前端设计](#7-前端设计)
8. [外部系统集成设计](#8-外部系统集成设计)
9. [AI模型集成设计](#9-ai模型集成设计)
10. [核心业务模块设计](#10-核心业务模块设计)
11. [安全设计](#11-安全设计)
12. [部署架构](#12-部署架构)

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
| 数据库 | SQL Server |
| 数据源策略 | 多数据源（FMEA主库 + PMS直查库） |
| 前端框架 | EasyUI + FreeMarker(FTL)模板 |
| 飞书画板 | iframe嵌入 |
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
│  │                  View Layer (FTL + EasyUI)                   │    │
│  │  FreeMarker模板渲染 + EasyUI组件(jQuery DataGrid/Dialog等)   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Controller Layer                          │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐  │    │
│  │  │评估  │ │分析  │ │基线  │ │评审  │ │入库  │ │看板统计│  │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Provider Layer (业务编排)                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │    │
│  │  │评估Prov. │ │分析Prov. │ │基线Prov. │ │评审入库Prov. │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │    │
│  │  复杂业务逻辑 / 跨模块Service组合 / 事务编排 / 状态机       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Service Layer (单模块逻辑)                 │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │    │
│  │  │业务Service│ │流程引擎  │ │AI调度    │ │通知调度      │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │    │
│  │  仅调用本模块Mapper，严禁跨模块调用Mapper                     │    │
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
│  FMEA SQL Server   │       │   PMS SQL Server     │
│    (读写)           │       │    (只读)             │
└────────────────────┘       └─────────────────────┘
```

### 2.2 架构说明

系统采用 **Spring Boot 单体应用** 架构，基于以下考量：

1. **并发规模小**：约100人并发，单体应用足以支撑
2. **业务内聚性高**：DRBFM全流程紧密关联，不适合微服务拆分
3. **运维简单**：单体部署、监控、排障成本最低
4. **多数据源**：通过 dynamic-datasource 实现FMEA主库与PMS只读库的切换

架构分为六层：

| 层次 | 职责 | 关键技术 |
|------|------|----------|
| View Layer | 页面渲染、UI组件 | FreeMarker(FTL) + EasyUI(jQuery) |
| Controller Layer | 接收请求、参数校验、响应封装 | Spring MVC, Validation |
| Provider Layer | 业务编排、跨模块Service组合、复杂业务逻辑、事务管理、状态机 | Spring Transaction, 状态机 |
| Service Layer | 单模块业务逻辑、数据校验、本模块CRUD | MyBatis Plus, Spring Bean |
| Integration Layer | 外部系统对接封装 | RestTemplate, JavaMail |
| Persistence Layer | 数据持久化、多数据源路由 | MyBatis Plus, Dynamic Datasource |

**层间调用约束**：

| 调用方 | 被调用方 | 规则 |
|--------|----------|------|
| Controller | Provider | Controller仅调用Provider，不直接调用Service |
| Provider | Service | Provider组合调用多个模块的Service，编排复杂业务 |
| Provider | Integration | Provider可调用集成模块服务(LarkService/AiService等) |
| Service | Mapper | Service仅调用本模块Mapper，**严禁跨模块调用Mapper** |
| Service | Service | 同模块内Service可互调，**禁止跨模块Service互调**（跨模块逻辑由Provider编排） |

---

## 3. 技术选型

### 3.1 核心技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 基础框架 | Spring Boot | 2.7.x | 主框架 |
| ORM | MyBatis Plus | 3.5.x | 持久层框架，单表CRUD简化 |
| 多数据源 | dynamic-datasource-spring-boot-starter | 3.6.x | MyBatis Plus官方多数据源组件 |
| 数据库 | SQL Server | 2019+ | FMEA主库 + PMS只读库 |
| 数据库驱动 | mssql-jdbc | 11.x | SQL Server JDBC驱动 |
| 连接池 | HikariCP | — | Spring Boot默认 |
| 缓存 | Redis | 7.x | 会话缓存、配置缓存、分布式锁 |
| 模板引擎 | FreeMarker | 2.3.x | FTL模板渲染页面 |
| 前端UI | EasyUI | 1.10.x | jQuery UI组件库(DataGrid/Dialog/Tabs等) |
| 前端基础 | jQuery | 3.x | EasyUI依赖 |
| 认证 | Spring Security + CAS | — | SSO单点登录 |
| 任务调度 | Spring Task / Quartz | — | 评审通知定时任务、统计推送 |
| 文件处理 | Apache POI | 5.x | Excel导入导出 |
| 文档处理 | Apache Tika | 2.x | Word/PDF文档内容提取 |
| HTTP客户端 | RestTemplate | — | 飞书API、AI API调用 |
| 邮件 | Spring Boot Mail | — | SMTP邮件发送 |
| 日志 | Logback + SLF4J | — | 审计日志、业务日志 |
| 工具库 | Hutool | 5.x | 通用工具 |
| 对象映射 | MapStruct | 1.5.x | DTO/Entity转换 |

### 3.2 前端技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 模板引擎 | FreeMarker (FTL) | 服务端渲染页面，Controller返回FTL视图 |
| UI框架 | EasyUI | jQuery企业级组件库 |
| 数据表格 | datagrid | 列表展示、分页、排序 |
| 表单 | form / validatebox | 表单提交与校验 |
| 弹窗 | dialog / messager | 弹窗交互 |
| 标签页 | tabs | 多步骤页面切换 |
| 下拉框 | combobox / combotree | 下拉选择/树形选择 |
| 日期 | datebox | 日期选择 |
| 文件上传 | filebox | 文件上传 |
| 图表 | ECharts (独立引入) | 看板统计图表 |
| 画板嵌入 | iframe | 飞书画板通过iframe嵌入 |
| AJAX交互 | jQuery.ajax | 前后端数据交互(JSON) |

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
    └── src/main/
        ├── java/
        │   └── com.fmea.FmeaApplication.java
        └── resources/
            ├── templates/            # FTL模板根目录
            │   ├── layout.ftl        # 布局模板
            │   ├── evaluation/       # 评估模块页面
            │   ├── analysis/         # 分析模块页面
            │   ├── baseline/         # 基线模块页面
            │   ├── review/           # 评审模块页面
            │   ├── inbound/          # 入库模块页面
            │   ├── library/          # 基线库页面
            │   ├── dashboard/        # 看板页面
            │   └── config/           # 配置页面
            ├── static/               # 静态资源
            │   ├── easyui/           # EasyUI库
            │   ├── js/               # 业务JS
            │   ├── css/              # 业务样式
            │   └── images/           # 图片
            └── mapper/               # MyBatis XML
                ├── fmea/             # FMEA数据源Mapper
                └── pms/              # PMS数据源Mapper
```

### 4.2 包结构规范

每个业务模块遵循统一的包结构：

```
com.fmea.{module}/
├── controller/           # Spring MVC控制器(返回FTL视图名或JSON)
├── provider/             # 业务编排层(复杂业务逻辑、跨模块Service组合)
│   └── impl/
├── service/              # 单模块业务逻辑(仅调用本模块Mapper)
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

**Provider与Service职责划分**：

| 维度 | Provider | Service |
|------|----------|---------|
| 定位 | 业务编排层，面向业务场景 | 数据服务层，面向数据实体 |
| 调用范围 | 可跨模块调用多个Service | 仅调用本模块Mapper |
| 事务管理 | 持有`@Transactional`，管理跨表/跨模块事务 | 无`@Transactional`（由Provider控制事务边界） |
| 复杂度 | 复杂业务逻辑、状态机、流程编排 | 单表/关联表CRUD、数据校验、格式转换 |
| 依赖方向 | 依赖Service接口 | 依赖本模块Mapper接口 |
| 命名规范 | `XxxProvider` / `XxxProviderImpl` | `XxxService` / `XxxServiceImpl` |

### 4.3 FTL模板目录规范

```
templates/
├── layout.ftl                    # 公共布局(头部/侧边栏/底部)
├── common/
│   ├── header.ftl                # 头部导航
│   ├── sidebar.ftl               # 侧边菜单
│   └── pagination.ftl            # 分页组件
├── evaluation/
│   ├── list.ftl                  # 评估任务列表
│   ├── form.ftl                  # 变更点清单编辑
│   ├── dimension.ftl             # 五维评估表
│   └── history-issue.ftl         # 历史问题导入
├── analysis/
│   ├── structure.ftl             # 结构框图(含iframe嵌入飞书画板)
│   ├── function-matrix.ftl       # 功能矩阵
│   ├── failure.ftl               # 失效分析(合并页面)
│   └── sod-rating.ftl            # SOD评分
├── baseline/
│   ├── output.ftl                # 基线输出
│   └── landing.ftl               # 落地跟踪
├── review/
│   ├── detail.ftl                # 评审详情
│   └── opinion.ftl               # 意见闭环
├── inbound/
│   └── approval.ftl              # 入库审批
├── library/
│   ├── baseline-list.ftl         # 基线库列表
│   ├── failure-list.ftl          # 失效库列表
│   └── measure-list.ftl          # 措施库列表
├── dashboard/
│   └── index.ftl                 # 看板首页
└── config/
    ├── role.ftl                  # 角色配置
    └── sod-standard.ftl          # SOD标准配置
```

### 4.4 模块依赖关系

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
- Controller仅调用Provider，不直接调用Service
- Provider可跨模块调用Service接口，组合编排复杂业务
- Service仅调用本模块Mapper，**严禁跨模块调用Mapper**
- Service间禁止跨模块互调（跨模块逻辑由Provider编排）
- 集成模块不依赖业务模块，仅被Provider/Service调用
- 通用模块不依赖任何业务模块

**调用链路示意**：

```
Controller → Provider → Service(本模块) → Mapper(本模块)
                    → Service(跨模块) → Mapper(跨模块自身)
                    → IntegrationService(LarkService/AiService等)

禁止链路：
  Service → Mapper(跨模块)          ✗ 严禁
  Service → Service(跨模块)         ✗ 严禁
  Controller → Service(直接调用)     ✗ 严禁
```

### 4.5 Provider层设计规范

#### 4.5.1 Provider层定位

Provider层是业务编排层，位于Controller与Service之间，承担以下核心职责：

1. **复杂业务编排**：跨模块Service组合调用，实现完整业务场景
2. **事务边界管理**：持有`@Transactional`注解，控制跨表/跨模块事务
3. **状态机驱动**：业务流程状态转换逻辑由Provider管理
4. **外部集成协调**：调用LarkService/AiService等集成服务，协调业务与外部系统交互

#### 4.5.2 Provider接口定义

```java
public interface EvaluationProvider {

    PageResult<EvaluationItemVO> queryEvaluationPage(int page, int rows, String projectId);

    Long submitEvaluation(EvaluationSubmitRequest request);

    void confirmEvaluation(Long evaluationId);

    void importChangeList(Long evaluationId, MultipartFile file);

    void importHistoryIssues(Long evaluationId, MultipartFile file);
}
```

#### 4.5.3 Provider实现示例

```java
@Service
public class EvaluationProviderImpl implements EvaluationProvider {

    @Autowired
    private EvaluationService evaluationService;

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private LarkService larkService;

    @Autowired
    private AiService aiService;

    @Override
    public PageResult<EvaluationItemVO> queryEvaluationPage(int page, int rows, String projectId) {
        return evaluationService.queryPage(page, rows, projectId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long submitEvaluation(EvaluationSubmitRequest request) {
        evaluationService.updateStatus(request.getEvaluationId(), EvaluationStatus.SUBMITTED);
        projectService.syncPermissions(request.getProjectId());
        larkService.sendMessage(request.getNotifyUserId(), "user", "text",
                "您有一条新的评估任务待审核");
        return request.getEvaluationId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void confirmEvaluation(Long evaluationId) {
        EvaluationItem item = evaluationService.getById(evaluationId);
        evaluationService.updateStatus(evaluationId, EvaluationStatus.CONFIRMED);
        Long analysisTaskId = analysisService.createTask(item);
        evaluationService.bindAnalysisTask(evaluationId, analysisTaskId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void importChangeList(Long evaluationId, MultipartFile file) {
        evaluationService.deleteChangeListItems(evaluationId);
        List<ChangeListItem> items = evaluationService.parseChangeListExcel(file);
        evaluationService.batchSaveChangeListItems(evaluationId, items);
        evaluationService.updateStatus(evaluationId, EvaluationStatus.APPROVED);
    }
}
```

#### 4.5.4 Service层实现示例（仅调用本模块Mapper）

```java
@Service
public class EvaluationServiceImpl implements EvaluationService {

    @Autowired
    private EvaluationMapper evaluationMapper;

    @Autowired
    private ChangeListItemMapper changeListItemMapper;

    @Override
    public PageResult<EvaluationItemVO> queryPage(int page, int rows, String projectId) {
        Page<EvaluationItem> pageParam = new Page<>(page, rows);
        LambdaQueryWrapper<EvaluationItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StringUtils.isNotBlank(projectId), EvaluationItem::getProjectId, projectId);
        Page<EvaluationItem> result = evaluationMapper.selectPage(pageParam, wrapper);
        return PageResult.of(result, converter::toVO);
    }

    @Override
    public void updateStatus(Long evaluationId, EvaluationStatus status) {
        EvaluationItem item = new EvaluationItem();
        item.setId(evaluationId);
        item.setStatus(status.name());
        item.setUpdatedTime(LocalDateTime.now());
        evaluationMapper.updateById(item);
    }

    @Override
    public void batchSaveChangeListItems(Long evaluationId, List<ChangeListItem> items) {
        items.forEach(item -> {
            item.setEvaluationId(evaluationId);
            changeListItemMapper.insert(item);
        });
    }
}
```

#### 4.5.5 各模块Provider清单

| 模块 | Provider | 核心编排场景 |
|------|----------|-------------|
| fmea-evaluation | EvaluationProvider | 评估提交→权限同步→通知；评估确认→创建分析任务；变更点导入→合并→评分 |
| fmea-analysis | AnalysisProvider | 结构分析→创建飞书画板；功能分析→AI生成→采纳；失效分析→AI生成→SOD评分 |
| fmea-baseline | BaselineProvider | 基线输出→措施清单生成；落地跟踪→SLA通知→审计 |
| fmea-review | ReviewProvider | 发起评审→指派评审人→通知；意见闭环→状态更新；评审完成→触发审批 |
| fmea-inbound | InboundProvider | 入库申请→审批流→入库/驳回；入库后修改→重审 |
| fmea-library | LibraryProvider | 入库→基线库写入→版本管理；基线库修改→重审→版本更新 |
| fmea-dashboard | DashboardProvider | 统计聚合→AI采纳率计算→排行榜推送 |

#### 4.5.6 Provider层编码约束

| 约束项 | 规则 | 说明 |
|--------|------|------|
| 事务管理 | `@Transactional`仅写在Provider方法上 | Service方法不加事务注解，由Provider控制事务边界 |
| 异常处理 | Provider捕获并转换异常为业务异常 | Service抛出原始异常，Provider统一包装 |
| 日志记录 | Provider记录业务操作日志 | Service仅记录数据操作debug日志 |
| 参数校验 | Provider做业务规则校验 | Service做数据格式校验 |
| 缓存操作 | Provider管理缓存策略 | Service不直接操作Redis缓存 |
| 跨模块调用 | 仅通过Service接口调用 | 禁止Provider直接调用其他模块Mapper |

---

## 5. 多数据源设计

### 5.1 数据源规划

| 数据源名称 | 用途 | 权限 | 连接池 |
|------------|------|------|--------|
| fmea | FMEA业务主库(SQL Server) | 读写 | HikariCP (max=20) |
| pms | PMS系统数据库(SQL Server) | **只读** | HikariCP (max=5) |

### 5.2 数据源配置

```yaml
spring:
  datasource:
    dynamic:
      primary: fmea
      strict: true
      datasource:
        fmea:
          url: jdbc:sqlserver://fmea-db:1433;databaseName=fmea;encrypt=false;trustServerCertificate=true
          username: ${FMEA_DB_USER}
          password: ${FMEA_DB_PASS}
          driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
        pms:
          url: jdbc:sqlserver://pms-db:1433;databaseName=pms;encrypt=false;trustServerCertificate=true
          username: ${PMS_DB_USER}
          password: ${PMS_DB_PASS}
          driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
```

### 5.3 数据源切换方式

采用 `@DS` 注解切换数据源：

```java
// FMEA主库（默认，无需注解）— Service层仅调用本模块Mapper
@Service
public class EvaluationServiceImpl implements EvaluationService {
    // 默认使用fmea数据源
    // 仅注入本模块Mapper，不跨模块调用
}

// PMS只读库 — 集成模块Service
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
| SQL管理 | PMS查询SQL写在独立Mapper XML中，与FMEA业务Mapper隔离；注意SQL Server语法差异 |
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

### 6.1 SQL Server 适配要点

| 适配项 | MySQL | SQL Server |
|--------|-------|------------|
| 主键自增 | AUTO_INCREMENT | IDENTITY(1,1) |
| 字符串类型 | VARCHAR | NVARCHAR(支持中文) |
| 大文本 | TEXT / LONGTEXT | NVARCHAR(MAX) |
| 布尔类型 | TINYINT(1) | BIT |
| 时间类型 | DATETIME | DATETIME2 |
| 默认时间 | DEFAULT CURRENT_TIMESTAMP | DEFAULT GETDATE() |
| 更新时间 | ON UPDATE CURRENT_TIMESTAMP | 需通过触发器或应用层实现 |
| 注释 | COMMENT 'xxx' | 需通过EXEC sp_addextendedproperty添加 |
| JSON | JSON类型 | NVARCHAR(MAX) + ISJSON约束(SQL Server 2016+) |
| 索引 | INDEX idx_name (col) | CREATE NONCLUSTERED INDEX |

### 6.2 FMEA主库表设计

#### 6.2.1 项目管理域

```sql
CREATE TABLE fmea_project (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(200) NOT NULL,
    bg              NVARCHAR(50) NOT NULL,
    pdtl            NVARCHAR(100),
    tr_stage        NVARCHAR(20),
    is_level1       BIT DEFAULT 0,
    pms_project_id  NVARCHAR(100),
    created_by      NVARCHAR(64),
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_by      NVARCHAR(64),
    updated_time    DATETIME2 DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0
);
CREATE NONCLUSTERED INDEX idx_fmea_project_pms_id ON fmea_project(pms_project_id);
CREATE NONCLUSTERED INDEX idx_fmea_project_bg ON fmea_project(bg);

CREATE TABLE fmea_domain (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    domain_name         NVARCHAR(100) NOT NULL,
    domain_desc         NVARCHAR(500),
    role                NVARCHAR(100),
    role_representative NVARCHAR(100),
    created_time        DATETIME2 DEFAULT GETDATE(),
    is_deleted          BIT DEFAULT 0
);

CREATE TABLE fmea_permission (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id         NVARCHAR(64) NOT NULL,
    project_id      BIGINT NOT NULL,
    resource_type   NVARCHAR(50) NOT NULL,
    permission_type NVARCHAR(30) NOT NULL,
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE UNIQUE NONCLUSTERED INDEX idx_fmea_perm_unique ON fmea_permission(user_id, project_id, resource_type, permission_type);
CREATE NONCLUSTERED INDEX idx_fmea_perm_project ON fmea_permission(project_id);
```

#### 6.2.2 DRBFM触发评估域

```sql
CREATE TABLE fmea_change_list (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    project_id      BIGINT NOT NULL,
    level           NVARCHAR(20) NOT NULL,
    created_by      NVARCHAR(64),
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0
);
CREATE NONCLUSTERED INDEX idx_fmea_cl_project ON fmea_change_list(project_id);

CREATE TABLE fmea_change_list_item (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    change_list_id  BIGINT NOT NULL,
    parent_id       BIGINT DEFAULT 0,
    level_num       INT NOT NULL DEFAULT 0,
    item_id         NVARCHAR(50) NOT NULL,
    structure_name  NVARCHAR(200) NOT NULL,
    dev_type        NVARCHAR(50),
    imn_option      NVARCHAR(10),
    change_point    NVARCHAR(MAX),
    quality_match   NVARCHAR(MAX),
    sort_order      INT DEFAULT 0,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0
);
CREATE NONCLUSTERED INDEX idx_fmea_cli_list ON fmea_change_list_item(change_list_id);
CREATE NONCLUSTERED INDEX idx_fmea_cli_parent ON fmea_change_list_item(parent_id);
CREATE NONCLUSTERED INDEX idx_fmea_cli_item ON fmea_change_list_item(item_id);

CREATE TABLE fmea_quality_plan (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    project_id      BIGINT NOT NULL,
    raw_content     NVARCHAR(MAX),
    file_name       NVARCHAR(200),
    created_time    DATETIME2 DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0
);
CREATE NONCLUSTERED INDEX idx_fmea_qp_project ON fmea_quality_plan(project_id);

CREATE TABLE fmea_evaluation_task (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    project_id      BIGINT NOT NULL,
    level           NVARCHAR(20) NOT NULL,
    status          NVARCHAR(30) NOT NULL,
    submit_count    INT DEFAULT 0,
    is_withdrawn    BIT DEFAULT 0,
    creator         NVARCHAR(64),
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0
);
CREATE NONCLUSTERED INDEX idx_fmea_et_project_level ON fmea_evaluation_task(project_id, level);

CREATE TABLE fmea_evaluation_item (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    task_id                 BIGINT NOT NULL,
    change_list_item_id     BIGINT NOT NULL,
    tech_novelty            DECIMAL(5,2),
    impact_scope            DECIMAL(5,2),
    severity                DECIMAL(5,2),
    change_complexity       DECIMAL(5,2),
    history_issue           DECIMAL(5,2),
    risk_score              DECIMAL(5,2),
    risk_level              NVARCHAR(10),
    drbfm_suggestion        NVARCHAR(50),
    drbfm_suggestion_reason NVARCHAR(MAX),
    drbfm_conclusion        NVARCHAR(50),
    created_time            DATETIME2 DEFAULT GETDATE(),
    updated_time            DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_ei_task ON fmea_evaluation_item(task_id);

CREATE TABLE fmea_evaluation_dimension_option (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    evaluation_item_id  BIGINT NOT NULL,
    dimension           NVARCHAR(30) NOT NULL,
    risk_level          NVARCHAR(10) NOT NULL,
    option_text         NVARCHAR(200) NOT NULL,
    is_selected         BIT NULL,
    sort_order          INT DEFAULT 0
);
CREATE NONCLUSTERED INDEX idx_fmea_edo_item ON fmea_evaluation_dimension_option(evaluation_item_id);

CREATE TABLE fmea_history_issue (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    evaluation_task_id  BIGINT NOT NULL,
    fault_order_no      NVARCHAR(100),
    issue_no            NVARCHAR(100),
    issue_type          NVARCHAR(100),
    domain              NVARCHAR(100),
    product_model       NVARCHAR(200),
    issue_desc          NVARCHAR(MAX) NOT NULL,
    detail_desc         NVARCHAR(MAX),
    solution            NVARCHAR(MAX),
    created_time        DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_hi_task ON fmea_history_issue(evaluation_task_id);

CREATE TABLE fmea_history_issue_library (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    bg              NVARCHAR(50),
    domain          NVARCHAR(100),
    fault_order_no  NVARCHAR(100),
    issue_no        NVARCHAR(100),
    issue_type      NVARCHAR(100),
    product_model   NVARCHAR(200),
    issue_desc      NVARCHAR(MAX) NOT NULL,
    detail_desc     NVARCHAR(MAX),
    solution        NVARCHAR(MAX),
    source_project  NVARCHAR(200),
    entry_time      DATETIME2,
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_hil_bg_domain ON fmea_history_issue_library(bg, domain);
```

#### 6.2.3 DRBFM分析域

```sql
CREATE TABLE fmea_analysis_task (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    project_id          BIGINT NOT NULL,
    evaluation_task_id  BIGINT NOT NULL,
    level               NVARCHAR(20) NOT NULL,
    status              NVARCHAR(30) NOT NULL,
    responsible         NVARCHAR(64),
    created_time        DATETIME2 DEFAULT GETDATE(),
    updated_time        DATETIME2 DEFAULT GETDATE(),
    is_deleted          BIT DEFAULT 0
);
CREATE NONCLUSTERED INDEX idx_fmea_at_project ON fmea_analysis_task(project_id);
CREATE NONCLUSTERED INDEX idx_fmea_at_eval ON fmea_analysis_task(evaluation_task_id);

CREATE TABLE fmea_structure_diagram (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_task_id BIGINT NOT NULL,
    lark_doc_id     NVARCHAR(100),
    lark_board_id   NVARCHAR(100),
    lark_board_url  NVARCHAR(500),
    version         INT DEFAULT 1,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_sd_task ON fmea_structure_diagram(analysis_task_id);

CREATE TABLE fmea_structure_node (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    diagram_id      BIGINT NOT NULL,
    parent_id       BIGINT DEFAULT 0,
    level_num       INT DEFAULT 0,
    name            NVARCHAR(200) NOT NULL,
    risk_level      NVARCHAR(10),
    sort_order      INT DEFAULT 0,
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_sn_diagram ON fmea_structure_node(diagram_id);
CREATE NONCLUSTERED INDEX idx_fmea_sn_parent ON fmea_structure_node(parent_id);

CREATE TABLE fmea_structure_edge (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    diagram_id      BIGINT NOT NULL,
    source_node_id  BIGINT NOT NULL,
    target_node_id  BIGINT NOT NULL,
    interface_type  NVARCHAR(20) NOT NULL,
    direction       NVARCHAR(20) NOT NULL DEFAULT 'none',
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_se_diagram ON fmea_structure_edge(diagram_id);

CREATE TABLE fmea_interface_table (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    diagram_id      BIGINT NOT NULL,
    source_node     NVARCHAR(200) NOT NULL,
    target_node     NVARCHAR(200) NOT NULL,
    function_desc   NVARCHAR(500),
    function_type   NVARCHAR(20),
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_it_diagram ON fmea_interface_table(diagram_id);

CREATE TABLE fmea_function_matrix (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_task_id BIGINT NOT NULL,
    version         INT DEFAULT 1,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_fm_task ON fmea_function_matrix(analysis_task_id);

CREATE TABLE fmea_function_item (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    matrix_id       BIGINT NOT NULL,
    description     NVARCHAR(500) NOT NULL,
    owner_node_id   BIGINT,
    abundance_order INT DEFAULT 0,
    source          NVARCHAR(20) DEFAULT 'edge',
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_fi_matrix ON fmea_function_item(matrix_id);

CREATE TABLE fmea_function_mapping (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    matrix_id       BIGINT NOT NULL,
    function_id     BIGINT NOT NULL,
    node_id         BIGINT NOT NULL,
    is_related      BIT DEFAULT 0,
    risk_level      NVARCHAR(10)
);
CREATE NONCLUSTERED INDEX idx_fmea_fmp_matrix ON fmea_function_mapping(matrix_id);

CREATE TABLE fmea_failure_analysis (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_task_id BIGINT NOT NULL,
    version         INT DEFAULT 1,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_fa_task ON fmea_failure_analysis(analysis_task_id);

CREATE TABLE fmea_ai_generation_temp (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_task_id BIGINT NOT NULL,
    generation_type NVARCHAR(30) NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    is_adopted      BIT DEFAULT 0,
    created_at      DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_aigt_task_type ON fmea_ai_generation_temp(analysis_task_id, generation_type);

CREATE TABLE fmea_failure_mode (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_id     BIGINT NOT NULL,
    function_id     BIGINT,
    mode_type       NVARCHAR(20) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    source          NVARCHAR(20) DEFAULT 'ai',
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_fm_analysis ON fmea_failure_mode(analysis_id);

CREATE TABLE fmea_failure_cause (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    mode_id         BIGINT NOT NULL,
    cause_dimension NVARCHAR(30) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    change_point_ref NVARCHAR(200),
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_fc_mode ON fmea_failure_cause(mode_id);

CREATE TABLE fmea_failure_effect (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    mode_id         BIGINT NOT NULL,
    effect_level    NVARCHAR(20) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_fe_mode ON fmea_failure_effect(mode_id);

CREATE TABLE fmea_preventive_measure (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    cause_id        BIGINT NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    measure_type    NVARCHAR(20) DEFAULT 'design',
    source          NVARCHAR(20) DEFAULT 'ai',
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_pm_cause ON fmea_preventive_measure(cause_id);

CREATE TABLE fmea_detection_measure (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    cause_id        BIGINT NOT NULL,
    phase           NVARCHAR(100),
    target          NVARCHAR(200),
    method          NVARCHAR(500),
    source          NVARCHAR(20) DEFAULT 'ai',
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_dm_cause ON fmea_detection_measure(cause_id);

CREATE TABLE fmea_optimization_measure (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    cause_id        BIGINT NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    source          NVARCHAR(20) DEFAULT 'ai',
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_om_cause ON fmea_optimization_measure(cause_id);

CREATE TABLE fmea_sod_rating (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    failure_mode_id BIGINT NOT NULL,
    severity        INT,
    occurrence      INT,
    detection       INT,
    ap_level        NVARCHAR(5),
    mode_type       TINYINT DEFAULT 2,
    rater           NVARCHAR(64),
    ai_suggested_s  INT,
    ai_suggested_o  INT,
    ai_suggested_d  INT,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE UNIQUE NONCLUSTERED INDEX idx_fmea_sod_mode ON fmea_sod_rating(failure_mode_id);

CREATE TABLE fmea_sod_standard (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    scope           NVARCHAR(20) NOT NULL,
    bg_id           NVARCHAR(50),
    mode_type       TINYINT NOT NULL DEFAULT 2,
    rating_type     NVARCHAR(1) NOT NULL,
    level           INT NOT NULL,
    score           INT NOT NULL,
    description     NVARCHAR(500)
);
CREATE NONCLUSTERED INDEX idx_fmea_ss_scope ON fmea_sod_standard(scope, bg_id, mode_type, rating_type);

CREATE TABLE fmea_ap_reference (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    s_range         NVARCHAR(10) NOT NULL,
    o_range         NVARCHAR(10) NOT NULL,
    d_range         NVARCHAR(10) NOT NULL,
    ap_level        NVARCHAR(5) NOT NULL
);
```

#### 6.2.4 基线与落地跟踪域

```sql
CREATE TABLE fmea_baseline (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_task_id BIGINT NOT NULL,
    version         INT DEFAULT 1,
    output_mode     TINYINT DEFAULT 1,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_bl_task ON fmea_baseline(analysis_task_id);

CREATE TABLE fmea_baseline_item (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    baseline_id     BIGINT NOT NULL,
    measure_id      BIGINT NOT NULL,
    measure_type    NVARCHAR(20) NOT NULL,
    is_landing      BIT DEFAULT 1,
    landing_owner   NVARCHAR(64),
    landing_date    DATE,
    source          NVARCHAR(20) DEFAULT 'ai',
    item_type       NVARCHAR(20) DEFAULT 'new',
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_bi_baseline ON fmea_baseline_item(baseline_id);

CREATE TABLE fmea_landing_task (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    baseline_id     BIGINT NOT NULL,
    status          NVARCHAR(20) NOT NULL,
    sla_date        DATE,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_lt_baseline ON fmea_landing_task(baseline_id);

CREATE TABLE fmea_landing_item (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    landing_task_id BIGINT NOT NULL,
    baseline_item_id BIGINT NOT NULL,
    landing_status  NVARCHAR(20) NOT NULL,
    new_owner       NVARCHAR(64),
    new_date        DATE,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_li_task ON fmea_landing_item(landing_task_id);

CREATE TABLE fmea_landing_audit (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    landing_item_id BIGINT NOT NULL,
    auditor_id      NVARCHAR(64) NOT NULL,
    conclusion      NVARCHAR(20) NOT NULL,
    opinion         NVARCHAR(MAX),
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_la_item ON fmea_landing_audit(landing_item_id);
```

#### 6.2.5 评审与审批域

```sql
CREATE TABLE fmea_review (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_task_id    BIGINT NOT NULL,
    status              NVARCHAR(20) NOT NULL,
    review_date         DATE NOT NULL,
    is_level1_project   BIT,
    opinion_rate        DECIMAL(5,4),
    ai_minutes          NVARCHAR(MAX),
    created_time        DATETIME2 DEFAULT GETDATE(),
    updated_time        DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_rv_task ON fmea_review(analysis_task_id);

CREATE TABLE fmea_reviewer (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    review_id       BIGINT NOT NULL,
    role            NVARCHAR(50) NOT NULL,
    user_id         NVARCHAR(64) NOT NULL,
    conclusion      NVARCHAR(20),
    is_closed       BIT DEFAULT 0,
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_rr_review ON fmea_reviewer(review_id);

CREATE TABLE fmea_review_opinion (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    reviewer_id     BIGINT NOT NULL,
    opinion_content NVARCHAR(MAX) NOT NULL,
    response        NVARCHAR(MAX),
    is_closed       BIT DEFAULT 0,
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_ro_reviewer ON fmea_review_opinion(reviewer_id);

CREATE TABLE fmea_meeting_minutes (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    review_id       BIGINT NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    upload_time     DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_mm_review ON fmea_meeting_minutes(review_id);

CREATE TABLE fmea_review_notification (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    review_id       BIGINT NOT NULL,
    reviewer_id     BIGINT NOT NULL,
    notify_type     NVARCHAR(20) NOT NULL,
    notify_time     DATETIME2 NOT NULL,
    is_sent         BIT DEFAULT 0,
    sent_time       DATETIME2
);
CREATE NONCLUSTERED INDEX idx_fmea_rn_review ON fmea_review_notification(review_id);
CREATE NONCLUSTERED INDEX idx_fmea_rn_time ON fmea_review_notification(notify_time, is_sent);

CREATE TABLE fmea_approval (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_task_id BIGINT NOT NULL,
    approval_level  TINYINT NOT NULL,
    approver_id     NVARCHAR(64) NOT NULL,
    conclusion      NVARCHAR(20),
    opinion         NVARCHAR(MAX),
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_ap_task ON fmea_approval(analysis_task_id);
```

#### 6.2.6 基线库域

```sql
CREATE TABLE fmea_baseline_library (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    bg              NVARCHAR(50) NOT NULL,
    domain          NVARCHAR(100),
    entry_time      DATETIME2,
    source_project  NVARCHAR(200),
    landing_owner   NVARCHAR(64),
    version         INT DEFAULT 1,
    change_desc     NVARCHAR(500),
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0
);
CREATE NONCLUSTERED INDEX idx_fmea_bll_bg_domain ON fmea_baseline_library(bg, domain);

CREATE TABLE fmea_baseline_library_version (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    library_id      BIGINT NOT NULL,
    version         INT NOT NULL,
    change_content  NVARCHAR(MAX),
    changed_at      DATETIME2 DEFAULT GETDATE(),
    changed_by      NVARCHAR(64)
);
CREATE NONCLUSTERED INDEX idx_fmea_bllv_library ON fmea_baseline_library_version(library_id);

CREATE TABLE fmea_failure_library (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    baseline_library_id BIGINT NOT NULL,
    mode                NVARCHAR(200),
    cause               NVARCHAR(MAX),
    effect              NVARCHAR(MAX),
    severity            INT,
    created_time        DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_fl_library ON fmea_failure_library(baseline_library_id);

CREATE TABLE fmea_measure_library (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    failure_library_id  BIGINT NOT NULL,
    description         NVARCHAR(MAX) NOT NULL,
    measure_type        NVARCHAR(20) NOT NULL,
    source              NVARCHAR(50),
    created_time        DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_ml_failure ON fmea_measure_library(failure_library_id);

CREATE TABLE fmea_function_library (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    domain          NVARCHAR(100) NOT NULL,
    description     NVARCHAR(500) NOT NULL,
    owner_node_type NVARCHAR(100),
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_fl_domain ON fmea_function_library(domain);

CREATE TABLE fmea_approval_inbound (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    baseline_library_id BIGINT NOT NULL,
    approver_id         NVARCHAR(64) NOT NULL,
    conclusion          NVARCHAR(20),
    opinion             NVARCHAR(MAX),
    reject_reason       NVARCHAR(MAX),
    created_time        DATETIME2 DEFAULT GETDATE(),
    updated_time        DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_ai_library ON fmea_approval_inbound(baseline_library_id);
```

#### 6.2.7 系统支撑域

```sql
CREATE TABLE fmea_configuration (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    config_type     NVARCHAR(50) NOT NULL,
    scope           NVARCHAR(20) NOT NULL,
    scope_id        NVARCHAR(50),
    config_key      NVARCHAR(100) NOT NULL,
    config_value    NVARCHAR(MAX),
    description     NVARCHAR(500),
    created_time    DATETIME2 DEFAULT GETDATE(),
    updated_time    DATETIME2 DEFAULT GETDATE()
);
CREATE UNIQUE NONCLUSTERED INDEX idx_fmea_cfg_unique ON fmea_configuration(config_type, scope, scope_id, config_key);

CREATE TABLE fmea_version_history (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    entity_type     NVARCHAR(50) NOT NULL,
    entity_id       BIGINT NOT NULL,
    version         INT NOT NULL,
    tr_stage        NVARCHAR(20),
    change_desc     NVARCHAR(500),
    change_snapshot NVARCHAR(MAX),
    created_by      NVARCHAR(64),
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_vh_entity ON fmea_version_history(entity_type, entity_id);

CREATE TABLE fmea_audit_log (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id         NVARCHAR(64) NOT NULL,
    action          NVARCHAR(50) NOT NULL,
    resource_type   NVARCHAR(50) NOT NULL,
    resource_id     BIGINT,
    detail          NVARCHAR(MAX),
    ip_address      NVARCHAR(50),
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_al_user ON fmea_audit_log(user_id, created_time);
CREATE NONCLUSTERED INDEX idx_fmea_al_resource ON fmea_audit_log(resource_type, resource_id);
CREATE NONCLUSTERED INDEX idx_fmea_al_time ON fmea_audit_log(created_time);

CREATE TABLE fmea_ai_adoption_stat (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_task_id BIGINT NOT NULL,
    generation_type NVARCHAR(30) NOT NULL,
    total_count     INT DEFAULT 0,
    adopted_count   INT DEFAULT 0,
    adoption_rate   DECIMAL(5,4),
    stat_date       DATE,
    created_time    DATETIME2 DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX idx_fmea_aas_task ON fmea_ai_adoption_stat(analysis_task_id, generation_type);
```

### 6.3 数据库设计说明

#### 6.3.1 SQL Server 特有注意事项

| 事项 | 说明 |
|------|------|
| updated_time | SQL Server不支持ON UPDATE，通过应用层Service统一设置，或使用触发器 |
| JSON存储 | 使用NVARCHAR(MAX)存储，SQL Server 2016+支持ISJSON/FOR JSON |
| 字符串 | 统一使用NVARCHAR支持中文，避免VARCHAR乱码 |
| 分页 | MyBatis Plus已适配SQL Server分页语法(OFFSET FETCH) |
| 索引 | 默认创建NONCLUSTERED INDEX，主键为CLUSTERED |
| BIT类型 | SQL Server BIT存0/1，非NULL，需注意NULL语义用TINYINT替代 |

#### 6.3.2 无限层级树结构

变更点清单项（`fmea_change_list_item`）和结构节点（`fmea_structure_node`）均采用 `parent_id` 方案实现无限层级树结构：

- `parent_id = 0` 表示顶级节点
- `level_num` 记录层级深度，便于查询和排序
- `item_id`（变更点清单项）作为业务ID，是跨协作人合并的依据

#### 6.3.3 枚举字段规范

所有枚举字段使用 NVARCHAR 存储枚举字符串，Java侧通过枚举类约束：

| 表 | 字段 | Java枚举 |
|----|------|----------|
| fmea_structure_edge | interface_type | InterfaceType{PHYSICAL, MATERIAL, ENERGY, SIGNAL} |
| fmea_structure_edge | direction | Direction{UNIDIRECTIONAL, BIDIRECTIONAL, NONE} |
| fmea_failure_mode | mode_type | FailureModeType{ABNORMAL, REVERSE, ACCOMPANY, EXCESS, REDUCE, PARTIAL, BLANK} |
| fmea_failure_cause | cause_dimension | CauseDimension{DESIGN, MANUFACTURE, STRESS, WEAR, INTERACTION, COMPOSITE} |
| fmea_failure_effect | effect_level | EffectLevel{SYSTEM, MACHINE, CUSTOMER} |
| fmea_evaluation_item | risk_level | RiskLevel{H, M, L} |

#### 6.3.4 通用字段规范

所有业务表包含以下通用字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT IDENTITY(1,1) | 主键 |
| created_time | DATETIME2 | 创建时间 |
| updated_time | DATETIME2 | 更新时间（部分表） |
| is_deleted | BIT | 逻辑删除（部分表） |

---

## 7. 前端设计

### 7.1 整体方案

前端采用 **FreeMarker(FTL)模板 + EasyUI** 的服务端渲染方案：

- **页面渲染**：Controller返回FTL视图名，Spring Boot集成FreeMarker自动渲染
- **UI组件**：EasyUI提供DataGrid、Dialog、Form、Tabs等企业级组件
- **数据交互**：jQuery.ajax与后端交互，JSON格式
- **画板嵌入**：飞书画板通过iframe嵌入FTL页面

### 7.2 FreeMarker配置

```yaml
spring:
  freemarker:
    template-loader-path: classpath:/templates/
    suffix: .ftl
    charset: UTF-8
    cache: false
    content-type: text/html;charset=UTF-8
    settings:
      number_format: 0.##
      datetime_format: yyyy-MM-dd HH:mm:ss
      date_format: yyyy-MM-dd
```

### 7.3 FTL布局模板

```html
<!-- layout.ftl -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>FMEA 2.0 - ${pageTitle!''}</title>
    <link rel="stylesheet" href="/static/easyui/themes/default/easyui.css">
    <link rel="stylesheet" href="/static/easyui/themes/icon.css">
    <link rel="stylesheet" href="/static/css/fmea.css">
    <script src="/static/easyui/jquery.min.js"></script>
    <script src="/static/easyui/jquery.easyui.min.js"></script>
    <script src="/static/easyui/locale/easyui-lang-zh_CN.js"></script>
</head>
<body class="easyui-layout">
    <div data-options="region:'north'" style="height:60px">
        <#include "common/header.ftl">
    </div>
    <div data-options="region:'west',title:'导航菜单'" style="width:200px">
        <#include "common/sidebar.ftl">
    </div>
    <div data-options="region:'center'">
        <#nested>
    </div>
</body>
</html>
```

### 7.4 Controller返回模式

```java
@Controller
@RequestMapping("/evaluation")
public class EvaluationController {

    @Autowired
    private EvaluationProvider evaluationProvider;

    @GetMapping("/list")
    public String list(Model model) {
        return "evaluation/list";
    }

    @PostMapping("/submit")
    @ResponseBody
    public Result submit(@RequestBody EvaluationSubmitRequest request) {
        return Result.success(evaluationProvider.submitEvaluation(request));
    }

    @GetMapping("/data")
    @ResponseBody
    public PageResult<EvaluationItemVO> getData(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int rows,
            @RequestParam(required = false) String projectId) {
        return evaluationProvider.queryEvaluationPage(page, rows, projectId);
    }
}
```

**返回模式说明**：
- 页面跳转：返回FTL视图名（String），Spring MVC渲染模板
- 数据接口：`@ResponseBody` 返回JSON，EasyUI DataGrid通过URL加载
- Controller仅调用Provider，不直接调用Service

### 7.5 EasyUI DataGrid典型用法

```html
<!-- evaluation/list.ftl -->
<table id="evalGrid" class="easyui-datagrid"
       data-options="url:'/evaluation/data', method:'get',
                     pagination:true, rownumbers:true, fit:true,
                     toolbar:'#evalToolbar'">
    <thead>
        <tr>
            <th data-options="field:'id',width:80">ID</th>
            <th data-options="field:'projectName',width:200">项目名称</th>
            <th data-options="field:'level',width:80">层级</th>
            <th data-options="field:'status',width:100,formatter:statusFormatter">状态</th>
            <th data-options="field:'riskScore',width:80">风险评分</th>
        </tr>
    </thead>
</table>
```

### 7.6 飞书画板iframe嵌入

结构框图页面通过iframe嵌入飞书画板：

```html
<!-- analysis/structure.ftl -->
<div class="easyui-tabs" data-options="fit:true">
    <div title="结构框图">
        <iframe id="boardFrame"
                src="${larkBoardUrl!''}"
                style="width:100%; height:100%; border:none;">
        </iframe>
    </div>
    <div title="接口表格">
        <table id="interfaceGrid" class="easyui-datagrid">...</table>
    </div>
</div>
```

**iframe嵌入方案说明**：

| 项目 | 说明 |
|------|------|
| URL来源 | 后端调用飞书API创建文档+画板后，获取画板URL存入`fmea_structure_diagram.lark_board_url` |
| URL格式 | `https://bytedance.larkoffice.com/whiteboard/docx/{board_id}` |
| 权限传递 | 飞书应用需有文档权限，用户通过CAS登录后需与飞书账号关联 |
| 数据回读 | 用户在画板中编辑完成后，后端通过飞书API读取画板节点和边数据 |
| 导出 | 通过飞书API导出画板为图片/PDF |

### 7.7 EasyUI组件使用映射

| 业务场景 | EasyUI组件 | 说明 |
|----------|------------|------|
| 列表页面 | datagrid | 分页、排序、行选择 |
| 表单编辑 | dialog + form | 弹窗表单 |
| 多步骤流程 | tabs / accordion | 分析任务步骤切换 |
| 下拉选择 | combobox | BG/领域/角色选择 |
| 树形选择 | combotree | 结构层级选择 |
| 日期选择 | datebox | 评审日期/落地时间 |
| 文件上传 | filebox | Excel/Word导入 |
| 消息提示 | messager | 操作成功/失败提示 |
| 确认对话框 | messager.confirm | 删除/提交确认 |
| 选项卡 | tabs | 基线输出模式切换 |

---

## 8. 外部系统集成设计

### 8.1 飞书服务封装（LarkService）

飞书API通过 `fmea-integration-lark` 模块统一封装，业务模块仅调用服务接口，不关心API细节。

#### 8.1.1 模块结构

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

#### 8.1.2 核心接口

```java
public interface LarkService {

    String createDoc(String title);

    String createBoardInDoc(String docId, String title);

    String getBoardUrl(String boardId);

    void updateBoardContent(String boardId, String mermaidContent);

    String getBoardContent(String boardId);

    void sendMessage(String receiveId, String receiveType, String msgType, String content);

    void sendCardMessage(String receiveId, String receiveType, String cardContent);

    byte[] exportBoardAsImage(String boardId);

    byte[] exportDocAsPdf(String docId);
}
```

#### 8.1.3 令牌管理

- 飞书API使用 `tenant_access_token` 认证
- Token缓存至Redis，有效期2小时，提前10分钟自动刷新
- 使用分布式锁避免并发刷新

#### 8.1.4 iframe嵌入流程

```
1. 用户进入结构分析步骤
2. 后端调用LarkService.createDoc()创建飞书文档
3. 后端调用LarkService.createBoardInDoc()在文档中创建画板
4. 后端调用LarkService.getBoardUrl()获取画板访问URL
5. 将URL存入fmea_structure_diagram.lark_board_url
6. FTL模板中通过iframe嵌入该URL
7. 用户在iframe中编辑画板
8. 编辑完成后，后端通过LarkService.getBoardContent()回读节点和边数据
```

### 8.2 PMS数据直查

PMS数据查询通过 `fmea-integration-pms` 模块封装，内部使用 `@DS("pms")` 注解切换至PMS只读数据源。

#### 8.2.1 模块结构

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

#### 8.2.2 核心接口

```java
public interface PmsQueryService {

    PmsProjectInfo getProjectInfo(String pmsProjectId);

    boolean isLevel1Project(String pmsProjectId);

    List<PmsProjectMember> getProjectMembers(String pmsProjectId);

    PmsTrNodeTrigger getTrNodeTrigger(String pmsProjectId);

    List<PmsChangeSource> getChangeSourceData(String pmsProjectId);
}
```

### 8.3 CAS单点登录

#### 8.3.1 集成方式

基于 Spring Security + CAS Client 实现：

```xml
<!-- 依赖 -->
spring-boot-starter-security
cas-client-support-springboot
```

#### 8.3.2 认证流程

```
1. 用户访问FMEA系统 → Spring Security拦截未认证请求
2. 重定向至CAS登录页 → 用户输入账号密码
3. CAS认证成功 → 回调FMEA系统携带ticket
4. FMEA验证ticket → 获取用户信息 → 创建本地会话
5. 后续请求携带session → 无需重复登录
```

#### 8.3.3 用户信息同步

- CAS认证成功后，从CAS返回属性中提取用户ID、姓名、部门等信息
- 本地维护 `fmea_user` 表缓存用户基本信息，定期从CAS同步
- 权限信息从PMS同步，不依赖CAS

### 8.4 邮件服务

#### 8.4.1 模块结构

```
com.fmea.integration.email/
├── EmailService.java
├── impl/
│   └── EmailServiceImpl.java
├── config/
│   └── EmailProperties.java
└── template/
    └── EmailTemplateRenderer.java    # 邮件模板渲染(FTL)
```

#### 8.4.2 邮件场景

| 场景 | 触发时机 | 收件人 |
|------|----------|--------|
| 评审通知 | 提前一周/一天 | 评审人 |
| 审批通知 | 发起审批时 | 审批人 |
| 审核不通过通知 | 审核不通过时 | 提交人 |
| 统计排行榜 | 每季度/TR节点 | 基线库管理员/PDTL/直属领导 |

---

## 9. AI模型集成设计

### 9.1 架构设计

AI模型通过 `fmea-integration-ai` 模块统一对接外部API，业务模块不直接调用AI接口。

```
┌──────────────────────────────────────────────┐
│              Provider层 (业务编排)             │
│  (EvaluationProvider, AnalysisProvider, etc.) │
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

### 9.2 模块结构

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

### 9.3 调用方式

| 场景 | 调用方式 | 超时 | 说明 |
|------|----------|------|------|
| 五维风险评估建议 | 同步 | 30s | 数据量小，实时返回 |
| 功能分析(AI补充) | 异步 | 60s | 需读取附件，可能较慢 |
| 失效模式/原因/影响生成 | 异步 | 60s | 批量生成，可能较慢 |
| 预防/探测措施生成 | 异步 | 60s | 批量生成 |
| SOD评分建议 | 同步 | 30s | 单条评分 |

### 9.4 异步任务设计

对于异步AI调用，采用以下流程：

```
1. 用户点击"AI生成"按钮
2. 后端创建异步任务，返回task_id
3. 前端通过jQuery.ajax轮询任务状态
4. AI调用完成后，结果写入fmea_ai_generation_temp表
5. 前端获取结果，用户选择采纳
```

前端轮询示例：

```javascript
function pollAiTask(taskId) {
    $.ajax({
        url: '/ai/task/status?taskId=' + taskId,
        method: 'GET',
        success: function(result) {
            if (result.data.status === 'COMPLETED') {
                loadAiResult(taskId);
            } else if (result.data.status === 'FAILED') {
                $.messager.alert('提示', 'AI生成失败，请重试');
            } else {
                setTimeout(function() { pollAiTask(taskId); }, 2000);
            }
        }
    });
}
```

异步任务状态管理：

```java
public enum AiTaskStatus {
    PENDING, PROCESSING, COMPLETED, FAILED
}
```

任务状态存储在Redis中，key格式：`ai:task:{taskId}`，TTL 1小时。

### 9.5 AI生成临时表管理

- 每次AI生成时，先删除该分析任务对应类型的旧临时数据
- 删除与插入在同一事务中
- 用户采纳后，数据从临时表复制到正式业务表

---

## 10. 核心业务模块设计

### 10.1 流程状态机

DRBFM核心流程采用状态机管理，定义在各Provider中：

#### 10.1.1 评估任务状态机

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

#### 10.1.2 分析任务状态机

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

### 10.2 评审通知定时任务

```java
@Component
public class ReviewNotificationTask {

    @Autowired
    private ReviewProvider reviewProvider;

    @Scheduled(cron = "0 0 8 * * ?")
    public void checkAndNotify() {
        // 1. 查询7天后到期的评审 → 发送一周提醒
        // 2. 查询1天后到期的评审 → 发送一天提醒
        // 3. 查询今天到期的评审 → 标记未评审人为"自动不通过"
        reviewProvider.processReviewNotifications();
    }
}
```

### 10.3 变更点清单合并算法

部件级评估中，协作人导入的变更点清单需合并：

```
1. TSE上传完整变更点清单 → 写入fmea_change_list_item
2. 协作人上传部分变更点清单 → 按item_id匹配
3. 匹配规则：
   - item_id已存在 → 更新change_point等字段
   - item_id不存在 → 新增记录
4. 合并后保留系统级(LEVEL=0)评估内容不变
```

### 10.4 五维风险评估评分算法

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

### 10.5 Excel导入导出设计

#### 10.5.1 导入

- 使用 Apache POI 读取 Excel 文件
- 变更点清单：按标准模板解析，支持无限层级（通过Level列或缩进判断层级关系）
- 质量策划：读取Excel各Sheet，转Markdown后由AI处理
- 历史问题：按固定列格式解析

#### 10.5.2 导出

- FMEA表单导出为Excel，使用POI模板填充方式
- 结构框图导出为图片/PDF，通过飞书API获取
- 统计数据导出为Excel

---

## 11. 安全设计

### 11.1 认证与授权

| 层面 | 方案 |
|------|------|
| 认证 | CAS单点登录，Spring Security集成 |
| 授权 | 项目级RBAC，权限数据从PMS同步 |
| 会话 | Redis集中存储Session |
| 跨域 | Nginx统一域名，无需CORS |

### 11.2 数据安全

| 层面 | 方案 |
|------|------|
| 传输安全 | HTTPS |
| SQL注入 | MyBatis Plus参数化查询 |
| XSS | FTL输出自动转义 + 前端输入过滤 |
| CSRF | Spring Security CSRF Token |
| 敏感数据 | 暂无加密存储要求 |
| PMS只读 | PMS数据源仅配置SELECT权限账号 |

### 11.3 审计日志

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

## 12. 部署架构

### 12.1 部署拓扑

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
┌────────▼────────┐ ┌───▼──────────┐ ┌─▼──────────────┐
│ FMEA SQL Server │ │ PMS SQL Svr  │ │    Redis       │
│    (读写)        │ │   (只读)      │ │  (缓存/会话)   │
│  Port: 1433     │ │ Port: 1433   │ │  Port: 6379    │
└─────────────────┘ └──────────────┘ └────────────────┘
```

### 12.2 部署清单

| 组件 | 规格 | 数量 | 说明 |
|------|------|------|------|
| Nginx | 2C4G | 1 | 反向代理 |
| FMEA App | 4C8G | 1 | Spring Boot应用 |
| FMEA SQL Server | 4C8G, 100GB SSD | 1 | 主库(已有备份策略) |
| PMS SQL Server | — | 0 | 复用PMS现有数据库(只读账号) |
| Redis | 2C4G | 1 | 缓存/会话/分布式锁 |

### 12.3 应用配置

```yaml
server:
  port: 8080
  servlet:
    session:
      timeout: 30m

spring:
  freemarker:
    template-loader-path: classpath:/templates/
    suffix: .ftl
    charset: UTF-8
    cache: false
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
| V1.1 | 2026-05-28 | 数据库改为SQL Server；前端改为EasyUI+FTL模板；飞书画板改为iframe嵌入 | — |
| V1.2 | 2026-05-28 | 新增Provider业务编排层；Service层限定仅调用本模块Mapper；严禁跨模块调用Mapper；Controller仅调用Provider | — |
