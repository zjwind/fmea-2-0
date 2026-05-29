# FMEA 2.0 / DRBFM全生命周期管理平台 详细设计文档

> **版本**: V1.0
> **日期**: 2026-05-28
> **关联文档**: FMEA2.0-需求分析文档 V2.0、FMEA2.0-概要设计文档 V1.2、FMEA2.0-功能规格文档 V2.0

---

## 目录

1. [文档概述](#1-文档概述)
2. [通用设计基础](#2-通用设计基础)
3. [项目管理模块（fmea-project）](#3-项目管理模块fmea-project)
4. [DRBFM分析模块（fmea-analysis）](#4-drbfm分析模块fmea-analysis)
5. [DRBFM触发评估模块（fmea-evaluation）](#5-drbfm触发评估模块fmea-evaluation)
6. [基线输出与落地跟踪模块（fmea-baseline）](#6-基线输出与落地跟踪模块fmea-baseline)
7. [评审与审批模块（fmea-review）](#7-评审与审批模块fmea-review)
8. [入库管理模块（fmea-inbound）](#8-入库管理模块fmea-inbound)
9. [DRBFM迭代更新模块（fmea-iteration）](#9-drbfm迭代更新模块fmea-iteration)
10. [基线库与知识图谱模块（fmea-library）](#10-基线库与知识图谱模块fmea-library)
11. [看板与统计模块（fmea-dashboard）](#11-看板与统计模块fmea-dashboard)
12. [系统配置模块（fmea-config）](#12-系统配置模块fmea-config)
13. [外部集成模块](#13-外部集成模块)

## 1. 文档概述

### 1.1 文档目的

本文档为 FMEA 2.0 / DRBFM 全生命周期管理平台的详细设计文档，旨在将概要设计文档中的架构设计和数据库设计进一步细化为可直接指导编码的实现规格，包括：

1. 各业务模块的 Controller API 签名、请求/响应 DTO 定义
2. Provider 接口方法的事务边界、业务编排逻辑
3. Service 接口方法的数据操作逻辑
4. Mapper 自定义 SQL 及索引策略
5. 状态机转换规则与校验约束
6. 业务规则与错误码定义

### 1.2 适用范围

本文档覆盖以下章节：

| 章节 | 内容 |
|------|------|
| 第1章 | 文档概述 |
| 第2章 | 通用设计基础（统一响应、异常处理、分页、基类、审计日志、多数据源、错误码） |
| 第3章 | 项目管理模块详细设计 |
| 第4章 | DRBFM分析模块详细设计 |
| 第5章 | DRBFM触发评估模块详细设计 |
| 第6章 | 基线输出与落地跟踪模块详细设计 |
| 第7章 | 评审与审批模块详细设计 |
| 第8章 | 入库管理模块详细设计 |
| 第9章 | DRBFM迭代更新模块详细设计 |
| 第10章 | 基线库与知识图谱模块详细设计 |
| 第11章 | 看板与统计模块详细设计 |
| 第12章 | 系统配置模块详细设计 |
| 第13章 | 外部集成模块详细设计 |

### 1.3 关联文档

| 文档名称 | 版本 | 与本文档的关系 |
|----------|------|----------------|
| FMEA2.0-需求分析文档 | V2.0 | 业务需求来源 |
| FMEA2.0-概要设计文档 | V1.2 | 架构设计、数据库设计、模块划分依据 |
| FMEA2.0-功能规格文档 | V2.0 | 功能验收标准、操作流程参考 |

### 1.4 详细设计范围

| 设计维度 | 说明 |
|----------|------|
| Controller API | HTTP方法、URL、请求参数、响应格式、视图名称 |
| Provider接口 | 方法签名、调用Service列表、事务边界、业务规则、集成服务调用 |
| Service接口 | 方法签名、调用Mapper方法、数据校验规则 |
| DTO/VO | 字段定义、校验注解、转换规则 |
| 状态机 | 状态枚举、转换条件、校验约束 |
| 业务规则 | 唯一性校验、权限校验、数据同步规则 |
| 错误码 | 模块前缀+错误类型+序号，完整错误码表 |

### 1.5 约定

| 约定项 | 说明 |
|--------|------|
| 技术栈 | Spring Boot 2.7.x + MyBatis Plus 3.5.x + SQL Server 2019+ |
| 前端 | EasyUI(jQuery) + FreeMarker(FTL) |
| 架构分层 | Controller → Provider(业务编排) → Service(单模块) → Mapper(本模块) |
| 事务管理 | Provider持有@Transactional，Service不加事务注解 |
| 跨模块调用 | Provider可跨模块调用Service，Service仅调用本模块Mapper |
| 数据源 | FMEA主库(默认) + PMS只读库(@DS("pms")) |
| 健康检查与监控 | 集成Spring Boot Actuator，暴露/actuator/health和/actuator/metrics端点，用于系统健康检查和性能指标监控 |

---

## 2. 通用设计基础

### 2.1 统一响应封装

#### 2.1.1 Result 统一响应

```java
package com.fmea.common.core.result;

import java.io.Serializable;

public class Result<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private int code;
    private String message;
    private T data;

    private Result() {}

    public static <T> Result<T> success() {
        Result<T> result = new Result<>();
        result.code = 200;
        result.message = "success";
        return result;
    }

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.code = 200;
        result.message = "success";
        result.data = data;
        return result;
    }

    public static <T> Result<T> success(String message, T data) {
        Result<T> result = new Result<>();
        result.code = 200;
        result.message = message;
        result.data = data;
        return result;
    }

    public static <T> Result<T> error(int code, String message) {
        Result<T> result = new Result<>();
        result.code = code;
        result.message = message;
        return result;
    }

    public static <T> Result<T> error(String message) {
        return error(500, message);
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
    public T getData() { return data; }
}
```

#### 2.1.2 PageResult 分页响应

```java
package com.fmea.common.core.result;

import java.io.Serializable;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

public class PageResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private long total;
    private List<T> rows;

    public PageResult() {}

    public PageResult(long total, List<T> rows) {
        this.total = total;
        this.rows = rows;
    }

    public static <T> PageResult<T> of(long total, List<T> rows) {
        return new PageResult<>(total, rows);
    }

    public static <S, T> PageResult<T> of(com.baomidou.mybatisplus.extension.plugins.pagination.Page<S> page,
                                            Function<S, T> converter) {
        List<T> rows = page.getRecords().stream()
                .map(converter)
                .collect(Collectors.toList());
        return new PageResult<>(page.getTotal(), rows);
    }

    public long getTotal() { return total; }
    public List<T> getRows() { return rows; }
}
```

#### 2.1.3 响应码规范

| 响应码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 所有正常业务响应 |
| 400 | 业务异常 | 参数校验失败、业务规则违反、数据不存在等 |
| 403 | 权限不足 | 无项目权限、角色不匹配、越权操作 |
| 500 | 系统异常 | 未捕获的运行时异常、数据库异常、外部服务异常 |

### 2.2 全局异常处理

#### 2.2.1 异常类定义

```java
package com.fmea.common.core.exception;

public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String errorCode, String message) {
        super(message);
        this.code = Integer.parseInt(errorCode);
    }

    public int getCode() { return code; }
}
```

```java
package com.fmea.common.core.exception;

public class PermissionDeniedException extends RuntimeException {

    public PermissionDeniedException(String message) {
        super(message);
    }
}
```

#### 2.2.2 全局异常处理器

```java
package com.fmea.common.core.exception;

import com.fmea.common.core.result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(PermissionDeniedException.class)
    public Result<Void> handlePermissionDeniedException(PermissionDeniedException e) {
        log.warn("权限异常: message={}", e.getMessage());
        return Result.error(403, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(500, "系统内部错误，请联系管理员");
    }
}
```

#### 2.2.3 异常码规范

异常码采用7位数字编码：**模块前缀(2位) + 错误类型(2位) + 序号(3位)**

| 模块前缀 | 模块名称 |
|----------|----------|
| 10 | 项目管理 |
| 20 | 触发评估 |
| 30 | DRBFM分析 |
| 40 | 基线落地 |
| 50 | 评审审批 |
| 60 | 入库管理 |
| 70 | 基线库 |
| 80 | 看板统计 |
| 90 | 系统配置 |
| 99 | 通用错误 |

| 错误类型 | 含义 |
|----------|------|
| 01 | 数据不存在 / 查询失败 |
| 02 | 数据重复 / 唯一性冲突 |
| 03 | 状态非法 / 流程校验失败 |
| 04 | 参数校验失败 |
| 05 | 权限不足 |
| 06 | 外部服务调用失败 |
| 07 | 数据同步失败 |
| 08 | 文件操作失败 |
| 09 | 业务规则违反 |
| 10 | 系统内部错误 |

### 2.3 分页规范

#### 2.3.1 前端分页参数

EasyUI DataGrid 发送的分页参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码，从1开始 |
| rows | int | 20 | 每页条数 |

#### 2.3.2 后端分页处理

```java
Page<FmeaProject> pageParam = new Page<>(page, rows);
Page<FmeaProject> result = projectMapper.selectPage(pageParam, wrapper);
return PageResult.of(result, converter::toVO);
```

#### 2.3.3 分页响应格式

```json
{
    "total": 100,
    "rows": [
        { "id": 1, "name": "项目A", "bg": "CBG" },
        { "id": 2, "name": "项目B", "bg": "SBG" }
    ]
}
```

### 2.4 基类设计

#### 2.4.1 BaseEntity

```java
package com.fmea.common.core.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.io.Serializable;
import java.time.LocalDateTime;

public abstract class BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;

    @TableField(fill = FieldFill.INSERT)
    private String createdBy;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updatedBy;

    @TableLogic
    private Boolean isDeleted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
    public LocalDateTime getUpdatedTime() { return updatedTime; }
    public void setUpdatedTime(LocalDateTime updatedTime) { this.updatedTime = updatedTime; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
}
```

#### 2.4.2 MetaObjectHandler（自动填充）

```java
package com.fmea.common.core.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class FmeaMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createdTime", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updatedTime", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "createdBy", String.class, getCurrentUserId());
        this.strictInsertFill(metaObject, "updatedBy", String.class, getCurrentUserId());
        this.strictInsertFill(metaObject, "isDeleted", Boolean.class, false);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updatedTime", LocalDateTime.class, LocalDateTime.now());
        this.strictUpdateFill(metaObject, "updatedBy", String.class, getCurrentUserId());
    }

    private String getCurrentUserId() {
        return com.fmea.common.security.SecurityUtils.getCurrentUserId();
    }
}
```

### 2.5 审计日志注解

#### 2.5.1 注解定义

```java
package com.fmea.common.log.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    String action();
    String resourceType();
}
```

#### 2.5.2 使用示例

```java
@AuditLog(action = "CREATE_PROJECT", resourceType = "PROJECT")
@PostMapping("/create")
@ResponseBody
public Result<Long> create(@RequestBody ProjectCreateRequest request) {
    return Result.success(projectProvider.createProject(request));
}

@AuditLog(action = "GRANT_PERMISSION", resourceType = "PERMISSION")
@PostMapping("/permission/grant")
@ResponseBody
public Result<Void> grantPermission(@RequestBody PermissionGrantRequest request) {
    projectProvider.grantPermission(request);
    return Result.success();
}
```

#### 2.5.3 审计日志切面

```java
package com.fmea.common.log.aspect;

import com.fmea.common.log.annotation.AuditLog;
import com.fmea.common.security.SecurityUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditLogAspect {

    @Autowired
    private AuditLogService auditLogService;

    @Around("@annotation(auditLog)")
    public Object around(ProceedingJoinPoint joinPoint, AuditLog auditLog) throws Throwable {
        Object result = joinPoint.proceed();
        try {
            AuditLogRecord record = new AuditLogRecord();
            record.setUserId(SecurityUtils.getCurrentUserId());
            record.setAction(auditLog.action());
            record.setResourceType(auditLog.resourceType());
            record.setIpAddress(SecurityUtils.getCurrentIpAddress());
            auditLogService.asyncSave(record);
        } catch (Exception e) {
            log.warn("审计日志记录失败", e);
        }
        return result;
    }
}
```

### 2.6 多数据源使用规范

#### 2.6.1 数据源配置

| 数据源名称 | 用途 | 权限 | @DS注解 | 使用位置 |
|------------|------|------|---------|----------|
| fmea | FMEA业务主库 | 读写 | 无需注解（默认） | 所有业务模块Service |
| pms | PMS系统数据库 | 只读 | @DS("pms") | 仅PmsQueryServiceImpl |

#### 2.6.2 使用约束

| 约束项 | 规则 |
|--------|------|
| FMEA主库 | 默认数据源，无需@DS注解 |
| PMS只读库 | 仅在PmsQueryServiceImpl中使用@DS("pms") |
| 事务隔离 | PMS查询不参与FMEA事务，禁止在@Transactional中混用两个数据源 |
| 缓存策略 | PMS查询结果按需缓存至Redis，减少跨库查询 |
| SQL隔离 | PMS查询SQL写在独立Mapper XML中，与FMEA业务Mapper隔离 |

#### 2.6.3 PmsQueryService 示例

```java
package com.fmea.integration.pms.impl;

import com.baomidou.dynamic.datasource.annotation.DS;
import com.fmea.integration.pms.PmsQueryService;
import com.fmea.integration.pms.dto.PmsProjectInfo;
import com.fmea.integration.pms.dto.PmsProjectMember;
import com.fmea.integration.pms.mapper.PmsMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PmsQueryServiceImpl implements PmsQueryService {

    @Autowired
    private PmsMapper pmsMapper;

    @Override
    @DS("pms")
    public PmsProjectInfo getProjectInfo(String pmsProjectId) {
        return pmsMapper.selectProjectInfo(pmsProjectId);
    }

    @Override
    @DS("pms")
    public boolean isLevel1Project(String pmsProjectId) {
        return pmsMapper.checkIsLevel1(pmsProjectId);
    }

    @Override
    @DS("pms")
    public List<PmsProjectMember> getProjectMembers(String pmsProjectId) {
        return pmsMapper.selectProjectMembers(pmsProjectId);
    }
}
```

### 2.7 错误码总表

#### 2.7.1 项目管理模块（10xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 1001001 | 项目不存在 | 根据ID查询项目返回null |
| 1001002 | PMS项目ID已存在 | 创建项目时PMS ID重复 |
| 1001003 | 项目名称不能为空 | 创建项目时名称和PMS ID均为空 |
| 1001004 | 项目查询失败 | 数据库查询异常 |
| 1002001 | PMS项目ID重复 | 同一PMS项目ID已关联项目 |
| 1002002 | 项目名称重复 | 同一BG下项目名称重复（预留） |
| 1003001 | 项目状态不允许此操作 | 项目已归档时尝试修改 |
| 1003002 | 评估任务已存在 | 创建系统级评估任务时已存在 |
| 1003003 | 分析任务已存在 | 创建分析任务时已存在 |
| 1004001 | PMS项目ID不能为空 | 创建项目时未提供PMS项目ID |
| 1004002 | 分页参数不合法 | page<1 或 rows<1 |
| 1005001 | 无项目查看权限 | 用户无阅读权限时查看项目详情 |
| 1005002 | 无项目管理权限 | 非管理权限用户尝试授权 |
| 1005003 | 无项目编辑权限 | 非编辑权限用户尝试修改项目数据 |
| 1006001 | PMS项目信息查询失败 | PmsQueryService调用异常 |
| 1006002 | PMS权限同步失败 | PMS成员查询异常 |
| 1006003 | 飞书消息发送失败 | LarkService调用异常 |
| 1007001 | PMS权限同步数据为空 | PMS返回成员列表为空 |
| 1007002 | 权限同步部分失败 | 部分成员权限写入失败 |
| 1008001 | 项目导出失败 | Excel导出异常 |
| 1009001 | 1级项目判定缓存过期 | Redis缓存失效且PMS不可用 |

#### 2.7.2 触发评估模块（20xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 2001001 | 评估任务不存在 | 根据ID查询评估任务返回null |
| 2001002 | 变更点清单不存在 | 评估任务无关联变更点清单 |
| 2001003 | 评估项不存在 | 根据ID查询评估项返回null |
| 2002001 | 系统级评估任务已存在 | 同一项目重复创建系统级评估任务 |
| 2002002 | 部件级评估任务已存在 | 同一项目重复创建部件级评估任务 |
| 2003001 | 评估任务状态不允许提交 | 非draft状态提交评估表 |
| 2003002 | 评估任务状态不允许审核 | 非submitted状态审核评估表 |
| 2003003 | 评估任务状态不允许撤回 | 非submitted状态撤回评估表 |
| 2003004 | 评估任务状态不允许评分 | 非approved状态进行评分 |
| 2003005 | 评估任务状态不允许确认 | 非scored状态确认评估 |
| 2004001 | 变更点清单为空 | 提交评估时变更点清单无数据 |
| 2004002 | 五维评估未完成 | 确认评估时存在未填写的维度 |
| 2004003 | 评分结果不完整 | 评分计算时缺少维度分数 |
| 2005001 | 无评估任务操作权限 | 非TSE/PSE角色操作评估任务 |
| 2005002 | 协作人指派信息不完整 | 指派协作人时缺少必要信息（用户ID或变更点） |
| 2006001 | AI风险评估调用失败 | AiService调用超时或异常 |
| 2006002 | AI评分建议生成失败 | AI模型返回异常 |
| 2007001 | 变更点清单合并冲突 | 协作人导入时item_id匹配冲突 |
| 2008001 | 变更点清单导入失败 | Excel解析异常 |
| 2008002 | 质量策划导入失败 | Excel解析异常 |
| 2008003 | 历史问题导入失败 | Excel解析异常 |
| 2009001 | 风险评分计算异常 | 评分算法执行异常 |

#### 2.7.3 DRBFM分析模块（30xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 3001001 | 分析任务不存在 | 根据ID查询分析任务返回null |
| 3001002 | 结构框图不存在 | 分析任务无关联结构框图 |
| 3001003 | 功能矩阵不存在 | 分析任务无关联功能矩阵 |
| 3001004 | 失效分析不存在 | 分析任务无关联失效分析 |
| 3002001 | 分析任务状态不允许此操作 | 当前步骤非目标步骤时操作 |
| 3002002 | 结构分析未完成 | 未完成结构分析时进入功能分析 |
| 3002003 | 功能分析未完成 | 未完成功能分析时进入失效分析 |
| 3003001 | 步骤流转校验失败 | 当前步骤数据不完整时流转 |
| 3003002 | 节点数据为空 | 结构分析完成时节点表无数据 |
| 3003003 | 功能矩阵未确认 | 功能分析未确认时进入失效分析 |
| 3004001 | 功能矩阵数据为空 | 生成DRBFM表单时功能矩阵无数据 |
| 3004002 | 失效模式数据为空 | SOD评分时失效模式无数据 |
| 3005001 | 无分析任务操作权限 | 非TSE/协作人角色操作分析任务 |
| 3005002 | 飞书画板创建失败 | LarkService创建画板异常 |
| 3006001 | AI失效模式生成失败 | AiService调用超时或异常 |
| 3006002 | AI失效原因生成失败 | AiService调用超时或异常 |
| 3006003 | AI失效影响生成失败 | AiService调用超时或异常 |
| 3006004 | AI预防措施生成失败 | AiService调用超时或异常 |
| 3006005 | AI探测措施生成失败 | AiService调用超时或异常 |
| 3006006 | AI SOD评分建议失败 | AiService调用超时或异常 |
| 3007001 | AI临时数据不存在 | 采纳AI结果时临时表无数据 |
| 3007002 | AI临时数据已采纳 | 重复采纳同一AI生成结果 |
| 3008001 | 飞书画板导出失败 | 画板导出图片异常 |
| 3008002 | FMEA表单导出失败 | Excel导出异常 |
| 3009001 | SOD评分值超出范围 | S/O/D值不在1-10范围 |
| 3009002 | AP参考表数据缺失 | SOD组合在AP参考表中无对应记录 |

#### 2.7.4 基线落地模块（40xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 4001001 | 基线不存在 | 根据ID查询基线返回null |
| 4001002 | 基线项不存在 | 根据ID查询基线项返回null |
| 4001003 | 落地任务不存在 | 根据ID查询落地任务返回null |
| 4001004 | 落地项不存在 | 根据ID查询落地项返回null |
| 4002001 | 基线项重复 | 同一措施在基线中重复 |
| 4003001 | 基线输出校验失败 | 落地措施缺少负责人或时间 |
| 4003002 | 落地时间不能为过去 | 落地时间早于当前时间 |
| 4003003 | 落地状态不允许此操作 | 非pending状态填报落地情况 |
| 4003004 | 落地审核状态不允许此操作 | 非待审核状态进行审核 |
| 4004001 | 落地负责人不能为空 | 落地措施未指定负责人 |
| 4004002 | 落地时间不能为空 | 落地措施未指定落地时间 |
| 4005001 | 无基线操作权限 | 非负责人/主管操作落地任务 |
| 4006001 | 落地审核通知失败 | 飞书/邮件通知异常 |
| 4007001 | 措施库写入失败 | 落地完成后写入措施库异常 |
| 4007002 | 失效库写入失败 | 落地完成后写入失效库异常 |
| 4008001 | 基线导出失败 | Excel导出异常 |
| 4009001 | SLA日期已过期 | 落地任务SLA到期未完成 |

#### 2.7.5 评审审批模块（50xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 5001001 | 评审记录不存在 | 根据ID查询评审返回null |
| 5001002 | 评审人不存在 | 根据ID查询评审人返回null |
| 5001003 | 评审意见不存在 | 根据ID查询评审意见返回null |
| 5001004 | 审批记录不存在 | 根据ID查询审批返回null |
| 5002001 | 评审人重复 | 同一评审角色指定重复评审人 |
| 5002002 | 审批记录重复 | 同一分析任务重复发起审批 |
| 5003001 | 评审状态不允许此操作 | 非评审中状态提交评审意见 |
| 5003002 | 审批状态不允许此操作 | 非待审批状态进行审批 |
| 5003003 | 评审意见未全部闭环 | 发起审批时评审意见未闭环 |
| 5003004 | 必选评审角色未指定 | 发起评审时缺少必选角色评审人 |
| 5004001 | 评审日期不能为空 | 发起评审时未设置评审日期 |
| 5004002 | 评审日期不能早于当前日期 | 评审日期设置在过去 |
| 5004003 | 审批层级不合法 | 审批层级不在1-3范围 |
| 5005001 | 非指定评审人 | 非指定评审人提交评审意见 |
| 5005002 | 非指定审批人 | 非指定审批人进行审批 |
| 5005003 | 评审人不可委托 | 评审人委托他人评审 |
| 5006001 | 评审通知发送失败 | 飞书/邮件通知异常 |
| 5006002 | 审批通知发送失败 | 飞书/邮件通知异常 |
| 5007001 | 1级项目判定失败 | PMS查询1级项目异常 |
| 5007002 | 意见率计算异常 | 评审人数据异常导致计算失败 |
| 5008001 | 会议纪要上传失败 | 文件上传异常 |
| 5009001 | AI评审纪要生成失败 | AiService调用异常 |

#### 2.7.6 入库管理模块（60xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 6001001 | 入库审批记录不存在 | 根据ID查询入库审批返回null |
| 6001002 | 基线库记录不存在 | 根据ID查询基线库记录返回null |
| 6002001 | 基线库记录重复 | 入库时BG+领域+来源项目重复 |
| 6002002 | 入库审批重复申请 | 审批不通过后再次申请入库 |
| 6003001 | 入库审批状态不允许此操作 | 非待审批状态进行审批 |
| 6003002 | 基线库数据修改需重新审批 | 修改已入库数据未发起审批 |
| 6004001 | 入库字段映射失败 | 措施数据映射到基线库结构异常 |
| 6005001 | 非基线库管理员 | 非基线库管理员操作入库审批 |
| 6006001 | 入库通知发送失败 | 飞书/邮件通知异常 |
| 6007001 | 基线库版本记录失败 | 版本变更记录写入异常 |
| 6008001 | 基线库Excel导入失败 | Excel解析异常 |
| 6009001 | 基线库数据校验失败 | 导入数据格式不合规 |

#### 2.7.7 基线库模块（70xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 7001001 | 失效库记录不存在 | 根据ID查询失效库返回null |
| 7001002 | 措施库记录不存在 | 根据ID查询措施库返回null |
| 7001003 | 功能库记录不存在 | 根据ID查询功能库返回null |
| 7002001 | 失效库记录重复 | 同一基线库下失效模式重复 |
| 7002002 | 措施库记录重复 | 同一失效库下措施描述重复 |
| 7003001 | 基线库分区不存在 | 指定BG/领域分区不存在 |
| 7004001 | 功能库描述格式不合规 | 功能描述不符合"动词+名称"规范 |
| 7005001 | 无基线库访问权限 | 用户无对应BG/领域的基线库权限 |
| 7006001 | 基线库检索失败 | 全文检索异常 |
| 7007001 | 基线库版本回滚失败 | 版本数据不完整 |
| 7008001 | 基线库Excel导入失败 | Excel解析异常 |
| 7009001 | 基线库数据导出失败 | Excel导出异常 |

#### 2.7.8 看板统计模块（80xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 8001001 | 统计数据查询失败 | 聚合查询异常 |
| 8001002 | 排行榜数据为空 | 统计周期内无数据 |
| 8002001 | 发布率计算失败 | 项目数据不完整 |
| 8002002 | 采纳率计算失败 | AI统计数据不完整 |
| 8003001 | 统计邮件推送失败 | SMTP发送异常 |
| 8004001 | 导出文件生成失败 | Excel/PDF生成异常 |
| 8005001 | 看板数据刷新失败 | 缓存更新异常 |
| 8006001 | PMS改板数据获取失败 | PMS接口异常 |
| 8007001 | 统计定时任务执行失败 | Quartz任务异常 |
| 8008001 | 图表数据序列化失败 | ECharts数据格式异常 |

#### 2.7.9 系统配置模块（90xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 9001001 | 配置项不存在 | 根据key查询配置返回null |
| 9001002 | SOD评价标准不存在 | 评分时未找到对应标准 |
| 9001003 | AP参考表数据不完整 | AP参考表行数不足100行 |
| 9002001 | 配置项key重复 | 创建配置时key已存在 |
| 9002002 | 角色代表重复 | 同一角色配置重复代表 |
| 9003001 | SOD评价标准配置不完整 | S/O/D评分等级不完整 |
| 9003002 | AP参考表不允许修改 | 尝试修改固定AP参考表 |
| 9004001 | 配置参数校验失败 | 配置值格式不合法 |
| 9004002 | 基线库管理员不能为空 | 未配置基线库管理员 |
| 9005001 | 无系统配置权限 | 非配置管理员修改配置 |
| 9006001 | CAS认证失败 | CAS票据验证异常 |
| 9006002 | 用户信息同步失败 | CAS返回属性解析异常 |
| 9007001 | 配置缓存更新失败 | Redis缓存更新异常 |
| 9008001 | 配置导入失败 | Excel批量导入配置异常 |
| 9009001 | 领域配置引用失败 | 领域被项目引用时尝试删除 |

#### 2.7.10 通用错误（99xxxx）

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 9901001 | 数据不存在 | 通用数据查询返回null |
| 9902001 | 数据重复 | 通用唯一性冲突 |
| 9903001 | 操作不允许 | 通用状态校验失败 |
| 9904001 | 参数校验失败 | 通用参数格式错误 |
| 9904002 | 请求方法不支持 | GET/POST方法不匹配 |
| 9904003 | 请求体解析失败 | JSON反序列化异常 |
| 9905001 | 未登录 | 未认证用户访问受保护资源 |
| 9905002 | 权限不足 | 通用权限校验失败 |
| 9906001 | 外部服务调用失败 | 通用外部服务异常 |
| 9906002 | 外部服务超时 | 通用外部服务超时 |
| 9907001 | Redis操作失败 | 缓存读写异常 |
| 9907002 | 分布式锁获取失败 | 并发操作锁竞争失败 |
| 9908001 | 文件上传失败 | 通用文件上传异常 |
| 9908002 | 文件下载失败 | 通用文件下载异常 |
| 9908003 | 文件格式不支持 | 上传文件格式不在允许范围 |
| 9909001 | 系统内部错误 | 未捕获的运行时异常 |
| 9909002 | 数据库操作失败 | 通用数据库异常 |
| 9909003 | 并发冲突 | 乐观锁版本冲突 |

---

## 3. 项目管理模块（fmea-project）

### 3.1 模块概述

#### 3.1.1 模块定位

项目管理模块是 FMEA 2.0 平台的基础模块，负责项目的创建、查询、详情展示和权限管理。项目是 DRBFM 全流程的载体，所有评估任务、分析任务、基线、评审、审批均围绕项目展开。

#### 3.1.2 基本信息

| 项目 | 说明 |
|------|------|
| 包路径 | com.fmea.project |
| 数据库表 | fmea_project, fmea_domain, fmea_permission |
| 关联集成模块 | PmsQueryService, LarkService |
| 依赖通用模块 | fmea-common-core, fmea-common-security, fmea-common-log |

#### 3.1.3 核心业务场景

| 场景 | 说明 |
|------|------|
| 项目列表 | 用户查看有权限的项目列表，支持BG/TR阶段筛选 |
| 项目创建 | 输入PMS项目ID，从PMS拉取信息创建本地项目 |
| 项目详情 | 展示项目信息、DRBFM任务进展、权限列表 |
| 权限管理 | 从PMS同步权限、管理权限用户手动授权/撤销 |
| 1级项目判定 | 从PMS获取1级项目标识，缓存30分钟 |

### 3.2 包结构

```
com.fmea.project/
├── controller/
│   └── ProjectController.java
├── provider/
│   ├── ProjectProvider.java
│   └── impl/
│       └── ProjectProviderImpl.java
├── service/
│   ├── ProjectService.java
│   ├── DomainService.java
│   ├── PermissionService.java
│   └── impl/
│       ├── ProjectServiceImpl.java
│       ├── DomainServiceImpl.java
│       └── PermissionServiceImpl.java
├── mapper/
│   ├── ProjectMapper.java
│   ├── DomainMapper.java
│   └── PermissionMapper.java
├── entity/
│   ├── FmeaProject.java
│   ├── FmeaDomain.java
│   └── FmeaPermission.java
├── dto/
│   ├── request/
│   │   ├── ProjectCreateRequest.java
│   │   ├── ProjectQueryRequest.java
│   │   └── PermissionGrantRequest.java
│   └── response/
│       ├── ProjectVO.java
│       ├── ProjectDetailVO.java
│       └── PermissionVO.java
├── enums/
│   ├── PermissionType.java
│   └── ResourceType.java
└── converter/
    └── ProjectConverter.java
```

### 3.3 Controller API设计

#### 3.3.1 API总览

| API | 方法 | URL | 说明 | 返回类型 |
|-----|------|-----|------|----------|
| 项目列表页 | GET | /project/list | 返回FTL视图 | String(视图名) |
| 项目列表数据 | GET | /project/data | 返回JSON分页数据 | PageResult\<ProjectVO\> |
| 项目创建页 | GET | /project/create | 返回FTL视图 | String(视图名) |
| 创建项目 | POST | /project/create | JSON请求 | Result\<Long\> |
| 项目详情页 | GET | /project/detail/{id} | 返回FTL视图 | String(视图名) |
| 项目详情数据 | GET | /project/detail/{id}/data | 返回JSON | Result\<ProjectDetailVO\> |
| 拉取PMS信息 | GET | /project/pms/info | 返回JSON | Result\<PmsProjectInfo\> |
| 权限列表 | GET | /project/permission/{projectId} | 返回JSON | Result\<List\<PermissionVO\>\> |
| 授予权限 | POST | /project/permission/grant | JSON请求 | Result\<Void\> |
| 撤销权限 | POST | /project/permission/revoke | JSON请求 | Result\<Void\> |
| 同步PMS权限 | POST | /project/permission/sync/{projectId} | JSON请求 | Result\<Void\> |

#### 3.3.2 项目列表页

**GET /project/list**

| 项目 | 说明 |
|------|------|
| 描述 | 返回项目列表FTL视图 |
| 请求参数 | 无 |
| 响应 | FTL视图名：`project/list` |
| Controller逻辑 | 直接返回视图名，数据由`/project/data`接口异步加载 |

```java
@GetMapping("/list")
public String list() {
    return "project/list";
}
```

#### 3.3.3 项目列表数据

**GET /project/data**

| 项目 | 说明 |
|------|------|
| 描述 | 返回项目列表分页数据，供EasyUI DataGrid加载 |
| 请求参数 | 见下表 |
| 响应 | PageResult\<ProjectVO\> |

请求参数：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | int | 否 | 1 | 页码，从1开始 |
| rows | int | 否 | 20 | 每页条数 |
| bg | String | 否 | null | BG筛选条件 |
| trStage | String | 否 | null | TR阶段筛选条件 |

```java
@GetMapping("/data")
@ResponseBody
public PageResult<ProjectVO> data(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int rows,
        @RequestParam(required = false) String bg,
        @RequestParam(required = false) String trStage) {
    return projectProvider.queryProjectPage(page, rows, bg, trStage);
}
```

#### 3.3.4 项目创建页

**GET /project/create**

| 项目 | 说明 |
|------|------|
| 描述 | 返回项目创建FTL视图 |
| 请求参数 | 无 |
| 响应 | FTL视图名：`project/create` |

```java
@GetMapping("/create")
public String createPage() {
    return "project/create";
}
```

#### 3.3.5 创建项目

**POST /project/create**

| 项目 | 说明 |
|------|------|
| 描述 | 创建项目，从PMS拉取信息并同步权限 |
| 请求参数 | JSON Body：ProjectCreateRequest |
| 响应 | Result\<Long\> 返回项目ID |

ProjectCreateRequest：

| 字段 | 类型 | 必填 | 校验 | 说明 |
|------|------|------|------|------|
| pmsProjectId | String | 是 | @NotBlank, @Size(max=100) | PMS项目ID |
| name | String | 否 | @Size(max=200) | 项目名称，不填则从PMS拉取 |

```java
@AuditLog(action = "CREATE_PROJECT", resourceType = "PROJECT")
@PostMapping("/create")
@ResponseBody
public Result<Long> create(@Valid @RequestBody ProjectCreateRequest request) {
    return Result.success(projectProvider.createProject(request));
}
```

#### 3.3.6 项目详情页

**GET /project/detail/{id}**

| 项目 | 说明 |
|------|------|
| 描述 | 返回项目详情FTL视图 |
| 请求参数 | id（路径参数） |
| 响应 | FTL视图名：`project/detail`，Model中包含projectId |

```java
@GetMapping("/detail/{id}")
public String detailPage(@PathVariable Long id, Model model) {
    model.addAttribute("projectId", id);
    return "project/detail";
}
```

#### 3.3.7 项目详情数据

**GET /project/detail/{id}/data**

| 项目 | 说明 |
|------|------|
| 描述 | 返回项目详情JSON数据 |
| 请求参数 | id（路径参数） |
| 响应 | Result\<ProjectDetailVO\> |

```java
@GetMapping("/detail/{id}/data")
@ResponseBody
public Result<ProjectDetailVO> detailData(@PathVariable Long id) {
    return Result.success(projectProvider.getProjectDetail(id));
}
```

#### 3.3.8 拉取PMS信息

**GET /project/pms/info**

| 项目 | 说明 |
|------|------|
| 描述 | 根据PMS项目ID拉取项目信息，用于创建项目时预填充 |
| 请求参数 | pmsProjectId（查询参数） |
| 响应 | Result\<PmsProjectInfo\> |

请求参数：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pmsProjectId | String | 是 | PMS项目ID |

PmsProjectInfo：

| 字段 | 类型 | 说明 |
|------|------|------|
| pmsProjectId | String | PMS项目ID |
| name | String | 项目名称 |
| bg | String | 业务集团 |
| pdtl | String | PDTL |
| trStage | String | TR阶段 |
| isLevel1 | Boolean | 是否1级项目 |

```java
@GetMapping("/pms/info")
@ResponseBody
public Result<PmsProjectInfo> pmsInfo(@RequestParam String pmsProjectId) {
    return Result.success(projectProvider.getPmsProjectInfo(pmsProjectId));
}
```

#### 3.3.9 权限列表

**GET /project/permission/{projectId}**

| 项目 | 说明 |
|------|------|
| 描述 | 获取项目权限列表 |
| 请求参数 | projectId（路径参数） |
| 响应 | Result\<List\<PermissionVO\>\> |

```java
@GetMapping("/permission/{projectId}")
@ResponseBody
public Result<List<PermissionVO>> permissionList(@PathVariable Long projectId) {
    return Result.success(projectProvider.getProjectPermissions(projectId));
}
```

#### 3.3.10 授予权限

**POST /project/permission/grant**

| 项目 | 说明 |
|------|------|
| 描述 | 给用户授予项目权限 |
| 请求参数 | JSON Body：PermissionGrantRequest |
| 响应 | Result\<Void\> |

PermissionGrantRequest：

| 字段 | 类型 | 必填 | 校验 | 说明 |
|------|------|------|------|------|
| projectId | Long | 是 | @NotNull | 项目ID |
| userId | String | 是 | @NotBlank | 用户ID |
| resourceType | String | 是 | @NotBlank | 资源类型 |
| permissionType | String | 是 | @NotBlank | 权限类型(manage/edit/read/review/approve) |

```java
@AuditLog(action = "GRANT_PERMISSION", resourceType = "PERMISSION")
@PostMapping("/permission/grant")
@ResponseBody
public Result<Void> grantPermission(@Valid @RequestBody PermissionGrantRequest request) {
    projectProvider.grantPermission(request);
    return Result.success();
}
```

#### 3.3.11 撤销权限

**POST /project/permission/revoke**

| 项目 | 说明 |
|------|------|
| 描述 | 撤销用户项目权限 |
| 请求参数 | JSON Body |
| 响应 | Result\<Void\> |

请求参数：

| 字段 | 类型 | 必填 | 校验 | 说明 |
|------|------|------|------|------|
| permissionId | Long | 是 | @NotNull | 权限记录ID |

```java
@AuditLog(action = "REVOKE_PERMISSION", resourceType = "PERMISSION")
@PostMapping("/permission/revoke")
@ResponseBody
public Result<Void> revokePermission(@RequestBody Map<String, Long> params) {
    projectProvider.revokePermission(params.get("permissionId"));
    return Result.success();
}
```

#### 3.3.12 同步PMS权限

**POST /project/permission/sync/{projectId}**

| 项目 | 说明 |
|------|------|
| 描述 | 从PMS同步项目成员权限 |
| 请求参数 | projectId（路径参数） |
| 响应 | Result\<Void\> |

```java
@AuditLog(action = "SYNC_PMS_PERMISSION", resourceType = "PERMISSION")
@PostMapping("/permission/sync/{projectId}")
@ResponseBody
public Result<Void> syncPmsPermission(@PathVariable Long projectId) {
    projectProvider.syncPmsPermission(projectId);
    return Result.success();
}
```

### 3.4 Provider接口设计

#### 3.4.1 接口定义

```java
package com.fmea.project.provider;

import com.fmea.common.core.result.PageResult;
import com.fmea.integration.pms.dto.PmsProjectInfo;
import com.fmea.project.dto.request.ProjectCreateRequest;
import com.fmea.project.dto.request.PermissionGrantRequest;
import com.fmea.project.dto.response.ProjectVO;
import com.fmea.project.dto.response.ProjectDetailVO;
import com.fmea.project.dto.response.PermissionVO;

import java.util.List;

public interface ProjectProvider {

    PageResult<ProjectVO> queryProjectPage(int page, int rows, String bg, String trStage);

    Long createProject(ProjectCreateRequest request);

    ProjectDetailVO getProjectDetail(Long projectId);

    PmsProjectInfo getPmsProjectInfo(String pmsProjectId);

    List<PermissionVO> getProjectPermissions(Long projectId);

    void grantPermission(PermissionGrantRequest request);

    void revokePermission(Long permissionId);

    void syncPmsPermission(Long projectId);
}
```

#### 3.4.2 方法详细设计

##### queryProjectPage

| 项目 | 说明 |
|------|------|
| 方法签名 | `PageResult<ProjectVO> queryProjectPage(int page, int rows, String bg, String trStage)` |
| 调用Service | ProjectService.queryPage, PermissionService |
| 事务边界 | 无@Transactional（只读查询） |
| 业务规则 | 1. 仅返回当前用户有阅读及以上权限的项目；2. 支持按BG和TR阶段筛选；3. 分页查询 |

业务流程：
1. 获取当前用户ID
2. 查询用户有权限的项目ID列表（PermissionService.getByUserId）
3. 调用ProjectService.queryPage，传入项目ID列表和筛选条件
4. 将FmeaProject转换为ProjectVO返回

##### createProject

| 项目 | 说明 |
|------|------|
| 方法签名 | `Long createProject(ProjectCreateRequest request)` |
| 调用Service | ProjectService, PermissionService |
| 调用集成服务 | PmsQueryService.getProjectInfo, PmsQueryService.isLevel1Project |
| 事务边界 | @Transactional(rollbackFor = Exception.class) |
| 业务规则 | 1. PMS项目ID唯一性校验；2. 从PMS拉取项目信息；3. 判定1级项目；4. 同步PMS权限 |

业务流程：
1. 校验PMS项目ID唯一性（ProjectService.getByPmsProjectId，若存在则抛出1002001）
2. 调用PmsQueryService.getProjectInfo拉取项目信息
3. 若request.name为空，使用PMS返回的项目名称
4. 调用PmsQueryService.isLevel1Project判定1级项目
5. 构建FmeaProject实体，调用ProjectService.save保存
6. 调用syncPmsPermission同步PMS权限
7. 返回项目ID

异常场景：

| 异常码 | 触发条件 |
|--------|----------|
| 1002001 | PMS项目ID已存在 |
| 1006001 | PMS项目信息查询失败 |
| 1007001 | PMS权限同步数据为空（不阻断项目创建，仅记录日志） |

##### getProjectDetail

| 项目 | 说明 |
|------|------|
| 方法签名 | `ProjectDetailVO getProjectDetail(Long projectId)` |
| 调用Service | ProjectService, PermissionService |
| 事务边界 | 无@Transactional（只读查询） |
| 业务规则 | 1. 校验项目存在；2. 校验用户有阅读权限；3. 组装详情数据 |

业务流程：
1. 调用ProjectService.getById查询项目，不存在则抛出1001001
2. 校验当前用户有阅读权限（PermissionService.hasPermission），无权限则抛出1005001
3. 查询项目权限列表（PermissionService.getByProjectId）
4. 组装ProjectDetailVO返回

##### grantPermission

| 项目 | 说明 |
|------|------|
| 方法签名 | `void grantPermission(PermissionGrantRequest request)` |
| 调用Service | PermissionService, ProjectService |
| 事务边界 | @Transactional(rollbackFor = Exception.class) |
| 业务规则 | 1. 校验操作者有管理权限；2. 管理权限不可通过此接口授予（仅PMS同步）；3. 同一用户同一项目同一资源类型同一权限类型不可重复 |

业务流程：
1. 校验项目存在（ProjectService.getById）
2. 校验操作者有管理权限（PermissionService.hasPermission），无权限则抛出1005002
3. 校验permissionType不为manage（管理权限仅PMS同步），违反则抛出1009001
4. 校验权限不重复（PermissionService检查唯一性），重复则抛出1002001
5. 构建FmeaPermission实体，调用PermissionService.save

##### revokePermission

| 项目 | 说明 |
|------|------|
| 方法签名 | `void revokePermission(Long permissionId)` |
| 调用Service | PermissionService |
| 事务边界 | @Transactional(rollbackFor = Exception.class) |
| 业务规则 | 1. 校验操作者有管理权限；2. 管理权限不可撤销（仅PMS同步管理） |

业务流程：
1. 查询权限记录（PermissionService.getById）
2. 校验操作者有该项目的管理权限
3. 校验被撤销的权限不是manage类型
4. 调用PermissionService.deleteById删除

##### syncPmsPermission

| 项目 | 说明 |
|------|------|
| 方法签名 | `void syncPmsPermission(Long projectId)` |
| 调用Service | ProjectService, PermissionService |
| 调用集成服务 | PmsQueryService.getProjectMembers |
| 事务边界 | @Transactional(rollbackFor = Exception.class) |
| 业务规则 | 1. 从PMS获取项目成员；2. 映射PMS角色为FMEA权限类型；3. 增量同步：新增权限写入，已有权限保留，PMS已移除的权限删除 |

业务流程：
1. 查询项目，获取pmsProjectId
2. 调用PmsQueryService.getProjectMembers获取PMS成员列表
3. 获取当前项目已有权限列表（PermissionService.getByProjectId）
4. 对比差异：
   - PMS有但本地无：新增权限记录
   - PMS有且本地有：保留（不更新）
   - PMS无但本地有（来源为PMS同步的）：删除
5. 批量写入新增权限（PermissionService.batchSave）

PMS角色到FMEA权限映射规则：

| PMS角色 | FMEA权限类型 |
|---------|-------------|
| PDTL | manage |
| TSE | manage |
| 分析人员 | edit |
| 评审人员 | review |
| 审批人员 | approve |
| 其他成员 | read |

### 3.5 Service接口设计

#### 3.5.1 ProjectService

```java
package com.fmea.project.service;

import com.fmea.common.core.result.PageResult;
import com.fmea.project.entity.FmeaProject;

public interface ProjectService {

    PageResult<FmeaProject> queryPage(int page, int rows, String bg, String trStage);

    FmeaProject getById(Long id);

    FmeaProject getByPmsProjectId(String pmsProjectId);

    Long save(FmeaProject project);

    void updateById(FmeaProject project);

    void updateIsLevel1(Long projectId, boolean isLevel1);
}
```

方法与Mapper调用关系：

| Service方法 | 调用的Mapper方法 | 说明 |
|-------------|-----------------|------|
| queryPage | ProjectMapper.selectPage | MyBatis Plus自动生成，传入LambdaQueryWrapper |
| getById | ProjectMapper.selectById | MyBatis Plus自动生成 |
| getByPmsProjectId | ProjectMapper.selectOne | 传入LambdaQueryWrapper(pmsProjectId=?) |
| save | ProjectMapper.insert | MyBatis Plus自动生成 |
| updateById | ProjectMapper.updateById | MyBatis Plus自动生成 |
| updateIsLevel1 | ProjectMapper.updateById | 仅更新is_level1字段 |

#### 3.5.2 DomainService

```java
package com.fmea.project.service;

import com.fmea.project.entity.FmeaDomain;

import java.util.List;

public interface DomainService {

    List<FmeaDomain> listAll();

    FmeaDomain getById(Long id);

    Long save(FmeaDomain domain);

    void updateById(FmeaDomain domain);

    void deleteById(Long id);
}
```

方法与Mapper调用关系：

| Service方法 | 调用的Mapper方法 | 说明 |
|-------------|-----------------|------|
| listAll | DomainMapper.selectList | 传入空Wrapper，查询未删除记录 |
| getById | DomainMapper.selectById | MyBatis Plus自动生成 |
| save | DomainMapper.insert | MyBatis Plus自动生成 |
| updateById | DomainMapper.updateById | MyBatis Plus自动生成 |
| deleteById | DomainMapper.deleteById | 逻辑删除（BaseEntity.isDeleted） |

#### 3.5.3 PermissionService

```java
package com.fmea.project.service;

import com.fmea.project.entity.FmeaPermission;

import java.util.List;

public interface PermissionService {

    List<FmeaPermission> getByProjectId(Long projectId);

    List<FmeaPermission> getByUserId(String userId);

    FmeaPermission getById(Long id);

    void save(FmeaPermission permission);

    void deleteById(Long id);

    void batchSave(List<FmeaPermission> permissions);

    boolean hasPermission(String userId, Long projectId, String permissionType);

    boolean hasAnyPermission(String userId, Long projectId);
}
```

方法与Mapper调用关系：

| Service方法 | 调用的Mapper方法 | 说明 |
|-------------|-----------------|------|
| getByProjectId | PermissionMapper.selectList | 传入projectId条件 |
| getByUserId | PermissionMapper.selectList | 传入userId条件 |
| getById | PermissionMapper.selectById | MyBatis Plus自动生成 |
| save | PermissionMapper.insert | MyBatis Plus自动生成 |
| deleteById | PermissionMapper.deleteById | 物理删除（fmea_permission无is_deleted字段） |
| batchSave | PermissionMapper.batchInsert | 自定义SQL，批量插入 |
| hasPermission | PermissionMapper.selectCount | 传入userId+projectId+permissionType条件 |
| hasAnyPermission | PermissionMapper.selectCount | 传入userId+projectId条件 |

### 3.6 Mapper设计

#### 3.6.1 ProjectMapper

```java
package com.fmea.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fmea.project.entity.FmeaProject;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectMapper extends BaseMapper<FmeaProject> {
}
```

说明：所有方法均由MyBatis Plus BaseMapper自动生成，无需自定义SQL。

- `selectPage`：分页查询，配合LambdaQueryWrapper实现BG、TR阶段筛选
- `selectById`：按主键查询
- `selectOne`：按pmsProjectId查询（通过Wrapper）
- `insert`：插入
- `updateById`：按主键更新

#### 3.6.2 DomainMapper

```java
package com.fmea.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fmea.project.entity.FmeaDomain;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DomainMapper extends BaseMapper<FmeaDomain> {
}
```

说明：所有方法均由MyBatis Plus BaseMapper自动生成，无需自定义SQL。

#### 3.6.3 PermissionMapper

```java
package com.fmea.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fmea.project.entity.FmeaPermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PermissionMapper extends BaseMapper<FmeaPermission> {

    void batchInsert(@Param("list") List<FmeaPermission> permissions);
}
```

自定义SQL（mapper XML）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.fmea.project.mapper.PermissionMapper">

    <insert id="batchInsert" parameterType="java.util.List">
        INSERT INTO fmea_permission (user_id, project_id, resource_type, permission_type, created_time)
        VALUES
        <foreach collection="list" item="item" separator=",">
            (#{item.userId}, #{item.projectId}, #{item.resourceType}, #{item.permissionType}, GETDATE())
        </foreach>
    </insert>

</mapper>
```

### 3.7 DTO/VO定义

#### 3.7.1 请求DTO

##### ProjectCreateRequest

```java
package com.fmea.project.dto.request;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class ProjectCreateRequest {

    @NotBlank(message = "PMS项目ID不能为空")
    @Size(max = 100, message = "PMS项目ID长度不能超过100")
    private String pmsProjectId;

    @Size(max = 200, message = "项目名称长度不能超过200")
    private String name;

    public String getPmsProjectId() { return pmsProjectId; }
    public void setPmsProjectId(String pmsProjectId) { this.pmsProjectId = pmsProjectId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

##### ProjectQueryRequest

```java
package com.fmea.project.dto.request;

public class ProjectQueryRequest {

    private String bg;
    private String trStage;

    public String getBg() { return bg; }
    public void setBg(String bg) { this.bg = bg; }
    public String getTrStage() { return trStage; }
    public void setTrStage(String trStage) { this.trStage = trStage; }
}
```

##### PermissionGrantRequest

```java
package com.fmea.project.dto.request;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class PermissionGrantRequest {

    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    @NotBlank(message = "用户ID不能为空")
    private String userId;

    @NotBlank(message = "资源类型不能为空")
    private String resourceType;

    @NotBlank(message = "权限类型不能为空")
    private String permissionType;

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getPermissionType() { return permissionType; }
    public void setPermissionType(String permissionType) { this.permissionType = permissionType; }
}
```

#### 3.7.2 响应VO

##### ProjectVO

```java
package com.fmea.project.dto.response;

import java.time.LocalDateTime;

public class ProjectVO {

    private Long id;
    private String name;
    private String bg;
    private String pdtl;
    private String trStage;
    private Boolean isLevel1;
    private String pmsProjectId;
    private LocalDateTime createdTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBg() { return bg; }
    public void setBg(String bg) { this.bg = bg; }
    public String getPdtl() { return pdtl; }
    public void setPdtl(String pdtl) { this.pdtl = pdtl; }
    public String getTrStage() { return trStage; }
    public void setTrStage(String trStage) { this.trStage = trStage; }
    public Boolean getIsLevel1() { return isLevel1; }
    public void setIsLevel1(Boolean isLevel1) { this.isLevel1 = isLevel1; }
    public String getPmsProjectId() { return pmsProjectId; }
    public void setPmsProjectId(String pmsProjectId) { this.pmsProjectId = pmsProjectId; }
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
}
```

##### ProjectDetailVO

```java
package com.fmea.project.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class ProjectDetailVO {

    private Long id;
    private String name;
    private String bg;
    private String pdtl;
    private String trStage;
    private Boolean isLevel1;
    private String pmsProjectId;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;

    private String systemEvalStatus;
    private String partEvalStatus;
    private String systemAnalysisStatus;
    private String partAnalysisStatus;

    private List<PermissionVO> permissions;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBg() { return bg; }
    public void setBg(String bg) { this.bg = bg; }
    public String getPdtl() { return pdtl; }
    public void setPdtl(String pdtl) { this.pdtl = pdtl; }
    public String getTrStage() { return trStage; }
    public void setTrStage(String trStage) { this.trStage = trStage; }
    public Boolean getIsLevel1() { return isLevel1; }
    public void setIsLevel1(Boolean isLevel1) { this.isLevel1 = isLevel1; }
    public String getPmsProjectId() { return pmsProjectId; }
    public void setPmsProjectId(String pmsProjectId) { this.pmsProjectId = pmsProjectId; }
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
    public LocalDateTime getUpdatedTime() { return updatedTime; }
    public void setUpdatedTime(LocalDateTime updatedTime) { this.updatedTime = updatedTime; }
    public String getSystemEvalStatus() { return systemEvalStatus; }
    public void setSystemEvalStatus(String systemEvalStatus) { this.systemEvalStatus = systemEvalStatus; }
    public String getPartEvalStatus() { return partEvalStatus; }
    public void setPartEvalStatus(String partEvalStatus) { this.partEvalStatus = partEvalStatus; }
    public String getSystemAnalysisStatus() { return systemAnalysisStatus; }
    public void setSystemAnalysisStatus(String systemAnalysisStatus) { this.systemAnalysisStatus = systemAnalysisStatus; }
    public String getPartAnalysisStatus() { return partAnalysisStatus; }
    public void setPartAnalysisStatus(String partAnalysisStatus) { this.partAnalysisStatus = partAnalysisStatus; }
    public List<PermissionVO> getPermissions() { return permissions; }
    public void setPermissions(List<PermissionVO> permissions) { this.permissions = permissions; }
}
```

##### PermissionVO

```java
package com.fmea.project.dto.response;

import java.time.LocalDateTime;

public class PermissionVO {

    private Long id;
    private String userId;
    private String userName;
    private Long projectId;
    private String projectName;
    private String resourceType;
    private String permissionType;
    private LocalDateTime createdTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getPermissionType() { return permissionType; }
    public void setPermissionType(String permissionType) { this.permissionType = permissionType; }
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
}
```

### 3.8 Entity定义

#### 3.8.1 FmeaProject

```java
package com.fmea.project.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.fmea.common.core.entity.BaseEntity;

@TableName("fmea_project")
public class FmeaProject extends BaseEntity {

    private String name;
    private String bg;
    private String pdtl;
    private String trStage;
    private Boolean isLevel1;
    private String pmsProjectId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBg() { return bg; }
    public void setBg(String bg) { this.bg = bg; }
    public String getPdtl() { return pdtl; }
    public void setPdtl(String pdtl) { this.pdtl = pdtl; }
    public String getTrStage() { return trStage; }
    public void setTrStage(String trStage) { this.trStage = trStage; }
    public Boolean getIsLevel1() { return isLevel1; }
    public void setIsLevel1(Boolean isLevel1) { this.isLevel1 = isLevel1; }
    public String getPmsProjectId() { return pmsProjectId; }
    public void setPmsProjectId(String pmsProjectId) { this.pmsProjectId = pmsProjectId; }
}
```

#### 3.8.2 FmeaDomain

```java
package com.fmea.project.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.fmea.common.core.entity.BaseEntity;

@TableName("fmea_domain")
public class FmeaDomain extends BaseEntity {

    private String domainName;
    private String domainDesc;
    private String role;
    private String roleRepresentative;

    public String getDomainName() { return domainName; }
    public void setDomainName(String domainName) { this.domainName = domainName; }
    public String getDomainDesc() { return domainDesc; }
    public void setDomainDesc(String domainDesc) { this.domainDesc = domainDesc; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getRoleRepresentative() { return roleRepresentative; }
    public void setRoleRepresentative(String roleRepresentative) { this.roleRepresentative = roleRepresentative; }
}
```

#### 3.8.3 FmeaPermission

```java
package com.fmea.project.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.io.Serializable;
import java.time.LocalDateTime;

@TableName("fmea_permission")
public class FmeaPermission implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;
    private String userId;
    private Long projectId;
    private String resourceType;
    private String permissionType;
    private LocalDateTime createdTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getPermissionType() { return permissionType; }
    public void setPermissionType(String permissionType) { this.permissionType = permissionType; }
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
}
```

### 3.9 枚举定义

#### 3.9.1 PermissionType

```java
package com.fmea.project.enums;

public enum PermissionType {

    MANAGE("manage", "管理权限"),
    EDIT("edit", "编辑权限"),
    READ("read", "阅读权限"),
    REVIEW("review", "评审权限"),
    APPROVE("approve", "审批权限");

    private final String code;
    private final String description;

    PermissionType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() { return code; }
    public String getDescription() { return description; }

    public static PermissionType fromCode(String code) {
        for (PermissionType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown permission type: " + code);
    }
}
```

#### 3.9.2 ResourceType

```java
package com.fmea.project.enums;

public enum ResourceType {

    PROJECT("project", "项目"),
    EVALUATION("evaluation", "评估任务"),
    ANALYSIS("analysis", "分析任务"),
    BASELINE("baseline", "基线"),
    REVIEW("review", "评审"),
    LIBRARY("library", "基线库");

    private final String code;
    private final String description;

    ResourceType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() { return code; }
    public String getDescription() { return description; }
}
```

### 3.10 Converter定义

```java
package com.fmea.project.converter;

import com.fmea.project.dto.response.ProjectVO;
import com.fmea.project.dto.response.PermissionVO;
import com.fmea.project.entity.FmeaProject;
import com.fmea.project.entity.FmeaPermission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper
public interface ProjectConverter {

    ProjectConverter INSTANCE = Mappers.getMapper(ProjectConverter.class);

    ProjectVO toVO(FmeaProject project);

    @Mapping(target = "userName", ignore = true)
    @Mapping(target = "projectName", ignore = true)
    PermissionVO toPermissionVO(FmeaPermission permission);
}
```

### 3.11 业务规则

#### 3.11.1 项目创建规则

| 规则编号 | 规则描述 | 校验方式 | 错误码 |
|----------|----------|----------|--------|
| PRJ-001 | PMS项目ID唯一性 | 创建前查询fmea_project表 | 1002001 |
| PRJ-002 | 项目名称来源 | name为空时从PMS拉取，否则使用请求值 | — |
| PRJ-003 | 1级项目判定 | 调用PmsQueryService.isLevel1Project，结果缓存30分钟 | — |
| PRJ-004 | 创建后同步权限 | 调用PmsQueryService.getProjectMembers，映射为FMEA权限 | 1007001 |

#### 3.11.2 权限管理规则

| 规则编号 | 规则描述 | 校验方式 | 错误码 |
|----------|----------|----------|--------|
| PERM-001 | 权限类型限制 | manage权限仅通过PMS同步，不可手动授予 | 1009001 |
| PERM-002 | 权限唯一性 | 同一用户+项目+资源类型+权限类型不可重复 | 1002001 |
| PERM-003 | 管理权限不可撤销 | manage类型权限不提供撤销入口 | 1009001 |
| PERM-004 | 操作权限校验 | 授予/撤销权限需操作者有manage权限 | 1005002 |
| PERM-005 | 权限数据来源 | 权限主要从PMS同步，本地可补充edit/read/review/approve | — |

#### 3.11.3 1级项目判定规则

| 规则编号 | 规则描述 | 实现方式 |
|----------|----------|----------|
| LVL-001 | 判定数据来源 | 从PMS系统获取，调用PmsQueryService.isLevel1Project |
| LVL-002 | 缓存策略 | Redis缓存，key: `pms:level1:{pmsProjectId}`，TTL: 30分钟 |
| LVL-003 | 缓存更新 | 缓存过期后下次访问时重新从PMS拉取 |
| LVL-004 | 降级策略 | PMS不可用时使用缓存数据，缓存也失效则抛出1009001 |

#### 3.11.4 PMS权限同步规则

| 规则编号 | 规则描述 | 实现方式 |
|----------|----------|----------|
| SYNC-001 | 同步触发时机 | 项目创建时自动同步；用户手动点击同步按钮 |
| SYNC-002 | 增量同步 | PMS有本地无→新增；PMS无本地有（来源PMS）→删除；两者都有→保留 |
| SYNC-003 | 角色映射 | PDTL/TSE→manage；分析人员→edit；评审人员→review；审批人员→approve；其他→read |
| SYNC-004 | 同步不阻断 | PMS查询失败不阻断项目创建，仅记录日志 |
| SYNC-005 | 缓存策略 | PMS成员查询结果缓存10分钟，key: `pms:members:{pmsProjectId}` |

### 3.12 Provider实现示例

```java
package com.fmea.project.provider.impl;

import com.fmea.common.core.exception.BusinessException;
import com.fmea.common.core.result.PageResult;
import com.fmea.integration.pms.PmsQueryService;
import com.fmea.integration.pms.dto.PmsProjectInfo;
import com.fmea.integration.pms.dto.PmsProjectMember;
import com.fmea.project.converter.ProjectConverter;
import com.fmea.project.dto.request.ProjectCreateRequest;
import com.fmea.project.dto.request.PermissionGrantRequest;
import com.fmea.project.dto.response.ProjectDetailVO;
import com.fmea.project.dto.response.ProjectVO;
import com.fmea.project.dto.response.PermissionVO;
import com.fmea.project.entity.FmeaPermission;
import com.fmea.project.entity.FmeaProject;
import com.fmea.project.provider.ProjectProvider;
import com.fmea.project.service.PermissionService;
import com.fmea.project.service.ProjectService;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectProviderImpl implements ProjectProvider {

    private static final Logger log = LoggerFactory.getLogger(ProjectProviderImpl.class);

    @Autowired
    private ProjectService projectService;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private PmsQueryService pmsQueryService;

    @Override
    public PageResult<ProjectVO> queryProjectPage(int page, int rows, String bg, String trStage) {
        PageResult<FmeaProject> pageResult = projectService.queryPage(page, rows, bg, trStage);
        List<ProjectVO> voList = pageResult.getRows().stream()
                .map(ProjectConverter.INSTANCE::toVO)
                .collect(Collectors.toList());
        return PageResult.of(pageResult.getTotal(), voList);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createProject(ProjectCreateRequest request) {
        FmeaProject existing = projectService.getByPmsProjectId(request.getPmsProjectId());
        if (existing != null) {
            throw new BusinessException(1002001, "PMS项目ID已存在");
        }

        PmsProjectInfo pmsInfo;
        try {
            pmsInfo = pmsQueryService.getProjectInfo(request.getPmsProjectId());
        } catch (Exception e) {
            log.error("PMS项目信息查询失败: pmsProjectId={}", request.getPmsProjectId(), e);
            throw new BusinessException(1006001, "PMS项目信息查询失败");
        }

        FmeaProject project = new FmeaProject();
        project.setPmsProjectId(request.getPmsProjectId());
        project.setName(request.getName() != null ? request.getName() : pmsInfo.getName());
        project.setBg(pmsInfo.getBg());
        project.setPdtl(pmsInfo.getPdtl());
        project.setTrStage(pmsInfo.getTrStage());

        try {
            boolean isLevel1 = pmsQueryService.isLevel1Project(request.getPmsProjectId());
            project.setIsLevel1(isLevel1);
        } catch (Exception e) {
            log.warn("1级项目判定失败，默认为非1级项目: pmsProjectId={}", request.getPmsProjectId(), e);
            project.setIsLevel1(false);
        }

        Long projectId = projectService.save(project);

        try {
            syncPmsPermission(projectId);
        } catch (Exception e) {
            log.warn("PMS权限同步失败，项目已创建: projectId={}", projectId, e);
        }

        return projectId;
    }

    @Override
    public ProjectDetailVO getProjectDetail(Long projectId) {
        FmeaProject project = projectService.getById(projectId);
        if (project == null) {
            throw new BusinessException(1001001, "项目不存在");
        }

        ProjectDetailVO detail = new ProjectDetailVO();
        detail.setId(project.getId());
        detail.setName(project.getName());
        detail.setBg(project.getBg());
        detail.setPdtl(project.getPdtl());
        detail.setTrStage(project.getTrStage());
        detail.setIsLevel1(project.getIsLevel1());
        detail.setPmsProjectId(project.getPmsProjectId());
        detail.setCreatedTime(project.getCreatedTime());
        detail.setUpdatedTime(project.getUpdatedTime());

        List<FmeaPermission> permissions = permissionService.getByProjectId(projectId);
        List<PermissionVO> permissionVOs = permissions.stream()
                .map(ProjectConverter.INSTANCE::toPermissionVO)
                .collect(Collectors.toList());
        detail.setPermissions(permissionVOs);

        return detail;
    }

    @Override
    public PmsProjectInfo getPmsProjectInfo(String pmsProjectId) {
        try {
            return pmsQueryService.getProjectInfo(pmsProjectId);
        } catch (Exception e) {
            log.error("PMS项目信息查询失败: pmsProjectId={}", pmsProjectId, e);
            throw new BusinessException(1006001, "PMS项目信息查询失败");
        }
    }

    @Override
    public List<PermissionVO> getProjectPermissions(Long projectId) {
        List<FmeaPermission> permissions = permissionService.getByProjectId(projectId);
        return permissions.stream()
                .map(ProjectConverter.INSTANCE::toPermissionVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void grantPermission(PermissionGrantRequest request) {
        FmeaProject project = projectService.getById(request.getProjectId());
        if (project == null) {
            throw new BusinessException(1001001, "项目不存在");
        }

        if ("manage".equals(request.getPermissionType())) {
            throw new BusinessException(1009001, "管理权限仅通过PMS同步，不可手动授予");
        }

        FmeaPermission permission = new FmeaPermission();
        permission.setUserId(request.getUserId());
        permission.setProjectId(request.getProjectId());
        permission.setResourceType(request.getResourceType());
        permission.setPermissionType(request.getPermissionType());
        permissionService.save(permission);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void revokePermission(Long permissionId) {
        FmeaPermission permission = permissionService.getById(permissionId);
        if (permission == null) {
            throw new BusinessException(1001001, "权限记录不存在");
        }

        if ("manage".equals(permission.getPermissionType())) {
            throw new BusinessException(1009001, "管理权限不可撤销");
        }

        permissionService.deleteById(permissionId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void syncPmsPermission(Long projectId) {
        FmeaProject project = projectService.getById(projectId);
        if (project == null) {
            throw new BusinessException(1001001, "项目不存在");
        }

        List<PmsProjectMember> pmsMembers;
        try {
            pmsMembers = pmsQueryService.getProjectMembers(project.getPmsProjectId());
        } catch (Exception e) {
            log.error("PMS成员查询失败: pmsProjectId={}", project.getPmsProjectId(), e);
            throw new BusinessException(1006002, "PMS权限同步失败");
        }

        if (pmsMembers == null || pmsMembers.isEmpty()) {
            log.warn("PMS成员列表为空: pmsProjectId={}", project.getPmsProjectId());
            return;
        }

        List<FmeaPermission> existingPermissions = permissionService.getByProjectId(projectId);
        List<FmeaPermission> newPermissions = new ArrayList<>();

        for (PmsProjectMember member : pmsMembers) {
            String permissionType = mapPmsRoleToPermissionType(member.getRole());
            boolean exists = existingPermissions.stream()
                    .anyMatch(p -> p.getUserId().equals(member.getUserId())
                            && p.getPermissionType().equals(permissionType));
            if (!exists) {
                FmeaPermission permission = new FmeaPermission();
                permission.setUserId(member.getUserId());
                permission.setProjectId(projectId);
                permission.setResourceType("project");
                permission.setPermissionType(permissionType);
                newPermissions.add(permission);
            }
        }

        if (!newPermissions.isEmpty()) {
            permissionService.batchSave(newPermissions);
        }
    }

    private String mapPmsRoleToPermissionType(String pmsRole) {
        if (pmsRole == null) {
            return "read";
        }
        switch (pmsRole.toUpperCase()) {
            case "PDTL":
            case "TSE":
                return "manage";
            case "ANALYST":
                return "edit";
            case "REVIEWER":
                return "review";
            case "APPROVER":
                return "approve";
            default:
                return "read";
        }
    }
}
```


## 4. DRBFM分析模块（fmea-analysis）

### 4.1 模块概述

| 维度 | 说明 |
|------|------|
| 包路径 | `com.fmea.analysis` |
| 模块定位 | DRBFM分析核心模块，承接评估确认后生成的分析任务，按步骤流转完成结构分析→功能分析→失效分析→SOD评分→基线输出 |
| 数据库表 | `fmea_analysis_task`, `fmea_structure_diagram`, `fmea_structure_node`, `fmea_structure_edge`, `fmea_interface_table`, `fmea_function_matrix`, `fmea_function_item`, `fmea_function_mapping`, `fmea_failure_analysis`, `fmea_ai_generation_temp`, `fmea_failure_mode`, `fmea_failure_cause`, `fmea_failure_effect`, `fmea_preventive_measure`, `fmea_detection_measure`, `fmea_optimization_measure`, `fmea_sod_rating` |
| 关联集成模块 | `LarkService`（飞书画板创建/回读/导出）、`AiService`（AI异步/同步生成） |
| 关联业务模块 | `EvaluationService`（只读评估数据）、`ProjectService`（只读项目数据） |

---

### 4.2 包结构

```
com.fmea.analysis/
├── controller/
│   └── AnalysisController.java
├── provider/
│   ├── AnalysisProvider.java
│   └── impl/
│       └── AnalysisProviderImpl.java
├── service/
│   ├── AnalysisTaskService.java
│   ├── StructureDiagramService.java
│   ├── StructureNodeService.java
│   ├── StructureEdgeService.java
│   ├── InterfaceTableService.java
│   ├── FunctionMatrixService.java
│   ├── FunctionItemService.java
│   ├── FunctionMappingService.java
│   ├── FailureAnalysisService.java
│   ├── FailureModeService.java
│   ├── FailureCauseService.java
│   ├── FailureEffectService.java
│   ├── PreventiveMeasureService.java
│   ├── DetectionMeasureService.java
│   ├── OptimizationMeasureService.java
│   ├── SodRatingService.java
│   ├── AiGenerationTempService.java
│   └── impl/
│       ├── AnalysisTaskServiceImpl.java
│       ├── StructureDiagramServiceImpl.java
│       ├── StructureNodeServiceImpl.java
│       ├── StructureEdgeServiceImpl.java
│       ├── InterfaceTableServiceImpl.java
│       ├── FunctionMatrixServiceImpl.java
│       ├── FunctionItemServiceImpl.java
│       ├── FunctionMappingServiceImpl.java
│       ├── FailureAnalysisServiceImpl.java
│       ├── FailureModeServiceImpl.java
│       ├── FailureCauseServiceImpl.java
│       ├── FailureEffectServiceImpl.java
│       ├── PreventiveMeasureServiceImpl.java
│       ├── DetectionMeasureServiceImpl.java
│       ├── OptimizationMeasureServiceImpl.java
│       ├── SodRatingServiceImpl.java
│       └── AiGenerationTempServiceImpl.java
├── mapper/
│   ├── AnalysisTaskMapper.java
│   ├── StructureDiagramMapper.java
│   ├── StructureNodeMapper.java
│   ├── StructureEdgeMapper.java
│   ├── InterfaceTableMapper.java
│   ├── FunctionMatrixMapper.java
│   ├── FunctionItemMapper.java
│   ├── FunctionMappingMapper.java
│   ├── FailureAnalysisMapper.java
│   ├── AiGenerationTempMapper.java
│   ├── FailureModeMapper.java
│   ├── FailureCauseMapper.java
│   ├── FailureEffectMapper.java
│   ├── PreventiveMeasureMapper.java
│   ├── DetectionMeasureMapper.java
│   ├── OptimizationMeasureMapper.java
│   └── SodRatingMapper.java
├── entity/
│   ├── AnalysisTask.java
│   ├── StructureDiagram.java
│   ├── StructureNode.java
│   ├── StructureEdge.java
│   ├── InterfaceTable.java
│   ├── FunctionMatrix.java
│   ├── FunctionItem.java
│   ├── FunctionMapping.java
│   ├── FailureAnalysis.java
│   ├── AiGenerationTemp.java
│   ├── FailureMode.java
│   ├── FailureCause.java
│   ├── FailureEffect.java
│   ├── PreventiveMeasure.java
│   ├── DetectionMeasure.java
│   ├── OptimizationMeasure.java
│   └── SodRating.java
├── dto/
│   ├── request/
│   │   ├── StructureDiagramCreateRequest.java
│   │   ├── InterfaceTableSaveRequest.java
│   │   ├── FunctionMatrixConfirmRequest.java
│   │   ├── AiGenerateRequest.java
│   │   ├── AiAdoptRequest.java
│   │   ├── SodRatingSaveRequest.java
│   │   ├── FailureAnalysisSaveRequest.java
│   │   └── AnalysisStepNextRequest.java
│   └── response/
│       ├── AnalysisTaskVO.java
│       ├── StructureDiagramVO.java
│       ├── FunctionMatrixVO.java
│       ├── FailureAnalysisVO.java
│       ├── SodRatingVO.java
│       ├── AiGenerationResultVO.java
│       └── AiTaskStatusVO.java
├── enums/
│   ├── AnalysisStatus.java
│   ├── FailureModeType.java
│   ├── CauseDimension.java
│   ├── EffectLevel.java
│   ├── InterfaceType.java
│   └── MeasureSourceType.java
└── converter/
    └── AnalysisConverter.java
```

---

### 4.3 Controller API设计

#### 4.3.1 API总览

| API | 方法 | URL | 说明 |
|-----|------|-----|------|
| 分析任务列表页 | GET | /analysis/list | FTL视图 |
| 分析任务数据 | GET | /analysis/data | JSON分页 |
| 分析任务详情页 | GET | /analysis/detail/{id} | FTL视图 |
| 分析任务详情数据 | GET | /analysis/detail/{id}/data | JSON |
| 结构分析页 | GET | /analysis/structure/{taskId} | FTL视图 |
| 创建飞书画板 | POST | /analysis/structure/board/{taskId} | JSON |
| 获取画板URL | GET | /analysis/structure/board-url/{taskId} | JSON |
| 保存接口表格 | POST | /analysis/structure/interface | JSON |
| 回读画板数据 | POST | /analysis/structure/sync/{taskId} | JSON |
| 从评估表生成框图 | POST | /analysis/structure/generate-from-eval/{taskId} | JSON |
| 导入历史框图 | POST | /analysis/structure/import-history/{taskId} | multipart |
| 导出框图图片（仅PNG格式） | GET | /analysis/structure/export-image/{taskId} | binary |
| 功能分析页 | GET | /analysis/function/{taskId} | FTL视图 |
| 获取功能矩阵 | GET | /analysis/function/matrix/{taskId} | JSON |
| AI补充功能 | POST | /analysis/function/ai-supplement/{taskId} | JSON(异步) |
| 导入历史问题 | POST | /analysis/function/import-history | multipart |
| 导入技术要求 | POST | /analysis/function/import-requirement | multipart |
| 导入需求分析 | POST | /analysis/function/import-needs | multipart |
| 确认功能矩阵 | POST | /analysis/function/confirm/{taskId} | JSON |
| 失效分析页 | GET | /analysis/failure/{taskId} | FTL视图 |
| AI生成失效模式 | POST | /analysis/failure/ai-generate-mode/{taskId} | JSON(异步) |
| AI生成失效原因 | POST | /analysis/failure/ai-generate-cause/{taskId} | JSON(异步) |
| AI生成失效影响 | POST | /analysis/failure/ai-generate-effect/{taskId} | JSON(异步) |
| AI生成预防措施 | POST | /analysis/failure/ai-generate-preventive/{taskId} | JSON(异步) |
| AI生成探测措施 | POST | /analysis/failure/ai-generate-detection/{taskId} | JSON(异步) |
| 采纳AI结果 | POST | /analysis/failure/ai-adopt | JSON |
| 保存失效分析 | POST | /analysis/failure/save | JSON |
| SOD评分页 | GET | /analysis/sod/{taskId} | FTL视图 |
| AI建议SOD | POST | /analysis/sod/ai-suggest/{modeId} | JSON(同步) |
| 保存SOD评分 | POST | /analysis/sod/save | JSON |
| 步骤流转 | POST | /analysis/step/next/{taskId} | JSON |
| AI任务状态 | GET | /analysis/ai/task-status | JSON(轮询) |

#### 4.3.2 API详细定义

##### 1. 分析任务列表页

```
GET /analysis/list
```

**返回**：FTL视图名 `analysis/list`

**Model属性**：

| 字段 | 类型 | 说明 |
|------|------|------|
| projectId | String | 当前项目ID（从查询参数传入） |
| projectName | String | 项目名称 |

---

##### 2. 分析任务数据

```
GET /analysis/data?page=1&rows=20&projectId=xxx
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| rows | int | 否 | 每页条数，默认20 |
| projectId | String | 是 | 项目ID |

**响应**：`PageResult<AnalysisTaskVO>`

| 字段 | 类型 | 说明 |
|------|------|------|
| total | long | 总记录数 |
| rows | List\<AnalysisTaskVO\> | 数据列表 |

**AnalysisTaskVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 分析任务ID |
| projectId | Long | 项目ID |
| projectName | String | 项目名称 |
| evaluationTaskId | Long | 关联评估任务ID |
| level | String | 层级（system/component） |
| status | String | 当前状态 |
| statusLabel | String | 状态中文标签 |
| responsible | String | 负责人 |
| createdTime | LocalDateTime | 创建时间 |
| updatedTime | LocalDateTime | 更新时间 |

---

##### 3. 分析任务详情页

```
GET /analysis/detail/{id}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 分析任务ID |

**返回**：FTL视图名 `analysis/detail`

**Model属性**：

| 字段 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |
| task | AnalysisTaskVO | 分析任务详情 |

---

##### 4. 分析任务详情数据

```
GET /analysis/detail/{id}/data
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 分析任务ID |

**响应**：`Result<AnalysisTaskVO>`

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码 |
| data | AnalysisTaskVO | 分析任务详情（同上） |

---

##### 5. 结构分析页

```
GET /analysis/structure/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**返回**：FTL视图名 `analysis/structure`

**Model属性**：

| 字段 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |
| larkBoardUrl | String | 飞书画板URL（已创建时非空） |
| diagramId | Long | 结构图ID（已创建时非空） |

---

##### 6. 创建飞书画板

```
POST /analysis/structure/board/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<StructureDiagramVO>`

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码 |
| data | StructureDiagramVO | 结构图信息 |

**StructureDiagramVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 结构图ID |
| analysisTaskId | Long | 分析任务ID |
| larkDocId | String | 飞书文档ID |
| larkBoardId | String | 飞书画板ID |
| larkBoardUrl | String | 飞书画板URL |
| version | int | 版本号 |

---

##### 7. 获取画板URL

```
GET /analysis/structure/board-url/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**响应**：`Result<Map<String, String>>`

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码 |
| data.boardUrl | String | 飞书画板URL |
| data.diagramId | Long | 结构图ID |

---

##### 8. 保存接口表格

```
POST /analysis/structure/interface
```

**请求体**：`List<InterfaceTableSaveRequest>`

**InterfaceTableSaveRequest**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diagramId | Long | 是 | 结构图ID |
| sourceNode | String | 是 | 起点节点名称 |
| targetNode | String | 是 | 终点节点名称 |
| functionDesc | String | 否 | 功能描述 |
| functionType | String | 否 | 功能类型（PHYSICAL/MATERIAL/ENERGY/SIGNAL） |

**响应**：`Result<Void>`

---

##### 9. 回读画板数据

```
POST /analysis/structure/sync/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<Void>`

说明：后端调用飞书API读取画板节点和边数据，解析后写入`fmea_structure_node`和`fmea_structure_edge`表。

---

##### 10. 从评估表生成框图

```
POST /analysis/structure/generate-from-eval/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<StructureDiagramVO>`

说明：从评估分析表读取节点组成成分，以Mermaid语法生成初图，通过飞书API写入画板。

---

##### 11. 导入历史框图

```
POST /analysis/structure/import-history/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | MultipartFile | 是 | 历史框图文件（JSON格式） |

**响应**：`Result<Void>`

---

##### 12. 导出框图图片（仅PNG格式）

```
GET /analysis/structure/export-image/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**响应**：`byte[]`（二进制流，Content-Type: image/png）

---

##### 13. 功能分析页

```
GET /analysis/function/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**返回**：FTL视图名 `analysis/function-matrix`

**Model属性**：

| 字段 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |
| matrixId | Long | 功能矩阵ID（已创建时非空） |

---

##### 14. 获取功能矩阵

```
GET /analysis/function/matrix/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**响应**：`Result<FunctionMatrixVO>`

**FunctionMatrixVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| matrixId | Long | 矩阵ID |
| analysisTaskId | Long | 分析任务ID |
| version | int | 版本号 |
| confirmed | boolean | 是否已确认 |
| nodes | List\<MatrixNodeDTO\> | 横轴器件列表 |
| functions | List\<MatrixFunctionDTO\> | 纵轴功能列表 |
| mappings | List\<MatrixMappingDTO\> | 关联关系列表 |

**MatrixNodeDTO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| nodeId | Long | 节点ID |
| name | String | 器件名称 |
| riskLevel | String | 风险等级（H/M/L） |

**MatrixFunctionDTO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| functionId | Long | 功能ID |
| description | String | 功能描述 |
| abundanceOrder | Integer | 关联接口数量，用于排序 |
| source | String | 来源（edge/ai_attachment/library） |
| isChangeRelated | Boolean | 是否与变更点关联（对应fmea_function_item.is_change_related字段） |

**MatrixMappingDTO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| functionId | Long | 功能ID |
| nodeId | Long | 节点ID |
| isRelated | boolean | 是否关联 |
| riskLevel | String | 风险等级 |

---

##### 15. AI补充功能

```
POST /analysis/function/ai-supplement/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<Map<String, String>>`

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码 |
| data.aiTaskId | String | AI异步任务ID，供轮询使用 |

---

##### 16. 导入历史问题

```
POST /analysis/function/import-history
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | MultipartFile | 是 | 历史问题Excel文件 |
| taskId | Long | 是 | 分析任务ID |

**响应**：`Result<Integer>`

| 字段 | 类型 | 说明 |
|------|------|------|
| data | Integer | 导入条数 |

---

##### 17. 导入技术要求

```
POST /analysis/function/import-requirement
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | MultipartFile | 是 | 技术要求Word文档 |
| taskId | Long | 是 | 分析任务ID |

**响应**：`Result<Void>`

---

##### 18. 导入需求分析

```
POST /analysis/function/import-needs
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | MultipartFile | 是 | 需求分析文档（Word/PDF） |
| taskId | Long | 是 | 分析任务ID |

**响应**：`Result<Void>`

---

##### 19. 确认功能矩阵

```
POST /analysis/function/confirm/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：`FunctionMatrixConfirmRequest`

**FunctionMatrixConfirmRequest**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 分析任务ID |
| mappings | List\<MatrixMappingDTO\> | 是 | 确认后的关联关系列表 |

**响应**：`Result<Void>`

---

##### 20. 失效分析页

```
GET /analysis/failure/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**返回**：FTL视图名 `analysis/failure`

**Model属性**：

| 字段 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |
| analysisId | Long | 失效分析ID |

---

##### 21. AI生成失效模式

```
POST /analysis/failure/ai-generate-mode/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<Map<String, String>>`

| 字段 | 类型 | 说明 |
|------|------|------|
| data.aiTaskId | String | AI异步任务ID |

---

##### 22. AI生成失效原因

```
POST /analysis/failure/ai-generate-cause/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<Map<String, String>>`

| 字段 | 类型 | 说明 |
|------|------|------|
| data.aiTaskId | String | AI异步任务ID |

---

##### 23. AI生成失效影响

```
POST /analysis/failure/ai-generate-effect/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<Map<String, String>>`

| 字段 | 类型 | 说明 |
|------|------|------|
| data.aiTaskId | String | AI异步任务ID |

---

##### 24. AI生成预防措施

```
POST /analysis/failure/ai-generate-preventive/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<Map<String, String>>`

| 字段 | 类型 | 说明 |
|------|------|------|
| data.aiTaskId | String | AI异步任务ID |

---

##### 25. AI生成探测措施

```
POST /analysis/failure/ai-generate-detection/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<Map<String, String>>`

| 字段 | 类型 | 说明 |
|------|------|------|
| data.aiTaskId | String | AI异步任务ID |

---

##### 26. 采纳AI结果

```
POST /analysis/failure/ai-adopt
```

**请求体**：`AiAdoptRequest`

**AiAdoptRequest**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| analysisTaskId | Long | 是 | 分析任务ID |
| generationType | String | 是 | 生成类型（failure_mode/failure_cause/failure_effect/preventive_measure/detection_measure） |
| tempIds | List\<Long\> | 是 | 要采纳的临时记录ID列表 |

**响应**：`Result<Void>`

---

##### 27. 保存失效分析

```
POST /analysis/failure/save
```

**请求体**：`FailureAnalysisSaveRequest`

**FailureAnalysisSaveRequest**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 分析任务ID |
| modes | List\<FailureModeDTO\> | 否 | 失效模式列表 |
| causes | List\<FailureCauseDTO\> | 否 | 失效原因列表 |
| effects | List\<FailureEffectDTO\> | 否 | 失效影响列表 |
| preventiveMeasures | List\<PreventiveMeasureDTO\> | 否 | 预防措施列表 |
| detectionMeasures | List\<DetectionMeasureDTO\> | 否 | 探测措施列表 |
| optimizationMeasures | List\<OptimizationMeasureDTO\> | 否 | 优化措施列表 |

**FailureModeDTO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否 | ID（新增为空，编辑时传入） |
| analysisId | Long | 是 | 失效分析ID |
| functionId | Long | 否 | 关联功能ID |
| modeType | String | 是 | 失效模式类型枚举 |
| description | String | 是 | 描述 |
| source | String | 否 | 来源（ai/manual） |

**FailureCauseDTO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否 | ID |
| modeId | Long | 是 | 关联失效模式ID |
| causeDimension | String | 是 | 原因维度枚举 |
| description | String | 是 | 描述 |
| changePointRef | String | 否 | 变更点引用 |

**FailureEffectDTO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否 | ID |
| modeId | Long | 是 | 关联失效模式ID |
| effectLevel | String | 是 | 影响层级枚举 |
| description | String | 是 | 描述 |

**PreventiveMeasureDTO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否 | ID |
| causeId | Long | 是 | 关联失效原因ID |
| description | String | 是 | 描述 |
| measureType | String | 否 | 措施类型（design/process/monitor） |
| source | String | 否 | 来源 |

**DetectionMeasureDTO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否 | ID |
| causeId | Long | 是 | 关联失效原因ID |
| phase | String | 否 | 探测阶段 |
| target | String | 否 | 探测对象 |
| method | String | 否 | 探测方法 |
| source | String | 否 | 来源 |

**OptimizationMeasureDTO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否 | ID |
| causeId | Long | 是 | 关联失效原因ID |
| description | String | 是 | 描述 |
| source | String | 否 | 来源 |

**响应**：`Result<Void>`

---

##### 28. SOD评分页

```
GET /analysis/sod/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**返回**：FTL视图名 `analysis/sod-rating`

**Model属性**：

| 字段 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

---

##### 29. AI建议SOD

```
POST /analysis/sod/ai-suggest/{modeId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| modeId | Long | 失效模式ID |

**请求体**：无

**响应**：`Result<SodRatingVO>`

**SodRatingVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| failureModeId | Long | 失效模式ID |
| severity | Integer | 严重度（1-10） |
| occurrence | Integer | 发生度（1-10） |
| detection | Integer | 探测度（1-10） |
| apLevel | String | AP等级（H/M/L） |
| modeType | Integer | 评分模式（1或2） |
| aiSuggestedS | Integer | AI建议严重度 |
| aiSuggestedO | Integer | AI建议发生度 |
| aiSuggestedD | Integer | AI建议探测度 |

---

##### 30. 保存SOD评分

```
POST /analysis/sod/save
```

**请求体**：`SodRatingSaveRequest`

**SodRatingSaveRequest**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ratings | List\<SodRatingItem\> | 是 | 评分列表 |

**SodRatingItem**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| failureModeId | Long | 是 | 失效模式ID |
| severity | Integer | 是 | 严重度（1-10） |
| occurrence | Integer | 是 | 发生度（1-10） |
| detection | Integer | 是 | 探测度（1-10） |
| modeType | Integer | 否 | 评分模式，默认2 |

**响应**：`Result<Void>`

---

##### 31. 步骤流转

```
POST /analysis/step/next/{taskId}
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| taskId | Long | 分析任务ID |

**请求体**：无

**响应**：`Result<String>`

| 字段 | 类型 | 说明 |
|------|------|------|
| data | String | 流转后的新状态 |

---

##### 32. AI任务状态

```
GET /analysis/ai/task-status?taskId=xxx
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | String | 是 | AI异步任务ID（UUID） |

**响应**：`Result<AiTaskStatusVO>`

**AiTaskStatusVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| aiTaskId | String | AI任务ID |
| status | String | 状态（PENDING/PROCESSING/COMPLETED/FAILED） |
| generationType | String | 生成类型 |
| resultCount | Integer | 生成结果条数（完成时） |
| errorMessage | String | 错误信息（失败时） |

---

### 4.4 Provider接口设计

```java
public interface AnalysisProvider {

    PageResult<AnalysisTaskVO> queryAnalysisPage(int page, int rows, String projectId);

    AnalysisTaskVO getAnalysisDetail(Long taskId);

    Long createAnalysisTask(Long evaluationTaskId);

    StructureDiagramVO createBoard(Long taskId);

    String getBoardUrl(Long taskId);

    void saveInterfaceTable(Long taskId, List<InterfaceTableSaveRequest> requests);

    void syncBoardData(Long taskId);

    void generateFromEvaluation(Long taskId);

    void importHistoryDiagram(Long taskId, MultipartFile file);

    byte[] exportBoardImage(Long taskId);

    FunctionMatrixVO getFunctionMatrix(Long taskId);

    String aiSupplementFunction(Long taskId);

    void importHistoryIssues(Long taskId, MultipartFile file);

    void importRequirementDoc(Long taskId, MultipartFile file);

    void importNeedsDoc(Long taskId, MultipartFile file);

    void confirmFunctionMatrix(Long taskId);

    String aiGenerateFailureMode(Long taskId);

    String aiGenerateFailureCause(Long taskId);

    String aiGenerateFailureEffect(Long taskId);

    String aiGeneratePreventiveMeasure(Long taskId);

    String aiGenerateDetectionMeasure(Long taskId);

    void adoptAiResult(Long analysisTaskId, String generationType, List<Long> tempIds);  // @AuditLog(action = "ADOPT_AI_RESULT", resourceType = "ANALYSIS")

    void saveFailureAnalysis(Long taskId, FailureAnalysisSaveRequest request);

    SodRatingVO aiSuggestSod(Long failureModeId);

    void saveSodRating(SodRatingSaveRequest request);

    void nextStep(Long taskId);  // @AuditLog(action = "NEXT_STEP", resourceType = "ANALYSIS")

    AiTaskStatusVO getAiTaskStatus(String aiTaskId);
}
```

#### 4.4.1 方法详细说明

##### queryAnalysisPage

| 维度 | 说明 |
|------|------|
| 方法签名 | `PageResult<AnalysisTaskVO> queryAnalysisPage(int page, int rows, String projectId)` |
| 调用的Service | AnalysisTaskService |
| 事务 | 无（只读查询） |
| 业务规则 | 按projectId过滤，按创建时间降序排列；逻辑删除过滤 |
| 集成服务 | 无 |

---

##### getAnalysisDetail

| 维度 | 说明 |
|------|------|
| 方法签名 | `AnalysisTaskVO getAnalysisDetail(Long taskId)` |
| 调用的Service | AnalysisTaskService |
| 事务 | 无（只读查询） |
| 业务规则 | taskId不存在时抛出BusinessException(3001001) |
| 集成服务 | 无 |

---

##### createAnalysisTask

| 维度 | 说明 |
|------|------|
| 方法签名 | `Long createAnalysisTask(Long evaluationTaskId)` |
| 调用的Service | AnalysisTaskService、EvaluationService(只读) |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 从EvaluationService读取评估任务信息；2. 校验评估任务状态为confirmed；3. 创建分析任务，初始状态structure；4. 关联evaluationTaskId和projectId |
| 集成服务 | 无 |

---

##### createBoard

| 维度 | 说明 |
|------|------|
| 方法签名 | `StructureDiagramVO createBoard(Long taskId)` |
| 调用的Service | StructureDiagramService、AnalysisTaskService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为structure；2. 校验该任务尚未创建画板（diagram不存在）；3. 调用LarkService创建文档和画板；4. 保存diagram记录含larkDocId/larkBoardId/larkBoardUrl |
| 集成服务 | LarkService.createDoc()、LarkService.createBoardInDoc()、LarkService.getBoardUrl() |

---

##### getBoardUrl

| 维度 | 说明 |
|------|------|
| 方法签名 | `String getBoardUrl(Long taskId)` |
| 调用的Service | StructureDiagramService |
| 事务 | 无（只读查询） |
| 业务规则 | 查询diagram记录返回larkBoardUrl；不存在时返回null |
| 集成服务 | 无 |

---

##### saveInterfaceTable

| 维度 | 说明 |
|------|------|
| 方法签名 | `void saveInterfaceTable(Long taskId, List<InterfaceTableSaveRequest> requests)` |
| 调用的Service | InterfaceTableService、StructureDiagramService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为structure；2. 根据taskId获取diagramId；3. 先删除该diagramId下的旧接口表格数据；4. 批量插入新接口表格数据 |
| 集成服务 | 无 |

---

##### syncBoardData

| 维度 | 说明 |
|------|------|
| 方法签名 | `void syncBoardData(Long taskId)` |
| 调用的Service | StructureDiagramService、StructureNodeService、StructureEdgeService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为structure；2. 校验画板已创建；3. 调用LarkService回读画板内容；4. 解析节点和边数据；5. 先删除旧节点和边数据；6. 写入新节点和边数据 |
| 集成服务 | LarkService.getBoardContent() |

---

##### generateFromEvaluation

| 维度 | 说明 |
|------|------|
| 方法签名 | `void generateFromEvaluation(Long taskId)` |
| 调用的Service | StructureDiagramService、StructureNodeService、StructureEdgeService、EvaluationService(只读) |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为structure；2. 校验画板已创建；3. 从EvaluationService读取变更点清单层级关系；4. 按层级构造树结构节点信息；5. 以Mermaid语法生成初图；6. 调用LarkService写入画板；7. 同步回读节点和边数据 |
| 集成服务 | LarkService.updateBoardContent()、LarkService.getBoardContent() |

**变更点清单→结构框图映射规则**：
- ID结构：10 → 10.1 → 10.1.1（无限层级）
- 映射规则：每个ID对应一个节点，节点名称取系统名/部件名称
- 层级关系：ID的"."分隔层级决定父子关系
  - 10 → 顶级节点（系统级）
  - 10.1 → 10的子节点
  - 10.1.1 → 10.1的子节点
- Mermaid生成规则：
  - 使用graph TD（自顶向下）
  - 顶级节点用subgraph包裹
  - 每个节点格式：ID前缀[系统名/部件名]
  - 边：父子关系用 --> 连接
  - 风险标记：H=红色样式、M=黄色样式、L=灰色样式

---

##### importHistoryDiagram

| 维度 | 说明 |
|------|------|
| 方法签名 | `void importHistoryDiagram(Long taskId, MultipartFile file)` |
| 调用的Service | StructureDiagramService、StructureNodeService、StructureEdgeService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为structure；2. 校验画板已创建；3. 解析上传的JSON文件（历史框图导出格式）；4. 先删除旧节点和边数据；5. 写入新节点和边数据；6. 调用LarkService将节点和边渲染到画板 |
| 集成服务 | LarkService.updateBoardContent() |

---

##### exportBoardImage

| 维度 | 说明 |
|------|------|
| 方法签名 | `byte[] exportBoardImage(Long taskId)` |
| 调用的Service | StructureDiagramService |
| 事务 | 无（只读操作） |
| 业务规则 | 1. 校验画板已创建；2. 调用LarkService导出画板为PNG图片（仅支持PNG格式） |
| 集成服务 | LarkService.exportBoardAsImage() |

---

##### getFunctionMatrix

| 维度 | 说明 |
|------|------|
| 方法签名 | `FunctionMatrixVO getFunctionMatrix(Long taskId)` |
| 调用的Service | FunctionMatrixService、FunctionItemService、FunctionMappingService、StructureNodeService、StructureEdgeService |
| 事务 | 无（只读查询） |
| 业务规则 | 1. 若矩阵不存在，自动生成：读取StructureNode（器件级节点）和StructureEdge（边信息），生成功能矩阵；2. 横轴=器件节点，纵轴=边功能描述，有关联标记"Y"；3. 功能按丰度（关联接口数）降序排列 |
| 集成服务 | 无 |

---

##### aiSupplementFunction

| 维度 | 说明 |
|------|------|
| 方法签名 | `String aiSupplementFunction(Long taskId)` |
| 调用的Service | FunctionMatrixService、FunctionItemService、AiGenerationTempService |
| 事务 | 无（异步调用，事务在回调中管理） |
| 业务规则 | 1. 校验任务状态为function；2. 创建Redis异步任务记录；3. 异步调用AiService（FunctionAnalysisStrategy）；4. AI从附件中提取功能，按"动词+名称"规范生成；5. 结果写入fmea_ai_generation_temp表；6. 返回aiTaskId供轮询 |
| 集成服务 | AiService.generate()（异步） |

---

##### importHistoryIssues

| 维度 | 说明 |
|------|------|
| 方法签名 | `void importHistoryIssues(Long taskId, MultipartFile file)` |
| 调用的Service | AnalysisTaskService、AiGenerationTempService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为function；2. 解析Excel文件（Apache POI）；3. 历史问题内容作为AI补充功能的上下文输入暂存 |
| 集成服务 | 无 |

---

##### importRequirementDoc

| 维度 | 说明 |
|------|------|
| 方法签名 | `void importRequirementDoc(Long taskId, MultipartFile file)` |
| 调用的Service | AnalysisTaskService、AiGenerationTempService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为function；2. 使用Apache Tika提取Word文档内容；3. 技术要求内容作为AI补充功能的上下文输入暂存 |
| 集成服务 | 无 |

---

##### importNeedsDoc

| 维度 | 说明 |
|------|------|
| 方法签名 | `void importNeedsDoc(Long taskId, MultipartFile file)` |
| 调用的Service | AnalysisTaskService、AiGenerationTempService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为function；2. 使用Apache Tika提取文档内容；3. 需求分析内容作为AI补充功能的上下文输入暂存；4. 支持多份上传（追加模式） |
| 集成服务 | 无 |

---

##### confirmFunctionMatrix

| 维度 | 说明 |
|------|------|
| 方法签名 | `void confirmFunctionMatrix(Long taskId)` |
| 调用的Service | FunctionMatrixService、FunctionItemService、FunctionMappingService、FailureAnalysisService、FailureModeService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为function；2. 校验功能矩阵存在且有数据；3. 标记矩阵为已确认；4. 根据横轴（器件）与纵轴（功能）组合，生成DRBFM表单"项目/功能"列，写入FailureAnalysis和FailureMode初始记录 |
| 集成服务 | 无 |

---

##### aiGenerateFailureMode

| 维度 | 说明 |
|------|------|
| 方法签名 | `String aiGenerateFailureMode(Long taskId)` |
| 调用的Service | AiGenerationTempService、FailureModeService、FunctionItemService |
| 事务 | 无（异步调用） |
| 业务规则 | 1. 校验任务状态为failure；2. 删除该任务generation_type=failure_mode的旧临时数据；3. 创建Redis异步任务记录；4. 异步调用AiService（FailureModeStrategy），传入功能矩阵中变更相关功能；5. AI生成7种类型失效模式；6. 结果写入fmea_ai_generation_temp表；7. 返回aiTaskId |
| 集成服务 | AiService.generate()（异步） |

---

##### aiGenerateFailureCause

| 维度 | 说明 |
|------|------|
| 方法签名 | `String aiGenerateFailureCause(Long taskId)` |
| 调用的Service | AiGenerationTempService、FailureModeService |
| 事务 | 无（异步调用） |
| 业务规则 | 1. 校验任务状态为failure；2. 删除该任务generation_type=failure_cause的旧临时数据；3. 创建Redis异步任务记录；4. 异步调用AiService（FailureCauseStrategy），传入失效模式和变更点信息；5. AI从6个维度生成失效原因；6. 结果写入fmea_ai_generation_temp表；7. 返回aiTaskId |
| 集成服务 | AiService.generate()（异步） |

---

##### aiGenerateFailureEffect

| 维度 | 说明 |
|------|------|
| 方法签名 | `String aiGenerateFailureEffect(Long taskId)` |
| 调用的Service | AiGenerationTempService、FailureModeService |
| 事务 | 无（异步调用） |
| 业务规则 | 1. 校验任务状态为failure；2. 删除该任务generation_type=failure_effect的旧临时数据；3. 创建Redis异步任务记录；4. 异步调用AiService（FailureEffectStrategy），传入失效模式和系统结构层级；5. AI逐层识别3个层级影响；6. 结果写入fmea_ai_generation_temp表；7. 返回aiTaskId |
| 集成服务 | AiService.generate()（异步） |

---

##### aiGeneratePreventiveMeasure

| 维度 | 说明 |
|------|------|
| 方法签名 | `String aiGeneratePreventiveMeasure(Long taskId)` |
| 调用的Service | AiGenerationTempService、FailureCauseService |
| 事务 | 无（异步调用） |
| 业务规则 | 1. 校验任务状态为failure；2. 删除该任务generation_type=preventive_measure的旧临时数据；3. 创建Redis异步任务记录；4. 异步调用AiService（PreventiveMeasureStrategy），传入失效原因和性能要求；5. AI按优先级生成预防措施（design>process>monitor）；6. 结果写入fmea_ai_generation_temp表；7. 返回aiTaskId |
| 集成服务 | AiService.generate()（异步） |

---

##### aiGenerateDetectionMeasure

| 维度 | 说明 |
|------|------|
| 方法签名 | `String aiGenerateDetectionMeasure(Long taskId)` |
| 调用的Service | AiGenerationTempService、FailureCauseService |
| 事务 | 无（异步调用） |
| 业务规则 | 1. 校验任务状态为failure；2. 删除该任务generation_type=detection_measure的旧临时数据；3. 创建Redis异步任务记录；4. 异步调用AiService（DetectionMeasureStrategy），传入失效原因和失效模式；5. AI生成探测措施（含三要素phase/target/method）；6. 结果写入fmea_ai_generation_temp表；7. 返回aiTaskId |
| 集成服务 | AiService.generate()（异步） |

---

##### adoptAiResult

| 维度 | 说明 |
|------|------|
| 方法签名 | `void adoptAiResult(Long analysisTaskId, String generationType, List<Long> tempIds)` |
| 调用的Service | AiGenerationTempService、FailureModeService、FailureCauseService、FailureEffectService、PreventiveMeasureService、DetectionMeasureService、OptimizationMeasureService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验临时记录属于该分析任务且类型匹配；2. 根据generationType将临时数据复制到对应正式业务表；3. 标记临时记录is_adopted=1；4. 更新AI采纳率统计。采纳复制逻辑：将临时表记录的所有业务字段复制到正式业务表，ID字段赋值为NULL（由正式表自增生成本文ID），临时表记录标记adopted=true。复制后正式表记录与临时表记录无外键关联 |
| 集成服务 | 无 |

---

##### saveFailureAnalysis

| 维度 | 说明 |
|------|------|
| 方法签名 | `void saveFailureAnalysis(Long taskId, FailureAnalysisSaveRequest request)` |
| 调用的Service | FailureModeService、FailureCauseService、FailureEffectService、PreventiveMeasureService、DetectionMeasureService、OptimizationMeasureService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验任务状态为failure；2. 对各子表数据执行upsert（有id则更新，无id则插入）；3. 校验失效模式类型在7种枚举范围内；4. 校验失效原因维度在6种枚举范围内；5. 校验失效影响层级在3种枚举范围内 |
| 集成服务 | 无 |

---

##### aiSuggestSod

| 维度 | 说明 |
|------|------|
| 方法签名 | `SodRatingVO aiSuggestSod(Long failureModeId)` |
| 调用的Service | SodRatingService、FailureModeService、FailureCauseService、FailureEffectService、PreventiveMeasureService、DetectionMeasureService |
| 事务 | 无（同步只读+写入建议值） |
| 业务规则 | 1. 读取失效模式及其关联的原因、影响、措施数据；2. 同步调用AiService（SodRatingStrategy）；3. AI返回S/O/D建议值；4. 根据SOD组合查AP参考表得出apLevel；5. 将AI建议值写入SodRating的aiSuggestedS/O/D字段；6. 返回SodRatingVO |
| 集成服务 | AiService.generate()（同步，30秒超时） |

---

##### saveSodRating

| 维度 | 说明 |
|------|------|
| 方法签名 | `void saveSodRating(SodRatingSaveRequest request)` |
| 调用的Service | SodRatingService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 校验S/O/D值均在1-10范围内，否则抛出BusinessException(3006001)；2. 根据SOD组合查AP参考表得出apLevel，查表失败抛出BusinessException(3006002)；3. upsert评分记录 |
| 集成服务 | 无 |

---

##### nextStep

| 维度 | 说明 |
|------|------|
| 方法签名 | `void nextStep(Long taskId)` |
| 调用的Service | AnalysisTaskService、StructureNodeService、StructureEdgeService、FunctionMatrixService、FailureModeService、SodRatingService |
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 业务规则 | 1. 读取当前任务状态；2. 按状态机校验流转条件（详见4.6）；3. 校验不通过时抛出BusinessException(3001002)及具体原因；4. 更新任务状态为下一步骤 |
| 集成服务 | 无 |

---

##### getAiTaskStatus

| 维度 | 说明 |
|------|------|
| 方法签名 | `AiTaskStatusVO getAiTaskStatus(String aiTaskId)` |
| 调用的Service | 无（直接读Redis） |
| 事务 | 无（只读查询） |
| 业务规则 | 1. 从Redis读取key=ai:task:{aiTaskId}的任务状态；2. key不存在时返回FAILED；3. COMPLETED时额外查询临时表结果条数 |
| 集成服务 | 无 |

---

### 4.5 Service接口设计

#### 4.5.1 AnalysisTaskService

```java
public interface AnalysisTaskService {

    AnalysisTask getById(Long id);

    PageResult<AnalysisTaskVO> queryPage(int page, int rows, String projectId);

    Long insert(AnalysisTask task);

    void updateStatus(Long id, String status);

    void updateResponsible(Long id, String responsible);

    List<AnalysisTask> listByProjectId(String projectId);

    AnalysisTask getByEvaluationTaskId(Long evaluationTaskId);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| getById | analysisTaskMapper.selectById | 按ID查询 |
| queryPage | analysisTaskMapper.selectPage | 分页查询，按projectId过滤 |
| insert | analysisTaskMapper.insert | 新增分析任务 |
| updateStatus | analysisTaskMapper.updateById | 更新状态字段 |
| updateResponsible | analysisTaskMapper.updateById | 更新负责人字段 |
| listByProjectId | analysisTaskMapper.selectList | 按项目ID查询列表 |
| getByEvaluationTaskId | analysisTaskMapper.selectOne | 按评估任务ID查询 |

---

#### 4.5.2 StructureDiagramService

```java
public interface StructureDiagramService {

    StructureDiagram getByAnalysisTaskId(Long analysisTaskId);

    Long insert(StructureDiagram diagram);

    void updateBoardInfo(Long id, String larkDocId, String larkBoardId, String larkBoardUrl);

    void incrementVersion(Long id);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| getByAnalysisTaskId | structureDiagramMapper.selectOne | 按分析任务ID查询 |
| insert | structureDiagramMapper.insert | 新增结构图记录 |
| updateBoardInfo | structureDiagramMapper.updateById | 更新飞书画板信息 |
| incrementVersion | structureDiagramMapper.updateById | 版本号+1 |

---

#### 4.5.3 StructureNodeService

```java
public interface StructureNodeService {

    List<StructureNode> listByDiagramId(Long diagramId);

    List<StructureNode> listLeafNodes(Long diagramId);

    void batchInsert(Long diagramId, List<StructureNode> nodes);

    void deleteByDiagramId(Long diagramId);

    StructureNode getById(Long id);

    int countByDiagramId(Long diagramId);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByDiagramId | structureNodeMapper.selectList | 按diagramId查询所有节点 |
| listLeafNodes | structureNodeMapper.selectList | 查询最末级节点（器件级） |
| batchInsert | structureNodeMapper.insert（循环） | 批量插入节点 |
| deleteByDiagramId | structureNodeMapper.delete | 按diagramId物理删除 |
| getById | structureNodeMapper.selectById | 按ID查询 |
| countByDiagramId | structureNodeMapper.selectCount | 统计节点数 |

---

#### 4.5.4 StructureEdgeService

```java
public interface StructureEdgeService {

    List<StructureEdge> listByDiagramId(Long diagramId);

    void batchInsert(Long diagramId, List<StructureEdge> edges);

    void deleteByDiagramId(Long diagramId);

    int countByDiagramId(Long diagramId);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByDiagramId | structureEdgeMapper.selectList | 按diagramId查询所有边 |
| batchInsert | structureEdgeMapper.insert（循环） | 批量插入边 |
| deleteByDiagramId | structureEdgeMapper.delete | 按diagramId物理删除 |
| countByDiagramId | structureEdgeMapper.selectCount | 统计边数 |

---

#### 4.5.5 InterfaceTableService

```java
public interface InterfaceTableService {

    List<InterfaceTable> listByDiagramId(Long diagramId);

    void batchInsert(Long diagramId, List<InterfaceTable> items);

    void deleteByDiagramId(Long diagramId);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByDiagramId | interfaceTableMapper.selectList | 按diagramId查询 |
| batchInsert | interfaceTableMapper.insert（循环） | 批量插入 |
| deleteByDiagramId | interfaceTableMapper.delete | 按diagramId物理删除 |

---

#### 4.5.6 FunctionMatrixService

```java
public interface FunctionMatrixService {

    FunctionMatrix getByAnalysisTaskId(Long analysisTaskId);

    Long insert(FunctionMatrix matrix);

    void updateConfirmed(Long id, boolean confirmed);

    void incrementVersion(Long id);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| getByAnalysisTaskId | functionMatrixMapper.selectOne | 按分析任务ID查询 |
| insert | functionMatrixMapper.insert | 新增矩阵 |
| updateConfirmed | functionMatrixMapper.updateById | 更新确认状态 |
| incrementVersion | functionMatrixMapper.updateById | 版本号+1 |

---

#### 4.5.7 FunctionItemService

```java
public interface FunctionItemService {

    List<FunctionItem> listByMatrixId(Long matrixId);

    void batchInsert(List<FunctionItem> items);

    void deleteByMatrixId(Long matrixId);

    void updateAbundanceOrder(Long id, int order);

    void updateChangeRelated(Long id, boolean isChangeRelated);
}

// fmea_function_item表新增字段：is_change_related BIT DEFAULT 0 — 是否与变更点关联
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByMatrixId | functionItemMapper.selectList | 按矩阵ID查询 |
| batchInsert | functionItemMapper.insert（循环） | 批量插入 |
| deleteByMatrixId | functionItemMapper.delete | 按矩阵ID物理删除 |
| updateAbundanceOrder | functionItemMapper.updateById | 更新丰度排序 |
| updateChangeRelated | functionItemMapper.updateById | 更新变更关联标记 |

---

#### 4.5.8 FunctionMappingService

```java
public interface FunctionMappingService {

    List<FunctionMapping> listByMatrixId(Long matrixId);

    void batchInsert(List<FunctionMapping> mappings);

    void deleteByMatrixId(Long matrixId);

    void updateRelated(Long id, boolean isRelated);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByMatrixId | functionMappingMapper.selectList | 按矩阵ID查询 |
| batchInsert | functionMappingMapper.insert（循环） | 批量插入 |
| deleteByMatrixId | functionMappingMapper.delete | 按矩阵ID物理删除 |
| updateRelated | functionMappingMapper.updateById | 更新关联状态 |

---

#### 4.5.9 FailureAnalysisService

```java
public interface FailureAnalysisService {

    FailureAnalysis getByAnalysisTaskId(Long analysisTaskId);

    Long insert(FailureAnalysis analysis);

    void incrementVersion(Long id);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| getByAnalysisTaskId | failureAnalysisMapper.selectOne | 按分析任务ID查询 |
| insert | failureAnalysisMapper.insert | 新增 |
| incrementVersion | failureAnalysisMapper.updateById | 版本号+1 |

---

#### 4.5.10 FailureModeService

```java
public interface FailureModeService {

    List<FailureMode> listByAnalysisId(Long analysisId);

    FailureMode getById(Long id);

    Long insert(FailureMode mode);

    void updateById(FailureMode mode);

    void deleteById(Long id);

    int countByAnalysisId(Long analysisId);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByAnalysisId | failureModeMapper.selectList | 按失效分析ID查询 |
| getById | failureModeMapper.selectById | 按ID查询 |
| insert | failureModeMapper.insert | 新增 |
| updateById | failureModeMapper.updateById | 更新 |
| deleteById | failureModeMapper.deleteById | 删除 |
| countByAnalysisId | failureModeMapper.selectCount | 统计数 |

---

#### 4.5.11 FailureCauseService

```java
public interface FailureCauseService {

    List<FailureCause> listByModeId(Long modeId);

    Long insert(FailureCause cause);

    void updateById(FailureCause cause);

    void deleteById(Long id);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByModeId | failureCauseMapper.selectList | 按失效模式ID查询 |
| insert | failureCauseMapper.insert | 新增 |
| updateById | failureCauseMapper.updateById | 更新 |
| deleteById | failureCauseMapper.deleteById | 删除 |

---

#### 4.5.12 FailureEffectService

```java
public interface FailureEffectService {

    List<FailureEffect> listByModeId(Long modeId);

    Long insert(FailureEffect effect);

    void updateById(FailureEffect effect);

    void deleteById(Long id);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByModeId | failureEffectMapper.selectList | 按失效模式ID查询 |
| insert | failureEffectMapper.insert | 新增 |
| updateById | failureEffectMapper.updateById | 更新 |
| deleteById | failureEffectMapper.deleteById | 删除 |

---

#### 4.5.13 PreventiveMeasureService

```java
public interface PreventiveMeasureService {

    List<PreventiveMeasure> listByCauseId(Long causeId);

    Long insert(PreventiveMeasure measure);

    void updateById(PreventiveMeasure measure);

    void deleteById(Long id);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByCauseId | preventiveMeasureMapper.selectList | 按失效原因ID查询 |
| insert | preventiveMeasureMapper.insert | 新增 |
| updateById | preventiveMeasureMapper.updateById | 更新 |
| deleteById | preventiveMeasureMapper.deleteById | 删除 |

---

#### 4.5.14 DetectionMeasureService

```java
public interface DetectionMeasureService {

    List<DetectionMeasure> listByCauseId(Long causeId);

    Long insert(DetectionMeasure measure);

    void updateById(DetectionMeasure measure);

    void deleteById(Long id);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByCauseId | detectionMeasureMapper.selectList | 按失效原因ID查询 |
| insert | detectionMeasureMapper.insert | 新增 |
| updateById | detectionMeasureMapper.updateById | 更新 |
| deleteById | detectionMeasureMapper.deleteById | 删除 |

---

#### 4.5.15 OptimizationMeasureService

```java
public interface OptimizationMeasureService {

    List<OptimizationMeasure> listByCauseId(Long causeId);

    Long insert(OptimizationMeasure measure);

    void updateById(OptimizationMeasure measure);

    void deleteById(Long id);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByCauseId | optimizationMeasureMapper.selectList | 按失效原因ID查询 |
| insert | optimizationMeasureMapper.insert | 新增 |
| updateById | optimizationMeasureMapper.updateById | 更新 |
| deleteById | optimizationMeasureMapper.deleteById | 删除 |

---

#### 4.5.16 SodRatingService

```java
public interface SodRatingService {

    SodRating getByFailureModeId(Long failureModeId);

    Long insert(SodRating rating);

    void updateById(SodRating rating);

    List<SodRating> listByAnalysisTaskId(Long analysisTaskId);

    String lookupApLevel(int severity, int occurrence, int detection);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| getByFailureModeId | sodRatingMapper.selectOne | 按失效模式ID查询 |
| insert | sodRatingMapper.insert | 新增 |
| updateById | sodRatingMapper.updateById | 更新 |
| listByAnalysisTaskId | sodRatingMapper.selectList | 按分析任务ID查询（关联查询） |
| lookupApLevel | sodRatingMapper.selectApLevel | 查AP参考表（fmea_ap_reference） |

---

#### 4.5.17 AiGenerationTempService

```java
public interface AiGenerationTempService {

    List<AiGenerationTemp> listByTaskAndType(Long analysisTaskId, String generationType);

    void deleteByTaskAndType(Long analysisTaskId, String generationType);

    void batchInsert(List<AiGenerationTemp> temps);

    void markAdopted(List<Long> tempIds);

    int countByTaskAndType(Long analysisTaskId, String generationType);

    int countAdoptedByTaskAndType(Long analysisTaskId, String generationType);
}
```

| 方法 | 调用的Mapper方法 | 说明 |
|------|-----------------|------|
| listByTaskAndType | aiGenerationTempMapper.selectList | 按任务ID和类型查询 |
| deleteByTaskAndType | aiGenerationTempMapper.delete | 按任务ID和类型物理删除（每次AI生成前清旧数据） |
| batchInsert | aiGenerationTempMapper.insert（循环） | 批量插入 |
| markAdopted | aiGenerationTempMapper.updateBatch | 批量标记is_adopted=1 |
| countByTaskAndType | aiGenerationTempMapper.selectCount | 统计总数 |
| countAdoptedByTaskAndType | aiGenerationTempMapper.selectCount | 统计已采纳数 |

---

### 4.6 状态机设计

#### 4.6.1 分析任务状态枚举

```java
public enum AnalysisStatus {
    STRUCTURE("structure", "结构分析"),
    FUNCTION("function", "功能分析"),
    FAILURE("failure", "失效分析"),
    BASELINE("baseline", "基线输出"),
    REVIEW("review", "评审"),
    APPROVAL("approval", "审批"),
    COMPLETED("completed", "已完成");

    private final String code;
    private final String label;
}
```

#### 4.6.2 状态转换表

| 当前状态 | 触发动作 | 目标状态 | 校验条件 | Provider方法 |
|----------|----------|----------|----------|-------------|
| structure | nextStep | function | 结构框图已创建（diagram存在），节点数>0（StructureNodeService.countByDiagramId > 0） | nextStep() |
| function | nextStep | failure | 功能矩阵已确认（FunctionMatrix.confirmed = true） | nextStep() |
| failure | nextStep | baseline | 失效分析数据完整：FailureMode记录数>0，每条FailureMode至少有1条FailureCause和1条FailureEffect，SodRating已填写 | nextStep() |
| baseline | — | review | 基线输出完成（转入评审模块，由BaselineProvider处理） | — |
| review | — | approval | 评审完成（转入审批模块，由ReviewProvider处理） | — |
| approval | — | completed | 审批通过（转入基线跟踪，由ApprovalProvider处理） | — |

#### 4.6.3 nextStep方法伪代码

```java
@Override
@Transactional(rollbackFor = Exception.class)
public void nextStep(Long taskId) {
    AnalysisTask task = analysisTaskService.getById(taskId);
    if (task == null) {
        throw new BusinessException(3001001, "分析任务不存在");
    }

    String currentStatus = task.getStatus();
    switch (AnalysisStatus.valueOf(currentStatus.toUpperCase())) {
        case STRUCTURE:
            validateStructureComplete(taskId);
            analysisTaskService.updateStatus(taskId, AnalysisStatus.FUNCTION.getCode());
            break;
        case FUNCTION:
            validateFunctionComplete(taskId);
            analysisTaskService.updateStatus(taskId, AnalysisStatus.FAILURE.getCode());
            break;
        case FAILURE:
            validateFailureComplete(taskId);
            analysisTaskService.updateStatus(taskId, AnalysisStatus.BASELINE.getCode());
            break;
        default:
            throw new BusinessException(3001002, "当前状态不允许此操作");
    }
}

private void validateStructureComplete(Long taskId) {
    StructureDiagram diagram = structureDiagramService.getByAnalysisTaskId(taskId);
    if (diagram == null) {
        throw new BusinessException(3002001, "结构框图未创建");
    }
    int nodeCount = structureNodeService.countByDiagramId(diagram.getId());
    if (nodeCount == 0) {
        throw new BusinessException(3002001, "结构框图节点数为0，请先同步画板数据");
    }
}

private void validateFunctionComplete(Long taskId) {
    FunctionMatrix matrix = functionMatrixService.getByAnalysisTaskId(taskId);
    if (matrix == null || !matrix.isConfirmed()) {
        throw new BusinessException(3003001, "功能矩阵未确认");
    }
}

private void validateFailureComplete(Long taskId) {
    FailureAnalysis analysis = failureAnalysisService.getByAnalysisTaskId(taskId);
    if (analysis == null) {
        throw new BusinessException(3004001, "失效分析数据不完整");
    }
    int modeCount = failureModeService.countByAnalysisId(analysis.getId());
    if (modeCount == 0) {
        throw new BusinessException(3004001, "失效模式为空");
    }
    List<SodRating> ratings = sodRatingService.listByAnalysisTaskId(taskId);
    if (ratings.size() < modeCount) {
        throw new BusinessException(3004001, "部分失效模式未完成SOD评分");
    }
}
```

---

### 4.7 AI异步任务设计

#### 4.7.1 完整流程

```
┌──────────┐    1.请求AI生成     ┌──────────────┐
│  前端     │ ──────────────────→ │  Controller   │
│  (jQuery) │                     └──────┬───────┘
└────▲─────┘                            │
     │                                  │ 2.调用Provider
     │                                  ▼
     │                          ┌──────────────┐
     │                          │  Provider     │
     │                          │  (异步编排)    │
     │                          └──┬───────┬───┘
     │                             │       │
     │                  3.创建Redis │       │ 4.异步调用
     │                    任务记录  │       │ AiService
     │                             ▼       │
     │                     ┌──────────┐    │
     │   5.返回aiTaskId    │  Redis   │    │
     │ ◄────────────────── │ ai:task: │    │
     │                     │ {uuid}   │    │
     │                     └──────────┘    │
     │                                     ▼
     │                            ┌──────────────┐
     │                            │  AiService    │
     │                            │  (策略路由)    │
     │                            └──────┬───────┘
     │                                   │
     │                          6.AI返回  │
     │                           结果     │
     │                                   ▼
     │                          ┌──────────────┐
     │                          │ 7.写入        │
     │                          │ ai_generation │
     │                          │ _temp表       │
     │                          └──────┬───────┘
     │                                 │
     │                    8.更新Redis   │
     │                     状态COMPLETED│
     │                                 │
     │  ┌──────────────────────────────┘
     │  │
     │  │  9.轮询 GET /analysis/ai/task-status
     │  │     每2秒一次
     │  │
┌────┴─────┐
│  前端     │  10.状态COMPLETED → 加载AI结果
│  (jQuery) │  11.用户选择采纳/忽略
└──────────┘
```

#### 4.7.2 Redis任务记录结构

**Key格式**：`ai:task:{uuid}`

**Value结构**（Hash）：

| 字段 | 类型 | 说明 |
|------|------|------|
| aiTaskId | String | AI任务UUID |
| analysisTaskId | Long | 分析任务ID |
| generationType | String | 生成类型 |
| status | String | 状态（PENDING/PROCESSING/COMPLETED/FAILED） |
| errorMessage | String | 错误信息（FAILED时） |
| resultCount | Integer | 结果条数（COMPLETED时） |
| createTime | Long | 创建时间戳 |
| updateTime | Long | 更新时间戳 |

**TTL**：1小时

#### 4.7.3 状态流转

```
PENDING ──→ PROCESSING ──→ COMPLETED
                │
                └──→ FAILED
```

| 状态 | 说明 | 触发时机 |
|------|------|----------|
| PENDING | 已创建任务，等待执行 | Provider创建Redis记录时 |
| PROCESSING | AI调用中 | Provider提交异步任务时 |
| COMPLETED | AI生成完成，结果已写入临时表 | AiService回调成功时 |
| FAILED | AI生成失败 | AiService回调异常或超时时 |

#### 4.7.4 Provider异步编排伪代码

```java
@Override
public String aiGenerateFailureMode(Long taskId) {
    AnalysisTask task = analysisTaskService.getById(taskId);
    if (task == null) {
        throw new BusinessException(3001001, "分析任务不存在");
    }
    if (!AnalysisStatus.FAILURE.getCode().equals(task.getStatus())) {
        throw new BusinessException(3001002, "分析任务状态不允许此操作");
    }

    String aiTaskId = UUID.randomUUID().toString();

    RedisTaskInfo taskInfo = new RedisTaskInfo();
    taskInfo.setAiTaskId(aiTaskId);
    taskInfo.setAnalysisTaskId(taskId);
    taskInfo.setGenerationType("failure_mode");
    taskInfo.setStatus("PENDING");
    taskInfo.setCreateTime(System.currentTimeMillis());
    redisTemplate.opsForHash().putAll("ai:task:" + aiTaskId, BeanUtil.beanToMap(taskInfo));
    redisTemplate.expire("ai:task:" + aiTaskId, 1, TimeUnit.HOURS);

    aiGenerationTempService.deleteByTaskAndType(taskId, "failure_mode");

    CompletableFuture.runAsync(() -> {
        try {
            updateAiTaskStatus(aiTaskId, "PROCESSING");

            List<FunctionItem> functions = functionItemService.listByMatrixId(
                functionMatrixService.getByAnalysisTaskId(taskId).getId());

            AiGenerationResult result = aiService.generate(
                "failure_mode", buildFailureModePrompt(functions));

            List<AiGenerationTemp> temps = parseToTempList(taskId, "failure_mode", result);
            aiGenerationTempService.batchInsert(temps);

            updateAiTaskStatus(aiTaskId, "COMPLETED", temps.size());
        } catch (Exception e) {
            updateAiTaskStatus(aiTaskId, "FAILED", e.getMessage());
        }
    }, asyncExecutor);

    return aiTaskId;
}
```

#### 4.7.5 前端轮询实现

```javascript
function startAiGenerate(apiUrl, taskId) {
    $.ajax({
        url: apiUrl,
        method: 'POST',
        contentType: 'application/json',
        success: function(result) {
            if (result.code === 200) {
                var aiTaskId = result.data.aiTaskId;
                $.messager.alert('提示', 'AI生成任务已提交，请稍候...');
                pollAiTaskStatus(aiTaskId);
            }
        }
    });
}

function pollAiTaskStatus(aiTaskId) {
    $.ajax({
        url: '/analysis/ai/task-status?taskId=' + aiTaskId,
        method: 'GET',
        success: function(result) {
            if (result.data.status === 'COMPLETED') {
                reloadAiResult();
            } else if (result.data.status === 'FAILED') {
                $.messager.alert('错误', 'AI生成失败：' + (result.data.errorMessage || '请重试'));
            } else {
                setTimeout(function() { pollAiTaskStatus(aiTaskId); }, 2000);
            }
        }
    });
}
```

---

### 4.8 业务规则

#### 4.8.1 结构框图三种生成方式

| 方式 | 触发条件 | 数据来源 | 生成逻辑 | 写入画板方式 |
|------|----------|----------|----------|-------------|
| 方式A - 一键导入 | 项目之前绘制过结构框图 | 历史框图JSON文件（用户上传） | 解析JSON中的节点和边数据，重新渲染 | LarkService.updateBoardContent() |
| 方式B - 从系统级读取 | 部件级分析任务 | 当前项目系统级分析任务的StructureNode和StructureEdge | 读取系统级框图数据，提取关联部件的节点和边 | LarkService.updateBoardContent() |
| 方式C - 从评估表生成 | 评估表有变更点清单数据 | EvaluationService读取变更点清单层级关系 | 按层级构造树结构，以Mermaid语法生成初图 | LarkService.updateBoardContent() |

**方式C详细逻辑**：

1. 从EvaluationService读取变更点清单（`fmea_change_list_item`），按`level_num`排序
2. 根据`parent_id`构建树形结构
3. 将树形结构转换为Mermaid语法：
   ```mermaid
   graph TD
       A[系统] --> B[子系统1]
       A --> C[子系统2]
       B --> D[器件1]
       B --> E[器件2]
   ```
4. 节点颜色根据风险等级标记：H=红色、M=黄色、L=灰色
5. 调用LarkService.updateBoardContent()将Mermaid写入画板
6. 调用syncBoardData()回读节点和边数据

---

#### 4.8.2 功能矩阵生成规则

**矩阵结构**：

| | 器件A | 器件B | 器件C | ... |
|---|---|---|---|---|
| 功能1（丰度=3） | Y | Y | Y | |
| 功能2（丰度=2） | Y | | Y | |
| 功能3（丰度=1） | | Y | | |

**生成规则**：

1. **横轴（器件）**：从`fmea_structure_node`中查询最末级节点（器件级），即没有子节点的节点
2. **纵轴（功能）**：从`fmea_structure_edge`中提取功能描述（`function_desc`字段），每条边对应一个功能
3. **关联关系**：边的`source_node_id`和`target_node_id`涉及的器件节点，标记为关联（`is_related=true`）
4. **丰度排序**：功能按关联的器件数量降序排列，`abundance_order`字段记录排序值
5. **风险标记**：关联节点风险等级为H/M的单元格标记颜色（H=红色，M=黄色）
6. **功能来源**：
   - `edge`：从结构图边信息提取
   - `ai_attachment`：AI从附件中提取
   - `library`：从功能库引用

**功能描述规范**：

- 格式：动词+名称（量词或状语）
- 示例：传输信号（高频）、承受载荷（≥500N）
- 技术要求格式：XX性能+量词
- 功能之间无重叠冲突
- 一个系统元素可以有多个功能

---

#### 4.8.3 失效模式7种类型枚举及AI生成规则

```java
public enum FailureModeType {
    ABNORMAL("ABNORMAL", "异常", "功能以错误方式执行"),
    REVERSE("REVERSE", "相逆", "功能反向执行"),
    ACCOMPANY("ACCOMPANY", "伴随", "产生非预期附加功能"),
    EXCESS("EXCESS", "过量", "功能超出预期范围"),
    REDUCE("REDUCE", "减量", "功能低于预期范围"),
    PARTIAL("PARTIAL", "部分", "功能部分执行"),
    BLANK("BLANK", "空白", "功能完全丧失");

    private final String code;
    private final String label;
    private final String description;
}
```

**AI生成规则**：

1. 读取功能矩阵中与变更点相关的功能
2. 对每个功能，基于功能偏差生成7种类型的失效模式
3. 同时关注变更点可能带来的典型失效模式
4. 不同失效模式分行列出
5. AI Prompt需包含：功能描述、变更点信息、7种类型的定义
6. 生成结果按类型分组展示

---

#### 4.8.4 失效原因6个维度枚举

```java
public enum CauseDimension {
    DESIGN("DESIGN", "固有设计缺陷", "设计本身存在的问题"),
    MANUFACTURE("MANUFACTURE", "制造/装配问题", "生产过程中引入的问题"),
    STRESS("STRESS", "应力诱发失效", "外部应力导致的失效"),
    WEAR("WEAR", "耗损与老化", "长期使用导致的退化"),
    INTERACTION("INTERACTION", "交互性/系统性失效", "系统间交互导致的问题"),
    COMPOSITE("COMPOSITE", "综合应力作用", "多种应力综合作用");

    private final String code;
    private final String label;
    private final String description;
}
```

**AI生成规则**：

1. 从6个维度逐一分析，每个维度至少生成一条原因
2. 失效原因需结合变更点具象化（`change_point_ref`字段关联变更点）
3. 控制方法成熟的失效原因不展开（已有成熟预防/探测措施的仅列出维度标签）
4. 其他系统失效且自身无法强化/检测的不用分析
5. AI Prompt需包含：失效模式描述、变更点信息、6个维度的定义

---

#### 4.8.5 失效影响3个层级

```java
public enum EffectLevel {
    SYSTEM("SYSTEM", "上级/系统级", "对上级系统的影响"),
    MACHINE("MACHINE", "整机级", "对整机的影响"),
    CUSTOMER("CUSTOMER", "客户级", "对客户的影响");

    private final String code;
    private final String label;
    private final String description;
}
```

**AI生成规则**：

1. 逐层识别影响：上级系统→整机→客户级，三层影响必须完整
2. 具体描述影响什么功能、什么性能
3. 多个影响列在一行中，不同层级影响用分隔符区分
4. 不同失效影响如相同需保证描述一致
5. AI Prompt需包含：失效模式、失效原因、系统结构层级关系

---

#### 4.8.6 SOD评分规则

**两种评分模式**：

| 维度 | 模式1（解决方案/软件） | 模式2（硬件/结构件） |
|------|----------------------|---------------------|
| 严重度(S) | 评价功能失效模式导致的最严重影响，取值1-10 | 同模式1 |
| 发生度(O) | 衡量预防措施有效性，按软件缺陷概率评分 | 衡量预防措施有效性，按硬件失效率评分 |
| 探测度(D) | 表示对失效原因或失效模式探测有效性的估计量度，取值1-10 | 同模式1 |

**评分规则差异**：

- **模式1发生度(O)**：基于软件缺陷概率，考虑代码复杂度、测试覆盖率等
- **模式2发生度(O)**：基于硬件失效率，考虑应力水平、材料特性等
- 两种模式的O值评分标准不同，S和D的评分标准相同

**AP参考表查表逻辑**：

1. 输入：severity(S)、occurrence(O)、detection(D)，均为1-10的整数
2. 查询`fmea_ap_reference`表，匹配条件：
   - S值落在`s_range`范围内
   - O值落在`o_range`范围内
   - D值落在`d_range`范围内
3. 返回匹配行的`ap_level`（H/M/L）
4. 表共100行（10×10），S=1~10，O=1~10，D固定为参考值
5. 查表失败时抛出BusinessException(3006002)

**SOD评价标准适配**：

- `fmea_sod_standard`表支持公司级默认规则（`scope='company'`）和BG级私有规则（`scope='bg'`）
- 各BG可在默认规则基础上增改后保存为BG私有规则
- 项目评分时根据所属BG加载对应规则
- 模式1和模式2采用不同评分规则，两套规则独立配置

---

#### 4.8.7 AI临时表管理规则

| 规则 | 说明 |
|------|------|
| 生成前删除 | 每次AI生成时，先执行 `DELETE FROM fmea_ai_generation_temp WHERE analysis_task_id=? AND generation_type=? AND is_adopted=0`，仅删除未采纳的临时数据 |
| 插入新数据 | 删除后插入本次AI生成的新数据 |
| 采纳标记 | 用户采纳后，`is_adopted`字段更新为1，数据同时复制到正式业务表 |
| 无自动清理 | 临时表不设置自动过期清理，每个分析任务对应一份临时数据 |
| 重新生成 | 用户点击"重新生成"时，仅删除该分析任务对应类型的未采纳临时数据（adopted=false），已采纳的数据（adopted=true）不受影响，然后调用AI→插入新数据 |
| 采纳率统计 | 采纳后更新`fmea_ai_adoption_stat`表，记录total_count/adopted_count/adoption_rate |

---

### 4.9 错误码

| 错误码 | 描述 | 触发场景 |
|--------|------|----------|
| 3001001 | 分析任务不存在 | 根据ID查询AnalysisTask返回null |
| 3001002 | 分析任务状态不允许此操作 | 状态机校验失败，当前状态不可执行请求的操作 |
| 3002001 | 结构框图未创建 | 进入功能分析前校验diagram不存在或节点数为0 |
| 3002002 | 飞书画板创建失败 | LarkService.createDoc()或createBoardInDoc()返回异常 |
| 3003001 | 功能矩阵未确认 | 进入失效分析前校验矩阵confirmed字段为false |
| 3004001 | 失效分析数据不完整 | 进入基线前校验失效模式/原因/影响/SOD评分不完整 |
| 3005001 | AI生成任务失败 | AiService回调异常，AI模型返回错误 |
| 3005002 | AI生成超时 | 异步调用超过60秒未返回，Redis任务状态更新为FAILED |
| 3006001 | SOD评分超出范围 | S/O/D值不在1-10范围内 |
| 3006002 | AP参考表匹配失败 | SOD组合在fmea_ap_reference表中无匹配行 |

**错误码分段规则**：

| 段 | 范围 | 说明 |
|----|------|------|
| 3001xxx | 分析任务 | 分析任务CRUD及状态相关 |
| 3002xxx | 结构分析 | 结构框图、画板、接口表格相关 |
| 3003xxx | 功能分析 | 功能矩阵、AI补充功能相关 |
| 3004xxx | 失效分析 | 失效模式/原因/影响/措施相关 |
| 3005xxx | AI生成 | AI异步任务相关 |
| 3006xxx | SOD评分 | SOD评分、AP参考表相关 |

**错误码策略**：业务异常使用BusinessException携带错误码，系统异常和参数校验异常使用统一错误码（9990001系统异常、9990002参数校验失败）。各模块仅定义核心业务错误码（每个模块5-10个），非核心异常使用通用错误码。

**错误响应格式**：

```json
{
    "code": 3001001,
    "message": "分析任务不存在",
    "data": null
}
```


## 5. DRBFM触发评估模块（fmea-evaluation）

### 5.1 模块概述

| 项目 | 说明 |
|------|------|
| 包路径 | `com.fmea.evaluation` |
| 数据库表 | `fmea_evaluation_task`, `fmea_evaluation_item`, `fmea_evaluation_dimension_option`, `fmea_change_list`, `fmea_change_list_item`, `fmea_quality_plan`, `fmea_history_issue` |
| 关联集成模块 | `PmsQueryService`（项目/1级项目判定）、`LarkService`（飞书消息通知）、`AiService`（质量策划AI处理、建议理由生成） |
| 关联业务模块 | `ProjectService`（只读：项目信息查询）、`AnalysisService`（创建分析任务） |

**核心职责**：管理DRBFM触发评估的全生命周期，包括评估任务创建、变更点清单导入、质量策划导入与自动匹配、评估提交/审核/撤回、历史问题导入、五维风险评估、风险综合评分、评估确认、协作人指派、部件级评估合并。

---

### 5.2 包结构

```
com.fmea.evaluation
├── controller
│   └── EvaluationController.java
├── provider
│   ├── EvaluationProvider.java              (接口)
│   └── EvaluationProviderImpl.java          (实现, @Service, @Transactional)
├── service
│   ├── EvaluationTaskService.java           (接口)
│   ├── EvaluationTaskServiceImpl.java
│   ├── EvaluationItemService.java           (接口)
│   ├── EvaluationItemServiceImpl.java
│   ├── ChangeListService.java               (接口)
│   ├── ChangeListServiceImpl.java
│   ├── QualityPlanService.java              (接口)
│   ├── QualityPlanServiceImpl.java
│   ├── HistoryIssueService.java             (接口)
│   ├── HistoryIssueServiceImpl.java
│   ├── DimensionOptionService.java          (接口)
│   ├── DimensionOptionServiceImpl.java
│   ├── CollaboratorService.java             (接口)
│   └── CollaboratorServiceImpl.java
├── mapper
│   ├── EvaluationTaskMapper.java
│   ├── EvaluationItemMapper.java
│   ├── DimensionOptionMapper.java
│   ├── ChangeListMapper.java
│   ├── ChangeListItemMapper.java
│   ├── QualityPlanMapper.java
│   └── HistoryIssueMapper.java
├── entity
│   ├── EvaluationTask.java
│   ├── EvaluationItem.java
│   ├── DimensionOption.java
│   ├── ChangeList.java
│   ├── ChangeListItem.java
│   ├── QualityPlan.java
│   └── HistoryIssue.java
├── dto
│   ├── request
│   │   ├── EvaluationTaskCreateRequest.java
│   │   ├── EvaluationSubmitRequest.java
│   │   ├── EvaluationReviewRequest.java
│   │   ├── DimensionSaveRequest.java
│   │   ├── CollaboratorAssignRequest.java
│   │   └── ChangeListImportResult.java
│   └── response
│       ├── EvaluationTaskVO.java
│       ├── EvaluationItemVO.java
│       ├── ChangeListItemVO.java
│       ├── DimensionDataVO.java
│       ├── RiskScoreVO.java
│       └── AutoMatchResultVO.java
├── enums
│   ├── EvaluationStatus.java
│   ├── EvaluationLevel.java
│   ├── DevType.java
│   ├── ImnOption.java
│   ├── RiskLevel.java
│   └── DimensionType.java
└── converter
    ├── EvaluationTaskConverter.java
    ├── EvaluationItemConverter.java
    ├── ChangeListItemConverter.java
    └── DimensionOptionConverter.java
```

---

### 5.3 Controller API设计

#### 5.3.1 评估任务列表页

| 项目 | 说明 |
|------|------|
| URL | `GET /evaluation/list` |
| 返回 | FTL视图 `evaluation/list.ftl` |

无请求参数，视图由前端EasyUI DataGrid通过`/evaluation/data`异步加载数据。

---

#### 5.3.2 评估任务数据

| 项目 | 说明 |
|------|------|
| URL | `GET /evaluation/data` |
| 返回 | JSON分页数据 |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 是 | 当前页码，默认1 |
| rows | int | 是 | 每页条数，默认20 |
| projectId | String | 否 | 项目ID筛选 |
| level | String | 否 | 评估级别筛选：system/component |

**响应DTO** — `PageResult<EvaluationTaskVO>`：

| 字段 | 类型 | 说明 |
|------|------|------|
| total | long | 总记录数 |
| rows | List\<EvaluationTaskVO\> | 数据列表 |

**EvaluationTaskVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 评估任务ID |
| projectId | String | 项目ID |
| projectName | String | 项目名称 |
| level | String | 评估级别：system/component |
| status | String | 当前状态（枚举值） |
| creator | String | 创建人 |
| creatorName | String | 创建人姓名 |
| submitCount | int | 提交次数 |
| isWithdrawn | int | 是否撤回过：0-否/1-是 |
| changeListImported | boolean | 变更点清单是否已导入 |
| qualityPlanImported | boolean | 质量策划是否已导入 |
| historyIssueImported | boolean | 历史问题是否已导入 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

---

#### 5.3.3 创建评估任务

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/create` |
| Content-Type | application/json |
| 返回 | JSON `Result<Long>` (任务ID) |

**请求DTO** — `EvaluationTaskCreateRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | String | 是 | 项目ID |
| level | String | 是 | 评估级别：system/component |
| parentTaskId | Long | 否 | 父评估任务ID（部件级时必填，指向系统级评估任务） |

**业务规则**：
- `level=system`时，同一项目仅允许创建一个系统级评估任务
- `level=component`时，`parentTaskId`必填且必须指向已存在的系统级评估任务
- 创建后初始状态为`draft`，`submitCount=0`，`isWithdrawn=0`

---

#### 5.3.4 评估任务详情页

| 项目 | 说明 |
|------|------|
| URL | `GET /evaluation/detail/{id}` |
| 返回 | FTL视图 `evaluation/detail.ftl` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 评估任务ID |

视图渲染后，前端通过AJAX调用其他接口加载变更点清单、质量策划、五维评估等数据。

---

#### 5.3.5 导入变更点清单

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/change-list/import/{taskId}` |
| Content-Type | multipart/form-data |
| 返回 | JSON `Result<ChangeListImportResult>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | MultipartFile | 是 | Excel文件(.xlsx) |

**响应DTO** — `ChangeListImportResult`：

| 字段 | 类型 | 说明 |
|------|------|------|
| totalCount | int | 导入总行数 |
| successCount | int | 成功行数 |
| failCount | int | 失败行数 |
| errorMessages | List\<String\> | 失败行错误信息列表 |
| changeListId | Long | 变更点清单ID |

---

#### 5.3.6 获取变更点清单

| 项目 | 说明 |
|------|------|
| URL | `GET /evaluation/change-list/{taskId}` |
| 返回 | JSON `Result<List<ChangeListItemVO>>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |

**响应DTO** — `ChangeListItemVO`：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 变更点清单项ID |
| changeListId | Long | 所属变更点清单ID |
| levelNum | int | 层级编号（LEVEL列值） |
| itemId | String | 项目ID列 |
| structureName | String | 系统/部件名称 |
| devType | String | 开发类型 |
| imnOption | String | I/M/N选项 |
| changePoint | String | 变更点描述 |
| qualityMatch | String | 质量策划匹配内容 |
| parentId | Long | 父节点ID |
| sortOrder | int | 排序号 |
| children | List\<ChangeListItemVO\> | 子节点列表（树形结构） |

---

#### 5.3.7 导入质量策划

| 项目 | 说明 |
|------|------|------|
| URL | `POST /evaluation/quality-plan/import/{taskId}` |
| Content-Type | multipart/form-data |
| 返回 | JSON `Result<Void>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | MultipartFile | 是 | Excel文件(.xlsx) |

**业务规则**：
- 读取Excel各Sheet内容，转Markdown格式
- 调用`AiService`处理Markdown，提取"风险小类+风险策划指南"
- 暂存至`fmea_quality_plan`表
- 若变更点清单已导入，自动触发匹配

---

#### 5.3.8 自动匹配

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/auto-match/{taskId}` |
| 返回 | JSON `Result<AutoMatchResultVO>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |

**响应DTO** — `AutoMatchResultVO`：

| 字段 | 类型 | 说明 |
|------|------|------|
| totalItems | int | 变更点总数 |
| matchedItems | int | 匹配成功数 |
| unmatchedItems | int | 未匹配数 |
| matchDetails | List\<MatchDetailVO\> | 匹配详情列表 |

**MatchDetailVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| changeListItemId | Long | 变更点清单项ID |
| structureName | String | 部件名称 |
| matched | boolean | 是否匹配成功 |
| matchedContent | String | 匹配到的质量策划内容 |
| matchScore | double | 匹配得分 |

---

#### 5.3.9 提交评估

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/submit` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `EvaluationSubmitRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |
| submitComment | String | 否 | 提交说明 |

**业务规则**：
- 变更点清单必须已导入
- 状态必须为`draft`或`rejected`
- 提交后状态变为`submitted`，`submitCount`自增1
- 通过`LarkService`和`EmailService`通知PSE

---

#### 5.3.10 撤回评估

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/withdraw/{taskId}` |
| 返回 | JSON `Result<Void>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |

**业务规则**：
- 状态必须为`submitted`
- 仅创建人可撤回
- 撤回后状态变为`draft`，`isWithdrawn=1`

---

#### 5.3.11 审核评估

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/review` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `EvaluationReviewRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |
| conclusion | String | 是 | 审核结论：approve/reject |
| reviewComment | String | 否 | 审核意见（reject时必填） |

**业务规则**：
- 状态必须为`submitted`
- 仅PSE角色可审核
- `approve`：状态变为`approved`
- `reject`：状态变为`rejected`，通知TSE

---

#### 5.3.12 导入历史问题

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/history-issue/import/{taskId}` |
| Content-Type | multipart/form-data |
| 返回 | JSON `Result<Integer>` (导入条数) |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | MultipartFile | 是 | Excel文件(.xlsx) |

**业务规则**：
- 评估任务状态必须为`approved`
- 追加模式导入，不覆盖已有历史问题
- 字段映射：故障单号→`faultOrderNo`、问题编号→`issueNo`、问题类型→`issueType`、涉及领域→`domain`、产品型号→`productModel`、问题描述→`issueDesc`、详细说明→`detailDesc`、解决方案→`solution`

---

#### 5.3.13 获取五维评估

| 项目 | 说明 |
|------|------|
| URL | `GET /evaluation/dimension/{itemId}` |
| 返回 | JSON `Result<DimensionDataVO>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | Long | 是 | 评估项ID |

**响应DTO** — `DimensionDataVO`：

| 字段 | 类型 | 说明 |
|------|------|------|
| itemId | Long | 评估项ID |
| dimensions | List\<DimensionGroupVO\> | 五维评估数据 |
| dimensionOptions | List\<DimensionOptionVO\> | 维度选项列表（含维度、风险等级、选项文本、选中状态） |

**DimensionGroupVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| dimensionType | String | 维度类型：tech_novelty/impact_scope/severity/change_complexity/history_issue |
| dimensionName | String | 维度名称 |
| dimensionWeight | BigDecimal | 维度权重 |
| highGroup | DimensionOptionGroupVO | 高组选项 |
| middleGroup | DimensionOptionGroupVO | 中组选项 |
| lowGroup | DimensionOptionGroupVO | 低组选项 |
| calculatedScore | BigDecimal | 计算得分 |

**DimensionOptionGroupVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| options | List\<DimensionOptionVO\> | 选项列表 |
| groupScore | BigDecimal | 组得分 |

**DimensionOptionVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 选项ID |
| dimension | String | 维度：tech_novelty/impact_scope/severity/change_complexity/history_issue |
| riskLevel | String | 风险等级：HIGH/MEDIUM/LOW |
| optionText | String | 选项描述文本 |
| isSelected | String | 选中状态：yes/no/blank |
| sortOrder | Integer | 排序号 |

---

#### 5.3.14 保存五维评估

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/dimension/save` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `DimensionSaveRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | Long | 是 | 评估项ID |
| dimensionOptions | List\<DimensionOptionSaveVO\> | 是 | 选项保存列表 |

**DimensionOptionSaveVO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| optionId | Long | 是 | 选项ID |
| isSelected | String | 是 | 选中状态：yes/no/blank |

---

#### 5.3.15 计算风险评分

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/risk-score/calculate/{itemId}` |
| 返回 | JSON `Result<RiskScoreVO>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | Long | 是 | 评估项ID |

**响应DTO** — `RiskScoreVO`：

| 字段 | 类型 | 说明 |
|------|------|------|
| itemId | Long | 评估项ID |
| techNoveltyScore | BigDecimal | 技术新颖性得分 |
| impactScopeScore | BigDecimal | 影响范围得分 |
| severityScore | BigDecimal | 失效严重度得分 |
| changeComplexityScore | BigDecimal | 变更复杂度得分 |
| historyIssueScore | BigDecimal | 历史问题得分 |
| totalScore | BigDecimal | 风险综合评分 |
| riskLevel | String | 风险等级：H/M/L |
| drbfmSuggestion | String | DRBFM触发评估建议 |
| drbfmSuggestionReason | String | 建议理由 |
| drbfmConclusion | String | 最终DRBFM触发结论 |

---

#### 5.3.16 确认评估

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/confirm/{taskId}` |
| 返回 | JSON `Result<Long>` (分析任务ID) |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |

**业务规则**：
- 状态必须为`scored`
- 校验所有LEVEL=0评估项五维评估是否全部完成
- 校验通过后创建DRBFM分析任务（调用`AnalysisService`）
- 评估任务状态更新为`confirmed`

---

#### 5.3.17 指派协作人

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/collaborator/assign` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `CollaboratorAssignRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | Long | 是 | 评估任务ID |
| collaborators | List\<CollaboratorItem\> | 是 | 协作人列表 |

**CollaboratorItem**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | String | 是 | 协作人用户ID |
| userName | String | 是 | 协作人姓名 |
| changeListItemIds | List\<Long\> | 是 | 负责的变更点清单项ID列表 |

---

#### 5.3.18 协作人指派（上传界面）

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/collaborator/assign` |
| 方法 | POST |
| 说明 | TSE在上传变更点清单或质量策划时，同时指派协作人 |

请求参数：
```json
{
  "taskId": 123,
  "collaborators": [
    {"userId": "user001", "changeListItemIds": [1,2,3]},
    {"userId": "user002", "changeListItemIds": [4,5,6]}
  ]
}
```

响应：Result<Void>

- 指派后协作人自动获得对应变更点的编辑权限
- 单方面指派，无需协作人确认接受

---

#### 5.3.19 部件级评估合并

| 项目 | 说明 |
|------|------|
| URL | `POST /evaluation/merge/{taskId}` |
| 返回 | JSON `Result<Void>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|
| taskId | Long | 是 | 部件级评估任务ID |

**业务规则**：
- 保留系统级（LEVEL=0）评估内容不变
- 更新部件级评估内容，按`itemId`匹配合并
- 已有评估内容的保留，否则新增
- 双路排序算法：系统级行优先，部件级行按`itemId`插入

---

### 5.4 Provider接口设计

```java
public interface EvaluationProvider {

    PageResult<EvaluationTaskVO> queryEvaluationPage(int page, int rows, String projectId, String level);

    Long createEvaluationTask(EvaluationTaskCreateRequest request);

    EvaluationTaskVO getEvaluationDetail(Long taskId);

    void importChangeList(Long taskId, MultipartFile file);

    List<ChangeListItemVO> getChangeList(Long taskId);

    void importQualityPlan(Long taskId, MultipartFile file);

    void autoMatch(Long taskId);

    void submitEvaluation(EvaluationSubmitRequest request);  // @AuditLog(action = "SUBMIT_EVALUATION", resourceType = "EVALUATION")

    void withdrawEvaluation(Long taskId);

    void reviewEvaluation(EvaluationReviewRequest request);

    void importHistoryIssues(Long taskId, MultipartFile file);

    EvaluationItemVO getDimensionData(Long itemId);

    void saveDimensionData(DimensionSaveRequest request);

    void calculateRiskScore(Long itemId);

    void confirmEvaluation(Long taskId);  // @AuditLog(action = "CONFIRM_EVALUATION", resourceType = "EVALUATION")

    void assignCollaborator(CollaboratorAssignRequest request);

    void mergeEvaluation(Long taskId);  // @AuditLog(action = "MERGE_EVALUATION", resourceType = "EVALUATION")
}
```

#### 5.4.1 queryEvaluationPage

| 项目 | 说明 |
|------|------|
| 事务 | 无（只读查询） |
| 调用Service | `EvaluationTaskService.queryPage()` |
| 业务规则 | 按`projectId`和`level`筛选，按创建时间降序排列 |

---

#### 5.4.2 createEvaluationTask

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `EvaluationTaskService.create()`, `ProjectService.getById()`(只读) |
| 业务规则 | 1. 通过`ProjectService`校验项目存在性；2. `level=system`时校验该项目无已有系统级评估任务（否则抛`2001002`）；3. `level=component`时校验`parentTaskId`对应的系统级评估任务存在；4. 初始状态`draft`，`submitCount=0`，`isWithdrawn=0`，`creator`为当前登录用户 |

---

#### 5.4.3 getEvaluationDetail

| 项目 | 说明 |
|------|------|
| 事务 | 无（只读查询） |
| 调用Service | `EvaluationTaskService.getById()`, `ChangeListService.getByTaskId()`, `QualityPlanService.getByTaskId()`, `HistoryIssueService.getByTaskId()`, `EvaluationItemService.listByTaskId()` |
| 业务规则 | 组装评估任务详情VO，包含变更点清单、质量策划、历史问题、评估项等完整信息 |

---

#### 5.4.4 importChangeList

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ChangeListService.importAndParse()`, `QualityPlanService.getByTaskId()`(只读), `ChangeListService.autoMatchWithQualityPlan()` |
| 业务规则 | 1. 校验评估任务存在（否则抛`2001001`）；2. 解析Excel文件，按LEVEL列解析无限层级结构（详见5.7.1）；3. 重复导入时先删除该任务关联的所有`fmea_change_list_item`记录再写入新数据；4. 设置`has_change_list=true`；5. 若质量策划已导入（`has_quality_plan=true`），自动触发匹配更新`qualityMatch`字段；6. 解析失败抛`2002001`，格式不正确抛`2002002` |

---

#### 5.4.5 getChangeList

| 项目 | 说明 |
|------|------|
| 事务 | 无（只读查询） |
| 调用Service | `ChangeListItemService.listByTaskId()` |
| 业务规则 | 查询变更点清单项，组装树形结构返回 |

---

#### 5.4.6 importQualityPlan

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `QualityPlanService.importAndProcess()`, `AiService.processQualityPlan()`, `ChangeListItemService.listByTaskId()`(只读), `ChangeListService.autoMatchWithQualityPlan()` |
| 业务规则 | 1. 读取Excel各Sheet内容转Markdown；2. 调用`AiService.processQualityPlan()`提取"风险小类+风险策划指南"；3. 暂存至`fmea_quality_plan`表；4. 设置`has_quality_plan=true`；5. 若变更点清单已导入（`has_change_list=true`），自动触发匹配；6. 导入失败抛`2003001` |

---

#### 5.4.7 autoMatch

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ChangeListItemService.listByTaskId()`(只读), `QualityPlanService.getByTaskId()`(只读), `ChangeListItemService.updateQualityMatch()` |
| 业务规则 | 1. 读取线上变更点清单和质量策划暂存内容；2. 按部件名称模糊匹配规则执行匹配（详见5.7.3）；3. 匹配成功更新`qualityMatch`字段；4. 全部无匹配结果抛`2004001` |

---

#### 5.4.8 submitEvaluation

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `EvaluationTaskService.submit()`, `LarkService.sendMessage()`, `EmailService.sendNotify()` |
| 业务规则 | 1. 校验评估任务存在（否则抛`2001001`）；2. 校验变更点清单已导入（否则抛`2001003`）；3. 校验状态为`draft`或`rejected`（否则抛`2001003`）；4. 状态更新为`submitted`，`submitCount`自增1；5. 通过`LarkService`和`EmailService`通知PSE |

---

#### 5.4.9 withdrawEvaluation

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `EvaluationTaskService.withdraw()` |
| 业务规则 | 1. 校验状态为`submitted`（否则抛`2001003`）；2. 校验当前用户为创建人；3. 状态更新为`draft`，`isWithdrawn=1`。撤回后状态回退为DRAFT；恢复变更点清单和质量策划的编辑权限；submitCount不重置（记录累计提交次数） |

---

#### 5.4.10 reviewEvaluation

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `EvaluationTaskService.review()`, `LarkService.sendMessage()`, `EmailService.sendNotify()` |
| 业务规则 | 1. 校验状态为`submitted`（否则抛`2001003`）；2. 校验当前用户为PSE角色；3. `approve`：状态变为`approved`，通知TSE进入历史问题导入步骤；4. `reject`：状态变为`rejected`，通知TSE修改后重新提交 |

---

#### 5.4.11 importHistoryIssues

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `HistoryIssueService.importIssues()` |
| 业务规则 | 1. 校验评估任务状态为`approved`（否则抛`2001003`）；2. 追加模式导入，不覆盖已有历史问题；3. 字段映射详见5.3.12 |

---

#### 5.4.12 getDimensionData

| 项目 | 说明 |
|------|------|
| 事务 | 无（只读查询） |
| 调用Service | `EvaluationItemService.getById()`, `DimensionOptionService.listByItemId()` |
| 业务规则 | 组装五维评估数据，按维度类型分组，包含高/中/低三组选项及选中状态 |

---

#### 5.4.13 saveDimensionData

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `DimensionOptionService.batchUpdateSelection()` |
| 业务规则 | 1. 批量更新选项的`isSelected`字段；2. 校验评估项存在；3. 校验评估任务状态为`approved`或`scored`（否则抛`2001003`） |

---

#### 5.4.14 calculateRiskScore

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `EvaluationItemService.calculateRiskScore()`, `DimensionOptionService.listByItemId()`(只读), `AiService.generateSuggestionReason()` |
| 业务规则 | 1. 读取五维选项，按高3/中2/低2规则计算各维度得分（详见5.7.4）；2. 按加权公式计算风险综合评分（详见5.7.5）；3. 按阈值判定H/M/L（详见5.7.6）；4. 填充`drbfmSuggestion`和`drbfmSuggestionReason`；5. 默认填充`drbfmConclusion`与风险等级一致；6. 更新评估项评分字段；7. 校验所有LEVEL=0评估项是否完成五维评估，若全部完成则评估任务状态更新为`scored`；8. 计算失败抛`2005002` |

---

#### 5.4.15 confirmEvaluation

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `EvaluationTaskService.confirm()`, `EvaluationItemService.checkAllLevel0Completed()`, `AnalysisService.createAnalysisTask()` |
| 业务规则 | 1. 校验状态为`scored`（否则抛`2001003`）；2. 校验所有LEVEL=0评估项五维评估已完成（否则抛`2005001`并列出未完成项）；3. 调用`AnalysisService.createAnalysisTask()`创建DRBFM分析任务；4. 评估任务状态更新为`confirmed` |

---

#### 5.4.16 assignCollaborator

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `CollaboratorService.assign()`, `LarkService.sendMessage()` |
| 业务规则 | 1. 校验评估任务为部件级（`level=component`）；2. 校验当前用户为TSE；3. 单方面指派，无需被指派人确认接受；4. 指派后协作人自动获得对应变更点的编辑权限；5. 通过`LarkService`通知协作人 |

---

#### 5.4.17 assignCollaborator

| 项目 | 说明 |
|------|------|
| 方法签名 | `void assignCollaborator(CollaboratorAssignRequest request)` |
| 调用Service | `PermissionService.batchSave()` |
| 业务规则 | 1. 校验评估任务存在（否则抛`2001001`）；2. 校验当前用户为TSE；3. 为每个协作人创建编辑权限记录；4. 协作人仅获得指定变更点的编辑权限 |

---

#### 5.4.18 mergeEvaluation

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `EvaluationItemService.mergeComponentEvaluation()`, `ChangeListItemService.mergeComponentItems()` |
| 业务规则 | 1. 保留系统级（LEVEL=0）评估内容不变；2. 按`itemId`匹配合并部件级评估内容（详见5.7.7）；3. 合并冲突时抛`2006002` |

---

### 5.5 Service接口设计

#### 5.5.1 EvaluationTaskService

```java
public interface EvaluationTaskService {
    IPage<EvaluationTask> queryPage(int page, int rows, String projectId, String level);
    EvaluationTask create(EvaluationTask task);
    EvaluationTask getById(Long id);
    void submit(Long taskId, String submitComment);
    void withdraw(Long taskId);
    void review(Long taskId, String conclusion, String reviewComment);
    void confirm(Long taskId);
    boolean existsSystemLevelTask(String projectId);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| queryPage | `EvaluationTaskMapper.selectPage()` | 分页查询评估任务 |
| create | `EvaluationTaskMapper.insert()` | 创建评估任务 |
| getById | `EvaluationTaskMapper.selectById()` | 根据ID查询 |
| submit | `EvaluationTaskMapper.updateById()` | 更新状态为submitted，submitCount+1 |
| withdraw | `EvaluationTaskMapper.updateById()` | 更新状态为draft，isWithdrawn=1 |
| review | `EvaluationTaskMapper.updateById()` | 更新状态为approved/rejected |
| confirm | `EvaluationTaskMapper.updateById()` | 更新状态为confirmed |
| existsSystemLevelTask | `EvaluationTaskMapper.selectCount()` | 检查项目是否已有系统级评估任务 |

**EvaluationTask Entity新增字段**：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| has_change_list | BIT | 0 | 是否已导入变更清单 |
| has_quality_plan | BIT | 0 | 是否已导入质量策划 |

---

#### 5.5.2 EvaluationItemService

```java
public interface EvaluationItemService {
    List<EvaluationItem> listByTaskId(Long taskId);
    EvaluationItem getById(Long id);
    void calculateRiskScore(Long itemId);
    boolean checkAllLevel0Completed(Long taskId);
    void mergeComponentEvaluation(Long taskId, Long parentTaskId);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| listByTaskId | `EvaluationItemMapper.selectList()` | 按评估任务ID查询评估项 |
| getById | `EvaluationItemMapper.selectById()` | 根据ID查询 |
| calculateRiskScore | `EvaluationItemMapper.updateById()` | 计算并更新风险评分 |
| checkAllLevel0Completed | `EvaluationItemMapper.selectCount()` | 检查LEVEL=0评估项是否全部完成 |
| mergeComponentEvaluation | `EvaluationItemMapper.selectList()`, `EvaluationItemMapper.insert()`, `EvaluationItemMapper.updateById()` | 部件级评估合并 |

**EvaluationItem Entity五维字段修改**：

原字段（DECIMAL类型存储得分）改为_option_id（存储选项ID）+ _score（存储计算后分数）双字段：

| 原字段 | 新字段1 | 新字段2 | 说明 |
|--------|---------|---------|------|
| tech_novelty DECIMAL(5,2) | tech_novelty_option_id BIGINT | tech_novelty_score INT | 技术新颖性：选项ID+计算后分数 |
| impact_scope DECIMAL(5,2) | impact_scope_option_id BIGINT | impact_scope_score INT | 影响范围：选项ID+计算后分数 |
| severity DECIMAL(5,2) | severity_option_id BIGINT | severity_score INT | 失效严重度：选项ID+计算后分数 |
| change_complexity DECIMAL(5,2) | change_complexity_option_id BIGINT | change_complexity_score INT | 变更复杂度：选项ID+计算后分数 |
| history_issue DECIMAL(5,2) | history_issue_option_id BIGINT | history_issue_score INT | 历史问题：选项ID+计算后分数 |

---

#### 5.5.3 ChangeListService / ChangeListItemService

```java
public interface ChangeListService {
    ChangeList getByTaskId(Long taskId);
    ChangeList importAndParse(Long taskId, MultipartFile file);
    void autoMatchWithQualityPlan(Long taskId, QualityPlan qualityPlan);
}

public interface ChangeListItemService {
    List<ChangeListItem> listByTaskId(Long taskId);
    void updateQualityMatch(Long itemId, String qualityMatch);
    void deleteByTaskId(Long taskId);
    void mergeComponentItems(Long taskId, Long parentTaskId, List<ChangeListItem> componentItems);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| getByTaskId | `ChangeListMapper.selectOne()` | 按评估任务ID查询清单 |
| importAndParse | `ChangeListMapper.insert()`, `ChangeListItemMapper.delete()`, `ChangeListItemMapper.batchInsert()` | 导入并解析Excel |
| autoMatchWithQualityPlan | `ChangeListItemMapper.selectList()`, `ChangeListItemMapper.updateById()` | 自动匹配质量策划 |
| listByTaskId | `ChangeListItemMapper.selectList()` | 查询变更点清单项 |
| updateQualityMatch | `ChangeListItemMapper.updateById()` | 更新匹配内容 |
| deleteByTaskId | `ChangeListItemMapper.delete()` | 删除关联清单项 |
| mergeComponentItems | `ChangeListItemMapper.selectList()`, `ChangeListItemMapper.insert()`, `ChangeListItemMapper.updateById()` | 合并部件级清单项 |

---

#### 5.5.4 QualityPlanService

```java
public interface QualityPlanService {
    QualityPlan getByTaskId(Long taskId);
    QualityPlan importAndProcess(Long taskId, MultipartFile file);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| getByTaskId | `QualityPlanMapper.selectOne()` | 按评估任务ID查询质量策划 |
| importAndProcess | `QualityPlanMapper.insertOrUpdate()` | 导入Excel并AI处理 |

---

#### 5.5.5 HistoryIssueService

```java
public interface HistoryIssueService {
    List<HistoryIssue> getByTaskId(Long taskId);
    int importIssues(Long taskId, MultipartFile file);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| getByTaskId | `HistoryIssueMapper.selectList()` | 按评估任务ID查询历史问题 |
| importIssues | `HistoryIssueMapper.batchInsert()` | 追加导入历史问题 |

---

#### 5.5.6 DimensionOptionService

```java
public interface DimensionOptionService {
    List<DimensionOption> listByItemId(Long itemId);
    void batchUpdateSelection(List<DimensionOption> options);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| listByItemId | `DimensionOptionMapper.selectList()` | 按评估项ID查询选项 |
| batchUpdateSelection | `DimensionOptionMapper.updateBatchById()` | 批量更新选项选中状态 |

---

#### 5.5.7 CollaboratorService

```java
public interface CollaboratorService {
    void assign(Long taskId, List<CollaboratorItem> collaborators);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| assign | `EvaluationTaskMapper.updateById()` | 指派协作人，更新权限 |

---

### 5.6 状态机设计

评估任务状态枚举 `EvaluationStatus`：

| 枚举值 | 中文名 | 说明 |
|--------|--------|------|
| `DRAFT` | 草稿 | 初始状态 |
| `SUBMITTED` | 已提交 | TSE提交后 |
| `APPROVED` | 审核通过 | PSE审核通过 |
| `REJECTED` | 审核不通过 | PSE审核不通过 |
| `SCORED` | 已评分 | 五维评估全部完成并计算风险评分 |
| `CONFIRMED` | 已确认 | 评估确认，已创建分析任务 |

**状态转换表**：

| 当前状态 | 触发动作 | 目标状态 | 校验条件 | 执行者 |
|----------|----------|----------|----------|--------|
| `DRAFT` | submit | `SUBMITTED` | 变更点清单已导入 | TSE |
| `SUBMITTED` | review(approve) | `APPROVED` | — | PSE |
| `SUBMITTED` | review(reject) | `REJECTED` | — | PSE |
| `SUBMITTED` | withdraw | `DRAFT` | 仅TSE可撤回；已撤回后恢复编辑权限 | TSE |
| `REJECTED` | submit | `SUBMITTED` | 变更点清单已导入 | TSE |
| `APPROVED` | score | `SCORED` | 所有LEVEL=0评估项五维评估全部完成 | 系统（自动） |
| `SCORED` | confirm | `CONFIRMED` | 所有LEVEL=0评估项已完成五维评估和风险评分 | PSE/TSE |

**状态机实现**：

```java
public enum EvaluationStatus {
    DRAFT("draft"),
    SUBMITTED("submitted"),
    APPROVED("approved"),
    REJECTED("rejected"),
    SCORED("scored"),
    CONFIRMED("confirmed");

    private final String code;

    EvaluationStatus(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    private static final Map<EvaluationStatus, Set<String>> ALLOWED_TRANSITIONS = new HashMap<>();

    static {
        ALLOWED_TRANSITIONS.put(DRAFT, Set.of(SUBMITTED.code));
        ALLOWED_TRANSITIONS.put(SUBMITTED, Set.of(APPROVED.code, REJECTED.code, DRAFT.code));
        ALLOWED_TRANSITIONS.put(REJECTED, Set.of(SUBMITTED.code));
        ALLOWED_TRANSITIONS.put(APPROVED, Set.of(SCORED.code));
        ALLOWED_TRANSITIONS.put(SCORED, Set.of(CONFIRMED.code));
        ALLOWED_TRANSITIONS.put(CONFIRMED, Collections.emptySet());
    }

    public boolean canTransitTo(String targetCode) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Collections.emptySet()).contains(targetCode);
    }
}
```

---

### 5.7 业务规则

#### 5.7.1 变更点清单无限层级解析规则

**输入**：Excel文件，包含列：LEVEL、ID、系统/部件名称、开发类型、I/M/N选项、变更点

**解析算法**：

```
1. 按行顺序读取Excel数据
2. 维护一个栈 stack，用于追踪当前层级路径
3. 对每一行数据：
   a. 读取 LEVEL 列值 levelNum
   b. 如果 levelNum == 0：
      - 清空栈，当前行为根节点
      - parentId = null
   c. 如果 levelNum > 0：
      - 弹出栈中 levelNum >= 当前 levelNum 的节点
      - 栈顶元素即为父节点，parentId = 栈顶元素.id
   d. 将当前行压入栈
   e. 写入 fmea_change_list_item 表，设置 parentId、levelNum、sortOrder
4. 栈操作保证任意深度层级均可正确解析
```

**示例**：

| LEVEL | ID | 名称 | parentId |
|-------|-----|------|----------|
| 0 | SYS-01 | 整机系统 | null |
| 1 | COMP-01 | 电源模块 | SYS-01.id |
| 2 | PART-01 | DC-DC芯片 | COMP-01.id |
| 1 | COMP-02 | 控制模块 | SYS-01.id |
| 2 | PART-02 | MCU | COMP-02.id |

---

#### 5.7.2 质量策划导入顺序处理

**三种导入顺序场景的统一处理逻辑**：

| 场景 | 导入顺序 | 处理逻辑 |
|------|----------|----------|
| 场景1 | 先导入变更清单，再导入质量策划 | `importChangeList`：导入变更清单数据到fmea_change_list_item，设置has_change_list=true；`importQualityPlan`：导入质量策划数据，检测到has_change_list=true，自动触发匹配更新；结果：变更清单+质量策划匹配后数据 |
| 场景2 | 先导入质量策划，再导入变更清单 | `importQualityPlan`：导入质量策划数据到fmea_quality_plan，设置has_quality_plan=true；`importChangeList`：导入变更清单数据，检测到has_quality_plan=true，自动触发匹配更新；结果：变更清单+质量策划匹配后数据 |
| 场景3 | 都已导入，点击自动匹配 | `autoMatch`：读取线上变更清单+质量策划，执行匹配更新；结果：重新匹配更新 |

**判断依据**：fmea_evaluation_task表增加has_change_list(BIT)和has_quality_plan(BIT)字段

---

#### 5.7.3 自动匹配规则

**匹配算法**：

```
1. 遍历所有变更点清单项（fmea_change_list_item）
2. 对每个清单项的 structureName（部件名称）：
   a. 在质量策划的风险小类列表中查找匹配项
   b. 匹配规则（优先级从高到低）：
      - 精确匹配：structureName == 风险小类
      - 包含匹配：风险小类包含 structureName，或 structureName 包含风险小类
      - 关键词匹配：提取 structureName 中的核心关键词（去除常见前缀/后缀），在风险小类中查找
   c. 取匹配度最高的结果
3. 匹配成功：将风险策划指南内容写入 qualityMatch 字段
4. 匹配失败：qualityMatch 保持为空
5. 返回匹配结果统计
```

---

#### 5.7.4 五维评估评分算法

**维度选项结构**（每个维度）：

| 组别 | 选项数量 | 选中判定 | 得分 |
|------|----------|----------|------|
| 高组 | 3个选项 | 任一选项选中"是" | 取该维度满分值（高分） |
| 中组 | 2个选项 | 高组无"是"，中组任一选中"是" | 取中分 |
| 低组 | 2个选项 | 高组和中组均无"是"，低组任一选中"是" | 取低分 |
| — | — | 三组均无"是" | 0分 |

**每个维度的评分规则**：高组任一选项选中→10分；中组任一选项选中→5分；低组任一选项选中→3分；均未选→0分。高组优先：高组有选中则取10分，不再看中/低组。

**各维度满分值与分组分值**：

| 维度 | 权重 | 高分 | 中分 | 低分 |
|------|------|------|------|------|
| 技术新颖性（tech_novelty） | 15% | 10 | 5 | 3 |
| 影响范围（impact_scope） | 30% | 10 | 5 | 3 |
| 失效严重度（severity） | 30% | 10 | 5 | 3 |
| 变更复杂度（change_complexity） | 20% | 10 | 5 | 3 |
| 历史问题（history_issue） | 5% | 10 | 5 | 3 |

**计算伪代码**：

```java
private BigDecimal calculateDimensionScore(List<DimensionOption> options) {
    List<DimensionOption> highGroup = options.stream()
        .filter(o -> "high".equals(o.getGroupType())).collect(Collectors.toList());
    List<DimensionOption> middleGroup = options.stream()
        .filter(o -> "middle".equals(o.getGroupType())).collect(Collectors.toList());
    List<DimensionOption> lowGroup = options.stream()
        .filter(o -> "low".equals(o.getGroupType())).collect(Collectors.toList());

    if (highGroup.stream().anyMatch(o -> "yes".equals(o.getIsSelected()))) {
        return HIGH_SCORE;
    }
    if (middleGroup.stream().anyMatch(o -> "yes".equals(o.getIsSelected()))) {
        return MIDDLE_SCORE;
    }
    if (lowGroup.stream().anyMatch(o -> "yes".equals(o.getIsSelected()))) {
        return LOW_SCORE;
    }
    return BigDecimal.ZERO;
}
```

---

#### 5.7.5 风险综合评分公式

```
风险综合评分 = 技术新颖性得分 × 15% + 影响范围得分 × 30% + 失效严重度得分 × 30%
             + 变更复杂度得分 × 20% + 历史问题得分 × 5%
```

**计算示例**：

| 维度 | 得分 | 权重 | 加权得分 |
|------|------|------|----------|
| 技术新颖性 | 6 | 15% | 0.90 |
| 影响范围 | 10 | 30% | 3.00 |
| 失效严重度 | 10 | 30% | 3.00 |
| 变更复杂度 | 6 | 20% | 1.20 |
| 历史问题 | 3 | 5% | 0.15 |
| **合计** | — | — | **8.25** |

结果保留两位小数。

---

#### 5.7.6 H/M/L判定阈值

| 风险综合评分 | 风险等级 | DRBFM触发评估建议 |
|-------------|----------|-------------------|
| ≥ 8 | H（高风险） | 必须进行DRBFM分析 |
| ≥ 5 且 < 8 | M（中风险） | 建议进行DRBFM分析 |
| < 5 | L（低风险） | 可以不进行DRBFM分析 |

**`drbfmSuggestion`映射**：
- H → "必须进行DRBFM分析"
- M → "建议进行DRBFM分析"
- L → "可以不进行DRBFM分析"

**`drbfmSuggestionReason`生成**：用户可选择两种模式之一：
1. **分数映射预定义理由**：根据风险等级和各维度得分，从预定义模板生成理由文本
2. **AI动态生成**：调用`AiService.generateSuggestionReason()`，传入五维评分数据，由AI生成个性化理由

**`drbfmConclusion`**：默认值与风险等级一致（H/M/L），PSE和TSE复核时可手动修改。

---

#### 5.7.7 部件级评估合并算法

**触发条件**：部件级评估任务协作人编辑完成后，TSE点击"合并"按钮。

**合并规则**：

```
1. 读取系统级评估任务的所有评估项（parentTaskId 对应的系统级任务）
2. 读取部件级评估任务的所有评估项
3. 合并策略：
   a. LEVEL=0（系统级）的评估内容：保留不变，不做任何修改
   b. LEVEL>0（部件级）的评估内容：按 itemId 匹配
      - itemId 已存在于系统级评估中 → 保留系统级评估内容（不覆盖）
      - itemId 不存在于系统级评估中 → 新增部件级评估项
4. 双路排序算法：
   a. 系统级行按原顺序排列（sortOrder 保持不变）
   b. 部件级新增行按 itemId 顺序插入到对应层级位置
5. 变更点清单合并：
   a. 按 itemId 匹配
   b. itemId 已存在 → 更新 changePoint 等字段
   c. itemId 不存在 → 新增记录
6. 合并冲突检测：
   a. 同一 itemId 在系统级和部件级均有评估内容且内容不一致
   b. 冲突时抛出 2006002 错误，提示用户手动处理
```

---

#### 5.7.8 协作人指派流程

```
1. TSE在上传变更点清单或质量策划的界面，点击"指派协作人"
2. 选择协作人，指定各协作人负责的变更点
3. 系统为协作人创建编辑权限（permission_type='edit'）
4. 协作人登录后可编辑被指派的变更点
5. TSE无需等待协作人签核，可直接提交评估表
6. 协作人编辑的变更点内容在提交时自动合并
```

---

### 5.8 错误码

| 错误码 | HTTP状态码 | 描述 | 触发场景 | 处理建议 |
|--------|-----------|------|----------|----------|
| 2001001 | 404 | 评估任务不存在 | 查询/操作不存在的评估任务ID | 检查任务ID是否正确 |
| 2001002 | 409 | 系统级评估任务已存在 | 同一项目重复创建系统级评估任务 | 每个项目仅允许一个系统级评估任务 |
| 2001003 | 409 | 评估任务状态不允许此操作 | 在非法状态下执行操作（如草稿状态审核） | 检查当前任务状态是否允许该操作 |
| 2002001 | 500 | 变更点清单导入失败 | Excel文件解析异常、IO错误 | 检查文件格式和内容 |
| 2002002 | 400 | 变更点清单格式不正确 | 缺少必要列、数据类型不匹配 | 按标准模板重新准备文件 |
| 2003001 | 500 | 质量策划导入失败 | Excel读取失败、AI处理异常 | 检查文件格式，重试导入 |
| 2004001 | 404 | 自动匹配无结果 | 变更点清单与质量策划无任何匹配项 | 检查部件名称和风险小类是否对应 |
| 2005001 | 400 | 五维评估未完成 | 存在LEVEL=0评估项未完成五维评估 | 完成所有LEVEL=0评估项的五维评估。错误响应data字段返回未完成评估的行号列表：`{"incompleteItems": [{"itemId": 101, "itemName": "电源模块", "missingDimensions": ["tech_novelty", "severity"]}, {"itemId": 105, "itemName": "信号处理", "missingDimensions": ["impact_scope"]}]}` |
| 2005002 | 500 | 风险评分计算失败 | 五维选项数据不完整、计算异常 | 检查五维评估数据完整性 |
| 2006001 | 400 | 协作人指派失败 | 指派协作人时权限创建失败 | 检查协作人信息和变更点是否有效 |
| 2006002 | 409 | 合并冲突 | 系统级与部件级评估内容冲突 | 手动处理冲突后重新合并 |

---

## 6. 基线输出与落地跟踪模块（fmea-baseline）

### 6.1 模块概述

| 项目 | 说明 |
|------|------|
| 包路径 | `com.fmea.baseline` |
| 数据库表 | `fmea_baseline`, `fmea_baseline_item`, `fmea_landing_task`, `fmea_landing_item`, `fmea_landing_audit` |
| 关联集成模块 | `LarkService`（落地通知）、`EmailService`（落地通知） |
| 关联业务模块 | `AnalysisService`（只读：分析任务数据）、`LibraryService`（入库写入：措施库/失效库） |

**核心职责**：将失效分析结果转化为可执行措施清单（基线输出），并跟踪措施在项目中的落地执行情况（落地跟踪），确保措施闭环。

---

### 6.2 包结构

```
com.fmea.baseline
├── controller
│   ├── BaselineController.java
│   └── LandingController.java
├── provider
│   ├── BaselineProvider.java                 (接口)
│   └── BaselineProviderImpl.java             (实现, @Service, @Transactional)
├── service
│   ├── BaselineService.java                  (接口)
│   ├── BaselineServiceImpl.java
│   ├── BaselineItemService.java              (接口)
│   ├── BaselineItemServiceImpl.java
│   ├── LandingTaskService.java               (接口)
│   ├── LandingTaskServiceImpl.java
│   ├── LandingItemService.java               (接口)
│   ├── LandingItemServiceImpl.java
│   └── LandingAuditService.java              (接口)
│       └── LandingAuditServiceImpl.java
├── mapper
│   ├── BaselineMapper.java
│   ├── BaselineItemMapper.java
│   ├── LandingTaskMapper.java
│   ├── LandingItemMapper.java
│   ├── LandingAuditMapper.java
│   └── LandingDeferredHistoryMapper.java
├── entity
│   ├── Baseline.java
│   ├── BaselineItem.java
│   ├── LandingTask.java
│   ├── LandingItem.java
│   ├── LandingAudit.java
│   └── LandingDeferredHistory.java
├── dto
│   ├── request
│   │   ├── BaselineSaveRequest.java
│   │   ├── LandingFillRequest.java
│   │   └── LandingAuditRequest.java
│   └── response
│       ├── BaselineVO.java
│       ├── BaselineItemVO.java
│       ├── LandingTaskVO.java
│       ├── LandingItemVO.java
│       └── LandingAuditVO.java
├── enums
│   ├── OutputMode.java
│   ├── MeasureType.java
│   ├── MeasureSource.java
│   ├── LandingStatus.java
│   └── AuditConclusion.java
└── converter
    ├── BaselineConverter.java
    ├── BaselineItemConverter.java
    └── LandingItemConverter.java
```

---

### 6.3 Controller API设计

#### 6.3.1 基线输出页

| 项目 | 说明 |
|------|------|
| URL | `GET /baseline/output/{analysisTaskId}` |
| 返回 | FTL视图 `baseline/output.ftl` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| analysisTaskId | Long | 是 | 分析任务ID |

---

#### 6.3.2 获取基线清单

| 项目 | 说明 |
|------|------|
| URL | `GET /baseline/items/{baselineId}` |
| 返回 | JSON `Result<List<BaselineItemVO>>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| baselineId | Long | 是 | 基线ID |

**响应DTO** — `BaselineItemVO`：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 基线项ID |
| baselineId | Long | 所属基线ID |
| measureType | String | 措施类型：preventive/detection/optimization |
| measureSource | String | 措施来源：AI/history |
| measureCategory | String | 措施分类：new/optimize |
| measureDesc | String | 措施描述 |
| relatedFailureMode | String | 关联失效模式 |
| relatedFailureCause | String | 关联失效原因 |
| severityScore | Integer | 严重度评分 |
| occurrenceScore | Integer | 发生度评分 |
| detectionScore | Integer | 探测度评分 |
| apLevel | String | 优先级：H/M/L |
| isLanding | boolean | 是否落地 |
| landingOwner | String | 落地负责人 |
| landingOwnerName | String | 落地负责人姓名 |
| landingDate | LocalDate | 落地时间 |
| sortOrder | int | 排序号 |

---

#### 6.3.3 保存基线输出

| 项目 | 说明 |
|------|------|
| URL | `POST /baseline/save` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `BaselineSaveRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| analysisTaskId | Long | 是 | 分析任务ID |
| outputMode | int | 是 | 输出模式：1-按S×O筛选/2-全部列出 |
| items | List\<BaselineItemSaveVO\> | 是 | 基线项列表 |

**BaselineItemSaveVO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 否 | 基线项ID（新增时为空，更新时必填） |
| measureType | String | 是 | 措施类型 |
| measureSource | String | 是 | 措施来源 |
| measureCategory | String | 是 | 措施分类 |
| measureDesc | String | 是 | 措施描述 |
| relatedFailureMode | String | 否 | 关联失效模式 |
| relatedFailureCause | String | 否 | 关联失效原因 |
| severityScore | Integer | 否 | 严重度评分 |
| occurrenceScore | Integer | 否 | 发生度评分 |
| detectionScore | Integer | 否 | 探测度评分 |
| apLevel | String | 否 | 优先级 |
| isLanding | boolean | 是 | 是否落地（默认true） |
| landingOwner | String | 否 | 落地负责人（isLanding=true时必填） |
| landingDate | LocalDate | 否 | 落地时间（isLanding=true时必填，不能为过去时间） |

---

#### 6.3.4 切换输出模式

| 项目 | 说明 |
|------|------|
| URL | `POST /baseline/switch-mode/{baselineId}` |
| Content-Type | application/json |
| 返回 | JSON `Result<List<BaselineItemVO>>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| baselineId | Long | 是 | 基线ID |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mode | int | 是 | 输出模式：1或2 |

---

#### 6.3.5 措施去重

| 项目 | 说明 |
|------|------|
| URL | `POST /baseline/deduplicate/{baselineId}` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| baselineId | Long | 是 | 基线ID |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| measureIds | List\<Long\> | 是 | 需要去重（删除）的措施ID列表 |

---

#### 6.3.6 提交基线

| 项目 | 说明 |
|------|------|
| URL | `POST /baseline/submit/{baselineId}` |
| 返回 | JSON `Result<Void>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| baselineId | Long | 是 | 基线ID |

**业务规则**：
- 校验所有`isLanding=true`的措施，落地负责人和落地时间不能为空
- 校验落地时间不能为过去时间
- 提交后基线状态变为`submitted`

---

#### 6.3.7 落地跟踪列表页

| 项目 | 说明 |
|------|------|
| URL | `GET /landing/list` |
| 返回 | FTL视图 `landing/list.ftl` |

---

#### 6.3.8 落地跟踪数据

| 项目 | 说明 |
|------|------|
| URL | `GET /landing/data` |
| 返回 | JSON分页数据 |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 是 | 当前页码 |
| rows | int | 是 | 每页条数 |
| projectId | String | 否 | 项目ID筛选 |

**响应DTO** — `PageResult<LandingTaskVO>`：

| 字段 | 类型 | 说明 |
|------|------|------|
| total | long | 总记录数 |
| rows | List\<LandingTaskVO\> | 数据列表 |

**LandingTaskVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 落地跟踪任务ID |
| baselineId | Long | 关联基线ID |
| projectId | String | 项目ID |
| projectName | String | 项目名称 |
| status | String | 任务状态 |
| totalItems | int | 落地项总数 |
| completedItems | int | 已完成落地项数 |
| pendingItems | int | 待填报落地项数 |
| createTime | LocalDateTime | 创建时间 |

---

#### 6.3.9 填报落地情况

| 项目 | 说明 |
|------|------|
| URL | `POST /landing/fill` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `LandingFillRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| landingItemId | Long | 是 | 落地项ID |
| landingResult | String | 是 | 落地情况：completed/failed/cannot_land/deferred |
| resultDesc | String | 否 | 结果说明（failed/cannot_land时必填） |
| newOwner | String | 否 | 新负责人（deferred时必填） |
| newOwnerName | String | 否 | 新负责人姓名 |
| newDate | LocalDate | 否 | 新落地时间（deferred时必填） |

---

#### 6.3.10 审核落地

| 项目 | 说明 |
|------|------|
| URL | `POST /landing/audit` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `LandingAuditRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| landingItemId | Long | 是 | 落地项ID |
| conclusion | String | 是 | 审核结论：pass/reject |
| auditComment | String | 否 | 审核意见 |

---

### 6.4 Provider接口设计

```java
public interface BaselineProvider {

    BaselineVO getBaselineOutput(Long analysisTaskId);

    void saveBaselineOutput(BaselineSaveRequest request);

    void switchOutputMode(Long baselineId, int mode);

    void deduplicateMeasures(Long baselineId, List<Long> measureIds);

    void submitBaseline(Long baselineId);  // @AuditLog(action = "SUBMIT_BASELINE", resourceType = "BASELINE")

    PageResult<LandingTaskVO> queryLandingPage(int page, int rows, String projectId);

    void fillLandingItem(LandingFillRequest request);

    void auditLandingItem(LandingAuditRequest request);  // @AuditLog(action = "AUDIT_LANDING_ITEM", resourceType = "LANDING")
}
```

#### 6.4.1 getBaselineOutput

| 项目 | 说明 |
|------|------|
| 事务 | 无（只读查询） |
| 调用Service | `BaselineService.getByAnalysisTaskId()`, `BaselineItemService.listByBaselineId()`, `AnalysisService.getById()`(只读) |
| 业务规则 | 1. 根据分析任务ID查询基线数据；2. 若基线不存在，按默认模式一自动生成基线清单；3. 从失效分析结果提取预防措施、探测措施、优化措施 |

**基线输出措施合并查询逻辑**：
1. 分别查询fmea_preventive_measure、fmea_detection_measure、fmea_optimization_measure三张表
2. 统一映射为BaselineMeasureVO（通用措施VO）：
   - id：原表ID
   - measureType：preventive/detection/optimization
   - description：措施描述
   - sourceType：AI_GENERATED/HISTORY
   - changeType：NEW/OPTIMIZED
   - isLanding：是否落地
   - landingOwner：落地负责人
   - landingDeadline：落地时间
3. 三表结果合并为一个List\<BaselineMeasureVO\>
4. 按measureType排序（preventive→detection→optimization），同类型内按创建时间排序

**BaselineMeasureVO DTO定义**：

```java
public class BaselineMeasureVO {
    private Long id;
    private String measureType;     // preventive/detection/optimization
    private String description;
    private String sourceType;      // AI_GENERATED/HISTORY
    private String changeType;      // NEW/OPTIMIZED
    private Boolean isLanding;
    private String landingOwner;
    private LocalDateTime landingDeadline;
    private LocalDateTime createdTime;
}
```

---

#### 6.4.2 saveBaselineOutput

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `BaselineService.saveOrUpdate()`, `BaselineItemService.batchSave()` |
| 业务规则 | 1. 保存基线基本信息和基线项列表；2. 校验`isLanding=true`的措施落地负责人和时间不为空 |

---

#### 6.4.3 switchOutputMode

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `BaselineService.updateMode()`, `BaselineItemService.regenerateByMode()`, `AnalysisService.getById()`(只读) |
| 业务规则 | 1. 模式一：根据S×O筛选措施，仅展示S×O达到阈值的措施，按S×O降序排列；2. 模式二：直接列出所有预防措施、探测措施、优化措施，不按S×O筛选；3. 切换模式后重新生成基线项列表 |

---

#### 6.4.4 deduplicateMeasures

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `BaselineItemService.removeByIds()` |
| 业务规则 | 去重逻辑：系统不自动判断重复，由工程师人工识别重复措施后，通过删除操作移除。deduplicateMeasures方法接收待删除的措施ID列表，执行逻辑删除（is_deleted=1） |

---

#### 6.4.5 submitBaseline

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `BaselineService.submit()`, `BaselineItemService.listByBaselineId()`(只读) |
| 业务规则 | 1. 校验所有`isLanding=true`的措施落地负责人不为空；2. 校验所有`isLanding=true`的措施落地时间不为空且不为过去时间；3. 基线状态更新为`submitted` |

---

#### 6.4.6 queryLandingPage

| 项目 | 说明 |
|------|------|
| 事务 | 无（只读查询） |
| 调用Service | `LandingTaskService.queryPage()` |
| 业务规则 | 按`projectId`筛选，按创建时间降序排列 |

---

#### 6.4.7 fillLandingItem

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `LandingItemService.fill()`, `LandingAuditService.createAuditRecord()`, `LarkService.sendMessage()`, `EmailService.sendNotify()` |
| 业务规则 | 1. 校验当前用户为落地负责人；2. 校验落地项状态为`pending`；3. 按落地情况更新状态（详见6.7.4）；4. 创建审核记录；5. 通知主管审核 |

---

#### 6.4.8 auditLandingItem

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `LandingAuditService.audit()`, `LandingItemService.updateStatus()`, `LibraryService.writeMeasureLibrary()`, `LibraryService.writeFailureLibrary()`, `LarkService.sendMessage()`, `EmailService.sendNotify()` |
| 业务规则 | 1. 校验当前用户为主管；2. 审核通过按落地情况执行不同动作（详见6.7.5）；3. 审核不通过通知负责人重新处理 |

---

### 6.5 Service接口设计

#### 6.5.1 BaselineService

```java
public interface BaselineService {
    Baseline getByAnalysisTaskId(Long analysisTaskId);
    Baseline saveOrUpdate(Baseline baseline);
    void updateMode(Long baselineId, int mode);
    void submit(Long baselineId);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| getByAnalysisTaskId | `BaselineMapper.selectOne()` | 按分析任务ID查询基线 |
| saveOrUpdate | `BaselineMapper.insertOrUpdate()` | 保存或更新基线 |
| updateMode | `BaselineMapper.updateById()` | 更新输出模式 |
| submit | `BaselineMapper.updateById()` | 更新状态为submitted |

---

#### 6.5.2 BaselineItemService

```java
public interface BaselineItemService {
    List<BaselineItem> listByBaselineId(Long baselineId);
    void batchSave(List<BaselineItem> items);
    void removeByIds(List<Long> ids);
    void regenerateByMode(Long baselineId, int mode);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| listByBaselineId | `BaselineItemMapper.selectList()` | 按基线ID查询基线项 |
| batchSave | `BaselineItemMapper.batchInsertOrUpdate()` | 批量保存 |
| removeByIds | `BaselineItemMapper.deleteBatchIds()` | 物理删除 |
| regenerateByMode | `BaselineItemMapper.delete()`, `BaselineItemMapper.batchInsert()` | 按模式重新生成 |

---

#### 6.5.3 LandingTaskService

```java
public interface LandingTaskService {
    IPage<LandingTask> queryPage(int page, int rows, String projectId);
    LandingTask createFromBaseline(Long baselineId);
    LandingTask getById(Long id);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| queryPage | `LandingTaskMapper.selectPage()` | 分页查询 |
| createFromBaseline | `LandingTaskMapper.insert()` | 从基线创建落地任务 |
| getById | `LandingTaskMapper.selectById()` | 根据ID查询 |

---

#### 6.5.4 LandingItemService

```java
public interface LandingItemService {
    List<LandingItem> listByTaskId(Long taskId);
    void fill(Long itemId, String landingResult, String resultDesc, String newOwner, LocalDate newDate);
    void updateStatus(Long itemId, String status);
    void createFromBaselineItems(Long taskId, List<BaselineItem> baselineItems);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| listByTaskId | `LandingItemMapper.selectList()` | 按任务ID查询落地项 |
| fill | `LandingItemMapper.updateById()` | 填报落地情况 |
| updateStatus | `LandingItemMapper.updateById()` | 更新落地项状态 |
| createFromBaselineItems | `LandingItemMapper.batchInsert()` | 从基线项创建落地项 |

---

#### 6.5.5 LandingAuditService

```java
public interface LandingAuditService {
    void createAuditRecord(Long landingItemId, String auditorId);
    void audit(Long auditId, String conclusion, String auditComment);
    LandingAudit getByItemId(Long itemId);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| createAuditRecord | `LandingAuditMapper.insert()` | 创建审核记录 |
| audit | `LandingAuditMapper.updateById()` | 执行审核 |
| getByItemId | `LandingAuditMapper.selectOne()` | 按落地项ID查询审核记录 |

---

### 6.6 状态机设计

#### 6.6.1 基线状态

| 枚举值 | 中文名 | 说明 |
|--------|--------|------|
| `DRAFT` | 草稿 | 初始状态，可编辑 |
| `SUBMITTED` | 已提交 | 已提交，等待评审 |

| 当前状态 | 触发动作 | 目标状态 | 校验条件 |
|----------|----------|----------|----------|
| `DRAFT` | save | `DRAFT` | — |
| `DRAFT` | submit | `SUBMITTED` | 所有落地措施负责人和时间已填写 |
| `SUBMITTED` | — | — | 进入评审流程 |

#### 6.6.2 落地跟踪状态

| 枚举值 | 中文名 | 说明 |
|--------|--------|------|
| `PENDING` | 待填报 | 初始状态 |
| `FILLED` | 已填报 | 负责人已填报 |
| `COMPLETED` | 已完成 | 审核通过且落地完成 |
| `DEFERRED` | 已延期 | 审核通过延期，重置为待填报 |
| `FAILED` | 试验失败 | 审核通过试验失败/无法落地，预留重新分析接口 |

**状态转换表**：

| 当前状态 | 触发动作 | 目标状态 | 说明 |
|----------|----------|----------|------|
| `PENDING` | fill | `FILLED` | 负责人填报落地情况 |
| `FILLED` | audit(pass) + landingResult=completed | `COMPLETED` | 审核通过，落地完成 |
| `FILLED` | audit(pass) + landingResult=deferred | `PENDING` | 审核通过延期，更新负责人/时间，重置为待填报 |
| `FILLED` | audit(pass) + landingResult=failed | `FAILED` | 审核通过试验失败，预留重新分析接口（具体触发方式待后续确认），当前仅记录状态和原因 |
| `FILLED` | audit(pass) + landingResult=cannot_land | `FAILED` | 审核通过无法落地，预留重新分析接口（具体触发方式待后续确认），当前仅记录状态和原因 |
| `FILLED` | audit(reject) | `PENDING` | 审核不通过，通知负责人重新处理 |
| `COMPLETED` | — | — | 终态，写入措施库和失效库 |
| `FAILED` | — | — | 预留重新分析接口，当前仅记录状态和原因 |

**状态机实现**：

```java
public enum LandingStatus {
    PENDING("pending"),
    FILLED("filled"),
    COMPLETED("completed"),
    DEFERRED("deferred"),
    FAILED("failed");

    private final String code;

    LandingStatus(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
```

---

### 6.7 业务规则

#### 6.7.1 两种输出模式详细逻辑

**模式一（按S×O筛选）**：

```
1. 从失效分析结果中提取所有预防措施、探测措施、优化措施
2. 计算每条措施关联失效模式的 S × O 值
3. 设定阈值（默认S×O≥20，可通过系统配置调整）
4. 仅保留 S×O 达到阈值的措施
5. 按 S×O 降序排列
6. 适用场景：解决方案或软件类项目
```

**模式二（全部列出）**：

```
1. 从失效分析结果中提取所有预防措施、探测措施、优化措施
2. 不做S×O筛选，全部列出
3. 按措施类型分组排列：预防措施 → 探测措施 → 优化措施
4. 同类型内按关联失效模式的AP等级降序排列（H→M→L）
5. 适用场景：硬件/结构件类项目
```

**模式切换**：切换模式时重新从失效分析结果生成基线项列表，用户已编辑的落地信息（负责人、时间、是否落地）保留。

---

#### 6.7.2 措施来源/类型标记

| 标记维度 | 字段 | 值 | 判定规则 |
|----------|------|-----|----------|
| 措施来源 | `measureSource` | `AI` | 措施由AI生成且被用户采纳 |
| | | `history` | 措施来自历史问题库或功能库 |
| 措施分类 | `measureCategory` | `new` | 该措施在项目中首次出现 |
| | | `optimize` | 该措施是对已有措施的优化改进 |

**来源判定逻辑**：
- AI生成的措施：从`fmea_ai_generation_temp`表中`is_adopted=1`的记录追溯，标记为`AI`
- 历史措施：从`fmea_history_issue`或`fmea_measure_library`中匹配到的措施，标记为`history`
- 无法判定来源时默认标记为`AI`

**分类判定逻辑**：
- 新增：该措施在当前项目的基线库中无历史记录
- 优化：该措施在当前项目的基线库中有相似历史记录（描述相似度>80%）

---

#### 6.7.3 是否落地判断和校验

**默认规则**：所有措施默认`isLanding=true`（需要落地）。

**用户操作**：
- 用户可将措施标记为`isLanding=false`（不需要落地），标记后该措施不要求填写负责人和时间
- 标记为`isLanding=false`的措施仍展示在基线清单中，但不生成落地跟踪项

**isLanding处理规则**：
- isLanding=false的措施：仍显示在基线清单中，标记为"不落地"，不纳入落地跟踪任务
- isLanding=true的措施：纳入落地跟踪任务，需指定落地负责人和落地时间

**提交校验**：

```
1. 遍历所有基线项
2. 对 isLanding=true 的项：
   a. landingOwner 不能为空 → 否则提示"落地负责人不能为空"
   b. landingDate 不能为空 → 否则提示"落地时间不能为空"
   c. landingDate 不能早于当前日期 → 否则提示"落地时间不能早于当前时间"
3. 校验全部通过才允许提交
```

---

#### 6.7.4 落地情况4种选项的处理逻辑

| 落地情况 | 枚举值 | 必填字段 | 状态变更 | 后续动作 |
|----------|--------|----------|----------|----------|
| 完成 | `completed` | — | `PENDING` → `FILLED` | 提交主管审核 |
| 试验失败 | `failed` | `resultDesc`（失败说明） | `PENDING` → `FILLED` | 提交主管审核 |
| 无法落地 | `cannot_land` | `resultDesc`（无法落地原因） | `PENDING` → `FILLED` | 提交主管审核 |
| 延期 | `deferred` | `newOwner`, `newDate` | `PENDING` → `FILLED` | 提交主管审核 |

**填报后统一进入`FILLED`状态，由主管审核时根据落地情况执行不同动作。**

---

#### 6.7.5 审核通过后的动作分支

| 落地情况 | 审核通过后动作 | 状态变更 | 数据操作 |
|----------|---------------|----------|----------|
| 完成 | 回写基线落地表+写入措施库和失效库 | `FILLED` → `COMPLETED` | 1. 更新`BaselineItem.landingStatus=completed`；2. 调用`LibraryService.writeMeasureLibrary()`写入措施库；3. 调用`LibraryService.writeFailureLibrary()`写入失效库 |
| 延期 | 更新负责人和落地时间，重置为待填报 | `FILLED` → `PENDING` | 1. 写入延期历史记录（fmea_landing_deferred_history）；2. 递增`LandingItem.deferred_count`；3. 更新`LandingItem.landingOwner=newOwner`；4. 更新`LandingItem.landingDate=newDate`；5. 重置`landingResult`为空 |
| 试验失败 | 预留重新分析接口（具体触发方式待后续确认），当前仅记录状态和原因 | `FILLED` → `FAILED` | 1. 更新`LandingItem.landingStatus=failed`；2. 记录失败原因 |
| 无法落地 | 预留重新分析接口（具体触发方式待后续确认），当前仅记录状态和原因 | `FILLED` → `FAILED` | 1. 更新`LandingItem.landingStatus=failed`；2. 记录无法落地原因 |

**审核不通过**：落地项状态重置为`PENDING`，通知负责人重新处理，无重试次数限制。

---

#### 6.7.6 延期历史设计

**fmea_landing_deferred_history（延期历史表）**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT IDENTITY(1,1) PRIMARY KEY | 主键 |
| landing_item_id | BIGINT NOT NULL | 关联fmea_landing_item.id |
| original_owner | NVARCHAR(100) | 原负责人 |
| new_owner | NVARCHAR(100) | 新负责人 |
| original_deadline | DATETIME2 | 原截止时间 |
| new_deadline | DATETIME2 | 新截止时间 |
| defer_reason | NVARCHAR(500) | 延期原因 |
| deferred_by | NVARCHAR(100) | 操作人 |
| deferred_time | DATETIME2 DEFAULT GETDATE() | 操作时间 |
| is_deleted | BIT DEFAULT 0 | 逻辑删除 |

**fmea_landing_item新增字段**：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| deferred_count | INT | 0 | 延期次数 |

---

### 6.8 错误码

| 错误码 | HTTP状态码 | 描述 | 触发场景 | 处理建议 |
|--------|-----------|------|----------|----------|
| 3001001 | 404 | 基线不存在 | 查询不存在的基线ID | 检查基线ID是否正确 |
| 3001002 | 409 | 基线状态不允许此操作 | 在非法状态下操作基线 | 检查基线当前状态 |
| 3001003 | 400 | 落地负责人不能为空 | 提交基线时落地措施缺少负责人 | 填写落地负责人 |
| 3001004 | 400 | 落地时间不能为空 | 提交基线时落地措施缺少时间 | 填写落地时间 |
| 3001005 | 400 | 落地时间不能早于当前时间 | 落地时间为过去时间 | 修改落地时间 |
| 3002001 | 404 | 落地跟踪任务不存在 | 查询不存在的落地任务 | 检查任务ID |
| 3002002 | 409 | 落地项状态不允许此操作 | 在非法状态下填报或审核 | 检查落地项当前状态 |
| 3002003 | 400 | 非落地负责人无权填报 | 非指定负责人尝试填报 | 确认当前用户为落地负责人 |
| 3002004 | 400 | 延期必须指定新负责人和时间 | 延期时未填写新负责人或时间 | 填写新负责人和落地时间 |
| 3002005 | 400 | 试验失败/无法落地必须填写说明 | 未填写结果说明 | 填写失败原因或无法落地原因 |
| 3003001 | 404 | 审核记录不存在 | 查询不存在的审核记录 | 检查审核记录ID |
| 3003002 | 400 | 非主管无权审核 | 非主管用户尝试审核 | 确认当前用户为主管身份 |

---

## 7. 评审与审批模块（fmea-review）

### 7.1 模块概述

| 项目 | 说明 |
|------|------|
| 包路径 | `com.fmea.review` |
| 数据库表 | `fmea_review`, `fmea_reviewer`, `fmea_review_opinion`, `fmea_meeting_minutes`, `fmea_review_notification`, `fmea_approval` |
| 关联集成模块 | `LarkService`（评审/审批通知）、`EmailService`（评审/审批通知）、`AiService`（AI生成评审纪要） |
| 关联业务模块 | `AnalysisService`（只读：分析任务数据）、`BaselineService`（只读：基线清单数据） |

**核心职责**：管理DRBFM分析的评审流程（评审人指定、意见提交与闭环、会议纪要、AI评审纪要生成）和审批流程（三级审批等级、审批处理、审批通过后触发基线跟踪任务生成）。

---

### 7.2 包结构

```
com.fmea.review
├── controller
│   ├── ReviewController.java
│   └── ApprovalController.java
├── provider
│   ├── ReviewProvider.java                    (接口)
│   └── ReviewProviderImpl.java                (实现, @Service, @Transactional)
├── service
│   ├── ReviewService.java                     (接口)
│   ├── ReviewServiceImpl.java
│   ├── ReviewerService.java                   (接口)
│   ├── ReviewerServiceImpl.java
│   ├── ReviewOpinionService.java              (接口)
│   ├── ReviewOpinionServiceImpl.java
│   ├── MeetingMinutesService.java             (接口)
│   ├── MeetingMinutesServiceImpl.java
│   ├── ReviewNotificationService.java         (接口)
│   ├── ReviewNotificationServiceImpl.java
│   ├── ApprovalService.java                   (接口)
│   └── ApprovalServiceImpl.java
├── mapper
│   ├── ReviewMapper.java
│   ├── ReviewerMapper.java
│   ├── ReviewOpinionMapper.java
│   ├── MeetingMinutesMapper.java
│   ├── ReviewNotificationMapper.java
│   └── ApprovalMapper.java
├── entity
│   ├── Review.java
│   ├── Reviewer.java
│   ├── ReviewOpinion.java
│   ├── MeetingMinutes.java
│   ├── ReviewNotification.java
│   └── Approval.java
├── dto
│   ├── request
│   │   ├── ReviewInitiateRequest.java
│   │   ├── OpinionSubmitRequest.java
│   │   ├── OpinionRespondRequest.java
│   │   ├── ApprovalInitiateRequest.java
│   │   └── ApprovalProcessRequest.java
│   └── response
│       ├── ReviewDetailVO.java
│       ├── ReviewerVO.java
│       ├── ReviewOpinionVO.java
│       ├── MeetingMinutesVO.java
│       └── ApprovalVO.java
├── enums
│   ├── ReviewStatus.java
│   ├── ReviewerConclusion.java
│   ├── OpinionStatus.java
│   ├── ApprovalLevel.java
│   ├── ApprovalConclusion.java
│   └── NotifyType.java
├── job
│   └── ReviewNotificationJob.java             (定时任务：评审通知)
└── converter
    ├── ReviewConverter.java
    ├── ReviewerConverter.java
    ├── ReviewOpinionConverter.java
    └── ApprovalConverter.java
```

---

### 7.3 Controller API设计

#### 7.3.1 发起评审页

| 项目 | 说明 |
|------|------|
| URL | `GET /review/initiate/{analysisTaskId}` |
| 返回 | FTL视图 `review/initiate.ftl` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| analysisTaskId | Long | 是 | 分析任务ID |

---

#### 7.3.2 发起评审

| 项目 | 说明 |
|------|------|
| URL | `POST /review/initiate` |
| Content-Type | application/json |
| 返回 | JSON `Result<Long>` (评审ID) |

**请求DTO** — `ReviewInitiateRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| analysisTaskId | Long | 是 | 分析任务ID |
| reviewDate | LocalDate | 是 | 评审日期 |
| reviewers | List\<ReviewerAssignVO\> | 是 | 评审人列表 |

**ReviewerAssignVO**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | String | 是 | 评审角色（见7.7.1） |
| userId | String | 是 | 评审人用户ID |
| userName | String | 是 | 评审人姓名 |

**业务规则**：
- 5个必选角色必须指定评审人
- 6个可选角色可选择性指定
- 评审日期必填

---

#### 7.3.3 评审详情页

| 项目 | 说明 |
|------|------|
| URL | `GET /review/detail/{reviewId}` |
| 返回 | FTL视图 `review/detail.ftl` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reviewId | Long | 是 | 评审ID |

---

#### 7.3.4 评审详情数据

| 项目 | 说明 |
|------|------|
| URL | `GET /review/detail/{reviewId}/data` |
| 返回 | JSON `Result<ReviewDetailVO>` |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reviewId | Long | 是 | 评审ID |

**响应DTO** — `ReviewDetailVO`：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 评审ID |
| analysisTaskId | Long | 分析任务ID |
| status | String | 评审状态 |
| reviewDate | LocalDate | 评审日期 |
| isLevel1Project | boolean | 是否1级项目 |
| opinionRate | BigDecimal | 意见率 |
| reviewers | List\<ReviewerVO\> | 评审人列表 |
| opinions | List\<ReviewOpinionVO\> | 评审意见列表 |
| meetingMinutes | MeetingMinutesVO | 会议纪要 |
| aiMinutesContent | String | AI生成评审纪要内容 |

**ReviewerVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 评审人记录ID |
| role | String | 评审角色 |
| userId | String | 用户ID |
| userName | String | 用户姓名 |
| conclusion | String | 评审结论：approved/rejected/pending |
| opinionSubmitted | boolean | 是否已提交意见 |
| submitTime | LocalDateTime | 提交时间 |

**ReviewOpinionVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 意见ID |
| reviewId | Long | 评审ID |
| reviewerId | Long | 评审人ID |
| reviewerName | String | 评审人姓名 |
| reviewerRole | String | 评审人角色 |
| opinionContent | String | 意见内容 |
| opinionType | String | 意见类型：suggestion/question/issue |
| responseContent | String | 答复内容 |
| respondedBy | String | 答复人 |
| respondedTime | LocalDateTime | 答复时间 |
| isClosed | boolean | 是否已闭环 |
| closedBy | String | 闭环人 |
| closedTime | LocalDateTime | 闭环时间 |

**MeetingMinutesVO**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 会议纪要ID |
| reviewId | Long | 评审ID |
| content | String | 纪要内容 |
| uploadedBy | String | 上传人 |
| uploadTime | LocalDateTime | 上传时间 |

---

#### 7.3.5 提交评审意见

| 项目 | 说明 |
|------|------|
| URL | `POST /review/opinion/submit` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `OpinionSubmitRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reviewId | Long | 是 | 评审ID |
| opinionContent | String | 是 | 意见内容 |
| opinionType | String | 是 | 意见类型：suggestion/question/issue |
| conclusion | String | 是 | 评审结论：approved/rejected |

**业务规则**：
- 校验当前用户为指定评审人
- 评审人不可委托他人代为评审
- 提交后更新评审人`conclusion`字段

---

#### 7.3.6 答复评审意见

| 项目 | 说明 |
|------|------|
| URL | `POST /review/opinion/respond` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `OpinionRespondRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| opinionId | Long | 是 | 意见ID |
| responseContent | String | 是 | 答复内容 |

**业务规则**：
- 仅负责人（TSE）可答复评审意见
- 答复后通知意见提出人

---

#### 7.3.7 闭环评审意见

| 项目 | 说明 |
|------|------|
| URL | `POST /review/opinion/close` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| opinionId | Long | 是 | 意见ID |

**业务规则**：
- 仅意见提出人可闭环
- 闭环后`isClosed=true`
- 所有意见闭环后触发AI生成评审纪要

---

#### 7.3.8 上传会议纪要

| 项目 | 说明 |
|------|------|
| URL | `POST /review/minutes/upload` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reviewId | Long | 是 | 评审ID |
| content | String | 是 | 会议纪要内容（文本格式） |

---

#### 7.3.9 AI生成评审纪要

| 项目 | 说明 |
|------|------|
| URL | `POST /review/minutes/ai-generate/{reviewId}` |
| 返回 | JSON `Result<String>` (纪要内容) |

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reviewId | Long | 是 | 评审ID |

**业务规则**：
- 所有评审意见必须已闭环
- 调用`AiService.generateReviewMinutes()`，传入评审意见、答复内容、DRBFM分析数据
- 生成结果保存到`Review.aiMinutesContent`字段

---

#### 7.3.10 发起审批

| 项目 | 说明 |
|------|------|
| URL | `POST /approval/initiate` |
| Content-Type | application/json |
| 返回 | JSON `Result<Long>` (审批ID) |

**请求DTO** — `ApprovalInitiateRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reviewId | Long | 是 | 评审ID |
| changeLevel | int | 是 | 变更等级：1-初级/2-中级/3-重大 |
| approverId | String | 是 | 审批人用户ID |
| approverName | String | 是 | 审批人姓名 |
| approvalComment | String | 否 | 审批说明 |

**业务规则**：
- 评审必须已完成（意见全部闭环，纪要已生成）
- 变更等级对应审批人层级（详见7.7.7）
- 简单审批流，不支持多级会签

---

#### 7.3.11 审批处理

| 项目 | 说明 |
|------|------|
| URL | `POST /approval/process` |
| Content-Type | application/json |
| 返回 | JSON `Result<Void>` |

**请求DTO** — `ApprovalProcessRequest`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| approvalId | Long | 是 | 审批ID |
| conclusion | String | 是 | 审批结论：approved/rejected |
| opinion | String | 否 | 审批意见 |

**业务规则**：
- 校验当前用户为审批人
- 审批通过：生成基线跟踪任务，分析任务状态更新为`completed`
- 审批不通过：通知发起人，可再次发起审批（无次数限制）

---

### 7.4 Provider接口设计

```java
public interface ReviewProvider {

    void initiateReview(ReviewInitiateRequest request);  // @AuditLog(action = "INITIATE_REVIEW", resourceType = "REVIEW")

    ReviewDetailVO getReviewDetail(Long reviewId);

    void submitOpinion(OpinionSubmitRequest request);

    void respondOpinion(OpinionRespondRequest request);

    void closeOpinion(Long opinionId);  // @AuditLog(action = "CLOSE_OPINION", resourceType = "REVIEW")

    void uploadMeetingMinutes(Long reviewId, String content);

    void generateAiMinutes(Long reviewId);

    void processReviewNotifications();

    void initiateApproval(ApprovalInitiateRequest request);  // @AuditLog(action = "INITIATE_APPROVAL", resourceType = "APPROVAL")

    void processApproval(ApprovalProcessRequest request);  // @AuditLog(action = "PROCESS_APPROVAL", resourceType = "APPROVAL")
}
```

#### 7.4.1 initiateReview

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ReviewService.create()`, `ReviewerService.batchInsert()`, `LarkService.sendMessage()`, `EmailService.sendNotify()`, `PmsQueryService.isLevel1Project()` |
| 业务规则 | 1. 校验分析任务当前步骤为"评审"；2. 校验5个必选角色已指定评审人；3. 从PMS获取项目是否为1级项目，更新`Review.isLevel1Project`；4. 创建`Review`记录，状态为`initiated`；5. 创建`Reviewer`记录列表；6. 通过`LarkService`和`EmailService`通知所有评审人；7. 注册评审通知定时任务 |

---

#### 7.4.2 getReviewDetail

| 项目 | 说明 |
|------|------|
| 事务 | 无（只读查询） |
| 调用Service | `ReviewService.getById()`, `ReviewerService.listByReviewId()`, `ReviewOpinionService.listByReviewId()`, `MeetingMinutesService.getByReviewId()`, `AnalysisService.getById()`(只读), `BaselineService.getByAnalysisTaskId()`(只读) |
| 业务规则 | 组装评审详情VO，包含评审人、意见、会议纪要、AI纪要、DRBFM分析内容和基线清单 |

---

#### 7.4.3 submitOpinion

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ReviewOpinionService.create()`, `ReviewerService.updateConclusion()`, `ReviewService.updateOpinionRate()` |
| 业务规则 | 1. 校验当前用户为指定评审人；2. 创建`ReviewOpinion`记录，`isClosed=false`；3. 更新`Reviewer.conclusion`和`opinionSubmitted`；4. 重新计算意见率并更新`Review.opinionRate`；5. 检查意见率是否达到2/3，若达到则更新评审状态为`reviewing`。意见率计算时机：所有评审人提交结论后（或评审到期自动关闭后）；计算公式：opinion_rate = 已提交结论的评审人数 / 总评审人数；写入fmea_review.opinion_rate字段 |

---

#### 7.4.4 respondOpinion

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ReviewOpinionService.respond()`, `LarkService.sendMessage()`, `EmailService.sendNotify()` |
| 业务规则 | 1. 校验当前用户为负责人（TSE）；2. 更新`ReviewOpinion.responseContent`和`respondedBy`；3. 通知意见提出人 |

---

#### 7.4.5 closeOpinion

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ReviewOpinionService.close()`, `ReviewService.checkAllOpinionsClosed()` |
| 业务规则 | 1. 校验当前用户为意见提出人；2. 更新`ReviewOpinion.isClosed=true`，`closedBy`和`closedTime`；3. 检查所有意见是否已闭环，若全部闭环则更新评审状态为`opinion_closed` |

---

#### 7.4.6 uploadMeetingMinutes

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `MeetingMinutesService.createOrUpdate()` |
| 业务规则 | 1. 校验评审状态为`reviewing`或`opinion_closed`；2. 1级项目意见率<2/3时必须上传会议纪要；3. 会议纪要以文本格式保存 |

---

#### 7.4.7 generateAiMinutes

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ReviewOpinionService.listByReviewId()`(只读), `AiService.generateReviewMinutes()`, `ReviewService.updateAiMinutes()` |
| 业务规则 | 1. 校验所有评审意见已闭环（`opinion_closed`状态）；2. 调用`AiService.generateReviewMinutes()`，传入评审意见列表、答复内容、DRBFM分析摘要；3. 生成结果保存到`Review.aiMinutesContent`；4. 评审状态更新为`minutes_generated` |

---

#### 7.4.8 processReviewNotifications

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ReviewNotificationService.processPendingNotifications()`, `ReviewerService.listUnsubmittedByReviewId()`, `LarkService.sendMessage()`, `EmailService.sendNotify()` |
| 业务规则 | 1. 由定时任务`ReviewNotificationJob`触发；2. 检查评审日期提前7天/1天，发送通知；3. 评审日期到期时，未提交意见的评审人自动标记为"不通过"；4. 详见7.7.8。自动不通过的处理：将未评审的reviewer的conclusion设为"auto_rejected"；auto_rejected纳入意见率计算（视为"不通过"意见）；不影响其他已评审评审人的结论；通知负责人有评审人自动不通过 |

---

#### 7.4.9 initiateApproval

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ApprovalService.create()`, `LarkService.sendMessage()`, `EmailService.sendNotify()` |
| 业务规则 | 1. 校验评审已完成（`minutes_generated`或`completed`状态）；2. 校验变更等级与审批人层级对应（详见7.7.7）；3. 创建`Approval`记录，状态为`pending`；4. 通知审批人。审批不通过后，负责人可再次调用initiateApproval重新发起审批，系统会创建新的审批记录 |

---

#### 7.4.10 processApproval

| 项目 | 说明 |
|------|------|
| 事务 | `@Transactional(rollbackFor = Exception.class)` |
| 调用Service | `ApprovalService.process()`, `LandingTaskService.createFromBaseline()`, `AnalysisService.updateStatus()`, `LarkService.sendMessage()`, `EmailService.sendNotify()` |
| 业务规则 | 1. 校验当前用户为审批人；2. 审批通过：`Approval.conclusion=approved`，调用`LandingTaskService.createFromBaseline()`生成基线跟踪任务，分析任务状态更新为`completed`；3. 审批不通过：`Approval.conclusion=rejected`，通知发起人，可再次发起审批 |

---

### 7.5 Service接口设计

#### 7.5.1 ReviewService

```java
public interface ReviewService {
    Review create(Review review);
    Review getById(Long id);
    void updateOpinionRate(Long reviewId);
    void checkAllOpinionsClosed(Long reviewId);
    void updateAiMinutes(Long reviewId, String content);
    void updateStatus(Long reviewId, String status);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| create | `ReviewMapper.insert()` | 创建评审记录 |
| getById | `ReviewMapper.selectById()` | 根据ID查询 |
| updateOpinionRate | `ReviewMapper.updateById()` | 更新意见率 |
| checkAllOpinionsClosed | `ReviewMapper.updateById()` | 检查并更新闭环状态 |
| updateAiMinutes | `ReviewMapper.updateById()` | 更新AI纪要内容 |
| updateStatus | `ReviewMapper.updateById()` | 更新评审状态 |

---

#### 7.5.2 ReviewerService

```java
public interface ReviewerService {
    void batchInsert(List<Reviewer> reviewers);
    List<Reviewer> listByReviewId(Long reviewId);
    void updateConclusion(Long reviewerId, String conclusion);
    List<Reviewer> listUnsubmittedByReviewId(Long reviewId);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| batchInsert | `ReviewerMapper.batchInsert()` | 批量插入评审人 |
| listByReviewId | `ReviewerMapper.selectList()` | 按评审ID查询评审人 |
| updateConclusion | `ReviewerMapper.updateById()` | 更新评审结论 |
| listUnsubmittedByReviewId | `ReviewerMapper.selectList()` | 查询未提交意见的评审人 |

---

#### 7.5.3 ReviewOpinionService

```java
public interface ReviewOpinionService {
    ReviewOpinion create(ReviewOpinion opinion);
    List<ReviewOpinion> listByReviewId(Long reviewId);
    void respond(Long opinionId, String responseContent, String respondedBy);
    void close(Long opinionId, String closedBy);
    boolean allClosedByReviewId(Long reviewId);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| create | `ReviewOpinionMapper.insert()` | 创建评审意见 |
| listByReviewId | `ReviewOpinionMapper.selectList()` | 按评审ID查询意见 |
| respond | `ReviewOpinionMapper.updateById()` | 答复意见 |
| close | `ReviewOpinionMapper.updateById()` | 闭环意见 |
| allClosedByReviewId | `ReviewOpinionMapper.selectCount()` | 检查是否全部闭环 |

---

#### 7.5.4 MeetingMinutesService

```java
public interface MeetingMinutesService {
    MeetingMinutes getByReviewId(Long reviewId);
    void createOrUpdate(MeetingMinutes minutes);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| getByReviewId | `MeetingMinutesMapper.selectOne()` | 按评审ID查询纪要 |
| createOrUpdate | `MeetingMinutesMapper.insertOrUpdate()` | 创建或更新纪要 |

---

#### 7.5.5 ReviewNotificationService

```java
public interface ReviewNotificationService {
    void createNotification(Long reviewId, String notifyType, List<String> targetUserIds);
    void processPendingNotifications();
    List<ReviewNotification> listByReviewId(Long reviewId);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| createNotification | `ReviewNotificationMapper.batchInsert()` | 创建通知记录 |
| processPendingNotifications | `ReviewNotificationMapper.selectList()`, `ReviewNotificationMapper.updateById()` | 处理待发送通知 |
| listByReviewId | `ReviewNotificationMapper.selectList()` | 按评审ID查询通知 |

---

#### 7.5.6 ApprovalService

```java
public interface ApprovalService {
    Approval create(Approval approval);
    Approval getById(Long id);
    void process(Long approvalId, String conclusion, String opinion);
    Approval getByReviewId(Long reviewId);
    void resetForReapproval(Long analysisTaskId);
}
```

| 方法 | 调用Mapper | 说明 |
|------|-----------|------|
| create | `ApprovalMapper.insert()` | 创建审批记录 |
| getById | `ApprovalMapper.selectById()` | 根据ID查询 |
| process | `ApprovalMapper.updateById()` | 处理审批 |
| getByReviewId | `ApprovalMapper.selectOne()` | 按评审ID查询审批 |
| resetForReapproval | `ApprovalMapper.updateById()` | 重置审批状态，允许再次发起审批 |

---

### 7.6 状态机设计

#### 7.6.1 评审状态

| 枚举值 | 中文名 | 说明 |
|--------|--------|------|
| `INITIATED` | 已发起 | 评审刚创建，等待评审人提交意见 |
| `REVIEWING` | 评审中 | 有评审人开始提交意见 |
| `MEETING` | 线下会议 | 意见率<2/3时转入线下会议 |
| `OPINION_CLOSED` | 意见已闭环 | 所有评审意见已闭环 |
| `MINUTES_GENERATED` | 纪要已生成 | AI评审纪要已生成 |
| `COMPLETED` | 已完成 | 评审完成，可发起审批 |

**状态转换表**：

| 当前状态 | 触发动作 | 目标状态 | 校验条件 |
|----------|----------|----------|----------|
| `INITIATED` | 首个评审人提交意见 | `REVIEWING` | — |
| `REVIEWING` | 意见率<2/3 | `MEETING` | 1级项目意见率未达到2/3 |
| `MEETING` | 上传会议纪要 | `OPINION_CLOSED` | 会议纪要内容非空 |
| `REVIEWING` | 所有意见闭环 | `OPINION_CLOSED` | 所有`ReviewOpinion.isClosed=true` |
| `OPINION_CLOSED` | AI生成纪要 | `MINUTES_GENERATED` | 所有意见已闭环 |
| `MINUTES_GENERATED` | 负责人确认纪要 | `COMPLETED` | 纪要内容非空 |

**线下会议流程说明**：系统无法跟踪会议过程，仅跟踪会议结果。负责人组织线下会议后，上传会议纪要文本，系统记录纪要内容和上传时间。

**状态机实现**：

```java
public enum ReviewStatus {
    INITIATED("initiated"),
    REVIEWING("reviewing"),
    MEETING("meeting"),
    OPINION_CLOSED("opinion_closed"),
    MINUTES_GENERATED("minutes_generated"),
    COMPLETED("completed");

    private final String code;

    ReviewStatus(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    private static final Map<ReviewStatus, Set<String>> ALLOWED_TRANSITIONS = new HashMap<>();

    static {
        ALLOWED_TRANSITIONS.put(INITIATED, Set.of(REVIEWING.code));
        ALLOWED_TRANSITIONS.put(REVIEWING, Set.of(MEETING.code, OPINION_CLOSED.code));
        ALLOWED_TRANSITIONS.put(MEETING, Set.of(OPINION_CLOSED.code));
        ALLOWED_TRANSITIONS.put(OPINION_CLOSED, Set.of(MINUTES_GENERATED.code));
        ALLOWED_TRANSITIONS.put(MINUTES_GENERATED, Set.of(COMPLETED.code));
        ALLOWED_TRANSITIONS.put(COMPLETED, Collections.emptySet());
    }

    public boolean canTransitTo(String targetCode) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Collections.emptySet()).contains(targetCode);
    }
}
```

#### 7.6.2 审批状态

| 枚举值 | 中文名 | 说明 |
|--------|--------|------|
| `PENDING` | 待审批 | 审批刚创建 |
| `APPROVED` | 已通过 | 审批人审批通过 |
| `REJECTED` | 已拒绝 | 审批人审批不通过 |

**状态转换表**：

| 当前状态 | 触发动作 | 目标状态 | 校验条件 |
|----------|----------|----------|----------|
| `PENDING` | process(approved) | `APPROVED` | 当前用户为审批人 |
| `PENDING` | process(rejected) | `REJECTED` | 当前用户为审批人 |
| `REJECTED` | 重新发起审批 | `PENDING` | 新建`Approval`记录 |

---

### 7.7 业务规则

#### 7.7.1 评审角色配置

**必选角色（5个）**：

| 角色编码 | 角色名称 | 必选 | 说明 |
|----------|----------|------|------|
| `TEAM_LEADER` | 专业组长 | 是 | 必须指定评审人 |
| `PSE` | 产品系统工程师 | 是 | 必须指定评审人 |
| `TSE` | 测试与验证工程师 | 是 | 必须指定评审人 |
| `HW_QUALITY_MGR` | 硬件质量经理 | 是 | 必须指定评审人 |
| `DFX_SE` | DFX系统工程师 | 是 | 必须指定评审人 |

**可选角色（6个）**：

| 角色编码 | 角色名称 | 必选 | 说明 |
|----------|----------|------|------|
| `MAINT_REP` | 维护代表 | 否 | 可选 |
| `MFG_REP` | 制造代表 | 否 | 可选 |
| `SW_FW_ENG` | 软件/固件工程师 | 否 | 可选 |
| `RF_ANT_ENG` | 射频/天线工程师 | 否 | 可选 |
| `STRUCT_THERMAL_ENG` | 结构/热设计工程师 | 否 | 可选 |
| `PROC_SQM_REP` | 采购/供应商质量代表 | 否 | 可选 |

**校验逻辑**：

```java
private void validateReviewers(List<ReviewerAssignVO> reviewers) {
    Set<String> requiredRoles = Set.of("TEAM_LEADER", "PSE", "TSE", "HW_QUALITY_MGR", "DFX_SE");
    Set<String> assignedRoles = reviewers.stream()
        .map(ReviewerAssignVO::getRole)
        .collect(Collectors.toSet());

    Set<String> missingRoles = new HashSet<>(requiredRoles);
    missingRoles.removeAll(assignedRoles);

    if (!missingRoles.isEmpty()) {
        throw new BusinessException("请指定必选角色评审人：" + String.join(", ", missingRoles));
    }
}
```

---

#### 7.7.2 意见率2/3判定逻辑

**计算公式**：

```
意见率 = 已提交意见的评审人数 / 总评审人数
```

**判定规则**：

| 条件 | 动作 |
|------|------|
| 意见率 ≥ 2/3 | 进入意见闭环流程 |
| 意见率 < 2/3 且为1级项目 | 负责人需组织线下会议，上传会议纪要 |
| 意见率 < 2/3 且非1级项目 | 仍可进入意见闭环流程 |

**实现**：

```java
private BigDecimal calculateOpinionRate(Long reviewId) {
    List<Reviewer> reviewers = reviewerService.listByReviewId(reviewId);
    long total = reviewers.size();
    long submitted = reviewers.stream()
        .filter(r -> r.getOpinionSubmitted())
        .count();
    if (total == 0) {
        return BigDecimal.ZERO;
    }
    return BigDecimal.valueOf(submitted)
        .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP);
}

private boolean isOpinionRateReached(Long reviewId) {
    BigDecimal rate = calculateOpinionRate(reviewId);
    return rate.compareTo(BigDecimal.valueOf(2.0 / 3.0)) >= 0;
}
```

---

#### 7.7.3 1级项目判定

**判定来源**：从PMS系统获取项目是否为1级项目。

**实现**：

```java
private boolean checkLevel1Project(String projectId) {
    Boolean cached = (Boolean) redisTemplate.opsForValue()
        .get("project:level1:" + projectId);
    if (cached != null) {
        return cached;
    }
    boolean isLevel1 = pmsQueryService.isLevel1Project(projectId);
    redisTemplate.opsForValue()
        .set("project:level1:" + projectId, isLevel1, 30, TimeUnit.MINUTES);
    return isLevel1;
}
```

**缓存策略**：Redis缓存30分钟，过期后下次访问重新从PMS拉取。

---

#### 7.7.4 线下会议纪要上传

**触发条件**：1级项目且意见率<2/3时，页面出现"上传会议纪要"入口。

**上传规则**：
- 会议纪要以文本格式上传（非文件上传）
- 纪要内容保存到`fmea_meeting_minutes.content`字段
- 关联到评审记录（`review_id`）
- 记录上传人和上传时间
- 上传后评审可继续推进至意见闭环流程

---

#### 7.7.5 意见闭环流程

```
1. 评审人提交评审意见
   - 创建 ReviewOpinion 记录，isClosed=false
   - 更新 Reviewer.conclusion
   ↓
2. 负责人（TSE）查看评审意见，填写答复内容
   - 更新 ReviewOpinion.responseContent, respondedBy, respondedTime
   - 通知意见提出人
   ↓
3. 意见提出人确认闭环
   - 更新 ReviewOpinion.isClosed=true, closedBy, closedTime
   ↓
4. 重复步骤1-3直到所有意见闭环
   ↓
5. 所有意见闭环后，AI自动生成评审纪要
   - 调用 AiService.generateReviewMinutes()
   - 保存到 Review.aiMinutesContent
   ↓
6. 主页提供入口方便跟踪未闭环意见
```

**闭环约束**：
- 评审人不可委托他人代为评审
- 意见闭环无时间限制
- 系统不设置超时自动闭环

---

#### 7.7.6 AI生成评审纪要

**触发条件**：所有评审意见已闭环（`ReviewStatus=OPINION_CLOSED`）。

**输入数据**：
- 评审意见列表（`ReviewOpinion`）
- 答复内容
- DRBFM分析摘要（结构框图、功能矩阵、失效分析表）
- 基线清单

**调用接口**：

```java
String aiMinutes = aiService.generateReviewMinutes(
    opinions,          // 评审意见列表
    responses,         // 答复内容列表
    analysisSummary,   // DRBFM分析摘要
    baselineItems      // 基线清单
);
```

**输出**：文本格式的评审纪要，包含评审结论、关键意见摘要、改进建议等。

**保存**：写入`Review.aiMinutesContent`字段，评审状态更新为`MINUTES_GENERATED`。

---

#### 7.7.7 三级审批等级

| 变更等级 | 等级名称 | 审批人 | 变更范围 |
|----------|----------|--------|----------|
| Level 1 | 初级变更 | 专业组长 | 不影响接口的软件Bug修复、不涉及软件变更的B配套器件导入、文档勘误、不改变意图的布线优化 |
| Level 2 | 中级变更 | 部门经理 | 影响单一模块性能的硬件设计优化、软件功能模块版本升级、涉及软件变更的B配套器件导入、涉及重新认证的B配套器件导入 |
| Level 3 | 重大变更 | 研发总监 | 架构性与范围性变更、资源性与流程性变更、显著影响成本与产品路标变更 |

**审批人选择逻辑**：

```java
private void validateApprovalLevel(ApprovalInitiateRequest request) {
    int changeLevel = request.getChangeLevel();
    String approverId = request.getApproverId();

    if (changeLevel == 1) {
        validateRole(approverId, "TEAM_LEADER");
    } else if (changeLevel == 2) {
        validateRole(approverId, "DEPT_MANAGER");
    } else if (changeLevel == 3) {
        validateRole(approverId, "RD_DIRECTOR");
    }
}
```

**简单审批流**：不支持多级会签，每次审批仅一个审批人。

---

#### 7.7.8 评审通知定时任务

**定时任务类**：`ReviewNotificationJob`

**调度策略**：每小时执行一次，检查所有状态为`INITIATED`或`REVIEWING`的评审记录。

**通知时间节点**：

| 时间节点 | 通知类型 | 通知对象 | 通知内容 |
|----------|----------|----------|----------|
| 评审日期前7天 | `one_week` | 所有未提交意见的评审人 | "您有评审任务将于7天后到期，请尽快提交评审意见" |
| 评审日期前1天 | `one_day` | 所有未提交意见的评审人 | "您有评审任务将于明天到期，请尽快提交评审意见" |
| 评审日期当天 | `expired` | 所有未提交意见的评审人 | 自动标记为"不通过" |

**实现**：

```java
@Component
public class ReviewNotificationJob {

    @Autowired
    private ReviewProvider reviewProvider;

    @Scheduled(cron = "0 0 * * * ?")
    public void execute() {
        reviewProvider.processReviewNotifications();
    }
}
```

**processReviewNotifications实现逻辑**：

```java
@Override
@Transactional(rollbackFor = Exception.class)
public void processReviewNotifications() {
    LocalDate today = LocalDate.now();
    List<Review> activeReviews = reviewService.listActiveReviews();

    for (Review review : activeReviews) {
        LocalDate reviewDate = review.getReviewDate();
        List<Reviewer> unsubmitted = reviewerService.listUnsubmittedByReviewId(review.getId());

        if (unsubmitted.isEmpty()) {
            continue;
        }

        List<String> unsubmittedUserIds = unsubmitted.stream()
            .map(Reviewer::getUserId)
            .collect(Collectors.toList());

        long daysUntilReview = ChronoUnit.DAYS.between(today, reviewDate);

        if (daysUntilReview == 7) {
            sendNotification(review, "one_week", unsubmittedUserIds);
        } else if (daysUntilReview == 1) {
            sendNotification(review, "one_day", unsubmittedUserIds);
        } else if (daysUntilReview <= 0) {
            for (Reviewer reviewer : unsubmitted) {
                reviewerService.updateConclusion(reviewer.getId(), "auto_rejected");
            }
            reviewNotificationService.createNotification(
                review.getId(), "expired", unsubmittedUserIds
            );
        }
    }
}

private void sendNotification(Review review, String notifyType, List<String> userIds) {
    String message = buildNotifyMessage(review, notifyType);
    for (String userId : userIds) {
        larkService.sendMessage(userId, message);
        emailService.sendNotify(userId, "评审通知", message);
    }
    reviewNotificationService.createNotification(review.getId(), notifyType, userIds);
}
```

---

### 7.8 错误码

| 错误码 | HTTP状态码 | 描述 | 触发场景 | 处理建议 |
|--------|-----------|------|----------|----------|
| 4001001 | 404 | 评审不存在 | 查询不存在的评审ID | 检查评审ID是否正确 |
| 4001002 | 409 | 评审状态不允许此操作 | 在非法状态下操作评审 | 检查评审当前状态 |
| 4001003 | 400 | 必选角色评审人未指定 | 发起评审时缺少必选角色 | 指定所有必选角色评审人 |
| 4001004 | 400 | 非指定评审人无权提交意见 | 非评审人尝试提交意见 | 确认当前用户为指定评审人 |
| 4001005 | 400 | 评审人不可委托他人代为评审 | 评审人身份校验失败 | 评审人须亲自提交意见 |
| 4002001 | 404 | 评审意见不存在 | 查询不存在的意见ID | 检查意见ID |
| 4002002 | 409 | 意见状态不允许此操作 | 对已闭环意见执行答复/闭环 | 检查意见当前状态 |
| 4002003 | 400 | 仅意见提出人可闭环 | 非提出人尝试闭环 | 确认当前用户为意见提出人 |
| 4002004 | 400 | 仅负责人可答复意见 | 非负责人尝试答复 | 确认当前用户为TSE |
| 4003001 | 400 | 1级项目意见率未达2/3需上传会议纪要 | 1级项目低意见率时未上传纪要 | 上传线下会议纪要 |
| 4003002 | 400 | 评审意见未全部闭环，无法生成纪要 | 存在未闭环意见时尝试AI生成纪要 | 先完成所有意见闭环 |
| 4004001 | 404 | 审批不存在 | 查询不存在的审批ID | 检查审批ID |
| 4004002 | 409 | 审批状态不允许此操作 | 在非法状态下操作审批 | 检查审批当前状态 |
| 4004003 | 400 | 非审批人无权处理审批 | 非审批人尝试审批 | 确认当前用户为审批人 |
| 4004004 | 400 | 变更等级与审批人层级不匹配 | 审批人角色与变更等级不符 | 选择对应层级的审批人 |
| 4004005 | 400 | 评审未完成，无法发起审批 | 评审状态未达到completed | 先完成评审流程 |
| 5003001 | 400 | 评审自动不通过 | 评审到期后评审人未提交评审结论 | 系统自动处理，通知负责人 |


## 8. 入库管理模块（fmea-inbound）

### 8.1 模块概述

入库管理模块负责将基线输出中经过评审审批的成果写入基线库，实现项目FMEA成果向组织知识资产的转化。入库需经基线库管理员审批，审批通过后数据写入`fmea_baseline_library`及相关子表；入库后支持编辑修改，修改后需重新审批。

| 属性 | 说明 |
|------|------|
| 包路径 | `com.fmea.inbound` |
| Maven模块 | `fmea-inbound` |
| 数据库表 | `fmea_approval_inbound`, `fmea_baseline_library`, `fmea_baseline_library_version`, `fmea_failure_library`, `fmea_measure_library` |
| 关联业务模块 | `BaselineService`(只读基线数据), `LibraryService`(写入基线库) |
| 关联集成模块 | `LarkService`(审批通知), `EmailService`(审批结果邮件) |

### 8.2 包结构

```
com.fmea.inbound/
├── controller/
│   └── InboundController.java
├── provider/
│   ├── InboundProvider.java
│   └── impl/
│       └── InboundProviderImpl.java
├── service/
│   ├── InboundApprovalService.java
│   ├── BaselineLibraryService.java
│   ├── FailureLibraryService.java
│   ├── MeasureLibraryService.java
│   └── impl/
│       ├── InboundApprovalServiceImpl.java
│       ├── BaselineLibraryServiceImpl.java
│       ├── FailureLibraryServiceImpl.java
│       └── MeasureLibraryServiceImpl.java
├── mapper/
│   ├── InboundApprovalMapper.java
│   ├── BaselineLibraryMapper.java
│   ├── BaselineLibraryVersionMapper.java
│   ├── FailureLibraryMapper.java
│   └── MeasureLibraryMapper.java
├── entity/
│   ├── InboundApproval.java
│   ├── BaselineLibrary.java
│   ├── BaselineLibraryVersion.java
│   ├── FailureLibrary.java
│   └── MeasureLibrary.java
├── dto/
│   ├── request/
│   │   ├── InboundApprovalRequest.java
│   │   └── LibraryEditRequest.java
│   └── response/
│       ├── InboundApprovalVO.java
│       ├── BaselineLibraryVO.java
│       ├── BaselineLibraryDetailVO.java
│       ├── FailureLibraryVO.java
│       └── MeasureLibraryVO.java
├── enums/
│   ├── InboundApprovalStatus.java
│   └── InboundApprovalConclusion.java
├── converter/
│   └── InboundConverter.java
└── config/
    └── InboundModuleConfig.java
```

### 8.3 Controller API设计

```java
@Controller
@RequestMapping("/inbound")
public class InboundController {

    @Autowired
    private InboundProvider inboundProvider;

    @GetMapping("/apply/{baselineId}")
    public String applyPage(@PathVariable Long baselineId, Model model) {
        model.addAttribute("baselineId", baselineId);
        return "inbound/apply";
    }

    @PostMapping("/apply")
    @ResponseBody
    public Result<Void> applyInbound(@RequestBody InboundApplyRequest request) {
        inboundProvider.applyInbound(request.getBaselineId());
        return Result.success();
    }

    @GetMapping("/approval/{id}")
    public String approvalPage(@PathVariable Long id, Model model) {
        model.addAttribute("approvalId", id);
        return "inbound/approval";
    }

    @PostMapping("/approval/process")
    @ResponseBody
    public Result<Void> processApproval(@RequestBody InboundApprovalRequest request) {
        inboundProvider.processInboundApproval(request);
        return Result.success();
    }

    @GetMapping("/edit/{libraryId}")
    public String editPage(@PathVariable Long libraryId, Model model) {
        model.addAttribute("libraryId", libraryId);
        return "inbound/edit";
    }

    @PostMapping("/edit/save")
    @ResponseBody
    public Result<Void> editSave(@RequestBody LibraryEditRequest request) {
        inboundProvider.editLibraryItem(request);
        return Result.success();
    }
}
```

| API | 方法 | URL | 说明 | 请求参数 | 返回类型 |
|-----|------|-----|------|----------|----------|
| 入库申请页 | GET | /inbound/apply/{baselineId} | FTL视图 | baselineId(Path) | String(视图名) |
| 提交入库申请 | POST | /inbound/apply | JSON | InboundApplyRequest | Result\<Void\> |
| 入库审批页 | GET | /inbound/approval/{id} | FTL视图 | id(Path) | String(视图名) |
| 入库审批 | POST | /inbound/approval/process | JSON | InboundApprovalRequest | Result\<Void\> |
| 入库后编辑 | GET | /inbound/edit/{libraryId} | FTL视图 | libraryId(Path) | String(视图名) |
| 保存入库后编辑 | POST | /inbound/edit/save | JSON | LibraryEditRequest | Result\<Void\> |

#### 8.3.1 请求/响应DTO定义

```java
@Data
public class InboundApplyRequest {
    @NotNull(message = "基线ID不能为空")
    private Long baselineId;
}

@Data
public class InboundApprovalRequest {
    @NotNull(message = "审批ID不能为空")
    private Long approvalId;

    @NotBlank(message = "审批结论不能为空")
    private String conclusion;

    private String opinion;

    private String rejectReason;
}

@Data
public class LibraryEditRequest {
    @NotNull(message = "基线库ID不能为空")
    private Long libraryId;

    private String changeDesc;

    private List<FailureLibraryEditItem> failureItems;

    @Data
    public static class FailureLibraryEditItem {
        private Long id;
        private String mode;
        private String cause;
        private String effect;
        private Integer severity;
        private List<MeasureLibraryEditItem> measures;
    }

    @Data
    public static class MeasureLibraryEditItem {
        private Long id;
        private String description;
        private String measureType;
        private String source;
    }
}
```

```java
@Data
public class InboundApprovalVO {
    private Long id;
    private Long baselineLibraryId;
    private String approverId;
    private String approverName;
    private String conclusion;
    private String opinion;
    private String rejectReason;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;
    private BaselineLibraryVO libraryInfo;
}

@Data
public class BaselineLibraryVO {
    private Long id;
    private String bg;
    private String domain;
    private LocalDateTime entryTime;
    private String sourceProject;
    private String landingOwner;
    private Integer version;
    private String changeDesc;
}

@Data
public class BaselineLibraryDetailVO {
    private Long id;
    private String bg;
    private String domain;
    private LocalDateTime entryTime;
    private String sourceProject;
    private String landingOwner;
    private Integer version;
    private String changeDesc;
    private List<FailureLibraryVO> failureList;
    private List<BaselineLibraryVersionVO> versionHistory;
}

@Data
public class FailureLibraryVO {
    private Long id;
    private Long baselineLibraryId;
    private String mode;
    private String cause;
    private String effect;
    private Integer severity;
    private List<MeasureLibraryVO> measures;
}

@Data
public class MeasureLibraryVO {
    private Long id;
    private Long failureLibraryId;
    private String description;
    private String measureType;
    private String source;
}

@Data
public class BaselineLibraryVersionVO {
    private Long id;
    private Long libraryId;
    private Integer version;
    private String changeContent;
    private LocalDateTime changedAt;
    private String changedBy;
}
```

### 8.4 Provider接口设计

```java
public interface InboundProvider {

    void applyInbound(Long baselineId);

    void processInboundApproval(InboundApprovalRequest request);  // @AuditLog(action = "PROCESS_INBOUND_APPROVAL", resourceType = "INBOUND")

    void editLibraryItem(LibraryEditRequest request);  // @AuditLog(action = "EDIT_LIBRARY_ITEM", resourceType = "INBOUND")
}
```

#### 8.4.1 Provider实现

```java
@Service
public class InboundProviderImpl implements InboundProvider {

    @Autowired
    private InboundApprovalService inboundApprovalService;

    @Autowired
    private BaselineLibraryService baselineLibraryService;

    @Autowired
    private FailureLibraryService failureLibraryService;

    @Autowired
    private MeasureLibraryService measureLibraryService;

    @Autowired
    private BaselineService baselineService;

    @Autowired
    private LarkService larkService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ConfigProvider configProvider;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void applyInbound(Long baselineId) {
        BaselineVO baseline = baselineService.getBaselineDetail(baselineId);
        if (baseline == null) {
            throw new BusinessException(8001001, "基线不存在");
        }
        if (!"completed".equals(baseline.getApprovalStatus())) {
            throw new BusinessException(8001002, "基线未完成审批，不可申请入库");
        }
        // 校验：查询fmea_approval_inbound表，如存在status='rejected'的记录，抛出8001009错误
        InboundApproval existingApproval = inboundApprovalService
                .getRejectedByBaselineId(baselineId);
        if (existingApproval != null) {
            throw new BusinessException(8001009, "入库申请已被拒绝，不允许重新申请入库");
        }

        BaselineLibrary library = baselineLibraryService
                .createFromBaseline(baseline);

        failureLibraryService.batchCreateFromBaselineItems(
                library.getId(), baseline.getItems());

        String adminUserId = configProvider.getLibraryAdmin();
        inboundApprovalService.createApproval(library.getId(), adminUserId);

        larkService.sendMessage(adminUserId, "user", "text",
                "您有一条新的入库申请待审批，基线库ID：" + library.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void processInboundApproval(InboundApprovalRequest request) {
        InboundApproval approval = inboundApprovalService
                .getById(request.getApprovalId());
        if (approval == null) {
            throw new BusinessException(8001003, "入库审批记录不存在");
        }
        if (!InboundApprovalStatus.PENDING.name()
                .equals(approval.getConclusion())) {
            throw new BusinessException(8001004, "该审批已处理，不可重复操作");
        }

        inboundApprovalService.updateApprovalResult(
                request.getApprovalId(),
                request.getConclusion(),
                request.getOpinion(),
                request.getRejectReason());

        if (InboundApprovalConclusion.APPROVED.name()
                .equals(request.getConclusion())) {
            baselineLibraryService.updateEntryTime(
                    approval.getBaselineLibraryId(), LocalDateTime.now());
        }

        BaselineLibrary library = baselineLibraryService
                .getById(approval.getBaselineLibraryId());
        emailService.sendApprovalResult(
                library.getLandingOwner(),
                request.getConclusion(),
                request.getRejectReason());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void editLibraryItem(LibraryEditRequest request) {
        BaselineLibrary library = baselineLibraryService
                .getById(request.getLibraryId());
        if (library == null) {
            throw new BusinessException(8001005, "基线库记录不存在");
        }

        String changeSnapshot = baselineLibraryService
                .buildChangeSnapshot(request);

        baselineLibraryService.incrementVersion(
                request.getLibraryId(), request.getChangeDesc());

        baselineLibraryService.saveVersionRecord(
                request.getLibraryId(),
                library.getVersion() + 1,
                changeSnapshot);

        if (request.getFailureItems() != null) {
            for (LibraryEditRequest.FailureLibraryEditItem item
                    : request.getFailureItems()) {
                failureLibraryService.updateFailureItem(
                        item.getId(),
                        item.getMode(),
                        item.getCause(),
                        item.getEffect(),
                        item.getSeverity());

                if (item.getMeasures() != null) {
                    for (LibraryEditRequest.MeasureLibraryEditItem measure
                            : item.getMeasures()) {
                        measureLibraryService.updateMeasureItem(
                                measure.getId(),
                                measure.getDescription(),
                                measure.getMeasureType(),
                                measure.getSource());
                    }
                }
            }
        }

        String adminUserId = configProvider.getLibraryAdmin();
        inboundApprovalService.createApproval(
                request.getLibraryId(), adminUserId);

        larkService.sendMessage(adminUserId, "user", "text",
                "入库后编辑需重新审批，基线库ID：" + request.getLibraryId());
    }
}
```

### 8.5 Service接口设计

#### 8.5.1 InboundApprovalService

```java
public interface InboundApprovalService {

    InboundApproval getById(Long id);

    void createApproval(Long baselineLibraryId, String approverId);

    void updateApprovalResult(Long approvalId, String conclusion,
                              String opinion, String rejectReason);

    InboundApprovalVO getApprovalDetail(Long approvalId);

    List<InboundApprovalVO> getPendingApprovals(String approverId);
}
```

```java
@Service
public class InboundApprovalServiceImpl implements InboundApprovalService {

    @Autowired
    private InboundApprovalMapper inboundApprovalMapper;

    @Override
    public InboundApproval getById(Long id) {
        return inboundApprovalMapper.selectById(id);
    }

    @Override
    public void createApproval(Long baselineLibraryId, String approverId) {
        InboundApproval approval = new InboundApproval();
        approval.setBaselineLibraryId(baselineLibraryId);
        approval.setApproverId(approverId);
        approval.setConclusion(InboundApprovalStatus.PENDING.name());
        approval.setCreatedTime(LocalDateTime.now());
        approval.setUpdatedTime(LocalDateTime.now());
        inboundApprovalMapper.insert(approval);
    }

    @Override
    public void updateApprovalResult(Long approvalId, String conclusion,
                                     String opinion, String rejectReason) {
        InboundApproval approval = new InboundApproval();
        approval.setId(approvalId);
        approval.setConclusion(conclusion);
        approval.setOpinion(opinion);
        approval.setRejectReason(rejectReason);
        approval.setUpdatedTime(LocalDateTime.now());
        inboundApprovalMapper.updateById(approval);
    }

    @Override
    public InboundApprovalVO getApprovalDetail(Long approvalId) {
        InboundApproval approval = inboundApprovalMapper.selectById(approvalId);
        return InboundConverter.INSTANCE.toApprovalVO(approval);
    }

    @Override
    public List<InboundApprovalVO> getPendingApprovals(String approverId) {
        LambdaQueryWrapper<InboundApproval> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(InboundApproval::getApproverId, approverId)
               .eq(InboundApproval::getConclusion,
                       InboundApprovalStatus.PENDING.name())
               .orderByDesc(InboundApproval::getCreatedTime);
        List<InboundApproval> list = inboundApprovalMapper
                .selectList(wrapper);
        return InboundConverter.INSTANCE.toApprovalVOList(list);
    }
}
```

#### 8.5.2 BaselineLibraryService

```java
public interface BaselineLibraryService {

    BaselineLibrary getById(Long id);

    BaselineLibrary createFromBaseline(BaselineVO baseline);

    void updateEntryTime(Long libraryId, LocalDateTime entryTime);

    void incrementVersion(Long libraryId, String changeDesc);

    void saveVersionRecord(Long libraryId, int version,
                           String changeContent);

    String buildChangeSnapshot(LibraryEditRequest request);

    PageResult<BaselineLibraryVO> queryPage(int page, int rows,
                                            String bg, String domain);

    BaselineLibraryDetailVO getDetail(Long libraryId);
}
```

```java
@Service
public class BaselineLibraryServiceImpl implements BaselineLibraryService {

    @Autowired
    private BaselineLibraryMapper baselineLibraryMapper;

    @Autowired
    private BaselineLibraryVersionMapper baselineLibraryVersionMapper;

    @Override
    public BaselineLibrary getById(Long id) {
        return baselineLibraryMapper.selectById(id);
    }

    @Override
    public BaselineLibrary createFromBaseline(BaselineVO baseline) {
        BaselineLibrary library = new BaselineLibrary();
        library.setBg(baseline.getBg());
        library.setDomain(baseline.getDomain());
        library.setSourceProject(baseline.getProjectName());
        library.setLandingOwner(baseline.getLandingOwner());
        library.setVersion(1);
        library.setChangeDesc("首次入库");
        library.setCreatedTime(LocalDateTime.now());
        library.setUpdatedTime(LocalDateTime.now());
        library.setIsDeleted(false);
        baselineLibraryMapper.insert(library);
        return library;
    }

    @Override
    public void updateEntryTime(Long libraryId, LocalDateTime entryTime) {
        BaselineLibrary library = new BaselineLibrary();
        library.setId(libraryId);
        library.setEntryTime(entryTime);
        library.setUpdatedTime(LocalDateTime.now());
        baselineLibraryMapper.updateById(library);
    }

    @Override
    public void incrementVersion(Long libraryId, String changeDesc) {
        BaselineLibrary current = baselineLibraryMapper.selectById(libraryId);
        BaselineLibrary update = new BaselineLibrary();
        update.setId(libraryId);
        update.setVersion(current.getVersion() + 1);
        update.setChangeDesc(changeDesc);
        update.setUpdatedTime(LocalDateTime.now());
        baselineLibraryMapper.updateById(update);
    }

    @Override
    public void saveVersionRecord(Long libraryId, int version,
                                  String changeContent) {
        BaselineLibraryVersion record = new BaselineLibraryVersion();
        record.setLibraryId(libraryId);
        record.setVersion(version);
        record.setChangeContent(changeContent);
        record.setChangedAt(LocalDateTime.now());
        record.setChangedBy(SecurityUtils.getCurrentUserId());
        baselineLibraryVersionMapper.insert(record);
    }

    @Override
    public String buildChangeSnapshot(LibraryEditRequest request) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("libraryId", request.getLibraryId());
        snapshot.put("changeDesc", request.getChangeDesc());
        snapshot.put("failureItemCount",
                request.getFailureItems() != null
                        ? request.getFailureItems().size() : 0);
        return JSONUtil.toJsonStr(snapshot);
    }

    @Override
    public PageResult<BaselineLibraryVO> queryPage(int page, int rows,
                                                   String bg, String domain) {
        Page<BaselineLibrary> pageParam = new Page<>(page, rows);
        LambdaQueryWrapper<BaselineLibrary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StringUtils.isNotBlank(bg),
                        BaselineLibrary::getBg, bg)
               .eq(StringUtils.isNotBlank(domain),
                        BaselineLibrary::getDomain, domain)
               .eq(BaselineLibrary::getIsDeleted, false)
               .orderByDesc(BaselineLibrary::getEntryTime);
        Page<BaselineLibrary> result =
                baselineLibraryMapper.selectPage(pageParam, wrapper);
        return PageResult.of(result, InboundConverter.INSTANCE::toLibraryVO);
    }

    @Override
    public BaselineLibraryDetailVO getDetail(Long libraryId) {
        BaselineLibrary library = baselineLibraryMapper.selectById(libraryId);
        return InboundConverter.INSTANCE.toLibraryDetailVO(library);
    }
}
```

#### 8.5.3 FailureLibraryService

```java
public interface FailureLibraryService {

    void batchCreateFromBaselineItems(Long baselineLibraryId,
                                      List<BaselineItemVO> items);

    void updateFailureItem(Long id, String mode, String cause,
                           String effect, Integer severity);

    List<FailureLibraryVO> listByBaselineLibraryId(Long baselineLibraryId);

    List<FailureLibraryVO> search(String keyword, String bg, String domain);
}
```

```java
@Service
public class FailureLibraryServiceImpl implements FailureLibraryService {

    @Autowired
    private FailureLibraryMapper failureLibraryMapper;

    @Override
    public void batchCreateFromBaselineItems(Long baselineLibraryId,
                                             List<BaselineItemVO> items) {
        for (BaselineItemVO item : items) {
            FailureLibrary failure = new FailureLibrary();
            failure.setBaselineLibraryId(baselineLibraryId);
            failure.setMode(item.getFailureMode());
            failure.setCause(item.getFailureCause());
            failure.setEffect(item.getFailureEffect());
            failure.setSeverity(item.getSeverity());
            failure.setCreatedTime(LocalDateTime.now());
            failureLibraryMapper.insert(failure);
        }
    }

    @Override
    public void updateFailureItem(Long id, String mode, String cause,
                                  String effect, Integer severity) {
        FailureLibrary update = new FailureLibrary();
        update.setId(id);
        update.setMode(mode);
        update.setCause(cause);
        update.setEffect(effect);
        update.setSeverity(severity);
        failureLibraryMapper.updateById(update);
    }

    @Override
    public List<FailureLibraryVO> listByBaselineLibraryId(
            Long baselineLibraryId) {
        LambdaQueryWrapper<FailureLibrary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FailureLibrary::getBaselineLibraryId, baselineLibraryId);
        List<FailureLibrary> list = failureLibraryMapper.selectList(wrapper);
        return InboundConverter.INSTANCE.toFailureVOList(list);
    }

    @Override
    public List<FailureLibraryVO> search(String keyword, String bg,
                                         String domain) {
        return failureLibraryMapper.search(keyword, bg, domain);
    }
}
```

#### 8.5.4 MeasureLibraryService

```java
public interface MeasureLibraryService {

    void batchCreateFromMeasures(Long failureLibraryId,
                                 List<MeasureVO> measures);

    void updateMeasureItem(Long id, String description,
                           String measureType, String source);

    List<MeasureLibraryVO> listByFailureLibraryId(Long failureLibraryId);

    List<MeasureLibraryVO> search(String keyword,
                                  String failureLibraryId);
}
```

```java
@Service
public class MeasureLibraryServiceImpl implements MeasureLibraryService {

    @Autowired
    private MeasureLibraryMapper measureLibraryMapper;

    @Override
    public void batchCreateFromMeasures(Long failureLibraryId,
                                        List<MeasureVO> measures) {
        for (MeasureVO measure : measures) {
            MeasureLibrary ml = new MeasureLibrary();
            ml.setFailureLibraryId(failureLibraryId);
            ml.setDescription(measure.getDescription());
            ml.setMeasureType(measure.getMeasureType());
            ml.setSource(measure.getSource());
            ml.setCreatedTime(LocalDateTime.now());
            measureLibraryMapper.insert(ml);
        }
    }

    @Override
    public void updateMeasureItem(Long id, String description,
                                  String measureType, String source) {
        MeasureLibrary update = new MeasureLibrary();
        update.setId(id);
        update.setDescription(description);
        update.setMeasureType(measureType);
        update.setSource(source);
        measureLibraryMapper.updateById(update);
    }

    @Override
    public List<MeasureLibraryVO> listByFailureLibraryId(
            Long failureLibraryId) {
        LambdaQueryWrapper<MeasureLibrary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MeasureLibrary::getFailureLibraryId, failureLibraryId);
        List<MeasureLibrary> list = measureLibraryMapper.selectList(wrapper);
        return InboundConverter.INSTANCE.toMeasureVOList(list);
    }

    @Override
    public List<MeasureLibraryVO> search(String keyword,
                                         String failureLibraryId) {
        return measureLibraryMapper.search(keyword, failureLibraryId);
    }
}
```

### 8.6 业务规则

#### 8.6.1 入库字段映射重构规则

基线输出数据入库时，需将分析阶段的业务字段映射为基线库字段：

**入库字段映射规则（一期：按原字段映射）**：
- fmea_preventive_measure → fmea_measure_library（measure_type='preventive'）
- fmea_detection_measure → fmea_measure_library（measure_type='detection'）
- fmea_optimization_measure → fmea_measure_library（measure_type='optimization'）
- fmea_failure_mode → fmea_failure_library
- 映射方式：源字段名与目标字段名相同的直接映射，目标表额外字段置空
- 后续迭代：通过配置表定义字段映射规则，支持自定义映射

**预留接口**：InboundMappingService.convertToLibrary(sourceType, sourceId)

| 基线输出源字段 | 入库目标表 | 入库目标字段 | 映射规则 |
|----------------|-----------|-------------|----------|
| baseline.bg | fmea_baseline_library | bg | 直接映射 |
| baseline.domain | fmea_baseline_library | domain | 直接映射 |
| project.name | fmea_baseline_library | source_project | 项目名称映射 |
| baseline_item.landing_owner | fmea_baseline_library | landing_owner | 直接映射 |
| failure_mode.name | fmea_failure_library | mode | 失效模式名称 |
| failure_cause.description | fmea_failure_library | cause | 失效原因描述 |
| failure_effect.description | fmea_failure_library | effect | 失效影响描述 |
| failure_mode.severity | fmea_failure_library | severity | 严重度评分 |
| measure.description | fmea_measure_library | description | 措施描述 |
| measure.measure_type | fmea_measure_library | measure_type | 预防/探测 |
| measure.source | fmea_measure_library | source | 来源(ai/manual) |

**映射注意事项**：
- 一条基线记录对应一条`fmea_baseline_library`记录
- 每个失效模式对应一条`fmea_failure_library`记录，关联到`baseline_library_id`
- 每条措施对应一条`fmea_measure_library`记录，关联到`failure_library_id`
- 入库时自动设置`entry_time`为审批通过时间
- 首次入库版本号为1

#### 8.6.2 审批不通过不可重新申请

- 入库审批结论为`REJECTED`时，该入库申请标记为终态
- 不允许对已驳回的入库申请重新发起审批
- 需修改基线输出内容后，重新提交入库申请（生成新的审批记录）
- 审批状态枚举：

```java
public enum InboundApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}

public enum InboundApprovalConclusion {
    APPROVED,
    REJECTED
}
```

#### 8.6.3 入库后修改需重新审批

- 已入库的基线库数据允许编辑（修改失效模式、原因、影响、措施等）
- 编辑保存后自动创建新的审批记录，状态为`PENDING`
- 在审批通过前，编辑内容已写入基线库表，但标记为"待审批"状态
- 审批通过后版本号自增，并记录版本变更历史
- 审批不通过时，需回滚至上一版本内容

#### 8.6.4 版本管理规则

| 规则 | 说明 |
|------|------|
| 初始版本 | 首次入库版本号为1 |
| 版本递增 | 每次入库后编辑审批通过，版本号+1 |
| 版本快照 | 每次版本变更时，在`fmea_baseline_library_version`记录变更内容和变更人 |
| 变更内容 | `change_content`字段存储JSON格式的变更快照，包含变更前后的字段对比 |
| 变更描述 | `change_desc`字段存储人工填写的变更说明 |
| 版本查询 | 支持查看任意历史版本的数据快照 |

### 8.7 错误码

| 错误码 | 描述 | 处理建议 |
|--------|------|----------|
| 8001001 | 基线不存在 | 检查baselineId是否正确 |
| 8001002 | 基线未完成审批，不可申请入库 | 先完成基线审批流程 |
| 8001003 | 入库审批记录不存在 | 检查审批ID是否正确 |
| 8001004 | 该审批已处理，不可重复操作 | 刷新页面获取最新状态 |
| 8001005 | 基线库记录不存在 | 检查libraryId是否正确 |
| 8001006 | 入库申请重复提交 | 同一基线不可重复申请入库 |
| 8001007 | 入库后编辑审批未通过，数据已回滚 | 重新编辑后再次提交 |
| 8001008 | 入库字段映射失败，源数据不完整 | 检查基线输出数据完整性 |
| 8001009 | 入库申请已被拒绝，不允许重新申请 | 审批不通过后不允许重新申请入库 |

---

## 9. DRBFM迭代更新模块（fmea-iteration）

### 9.1 模块概述

DRBFM迭代更新模块负责在TR节点触发时，对已有DRBFM分析进行增量更新。当PMS系统推送TR节点触发事件时，系统自动识别变更内容，执行增量更新逻辑，并维护版本历史快照，支持基线模式切换查看不同版本的分析数据。

| 属性 | 说明 |
|------|------|
| 包路径 | `com.fmea.iteration` |
| Maven模块 | `fmea-iteration` |
| 数据库表 | `fmea_version_history`（复用） |
| 关联集成模块 | `PmsQueryService`(TR节点触发数据) |
| 关联业务模块 | `EvaluationService`(评估数据), `AnalysisService`(分析数据) |

### 9.2 包结构

```
com.fmea.iteration/
├── controller/
│   └── IterationController.java
├── provider/
│   ├── IterationProvider.java
│   └── impl/
│       └── IterationProviderImpl.java
├── service/
│   ├── VersionHistoryService.java
│   └── impl/
│       └── VersionHistoryServiceImpl.java
├── mapper/
│   └── VersionHistoryMapper.java
├── entity/
│   └── VersionHistory.java
├── dto/
│   ├── request/
│   │   └── IterationTriggerRequest.java
│   └── response/
│       └── VersionHistoryVO.java
├── enums/
│   ├── IterationType.java
│   └── VersionLevel.java
├── converter/
│   └── IterationConverter.java
└── config/
    └── IterationModuleConfig.java
```

### 9.3 Controller API设计

```java
@Controller
@RequestMapping("/iteration")
public class IterationController {

    @Autowired
    private IterationProvider iterationProvider;

    @PostMapping("/trigger")
    @ResponseBody
    public Result<Void> triggerIteration(
            @RequestBody IterationTriggerRequest request) {
        iterationProvider.triggerIteration(request);
        return Result.success();
    }

    @GetMapping("/versions/{taskId}")
    @ResponseBody
    public Result<List<VersionHistoryVO>> getVersionHistory(
            @PathVariable Long taskId) {
        return Result.success(iterationProvider.getVersionHistory(taskId));
    }

    @GetMapping("/baseline/{taskId}/{version}")
    @ResponseBody
    public Result<Object> getBaselineVersion(
            @PathVariable Long taskId,
            @PathVariable int version) {
        return Result.success(
                iterationProvider.getBaselineVersion(taskId, version));
    }
}
```

| API | 方法 | URL | 说明 | 请求参数 | 返回类型 |
|-----|------|-----|------|----------|----------|
| 迭代更新触发 | POST | /iteration/trigger | JSON(PMS推送) | IterationTriggerRequest | Result\<Void\> |
| 版本历史 | GET | /iteration/versions/{taskId} | JSON | taskId(Path) | Result\<List\<VersionHistoryVO\>\> |
| 切换基线模式 | GET | /iteration/baseline/{taskId}/{version} | JSON | taskId(Path), version(Path) | Result\<Object\> |

#### 9.3.1 请求/响应DTO定义

```java
@Data
public class IterationTriggerRequest {
    @NotBlank(message = "项目ID不能为空")
    private String projectId;

    @NotBlank(message = "TR阶段不能为空")
    private String trStage;

    @NotBlank(message = "触发类型不能为空")
    private String triggerType;

    private String triggerDesc;

    private List<String> changeItems;
}

@Data
public class VersionHistoryVO {
    private Long id;
    private String entityType;
    private Long entityId;
    private Integer version;
    private String trStage;
    private String changeDesc;
    private String changeSnapshot;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdTime;
}
```

### 9.4 Provider接口设计

```java
public interface IterationProvider {

    void triggerIteration(IterationTriggerRequest request);

    List<VersionHistoryVO> getVersionHistory(Long taskId);

    Object getBaselineVersion(Long taskId, int version);
}
```

#### 9.4.1 Provider实现

```java
@Service
public class IterationProviderImpl implements IterationProvider {

    @Autowired
    private VersionHistoryService versionHistoryService;

    @Autowired
    private EvaluationService evaluationService;

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private PmsQueryService pmsQueryService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void triggerIteration(IterationTriggerRequest request) {
        PmsTrNodeTrigger trigger = pmsQueryService
                .getTrNodeTrigger(request.getProjectId());
        if (trigger == null) {
            throw new BusinessException(9001001, "未找到TR节点触发信息");
        }

        Long analysisTaskId = analysisService
                .getTaskIdByProjectId(request.getProjectId());
        if (analysisTaskId == null) {
            throw new BusinessException(9001002, "未找到对应的分析任务");
        }

        String currentVersion = versionHistoryService
                .getLatestVersion("analysis_task", analysisTaskId);
        int nextVersion = (currentVersion == null)
                ? 1 : Integer.parseInt(currentVersion) + 1;

        String snapshot = analysisService
                .buildAnalysisSnapshot(analysisTaskId);

        versionHistoryService.createVersion(
                "analysis_task",
                analysisTaskId,
                nextVersion,
                request.getTrStage(),
                "TR" + request.getTrStage() + "触发迭代更新",
                snapshot);

        List<PmsChangeSource> changes = pmsQueryService
                .getChangeSourceData(request.getProjectId());
        evaluationService.mergeChangeSources(
                analysisTaskId, changes, request.getTrStage());

        analysisService.updateTaskTrStage(
                analysisTaskId, request.getTrStage());
    }

    @Override
    public List<VersionHistoryVO> getVersionHistory(Long taskId) {
        List<VersionHistory> histories = versionHistoryService
                .listByEntity("analysis_task", taskId);
        return IterationConverter.INSTANCE.toVOList(histories);
    }

    @Override
    public Object getBaselineVersion(Long taskId, int version) {
        VersionHistory history = versionHistoryService
                .getByVersion("analysis_task", taskId, version);
        if (history == null) {
            throw new BusinessException(9001003, "指定版本不存在");
        }
        return JSONUtil.parse(history.getChangeSnapshot());
    }
}
```

### 9.5 Service接口设计

#### 9.5.1 VersionHistoryService

```java
public interface VersionHistoryService {

    String getLatestVersion(String entityType, Long entityId);

    void createVersion(String entityType, Long entityId, int version,
                       String trStage, String changeDesc,
                       String changeSnapshot);

    VersionHistory getByVersion(String entityType, Long entityId,
                                int version);

    List<VersionHistory> listByEntity(String entityType, Long entityId);
}
```

```java
@Service
public class VersionHistoryServiceImpl implements VersionHistoryService {

    @Autowired
    private VersionHistoryMapper versionHistoryMapper;

    @Override
    public String getLatestVersion(String entityType, Long entityId) {
        LambdaQueryWrapper<VersionHistory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VersionHistory::getEntityType, entityType)
               .eq(VersionHistory::getEntityId, entityId)
               .orderByDesc(VersionHistory::getVersion)
               .last("OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY");
        VersionHistory latest = versionHistoryMapper.selectOne(wrapper);
        return latest != null ? String.valueOf(latest.getVersion()) : null;
    }

    @Override
    public void createVersion(String entityType, Long entityId,
                              int version, String trStage,
                              String changeDesc, String changeSnapshot) {
        VersionHistory record = new VersionHistory();
        record.setEntityType(entityType);
        record.setEntityId(entityId);
        record.setVersion(version);
        record.setTrStage(trStage);
        record.setChangeDesc(changeDesc);
        record.setChangeSnapshot(changeSnapshot);
        record.setCreatedBy(SecurityUtils.getCurrentUserId());
        record.setCreatedTime(LocalDateTime.now());
        versionHistoryMapper.insert(record);
    }

    @Override
    public VersionHistory getByVersion(String entityType, Long entityId,
                                       int version) {
        LambdaQueryWrapper<VersionHistory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VersionHistory::getEntityType, entityType)
               .eq(VersionHistory::getEntityId, entityId)
               .eq(VersionHistory::getVersion, version);
        return versionHistoryMapper.selectOne(wrapper);
    }

    @Override
    public List<VersionHistory> listByEntity(String entityType,
                                             Long entityId) {
        LambdaQueryWrapper<VersionHistory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VersionHistory::getEntityType, entityType)
               .eq(VersionHistory::getEntityId, entityId)
               .orderByDesc(VersionHistory::getVersion);
        return versionHistoryMapper.selectList(wrapper);
    }
}
```

### 9.6 业务规则

#### 9.6.1 TR节点触发规则

| 规则 | 说明 |
|------|------|
| 触发来源 | PMS系统推送TR节点到达事件，或用户手动触发 |
| 触发条件 | 项目存在已确认的评估任务，且当前TR阶段与触发TR阶段不同 |
| 触发阶段 | TR1、TR3、TR4、TR4a、TR5、TR6 |
| 首次触发 | TR1阶段为首次评估，不触发迭代更新 |
| 后续触发 | TR3/TR4/TR5/TR6阶段触发时，执行增量更新逻辑 |
| 幂等性 | 同一TR阶段不可重复触发，需校验当前版本是否已包含该TR阶段 |

#### 9.6.2 增量更新逻辑

```
1. 接收TR触发请求
2. 从PMS获取该TR节点的变更来源数据
3. 与当前评估任务中的变更点清单进行比对：
   a. 新增变更点 → 追加到变更点清单
   b. 已有变更点内容变化 → 更新变更点描述
   c. 已有变更点无变化 → 保持不变
4. 对新增/变化的变更点执行五维评估
5. 将新增的高风险变更点纳入分析任务
6. 保留已有分析结果，仅增量补充
7. 记录版本历史快照
```

#### 9.6.3 版本号规则

| 维度 | 规则 | 示例 |
|------|------|------|
| 系统级 | 每个TR节点触发时版本号+1 | TR1→V1, TR3→V2, TR4→V3 |
| 部件级 | 随系统级版本号递增，不单独编号 | 与系统级保持一致 |
| 版本格式 | 整数递增，从1开始 | 1, 2, 3, ... |
| 版本关联 | 版本号与TR阶段一一对应 | V1=TR1, V2=TR3 |

#### 9.6.4 版本历史快照

| 规则 | 说明 |
|------|------|
| 快照内容 | `change_snapshot`字段存储JSON格式的分析任务完整数据快照 |
| 快照时机 | 每次TR触发时，在执行增量更新前保存当前状态快照 |
| 快照结构 | 包含结构节点、功能矩阵、失效模式、原因、影响、措施、SOD评分的完整数据 |
| 快照大小 | 单个快照预估200KB~2MB，使用NVARCHAR(MAX)存储 |
| 快照查询 | 支持按版本号查看历史快照，用于基线模式切换 |

### 9.7 错误码

| 错误码 | 描述 | 处理建议 |
|--------|------|----------|
| 9001001 | 未找到TR节点触发信息 | 确认PMS中项目TR节点数据 |
| 9001002 | 未找到对应的分析任务 | 确认项目已创建分析任务 |
| 9001003 | 指定版本不存在 | 检查版本号是否正确 |
| 9001004 | TR节点重复触发 | 同一TR阶段不可重复触发 |
| 9001005 | 增量更新合并失败 | 检查变更来源数据格式 |
| 9001006 | 版本快照保存失败 | 检查快照数据大小 |

---

## 10. 基线库与知识图谱模块（fmea-library）

### 10.1 模块概述

基线库与知识图谱模块是FMEA 2.0平台的知识管理中心，负责管理入库后的基线数据、失效库、措施库和功能库，支持跨项目检索和知识复用。模块提供基线库的分区管理、版本管理、Excel导入、多维度检索等功能，并为知识图谱预留扩展接口。

| 属性 | 说明 |
|------|------|
| 包路径 | `com.fmea.library` |
| Maven模块 | `fmea-library` |
| 数据库表 | `fmea_baseline_library`, `fmea_baseline_library_version`, `fmea_failure_library`, `fmea_measure_library`, `fmea_function_library` |
| 关联业务模块 | `InboundService`(入库写入) |

### 10.2 包结构

```
com.fmea.library/
├── controller/
│   └── LibraryController.java
├── provider/
│   ├── LibraryProvider.java
│   └── impl/
│       └── LibraryProviderImpl.java
├── service/
│   ├── BaselineLibraryService.java
│   ├── BaselineLibraryVersionService.java
│   ├── FailureLibraryService.java
│   ├── MeasureLibraryService.java
│   ├── FunctionLibraryService.java
│   └── impl/
│       ├── BaselineLibraryServiceImpl.java
│       ├── BaselineLibraryVersionServiceImpl.java
│       ├── FailureLibraryServiceImpl.java
│       ├── MeasureLibraryServiceImpl.java
│       └── FunctionLibraryServiceImpl.java
├── mapper/
│   ├── BaselineLibraryMapper.java
│   ├── BaselineLibraryVersionMapper.java
│   ├── FailureLibraryMapper.java
│   ├── MeasureLibraryMapper.java
│   └── FunctionLibraryMapper.java
├── entity/
│   ├── BaselineLibrary.java
│   ├── BaselineLibraryVersion.java
│   ├── FailureLibrary.java
│   ├── MeasureLibrary.java
│   └── FunctionLibrary.java
├── dto/
│   ├── request/
│   │   ├── FunctionLibraryAddRequest.java
│   │   └── LibraryImportRequest.java
│   └── response/
│       ├── BaselineLibraryVO.java
│       ├── BaselineLibraryDetailVO.java
│       ├── FailureLibraryVO.java
│       ├── MeasureLibraryVO.java
│       ├── FunctionLibraryVO.java
│       └── BaselineLibraryVersionVO.java
├── enums/
│   └── MeasureType.java
├── converter/
│   └── LibraryConverter.java
├── import/
│   └── LibraryExcelImporter.java
└── config/
    └── LibraryModuleConfig.java
```

### 10.3 Controller API设计

```java
@Controller
@RequestMapping("/library")
public class LibraryController {

    @Autowired
    private LibraryProvider libraryProvider;

    @GetMapping("/list")
    public String listPage(Model model) {
        return "library/baseline-list";
    }

    @GetMapping("/data")
    @ResponseBody
    public PageResult<BaselineLibraryVO> getData(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int rows,
            @RequestParam(required = false) String bg,
            @RequestParam(required = false) String domain) {
        return libraryProvider.queryLibraryPage(page, rows, bg, domain);
    }

    @GetMapping("/detail/{id}")
    public String detailPage(@PathVariable Long id, Model model) {
        model.addAttribute("libraryId", id);
        return "library/detail";
    }

    @PostMapping("/import")
    @ResponseBody
    public Result<Void> importExcel(@RequestParam("file") MultipartFile file) {
        libraryProvider.importFromExcel(file);
        return Result.success();
    }

    @GetMapping("/failure/search")
    @ResponseBody
    public Result<List<FailureLibraryVO>> searchFailure(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String bg,
            @RequestParam(required = false) String domain) {
        return Result.success(
                libraryProvider.searchFailure(keyword, bg, domain));
    }

    @GetMapping("/measure/search")
    @ResponseBody
    public Result<List<MeasureLibraryVO>> searchMeasure(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String failureLibraryId) {
        return Result.success(
                libraryProvider.searchMeasure(keyword, failureLibraryId));
    }

    @GetMapping("/function/search")
    @ResponseBody
    public Result<List<FunctionLibraryVO>> searchFunction(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String domain) {
        return Result.success(
                libraryProvider.searchFunction(keyword, domain));
    }

    @GetMapping("/function/manage")
    public String functionManagePage(Model model) {
        return "library/function-manage";
    }

    @PostMapping("/function/add")
    @ResponseBody
    public Result<Void> addFunction(
            @RequestBody FunctionLibraryAddRequest request) {
        libraryProvider.addFunctionLibrary(request);
        return Result.success();
    }
}
```

| API | 方法 | URL | 说明 | 请求参数 | 返回类型 |
|-----|------|-----|------|----------|----------|
| 基线库列表页 | GET | /library/list | FTL视图 | — | String(视图名) |
| 基线库数据 | GET | /library/data | JSON分页 | page, rows, bg, domain | PageResult\<BaselineLibraryVO\> |
| 基线库详情 | GET | /library/detail/{id} | FTL视图 | id(Path) | String(视图名) |
| Excel导入 | POST | /library/import | multipart | file(MultipartFile) | Result\<Void\> |
| 失效库查询 | GET | /library/failure/search | JSON | keyword, bg, domain | Result\<List\<FailureLibraryVO\>\> |
| 措施库查询 | GET | /library/measure/search | JSON | keyword, failureLibraryId | Result\<List\<MeasureLibraryVO\>\> |
| 功能库查询 | GET | /library/function/search | JSON | keyword, domain | Result\<List\<FunctionLibraryVO\>\> |
| 功能库管理页 | GET | /library/function/manage | FTL视图 | — | String(视图名) |
| 新增功能库条目 | POST | /library/function/add | JSON | FunctionLibraryAddRequest | Result\<Void\> |

#### 10.3.1 请求/响应DTO定义

```java
@Data
public class FunctionLibraryAddRequest {
    @NotBlank(message = "专业域不能为空")
    private String domain;

    @NotBlank(message = "功能描述不能为空")
    private String description;

    private String ownerNodeType;
}

@Data
public class LibraryImportRequest {
    private String bg;
    private String domain;
    private String importType;
}

@Data
public class BaselineLibraryVO {
    private Long id;
    private String bg;
    private String domain;
    private LocalDateTime entryTime;
    private String sourceProject;
    private String landingOwner;
    private Integer version;
    private String changeDesc;
}

@Data
public class BaselineLibraryDetailVO {
    private Long id;
    private String bg;
    private String domain;
    private LocalDateTime entryTime;
    private String sourceProject;
    private String landingOwner;
    private Integer version;
    private String changeDesc;
    private List<FailureLibraryVO> failureList;
    private List<BaselineLibraryVersionVO> versionHistory;
}

@Data
public class FailureLibraryVO {
    private Long id;
    private Long baselineLibraryId;
    private String mode;
    private String cause;
    private String effect;
    private Integer severity;
    private List<MeasureLibraryVO> measures;
}

@Data
public class MeasureLibraryVO {
    private Long id;
    private Long failureLibraryId;
    private String description;
    private String measureType;
    private String source;
}

@Data
public class FunctionLibraryVO {
    private Long id;
    private String domain;
    private String description;
    private String ownerNodeType;
    private LocalDateTime createdTime;
}

@Data
public class BaselineLibraryVersionVO {
    private Long id;
    private Long libraryId;
    private Integer version;
    private String changeContent;
    private LocalDateTime changedAt;
    private String changedBy;
}
```

### 10.4 Provider接口设计

```java
public interface LibraryProvider {

    PageResult<BaselineLibraryVO> queryLibraryPage(int page, int rows,
                                                   String bg, String domain);

    BaselineLibraryDetailVO getLibraryDetail(Long libraryId);

    void importFromExcel(MultipartFile file);

    List<FailureLibraryVO> searchFailure(String keyword,
                                         String bg, String domain);

    List<MeasureLibraryVO> searchMeasure(String keyword,
                                         String failureLibraryId);

    List<FunctionLibraryVO> searchFunction(String keyword, String domain);

    void addFunctionLibrary(FunctionLibraryAddRequest request);
}
```

#### 10.4.1 Provider实现

```java
@Service
public class LibraryProviderImpl implements LibraryProvider {

    @Autowired
    private BaselineLibraryService baselineLibraryService;

    @Autowired
    private BaselineLibraryVersionService baselineLibraryVersionService;

    @Autowired
    private FailureLibraryService failureLibraryService;

    @Autowired
    private MeasureLibraryService measureLibraryService;

    @Autowired
    private FunctionLibraryService functionLibraryService;

    @Autowired
    private LibraryExcelImporter libraryExcelImporter;

    @Override
    public PageResult<BaselineLibraryVO> queryLibraryPage(int page, int rows,
                                                         String bg,
                                                         String domain) {
        return baselineLibraryService.queryPage(page, rows, bg, domain);
    }

    @Override
    public BaselineLibraryDetailVO getLibraryDetail(Long libraryId) {
        BaselineLibraryDetailVO detail =
                baselineLibraryService.getDetail(libraryId);
        detail.setFailureList(
                failureLibraryService.listByBaselineLibraryId(libraryId));
        for (FailureLibraryVO failure : detail.getFailureList()) {
            failure.setMeasures(
                    measureLibraryService.listByFailureLibraryId(
                            failure.getId()));
        }
        detail.setVersionHistory(
                baselineLibraryVersionService.listByLibraryId(libraryId));
        return detail;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void importFromExcel(MultipartFile file) {
        List<LibraryImportData> importDataList =
                libraryExcelImporter.parse(file);
        for (LibraryImportData importData : importDataList) {
            BaselineLibrary library = baselineLibraryService
                    .create(importData.getBg(),
                            importData.getDomain(),
                            importData.getSourceProject(),
                            importData.getLandingOwner());
            for (LibraryImportData.FailureImportItem fi
                    : importData.getFailureItems()) {
                FailureLibrary failure = failureLibraryService
                        .create(library.getId(), fi.getMode(),
                                fi.getCause(), fi.getEffect(),
                                fi.getSeverity());
                for (LibraryImportData.MeasureImportItem mi
                        : fi.getMeasureItems()) {
                    measureLibraryService.create(failure.getId(),
                            mi.getDescription(), mi.getMeasureType(),
                            mi.getSource());
                }
            }
        }
    }

    @Override
    public List<FailureLibraryVO> searchFailure(String keyword, String bg,
                                                String domain) {
        return failureLibraryService.search(keyword, bg, domain);
    }

    @Override
    public List<MeasureLibraryVO> searchMeasure(String keyword,
                                                String failureLibraryId) {
        return measureLibraryService.search(keyword, failureLibraryId);
    }

    @Override
    public List<FunctionLibraryVO> searchFunction(String keyword,
                                                  String domain) {
        return functionLibraryService.search(keyword, domain);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addFunctionLibrary(FunctionLibraryAddRequest request) {
        functionLibraryService.create(request.getDomain(),
                request.getDescription(), request.getOwnerNodeType());
    }
}
```

### 10.5 Service接口设计

#### 10.5.1 BaselineLibraryService

```java
public interface BaselineLibraryService {

    BaselineLibrary getById(Long id);

    BaselineLibrary create(String bg, String domain,
                           String sourceProject, String landingOwner);

    PageResult<BaselineLibraryVO> queryPage(int page, int rows,
                                            String bg, String domain);

    BaselineLibraryDetailVO getDetail(Long libraryId);
}
```

#### 10.5.2 BaselineLibraryVersionService

```java
public interface BaselineLibraryVersionService {

    void createVersion(Long libraryId, int version,
                       String changeContent);

    List<BaselineLibraryVersionVO> listByLibraryId(Long libraryId);

    BaselineLibraryVersionVO getByVersion(Long libraryId, int version);
}
```

#### 10.5.3 FailureLibraryService

```java
public interface FailureLibraryService {

    FailureLibrary create(Long baselineLibraryId, String mode,
                          String cause, String effect, Integer severity);

    List<FailureLibraryVO> listByBaselineLibraryId(Long baselineLibraryId);

    List<FailureLibraryVO> search(String keyword, String bg,
                                  String domain);
}
```

#### 10.5.4 MeasureLibraryService

```java
public interface MeasureLibraryService {

    MeasureLibrary create(Long failureLibraryId, String description,
                          String measureType, String source);

    List<MeasureLibraryVO> listByFailureLibraryId(Long failureLibraryId);

    List<MeasureLibraryVO> search(String keyword,
                                  String failureLibraryId);
}
```

#### 10.5.5 FunctionLibraryService

```java
public interface FunctionLibraryService {

    FunctionLibrary create(String domain, String description,
                           String ownerNodeType);

    List<FunctionLibraryVO> search(String keyword, String domain);

    List<FunctionLibraryVO> listByDomain(String domain);
}
```

#### 10.5.6 Service实现示例

```java
@Service
public class FunctionLibraryServiceImpl implements FunctionLibraryService {

    @Autowired
    private FunctionLibraryMapper functionLibraryMapper;

    @Override
    public FunctionLibrary create(String domain, String description,
                                 String ownerNodeType) {
        FunctionLibrary entity = new FunctionLibrary();
        entity.setDomain(domain);
        entity.setDescription(description);
        entity.setOwnerNodeType(ownerNodeType);
        entity.setCreatedTime(LocalDateTime.now());
        functionLibraryMapper.insert(entity);
        return entity;
    }

    @Override
    public List<FunctionLibraryVO> search(String keyword, String domain) {
        return functionLibraryMapper.search(keyword, domain);
    }

    @Override
    public List<FunctionLibraryVO> listByDomain(String domain) {
        LambdaQueryWrapper<FunctionLibrary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StringUtils.isNotBlank(domain),
                        FunctionLibrary::getDomain, domain)
               .orderByAsc(FunctionLibrary::getCreatedTime);
        List<FunctionLibrary> list = functionLibraryMapper.selectList(wrapper);
        return LibraryConverter.INSTANCE.toFunctionVOList(list);
    }
}
```

### 10.6 业务规则

#### 10.6.1 按BG/专业域分区管理

| 规则 | 说明 |
|------|------|
| 分区维度 | 基线库按BG（业务集团）和专业域（domain）两级分区 |
| BG枚举 | CBG、SBG、EBG等，与项目BG保持一致 |
| 专业域 | 由系统配置模块管理，存储在`fmea_domain`表 |
| 数据隔离 | 不同BG的基线库数据逻辑隔离，管理员仅可见本BG数据 |
| 跨BG检索 | 支持跨BG检索，但需明确指定目标BG参数 |
| 默认筛选 | 列表页默认按当前用户所属BG筛选 |

#### 10.6.2 版本管理（每条记录变动内容）

| 规则 | 说明 |
|------|------|
| 版本记录 | 每次基线库记录变更时，在`fmea_baseline_library_version`中记录一条版本历史 |
| 变更内容 | `change_content`字段存储JSON格式的变更详情，包含变更字段名、变更前值、变更后值 |
| 变更结构 | `{"fields":[{"name":"mode","oldValue":"断裂","newValue":"疲劳断裂"},{"name":"severity","oldValue":7,"newValue":8}]}` |
| 版本号 | 与`fmea_baseline_library.version`字段保持同步 |
| 变更人 | `changed_by`字段记录操作人用户ID |
| 变更时间 | `changed_at`字段记录变更时间 |

#### 10.6.3 跨项目检索

| 规则 | 说明 |
|------|------|
| 检索范围 | 失效库、措施库、功能库均支持跨项目检索 |
| 检索方式 | 按关键词模糊匹配，支持按BG/专业域筛选 |
| 检索结果 | 返回匹配的库记录列表，包含来源项目信息 |
| 使用场景 | 分析阶段AI生成时，从库中检索相似失效模式/措施作为参考 |
| 性能要求 | 检索响应时间<2秒（数据量<10万条） |

#### 10.6.4 功能库专业域配置

| 规则 | 说明 |
|------|------|
| 专业域来源 | 功能库的专业域与`fmea_domain`表保持一致 |
| 新增条目 | 新增功能库条目时，专业域从配置的下拉选项中选择 |
| 功能描述 | 功能描述需唯一（同一专业域内不可重复） |
| 所属节点类型 | `ownerNodeType`标识该功能所属的结构节点类型（如系统、子系统、零部件） |

#### 10.6.5 知识图谱预留接口

| 接口 | 说明 | 当前状态 |
|------|------|----------|
| `getFailureRelationGraph` | 获取失效模式关联图谱（失效→原因→措施） | 预留，返回空数据 |
| `getFunctionDependencyGraph` | 获取功能依赖图谱 | 预留，返回空数据 |
| `searchSimilarFailure` | 语义相似失效模式检索 | 预留，当前使用关键词匹配 |
| `getKnowledgePath` | 获取知识传播路径 | 预留，返回空数据 |

```java
public interface KnowledgeGraphService {

    GraphData getFailureRelationGraph(String bg, String domain);

    GraphData getFunctionDependencyGraph(String domain);

    List<FailureLibraryVO> searchSimilarFailure(String description,
                                                String bg, String domain,
                                                int limit);

    PathData getKnowledgePath(Long fromId, Long toId);
}
```

### 10.7 Excel导入设计

```java
@Component
public class LibraryExcelImporter {

    public List<LibraryImportData> parse(MultipartFile file) {
        Workbook workbook = WorkbookFactory.create(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        List<LibraryImportData> result = new ArrayList<>();
        for (Row row : sheet) {
            if (row.getRowNum() == 0) {
                continue;
            }
            LibraryImportData data = parseRow(row);
            if (data != null) {
                result.add(data);
            }
        }
        return result;
    }

    private LibraryImportData parseRow(Row row) {
        LibraryImportData data = new LibraryImportData();
        data.setBg(getStringCellValue(row, 0));
        data.setDomain(getStringCellValue(row, 1));
        data.setSourceProject(getStringCellValue(row, 2));
        data.setLandingOwner(getStringCellValue(row, 3));

        LibraryImportData.FailureImportItem fi =
                new LibraryImportData.FailureImportItem();
        fi.setMode(getStringCellValue(row, 4));
        fi.setCause(getStringCellValue(row, 5));
        fi.setEffect(getStringCellValue(row, 6));
        fi.setSeverity(getIntegerCellValue(row, 7));

        LibraryImportData.MeasureImportItem mi =
                new LibraryImportData.MeasureImportItem();
        mi.setDescription(getStringCellValue(row, 8));
        mi.setMeasureType(getStringCellValue(row, 9));
        mi.setSource(getStringCellValue(row, 10));
        fi.getMeasureItems().add(mi);

        data.getFailureItems().add(fi);
        return data;
    }
}
```

**Excel导入模板列定义**：

| 列序 | 列名 | 类型 | 说明 |
|------|------|------|------|
| 1 | BG | 文本 | 业务集团 |
| 2 | 专业域 | 文本 | domain |
| 3 | 来源项目 | 文本 | source_project |
| 4 | 落地负责人 | 文本 | landing_owner |
| 5 | 失效模式 | 文本 | mode |
| 6 | 失效原因 | 文本 | cause |
| 7 | 失效影响 | 文本 | effect |
| 8 | 严重度 | 数值 | severity(1-10) |
| 9 | 措施描述 | 文本 | description |
| 10 | 措施类型 | 文本 | measure_type(预防/探测) |
| 11 | 措施来源 | 文本 | source |

### 10.8 错误码

| 错误码 | 描述 | 处理建议 |
|--------|------|----------|
| 10001001 | 基线库记录不存在 | 检查libraryId是否正确 |
| 10001002 | Excel文件格式错误 | 检查文件格式和列定义 |
| 10001003 | Excel导入数据为空 | 检查文件内容 |
| 10001004 | 功能库条目重复 | 同一专业域内功能描述不可重复 |
| 10001005 | 专业域不存在 | 检查domain参数是否在配置中 |
| 10001006 | BG参数无效 | 检查bg参数是否在枚举范围内 |
| 10001007 | 失效库检索失败 | 检查检索参数 |
| 10001008 | 措施库检索失败 | 检查检索参数 |
| 10001009 | 功能库检索失败 | 检查检索参数 |
| 10001010 | Excel导入数据校验失败 | 检查数据格式和必填字段 |

---

## 11. 看板与统计模块（fmea-dashboard）

### 11.1 模块概述

看板与统计模块提供FMEA 2.0平台的全局数据可视化和统计分析能力，包括看板首页、项目进展跟踪、AI采纳率统计、多维度排行榜推送、以及各类数据导出功能。模块从所有业务模块聚合只读数据，不直接写入业务表。

| 属性 | 说明 |
|------|------|
| 包路径 | `com.fmea.dashboard` |
| Maven模块 | `fmea-dashboard` |
| 数据库表 | `fmea_ai_adoption_stat`（复用），其他为聚合查询 |
| 关联业务模块 | 所有业务模块（只读聚合） |
| 关联集成模块 | `EmailService`(统计推送) |

### 11.2 包结构

```
com.fmea.dashboard/
├── controller/
│   └── DashboardController.java
├── provider/
│   ├── DashboardProvider.java
│   └── impl/
│       └── DashboardProviderImpl.java
├── service/
│   ├── DashboardStatService.java
│   ├── AiAdoptionStatService.java
│   ├── ExportService.java
│   └── impl/
│       ├── DashboardStatServiceImpl.java
│       ├── AiAdoptionStatServiceImpl.java
│       └── ExportServiceImpl.java
├── mapper/
│   ├── DashboardStatMapper.java
│   └── AiAdoptionStatMapper.java
├── entity/
│   └── AiAdoptionStat.java
├── dto/
│   ├── request/
│   │   └── DashboardQueryRequest.java
│   └── response/
│       ├── DashboardDataVO.java
│       ├── ProjectProgressVO.java
│       ├── AiAdoptionStatVO.java
│       ├── RankingItemVO.java
│       └── ExportConfigVO.java
├── enums/
│   └── ExportType.java
├── converter/
│   └── DashboardConverter.java
├── export/
│   ├── ExcelExporter.java
│   ├── ChangeListExporter.java
│   ├── EvaluationExporter.java
│   ├── FunctionMatrixExporter.java
│   ├── FmeaFormExporter.java
│   ├── BaselinePlanExporter.java
│   └── BaselineStatusExporter.java
├── schedule/
│   └── DashboardScheduleTask.java
└── config/
    └── DashboardModuleConfig.java
```

### 11.3 Controller API设计

```java
@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardProvider dashboardProvider;

    @GetMapping("/index")
    public String index(Model model) {
        return "dashboard/index";
    }

    @GetMapping("/data")
    @ResponseBody
    public Result<DashboardDataVO> getData(
            @RequestParam(required = false) String bg) {
        return Result.success(dashboardProvider.getDashboardData(bg));
    }

    @GetMapping("/projects")
    @ResponseBody
    public Result<List<ProjectProgressVO>> getProjects(
            @RequestParam(required = false) String bg,
            @RequestParam(required = false) String status) {
        return Result.success(
                dashboardProvider.getProjectProgress(bg, status));
    }

    @GetMapping("/ai-adoption")
    @ResponseBody
    public Result<AiAdoptionStatVO> getAiAdoption(
            @RequestParam(required = false) Long analysisTaskId) {
        return Result.success(
                dashboardProvider.getAiAdoptionStat(analysisTaskId));
    }

    @GetMapping("/export/change-list/{taskId}")
    public void exportChangeList(@PathVariable Long taskId,
                                 HttpServletResponse response) {
        dashboardProvider.exportChangeList(taskId, response);
    }

    @GetMapping("/export/evaluation/{taskId}")
    public void exportEvaluation(@PathVariable Long taskId,
                                 HttpServletResponse response) {
        dashboardProvider.exportEvaluation(taskId, response);
    }

    @GetMapping("/export/structure/{taskId}")
    public void exportStructure(@PathVariable Long taskId,
                                HttpServletResponse response) {
        dashboardProvider.exportStructure(taskId, response);
    }

    @GetMapping("/export/function-matrix/{taskId}")
    public void exportFunctionMatrix(@PathVariable Long taskId,
                                     HttpServletResponse response) {
        dashboardProvider.exportFunctionMatrix(taskId, response);
    }

    @GetMapping("/export/fmea/{taskId}")
    public void exportFmeaForm(@PathVariable Long taskId,
                               HttpServletResponse response) {
        dashboardProvider.exportFmeaForm(taskId, response);
    }

    @GetMapping("/export/baseline-plan/{baselineId}")
    public void exportBaselinePlan(@PathVariable Long baselineId,
                                   HttpServletResponse response) {
        dashboardProvider.exportBaselinePlan(baselineId, response);
    }

    @GetMapping("/export/baseline-status/{baselineId}")
    public void exportBaselineStatus(@PathVariable Long baselineId,
                                     HttpServletResponse response) {
        dashboardProvider.exportBaselineStatus(baselineId, response);
    }
}
```

| API | 方法 | URL | 说明 | 请求参数 | 返回类型 |
|-----|------|-----|------|----------|----------|
| 看板首页 | GET | /dashboard/index | FTL视图 | — | String(视图名) |
| 看板数据 | GET | /dashboard/data | JSON | bg(可选) | Result\<DashboardDataVO\> |
| 项目清单与进展 | GET | /dashboard/projects | JSON | bg, status(可选) | Result\<List\<ProjectProgressVO\>\> |
| AI采纳率统计 | GET | /dashboard/ai-adoption | JSON | analysisTaskId(可选) | Result\<AiAdoptionStatVO\> |
| 导出变更点清单 | GET | /dashboard/export/change-list/{taskId} | Excel | taskId(Path) | void(Stream) |
| 导出评估表 | GET | /dashboard/export/evaluation/{taskId} | Excel | taskId(Path) | void(Stream) |
| 导出结构框图 | GET | /dashboard/export/structure/{taskId} | Image/PDF | taskId(Path) | void(Stream) |
| 导出功能矩阵 | GET | /dashboard/export/function-matrix/{taskId} | Excel | taskId(Path) | void(Stream) |
| 导出FMEA表单 | GET | /dashboard/export/fmea/{taskId} | Excel | taskId(Path) | void(Stream) |
| 导出基线落地计划 | GET | /dashboard/export/baseline-plan/{baselineId} | Excel | baselineId(Path) | void(Stream) |
| 导出基线落地情况 | GET | /dashboard/export/baseline-status/{baselineId} | Excel | baselineId(Path) | void(Stream) |

#### 11.3.1 响应DTO定义

```java
@Data
public class DashboardDataVO {
    private Integer totalProjects;
    private Integer activeProjects;
    private Integer completedProjects;
    private Integer pendingReviewCount;
    private Integer pendingApprovalCount;
    private Integer totalBaselineLibraryCount;
    private Integer totalFailureLibraryCount;
    private Integer totalMeasureLibraryCount;
    private List<ProjectProgressVO> recentProjects;
    private List<RankingItemVO> baselineCallRanking;
    private List<RankingItemVO> measureOptimizeRanking;
}

@Data
public class ProjectProgressVO {
    private Long projectId;
    private String projectName;
    private String bg;
    private String pdtl;
    private String trStage;
    private String analysisStatus;
    private String reviewStatus;
    private String approvalStatus;
    private Boolean isInbounded;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;
}

@Data
public class AiAdoptionStatVO {
    private Long analysisTaskId;
    private String projectName;
    private Integer totalAiGenerations;
    private Integer adoptedCount;
    private BigDecimal adoptionRate;
    private List<AiAdoptionDetailVO> details;
}

@Data
public class AiAdoptionDetailVO {
    private String generationType;
    private Integer totalCount;
    private Integer adoptedCount;
    private BigDecimal adoptionRate;
}

@Data
public class RankingItemVO {
    private String rankKey;
    private String rankLabel;
    private Integer rankValue;
    private Integer rankOrder;
}
```

### 11.4 Provider接口设计

```java
public interface DashboardProvider {

    DashboardDataVO getDashboardData(String bg);

    List<ProjectProgressVO> getProjectProgress(String bg, String status);

    AiAdoptionStatVO getAiAdoptionStat(Long analysisTaskId);

    void exportChangeList(Long taskId, HttpServletResponse response);

    void exportEvaluation(Long taskId, HttpServletResponse response);

    void exportStructure(Long taskId, HttpServletResponse response);

    void exportFunctionMatrix(Long taskId, HttpServletResponse response);

    void exportFmeaForm(Long taskId, HttpServletResponse response);

    void exportBaselinePlan(Long baselineId, HttpServletResponse response);

    void exportBaselineStatus(Long baselineId, HttpServletResponse response);

    void sendQuarterlyReport();

    void sendTrNodeReport(String projectId);
}
```

#### 11.4.1 Provider实现

```java
@Service
public class DashboardProviderImpl implements DashboardProvider {

    @Autowired
    private DashboardStatService dashboardStatService;

    @Autowired
    private AiAdoptionStatService aiAdoptionStatService;

    @Autowired
    private ExportService exportService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private LarkService larkService;

    @Override
    public DashboardDataVO getDashboardData(String bg) {
        DashboardDataVO data = new DashboardDataVO();
        data.setTotalProjects(
                dashboardStatService.countProjects(bg));
        data.setActiveProjects(
                dashboardStatService.countActiveProjects(bg));
        data.setCompletedProjects(
                dashboardStatService.countCompletedProjects(bg));
        data.setPendingReviewCount(
                dashboardStatService.countPendingReviews(bg));
        data.setPendingApprovalCount(
                dashboardStatService.countPendingApprovals(bg));
        data.setTotalBaselineLibraryCount(
                dashboardStatService.countBaselineLibrary(bg));
        data.setTotalFailureLibraryCount(
                dashboardStatService.countFailureLibrary(bg));
        data.setTotalMeasureLibraryCount(
                dashboardStatService.countMeasureLibrary(bg));
        data.setRecentProjects(
                dashboardStatService.getRecentProjects(bg, 10));
        data.setBaselineCallRanking(
                dashboardStatService.getBaselineCallRanking(bg, 10));
        data.setMeasureOptimizeRanking(
                dashboardStatService.getMeasureOptimizeRanking(bg, 10));
        return data;
    }

    @Override
    public List<ProjectProgressVO> getProjectProgress(String bg,
                                                      String status) {
        return dashboardStatService.getProjectProgress(bg, status);
    }

    @Override
    public AiAdoptionStatVO getAiAdoptionStat(Long analysisTaskId) {
        return aiAdoptionStatService.getStat(analysisTaskId);
    }

    @Override
    public void exportChangeList(Long taskId,
                                 HttpServletResponse response) {
        exportService.exportChangeList(taskId, response);
    }

    @Override
    public void exportEvaluation(Long taskId,
                                 HttpServletResponse response) {
        exportService.exportEvaluation(taskId, response);
    }

    @Override
    public void exportStructure(Long taskId,
                                HttpServletResponse response) {
        exportService.exportStructure(taskId, response);
    }

    @Override
    public void exportFunctionMatrix(Long taskId,
                                     HttpServletResponse response) {
        exportService.exportFunctionMatrix(taskId, response);
    }

    @Override
    public void exportFmeaForm(Long taskId,
                               HttpServletResponse response) {
        exportService.exportFmeaForm(taskId, response);
    }

    @Override
    public void exportBaselinePlan(Long baselineId,
                                   HttpServletResponse response) {
        exportService.exportBaselinePlan(baselineId, response);
    }

    @Override
    public void exportBaselineStatus(Long baselineId,
                                     HttpServletResponse response) {
        exportService.exportBaselineStatus(baselineId, response);
    }

    @Override
    public void sendQuarterlyReport() {
        // 定时调度暂不配置，后续引入xxl-job统一调度。当前仅实现Service方法，由调度框架触发调用。
        List<RankingItemVO> baselineCallRanking =
                dashboardStatService.getBaselineCallRanking(null, 20);
        String adminUserId = configProvider.getLibraryAdmin();
        emailService.sendRankingReport(adminUserId,
                "基线库调用次数排行榜", baselineCallRanking);

        List<RankingItemVO> measureRanking =
                dashboardStatService.getMeasureOptimizeRanking(null, 20);
        List<String> pdtlList =
                dashboardStatService.getActivePdtlList();
        for (String pdtl : pdtlList) {
            emailService.sendRankingReport(pdtl,
                    "新增/优化措施数量FMEA项目排行榜", measureRanking);
        }

        List<RankingItemVO> reviewerRanking =
                dashboardStatService.getReviewerRanking(null, 20);
        List<String> leaderList =
                dashboardStatService.getReviewerLeaderList();
        for (String leader : leaderList) {
            emailService.sendRankingReport(leader,
                    "评审角色参与项目数量及有效建议数量排行榜",
                    reviewerRanking);
        }

        List<RankingItemVO> analystRanking =
                dashboardStatService.getAnalystRanking(null, 20);
        List<String> analystLeaderList =
                dashboardStatService.getAnalystLeaderList();
        for (String leader : analystLeaderList) {
            emailService.sendRankingReport(leader,
                    "FMEA分析人员发布项目FMEA数量排行榜",
                    analystRanking);
        }
    }

    @Override
    public void sendTrNodeReport(String projectId) {
        // 定时调度暂不配置，后续引入xxl-job统一调度。当前仅实现Service方法，由调度框架触发调用。
        ProjectProgressVO project =
                dashboardStatService.getProjectProgressById(projectId);
        List<RankingItemVO> measureRanking =
                dashboardStatService.getMeasureRankingByProject(projectId);
        emailService.sendRankingReport(project.getPdtl(),
                "新增/优化措施数量FMEA项目排行榜-TR节点",
                measureRanking);
    }
}
```

### 11.5 Service接口设计

#### 11.5.1 DashboardStatService

```java
public interface DashboardStatService {

    int countProjects(String bg);

    int countActiveProjects(String bg);

    int countCompletedProjects(String bg);

    int countPendingReviews(String bg);

    int countPendingApprovals(String bg);

    int countBaselineLibrary(String bg);

    int countFailureLibrary(String bg);

    int countMeasureLibrary(String bg);

    List<ProjectProgressVO> getRecentProjects(String bg, int limit);

    List<ProjectProgressVO> getProjectProgress(String bg, String status);

    ProjectProgressVO getProjectProgressById(String projectId);

    List<RankingItemVO> getBaselineCallRanking(String bg, int limit);

    List<RankingItemVO> getMeasureOptimizeRanking(String bg, int limit);

    List<RankingItemVO> getReviewerRanking(String bg, int limit);

    List<RankingItemVO> getAnalystRanking(String bg, int limit);

    List<RankingItemVO> getMeasureRankingByProject(String projectId);

    List<String> getActivePdtlList();

    List<String> getReviewerLeaderList();

    List<String> getAnalystLeaderList();
}
```

#### 11.5.2 AiAdoptionStatService

```java
public interface AiAdoptionStatService {

    AiAdoptionStatVO getStat(Long analysisTaskId);

    void recordAdoption(Long analysisTaskId, String generationType,
                        int totalCount, int adoptedCount);

    void refreshStat(Long analysisTaskId);
}
```

```java
@Service
public class AiAdoptionStatServiceImpl implements AiAdoptionStatService {

    @Autowired
    private AiAdoptionStatMapper aiAdoptionStatMapper;

    @Override
    public AiAdoptionStatVO getStat(Long analysisTaskId) {
        LambdaQueryWrapper<AiAdoptionStat> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(analysisTaskId != null,
                        AiAdoptionStat::getAnalysisTaskId, analysisTaskId);
        List<AiAdoptionStat> stats = aiAdoptionStatMapper.selectList(wrapper);

        AiAdoptionStatVO vo = new AiAdoptionStatVO();
        vo.setAnalysisTaskId(analysisTaskId);
        int totalAi = 0;
        int totalAdopted = 0;
        List<AiAdoptionDetailVO> details = new ArrayList<>();
        for (AiAdoptionStat stat : stats) {
            AiAdoptionDetailVO detail = new AiAdoptionDetailVO();
            detail.setGenerationType(stat.getGenerationType());
            detail.setTotalCount(stat.getTotalCount());
            detail.setAdoptedCount(stat.getAdoptedCount());
            detail.setAdoptionRate(stat.getAdoptionRate());
            details.add(detail);
            totalAi += stat.getTotalCount();
            totalAdopted += stat.getAdoptedCount();
        }
        vo.setTotalAiGenerations(totalAi);
        vo.setAdoptedCount(totalAdopted);
        vo.setAdoptionRate(totalAi > 0
                ? BigDecimal.valueOf(totalAdopted)
                        .divide(BigDecimal.valueOf(totalAi), 4,
                                RoundingMode.HALF_UP)
                : BigDecimal.ZERO);
        vo.setDetails(details);
        return vo;
    }

    @Override
    public void recordAdoption(Long analysisTaskId, String generationType,
                               int totalCount, int adoptedCount) {
        AiAdoptionStat stat = new AiAdoptionStat();
        stat.setAnalysisTaskId(analysisTaskId);
        stat.setGenerationType(generationType);
        stat.setTotalCount(totalCount);
        stat.setAdoptedCount(adoptedCount);
        stat.setAdoptionRate(totalCount > 0
                ? BigDecimal.valueOf(adoptedCount)
                        .divide(BigDecimal.valueOf(totalCount), 4,
                                RoundingMode.HALF_UP)
                : BigDecimal.ZERO);
        stat.setStatDate(LocalDate.now());
        stat.setCreatedTime(LocalDateTime.now());
        aiAdoptionStatMapper.insert(stat);
    }

    @Override
    public void refreshStat(Long analysisTaskId) {
        LambdaQueryWrapper<AiAdoptionStat> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiAdoptionStat::getAnalysisTaskId, analysisTaskId);
        aiAdoptionStatMapper.delete(wrapper);
    }
}
```

#### 11.5.3 ExportService

```java
public interface ExportService {

    void exportChangeList(Long taskId, HttpServletResponse response);

    void exportEvaluation(Long taskId, HttpServletResponse response);

    void exportStructure(Long taskId, HttpServletResponse response);

    void exportFunctionMatrix(Long taskId, HttpServletResponse response);

    void exportFmeaForm(Long taskId, HttpServletResponse response);

    void exportBaselinePlan(Long baselineId, HttpServletResponse response);

    void exportBaselineStatus(Long baselineId, HttpServletResponse response);
}
```

### 11.6 统计推送设计

#### 11.6.1 推送规则

| 排行榜 | 推送频率 | 推送对象 | 数据来源 | 排序规则 |
|--------|----------|----------|----------|----------|
| 基线库调用次数排行榜 | 每季度 | 基线库管理员 | `fmea_baseline_library` + 调用日志 | 调用次数降序 |
| 新增/优化措施数量FMEA项目排行榜 | TR3/TR4节点 | PDTL | `fmea_measure_library` + `fmea_baseline` | 措施数量降序 |
| 评审角色参与项目数量及有效建议数量排行榜 | 每季度 | 直属领导 | `fmea_reviewer` + `fmea_review_opinion` | 参与数×0.4+建议数×0.6 |
| FMEA分析人员发布项目FMEA数量排行榜 | 每季度 | 直属领导 | `fmea_analysis_task` | 发布数量降序 |
| AI生成结果采纳率统计 | 按需 | 页面展示 | `fmea_ai_adoption_stat` | 采纳率降序 |

#### 11.6.2 定时任务

```java
@Component
public class DashboardScheduleTask {

    @Autowired
    private DashboardProvider dashboardProvider;

    @Scheduled(cron = "0 0 9 1 1,4,7,10 ?")
    public void quarterlyReport() {
        dashboardProvider.sendQuarterlyReport();
    }
}
```

- 每季度首月1日09:00执行
- TR节点报告由迭代更新Provider触发调用`sendTrNodeReport`

#### 11.6.3 排行榜数据聚合SQL示例

```sql
SELECT
    bl.bg AS rank_key,
    bl.bg AS rank_label,
    COUNT(*) AS rank_value
FROM fmea_baseline_library bl
WHERE bl.is_deleted = 0
  AND bl.entry_time >= DATEADD(QUARTER, -1, GETDATE())
GROUP BY bl.bg
ORDER BY rank_value DESC
```

### 11.7 导出设计

#### 11.7.1 Apache POI Excel导出

所有Excel导出统一使用Apache POI实现，遵循以下规范：

```java
@Component
public class ExcelExporter {

    public void export(HttpServletResponse response, String fileName,
                       String[] headers, List<String[]> dataRows) throws IOException {
        response.setContentType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition",
                "attachment;filename=" + URLEncoder.encode(fileName, "UTF-8"));

        Workbook workbook = new SXSSFWorkbook(100);
        Sheet sheet = workbook.createSheet();

        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i);
            CellStyle style = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            style.setFont(font);
            cell.setCellStyle(style);
        }

        for (int i = 0; i < dataRows.size(); i++) {
            Row row = sheet.createRow(i + 1);
            String[] data = dataRows.get(i);
            for (int j = 0; j < data.length; j++) {
                row.createCell(j).setCellValue(data[j]);
            }
        }

        workbook.write(response.getOutputStream());
        workbook.close();
    }
}
```

#### 11.7.2 飞书API导出图片

结构框图导出使用飞书API（仅PNG格式）：

```java
@Service
public class ExportServiceImpl implements ExportService {

    @Autowired
    private LarkService larkService;

    @Autowired
    private ExcelExporter excelExporter;

    @Autowired
    private AnalysisService analysisService;

    @Override
    public void exportStructure(Long taskId,
                                HttpServletResponse response) {
        StructureDiagram diagram = analysisService.getDiagram(taskId);
        byte[] imageBytes = larkService.exportBoardAsImage(
                diagram.getLarkBoardId());
        response.setContentType("image/png");
        response.setHeader("Content-Disposition",
                "attachment;filename=structure_" + taskId + ".png");
        response.getOutputStream().write(imageBytes);
    }

    @Override
    public void exportChangeList(Long taskId,
                                 HttpServletResponse response) {
        List<ChangeListItem> items =
                analysisService.getChangeListItems(taskId);
        String[] headers = {"层级", "项目ID", "结构名称", "开发类型",
                "变更点", "质量匹配"};
        List<String[]> rows = items.stream()
                .map(item -> new String[]{
                        String.valueOf(item.getLevelNum()),
                        item.getItemId(),
                        item.getStructureName(),
                        item.getDevType(),
                        item.getChangePoint(),
                        item.getQualityMatch()})
                .collect(Collectors.toList());
        excelExporter.export(response,
                "变更点清单_" + taskId + ".xlsx", headers, rows);
    }
}
```

#### 11.7.3 导出模板配置

| 导出类型 | 文件格式 | 模板来源 | 说明 |
|----------|----------|----------|------|
| 变更点清单 | .xlsx | 代码内置 | 标准列定义 |
| 评估表 | .xlsx | 代码内置 | 五维评估+风险评分 |
| 结构框图 | .png | 飞书API | 从飞书画板导出（仅PNG格式） |
| 功能矩阵 | .xlsx | 代码内置 | 功能×结构矩阵 |
| FMEA表单 | .xlsx | 代码内置 | 失效模式+原因+影响+措施+SOD |
| 基线落地计划 | .xlsx | 代码内置 | 措施清单+负责人+时间 |
| 基线落地情况 | .xlsx | 代码内置 | 落地状态+审核结果 |

### 11.8 错误码

| 错误码 | 描述 | 处理建议 |
|--------|------|----------|
| 11001001 | 看板数据聚合查询失败 | 检查数据库连接 |
| 11001002 | 项目进展数据查询失败 | 检查项目ID |
| 11001003 | AI采纳率统计数据不存在 | 确认分析任务ID |
| 11001004 | 导出变更点清单失败 | 检查任务ID和数据 |
| 11001005 | 导出评估表失败 | 检查任务ID和数据 |
| 11001006 | 导出结构框图失败 | 检查飞书画板ID |
| 11001007 | 导出功能矩阵失败 | 检查任务ID和数据 |
| 11001008 | 导出FMEA表单失败 | 检查任务ID和数据 |
| 11001009 | 导出基线落地计划失败 | 检查基线ID和数据 |
| 11001010 | 导出基线落地情况失败 | 检查基线ID和数据 |
| 11001011 | 统计推送邮件发送失败 | 检查邮件服务配置 |
| 11001012 | 排行榜数据聚合失败 | 检查数据完整性 |

---

## 12. 系统配置模块（fmea-config）

### 12.1 模块概述

系统配置模块负责管理FMEA 2.0平台的全局配置项，包括评审角色、审批角色、SOD评价标准、AP参考表、领域角色、导出模板、基线库管理员等配置。配置采用三级层级管理（公司级 > BG级 > 专业域级），支持灵活的配置继承和覆盖。

| 属性 | 说明 |
|------|------|
| 包路径 | `com.fmea.config` |
| Maven模块 | `fmea-config` |
| 数据库表 | `fmea_configuration`, `fmea_sod_standard`, `fmea_ap_reference`, `fmea_domain` |

### 12.2 包结构

```
com.fmea.config/
├── controller/
│   └── ConfigController.java
├── provider/
│   ├── ConfigProvider.java
│   └── impl/
│       └── ConfigProviderImpl.java
├── service/
│   ├── ConfigurationService.java
│   ├── SodStandardService.java
│   ├── ApReferenceService.java
│   ├── DomainService.java
│   └── impl/
│       ├── ConfigurationServiceImpl.java
│       ├── SodStandardServiceImpl.java
│       ├── ApReferenceServiceImpl.java
│       └── DomainServiceImpl.java
├── mapper/
│   ├── ConfigurationMapper.java
│   ├── SodStandardMapper.java
│   ├── ApReferenceMapper.java
│   └── DomainMapper.java
├── entity/
│   ├── Configuration.java
│   ├── SodStandard.java
│   ├── ApReference.java
│   └── Domain.java
├── dto/
│   ├── request/
│   │   ├── ConfigurationSaveRequest.java
│   │   ├── ReviewRoleSaveRequest.java
│   │   ├── ApprovalRoleSaveRequest.java
│   │   ├── SodStandardSaveRequest.java
│   │   ├── DomainRoleSaveRequest.java
│   │   └── ReviewRoleConfigVO.java
│   └── response/
│       ├── ConfigurationVO.java
│       ├── ReviewRoleConfigVO.java
│       ├── ApprovalRoleConfigVO.java
│       ├── SodStandardVO.java
│       ├── ApReferenceVO.java
│       ├── DomainRoleConfigVO.java
│       └── ExportTemplateVO.java
├── enums/
│   ├── ConfigType.java
│   └── ConfigScope.java
├── converter/
│   └── ConfigConverter.java
└── config/
    └── ConfigModuleConfig.java
```

### 12.3 Controller API设计

```java
@Controller
@RequestMapping("/config")
public class ConfigController {

    @Autowired
    private ConfigProvider configProvider;

    @GetMapping("/list")
    public String listPage(Model model) {
        return "config/list";
    }

    @GetMapping("/data")
    @ResponseBody
    public Result<List<ConfigurationVO>> getData(
            @RequestParam(required = false) String configType,
            @RequestParam(required = false) String scope) {
        return Result.success(
                configProvider.getConfigList(configType, scope));
    }

    @PostMapping("/save")
    @ResponseBody
    public Result<Void> save(
            @RequestBody ConfigurationSaveRequest request) {
        configProvider.saveConfiguration(request);
        return Result.success();
    }

    @GetMapping("/review-roles")
    @ResponseBody
    public Result<List<ReviewRoleConfigVO>> getReviewRoles(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String scopeId) {
        return Result.success(
                configProvider.getReviewRoles(scope, scopeId));
    }

    @PostMapping("/review-roles/save")
    @ResponseBody
    public Result<Void> saveReviewRoles(
            @RequestBody ReviewRoleSaveRequest request) {
        configProvider.saveReviewRoles(request);
        return Result.success();
    }

    @GetMapping("/approval-roles")
    @ResponseBody
    public Result<List<ApprovalRoleConfigVO>> getApprovalRoles(
            @RequestParam(required = false) String bg) {
        return Result.success(configProvider.getApprovalRoles(bg));
    }

    @PostMapping("/approval-roles/save")
    @ResponseBody
    public Result<Void> saveApprovalRoles(
            @RequestBody ApprovalRoleSaveRequest request) {
        configProvider.saveApprovalRoles(request);
        return Result.success();
    }

    @GetMapping("/sod-standard")
    @ResponseBody
    public Result<List<SodStandardVO>> getSodStandard(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String bgId,
            @RequestParam(defaultValue = "2") int modeType) {
        return Result.success(
                configProvider.getSodStandard(scope, bgId, modeType));
    }

    @PostMapping("/sod-standard/save")
    @ResponseBody
    public Result<Void> saveSodStandard(
            @RequestBody SodStandardSaveRequest request) {
        configProvider.saveSodStandard(request);
        return Result.success();
    }

    @GetMapping("/ap-reference")
    @ResponseBody
    public Result<List<ApReferenceVO>> getApReference() {
        return Result.success(configProvider.getApReference());
    }

    @GetMapping("/domain-roles")
    @ResponseBody
    public Result<List<DomainRoleConfigVO>> getDomainRoles() {
        return Result.success(configProvider.getDomainRoles());
    }

    @PostMapping("/domain-roles/save")
    @ResponseBody
    public Result<Void> saveDomainRoles(
            @RequestBody DomainRoleSaveRequest request) {
        configProvider.saveDomainRoles(request);
        return Result.success();
    }

    @GetMapping("/export-template")
    @ResponseBody
    public Result<ExportTemplateVO> getExportTemplate() {
        return Result.success(configProvider.getExportTemplate());
    }

    @GetMapping("/library-admin")
    @ResponseBody
    public Result<String> getLibraryAdmin() {
        return Result.success(configProvider.getLibraryAdmin());
    }

    @PostMapping("/library-admin/save")
    @ResponseBody
    public Result<Void> saveLibraryAdmin(@RequestBody String userId) {
        configProvider.saveLibraryAdmin(userId);
        return Result.success();
    }
}
```

| API | 方法 | URL | 说明 | 请求参数 | 返回类型 |
|-----|------|-----|------|----------|----------|
| 配置管理页 | GET | /config/list | FTL视图 | — | String(视图名) |
| 配置列表 | GET | /config/data | JSON | configType, scope(可选) | Result\<List\<ConfigurationVO\>\> |
| 保存配置 | POST | /config/save | JSON | ConfigurationSaveRequest | Result\<Void\> |
| 评审角色配置 | GET | /config/review-roles | JSON | scope, scopeId(可选) | Result\<List\<ReviewRoleConfigVO\>\> |
| 保存评审角色 | POST | /config/review-roles/save | JSON | ReviewRoleSaveRequest | Result\<Void\> |
| 审批角色配置 | GET | /config/approval-roles | JSON | bg(可选) | Result\<List\<ApprovalRoleConfigVO\>\> |
| 保存审批角色 | POST | /config/approval-roles/save | JSON | ApprovalRoleSaveRequest | Result\<Void\> |
| SOD标准配置 | GET | /config/sod-standard | JSON | scope, bgId, modeType | Result\<List\<SodStandardVO\>\> |
| 保存SOD标准 | POST | /config/sod-standard/save | JSON | SodStandardSaveRequest | Result\<Void\> |
| AP参考表 | GET | /config/ap-reference | JSON | — | Result\<List\<ApReferenceVO\>\> |
| 领域角色配置 | GET | /config/domain-roles | JSON | — | Result\<List\<DomainRoleConfigVO\>\> |
| 保存领域角色 | POST | /config/domain-roles/save | JSON | DomainRoleSaveRequest | Result\<Void\> |
| 导出模板配置 | GET | /config/export-template | JSON | — | Result\<ExportTemplateVO\> |
| 基线库管理员 | GET | /config/library-admin | JSON | — | Result\<String\> |
| 保存基线库管理员 | POST | /config/library-admin/save | JSON | userId | Result\<Void\> |

#### 12.3.1 请求/响应DTO定义

```java
@Data
public class ConfigurationSaveRequest {
    @NotBlank(message = "配置类型不能为空")
    private String configType;

    @NotBlank(message = "配置范围不能为空")
    private String scope;

    private String scopeId;

    @NotBlank(message = "配置键不能为空")
    private String configKey;

    private String configValue;

    private String description;
}

@Data
public class ReviewRoleSaveRequest {
    @NotBlank(message = "配置范围不能为空")
    private String scope;

    private String scopeId;

    @NotEmpty(message = "角色列表不能为空")
    private List<ReviewRoleItem> roles;

    @Data
    public static class ReviewRoleItem {
        private String roleName;
        private String userId;
        private String userName;
    }
}

@Data
public class ApprovalRoleSaveRequest {
    @NotBlank(message = "BG不能为空")
    private String bg;

    @NotEmpty(message = "角色列表不能为空")
    private List<ApprovalRoleItem> roles;

    @Data
    public static class ApprovalRoleItem {
        private String approvalLevel;
        private String userId;
        private String userName;
    }
}

@Data
public class SodStandardSaveRequest {
    @NotBlank(message = "配置范围不能为空")
    private String scope;

    private String bgId;

    @NotNull(message = "模式类型不能为空")
    private Integer modeType;

    @NotEmpty(message = "评分标准列表不能为空")
    private List<SodStandardItem> standards;

    @Data
    public static class SodStandardItem {
        private String ratingType;
        private Integer level;
        private Integer score;
        private String description;
    }
}

@Data
public class DomainRoleSaveRequest {
    @NotEmpty(message = "领域角色列表不能为空")
    private List<DomainRoleItem> domains;

    @Data
    public static class DomainRoleItem {
        private Long domainId;
        private String domainName;
        private String role;
        private String roleRepresentative;
    }
}
```

```java
@Data
public class ConfigurationVO {
    private Long id;
    private String configType;
    private String scope;
    private String scopeId;
    private String configKey;
    private String configValue;
    private String description;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;
}

@Data
public class ReviewRoleConfigVO {
    private Long id;
    private String scope;
    private String scopeId;
    private String roleName;
    private String userId;
    private String userName;
}

@Data
public class ApprovalRoleConfigVO {
    private Long id;
    private String bg;
    private String approvalLevel;
    private String userId;
    private String userName;
}

@Data
public class SodStandardVO {
    private Long id;
    private String scope;
    private String bgId;
    private Integer modeType;
    private String ratingType;
    private Integer level;
    private Integer score;
    private String description;
}

@Data
public class ApReferenceVO {
    private Long id;
    private String sRange;
    private String oRange;
    private String dRange;
    private String apLevel;
}

@Data
public class DomainRoleConfigVO {
    private Long id;
    private String domainName;
    private String domainDesc;
    private String role;
    private String roleRepresentative;
}

@Data
public class ExportTemplateVO {
    private String changeListTemplate;
    private String evaluationTemplate;
    private String functionMatrixTemplate;
    private String fmeaFormTemplate;
    private String baselinePlanTemplate;
    private String baselineStatusTemplate;
}
```

### 12.4 Provider接口设计

```java
public interface ConfigProvider {

    List<ConfigurationVO> getConfigList(String configType, String scope);

    void saveConfiguration(ConfigurationSaveRequest request);

    List<ReviewRoleConfigVO> getReviewRoles(String scope, String scopeId);

    void saveReviewRoles(ReviewRoleSaveRequest request);

    List<ApprovalRoleConfigVO> getApprovalRoles(String bg);

    void saveApprovalRoles(ApprovalRoleSaveRequest request);

    List<SodStandardVO> getSodStandard(String scope, String bgId,
                                       int modeType);

    void saveSodStandard(SodStandardSaveRequest request);

    List<ApReferenceVO> getApReference();

    List<DomainRoleConfigVO> getDomainRoles();

    void saveDomainRoles(DomainRoleSaveRequest request);

    String getLibraryAdmin();

    void saveLibraryAdmin(String userId);

    ExportTemplateVO getExportTemplate();
}
```

#### 12.4.1 Provider实现

```java
@Service
public class ConfigProviderImpl implements ConfigProvider {

    @Autowired
    private ConfigurationService configurationService;

    @Autowired
    private SodStandardService sodStandardService;

    @Autowired
    private ApReferenceService apReferenceService;

    @Autowired
    private DomainService domainService;

    @Override
    public List<ConfigurationVO> getConfigList(String configType,
                                               String scope) {
        return configurationService.queryList(configType, scope);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveConfiguration(ConfigurationSaveRequest request) {
        configurationService.saveOrUpdate(
                request.getConfigType(),
                request.getScope(),
                request.getScopeId(),
                request.getConfigKey(),
                request.getConfigValue(),
                request.getDescription());
    }

    @Override
    public List<ReviewRoleConfigVO> getReviewRoles(String scope,
                                                   String scopeId) {
        return configurationService.queryReviewRoles(scope, scopeId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveReviewRoles(ReviewRoleSaveRequest request) {
        configurationService.deleteReviewRoles(
                request.getScope(), request.getScopeId());
        for (ReviewRoleSaveRequest.ReviewRoleItem role
                : request.getRoles()) {
            configurationService.insertReviewRole(
                    request.getScope(), request.getScopeId(),
                    role.getRoleName(), role.getUserId(),
                    role.getUserName());
        }
    }

    @Override
    public List<ApprovalRoleConfigVO> getApprovalRoles(String bg) {
        return configurationService.queryApprovalRoles(bg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveApprovalRoles(ApprovalRoleSaveRequest request) {
        configurationService.deleteApprovalRoles(request.getBg());
        for (ApprovalRoleSaveRequest.ApprovalRoleItem role
                : request.getRoles()) {
            configurationService.insertApprovalRole(
                    request.getBg(), role.getApprovalLevel(),
                    role.getUserId(), role.getUserName());
        }
    }

    @Override
    public List<SodStandardVO> getSodStandard(String scope, String bgId,
                                              int modeType) {
        List<SodStandardVO> result =
                sodStandardService.query(scope, bgId, modeType);
        if (result.isEmpty() && !"company".equals(scope)) {
            result = sodStandardService.query("company", null, modeType);
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveSodStandard(SodStandardSaveRequest request) {
        sodStandardService.deleteByScope(
                request.getScope(), request.getBgId(),
                request.getModeType());
        for (SodStandardSaveRequest.SodStandardItem item
                : request.getStandards()) {
            sodStandardService.insert(
                    request.getScope(), request.getBgId(),
                    request.getModeType(), item.getRatingType(),
                    item.getLevel(), item.getScore(),
                    item.getDescription());
        }
    }

    @Override
    public List<ApReferenceVO> getApReference() {
        return apReferenceService.queryAll();
    }

    @Override
    public List<DomainRoleConfigVO> getDomainRoles() {
        return domainService.queryAll();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveDomainRoles(DomainRoleSaveRequest request) {
        for (DomainRoleSaveRequest.DomainRoleItem item
                : request.getDomains()) {
            domainService.updateRole(item.getDomainId(),
                    item.getRole(), item.getRoleRepresentative());
        }
    }

    @Override
    public String getLibraryAdmin() {
        ConfigurationVO config = configurationService.getByKey(
                "system", "library_admin", null);
        return config != null ? config.getConfigValue() : null;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveLibraryAdmin(String userId) {
        configurationService.saveOrUpdate(
                "system", "library_admin", null,
                "library_admin_user", userId, "基线库管理员用户ID");
    }

    @Override
    public ExportTemplateVO getExportTemplate() {
        ExportTemplateVO vo = new ExportTemplateVO();
        vo.setChangeListTemplate(
                configurationService.getConfigValue(
                        "export", "change_list_template"));
        vo.setEvaluationTemplate(
                configurationService.getConfigValue(
                        "export", "evaluation_template"));
        vo.setFunctionMatrixTemplate(
                configurationService.getConfigValue(
                        "export", "function_matrix_template"));
        vo.setFmeaFormTemplate(
                configurationService.getConfigValue(
                        "export", "fmea_form_template"));
        vo.setBaselinePlanTemplate(
                configurationService.getConfigValue(
                        "export", "baseline_plan_template"));
        vo.setBaselineStatusTemplate(
                configurationService.getConfigValue(
                        "export", "baseline_status_template"));
        return vo;
    }
}
```

### 12.5 Service接口设计

#### 12.5.1 ConfigurationService

```java
public interface ConfigurationService {

    List<ConfigurationVO> queryList(String configType, String scope);

    ConfigurationVO getByKey(String configType, String configKey,
                             String scopeId);

    String getConfigValue(String configType, String configKey);

    void saveOrUpdate(String configType, String scope, String scopeId,
                      String configKey, String configValue,
                      String description);

    List<ReviewRoleConfigVO> queryReviewRoles(String scope,
                                              String scopeId);

    void deleteReviewRoles(String scope, String scopeId);

    void insertReviewRole(String scope, String scopeId,
                          String roleName, String userId,
                          String userName);

    List<ApprovalRoleConfigVO> queryApprovalRoles(String bg);

    void deleteApprovalRoles(String bg);

    void insertApprovalRole(String bg, String approvalLevel,
                            String userId, String userName);
}
```

#### 12.5.2 SodStandardService

```java
public interface SodStandardService {

    List<SodStandardVO> query(String scope, String bgId, int modeType);

    void deleteByScope(String scope, String bgId, int modeType);

    void insert(String scope, String bgId, int modeType,
                String ratingType, int level, int score,
                String description);
}
```

#### 12.5.3 ApReferenceService

```java
public interface ApReferenceService {

    List<ApReferenceVO> queryAll();

    String getApLevel(int severity, int occurrence, int detection);
}
```

```java
@Service
public class ApReferenceServiceImpl implements ApReferenceService {

    @Autowired
    private ApReferenceMapper apReferenceMapper;

    @Override
    public List<ApReferenceVO> queryAll() {
        List<ApReference> list = apReferenceMapper.selectList(null);
        return ConfigConverter.INSTANCE.toApReferenceVOList(list);
    }

    @Override
    public String getApLevel(int severity, int occurrence, int detection) {
        LambdaQueryWrapper<ApReference> wrapper = new LambdaQueryWrapper<>();
        List<ApReference> all = apReferenceMapper.selectList(wrapper);
        for (ApReference ref : all) {
            if (matchRange(ref.getSRange(), severity)
                    && matchRange(ref.getORange(), occurrence)
                    && matchRange(ref.getDRange(), detection)) {
                return ref.getApLevel();
            }
        }
        return "M";
    }

    private boolean matchRange(String range, int value) {
        String[] parts = range.split("-");
        int min = Integer.parseInt(parts[0].trim());
        int max = Integer.parseInt(parts[1].trim());
        return value >= min && value <= max;
    }
}
```

#### 12.5.4 DomainService

```java
public interface DomainService {

    List<DomainRoleConfigVO> queryAll();

    void updateRole(Long domainId, String role,
                    String roleRepresentative);

    Domain getById(Long id);
}
```

### 12.6 业务规则

#### 12.6.1 配置层级：公司级 > BG级 > 专业域级

| 层级 | scope值 | scopeId | 说明 |
|------|---------|---------|------|
| 公司级 | `company` | null | 全局默认配置，所有BG和专业域继承 |
| BG级 | `bg` | BG标识(如CBG) | 覆盖公司级配置，仅对指定BG生效 |
| 专业域级 | `domain` | 专业域ID | 覆盖BG级配置，仅对指定专业域生效 |

**配置读取规则**：
1. 优先读取专业域级配置
2. 若专业域级不存在，读取BG级配置
3. 若BG级不存在，读取公司级配置
4. 若公司级也不存在，使用代码内置默认值

#### 12.6.2 SOD标准：公司级默认 + BG私有规则

| 规则 | 说明 |
|------|------|
| 公司级默认 | `scope=company, bg_id=null`，提供S/O/D各10级评分标准 |
| BG私有规则 | `scope=bg, bg_id=CBG`，可覆盖公司级评分描述 |
| modeType | 1=系统级，2=部件级（默认），不同模式可配置不同评分标准 |
| ratingType | S=严重度，O=发生度，D=探测度 |
| 评分范围 | 每个ratingType对应10个level，score从1到10 |
| 继承逻辑 | BG级未配置的level，自动继承公司级对应level的描述 |

#### 12.6.3 AP参考表：固定100行，暂不允许修改

| 规则 | 说明 |
|------|------|
| 数据量 | 固定100行，覆盖S(1-10)×O(1-10)的所有组合 |
| D维度 | 每行对应一个D范围区间 |
| AP等级 | H(高优先级)、M(中优先级)、L(低优先级) |
| 修改限制 | 一期暂不允许修改AP参考表数据 |
| 初始化 | 系统部署时通过SQL脚本初始化100行数据 |

**AP参考表示例**：

| S范围 | O范围 | D范围 | AP等级 |
|-------|-------|-------|--------|
| 9-10 | 8-10 | 1-10 | H |
| 9-10 | 4-7 | 1-10 | H |
| 9-10 | 1-3 | 1-6 | H |
| 9-10 | 1-3 | 7-10 | M |
| 4-6 | 8-10 | 1-10 | M |
| ... | ... | ... | ... |

#### 12.6.4 配置变更无需审批，记录审计日志

| 规则 | 说明 |
|------|------|
| 变更审批 | 配置变更无需走审批流程，保存即生效 |
| 审计日志 | 所有配置变更操作记录到`fmea_audit_log`表 |
| 日志内容 | 包含操作人、操作时间、配置类型、变更前值、变更后值 |
| 缓存刷新 | 配置变更后自动刷新Redis缓存 |
| 影响范围 | 配置变更仅影响后续操作，不影响已创建的业务数据 |

### 12.7 错误码

| 错误码 | 描述 | 处理建议 |
|--------|------|----------|
| 12001001 | 配置项不存在 | 检查configType和configKey |
| 12001002 | 配置范围无效 | scope必须为company/bg/domain |
| 12001003 | 评审角色配置保存失败 | 检查角色列表数据 |
| 12001004 | 审批角色配置保存失败 | 检查角色列表数据 |
| 12001005 | SOD标准配置保存失败 | 检查评分标准数据 |
| 12001006 | SOD评分级别重复 | 同一ratingType下level不可重复 |
| 12001007 | 领域角色配置保存失败 | 检查领域列表数据 |
| 12001008 | 基线库管理员配置失败 | 检查userId是否有效 |
| 12001009 | AP参考表不允许修改 | 一期AP参考表为只读 |
| 12001010 | 配置层级冲突 | 专业域级配置的scopeId必须在BG下 |

---

## 13. 外部集成模块

### 13.1 飞书集成（fmea-integration-lark）

#### 13.1.1 LarkService接口完整定义

```java
public interface LarkService {

    String createDoc(String title);

    String createBoardInDoc(String docId, String title);

    String getBoardUrl(String boardId);

    void updateBoardContent(String boardId, String mermaidContent);

    String getBoardContent(String boardId);

    void sendMessage(String receiveId, String receiveType,
                     String msgType, String content);

    void sendCardMessage(String receiveId, String receiveType,
                         String cardContent);

    byte[] exportBoardAsImage(String boardId);

    byte[] exportDocAsPdf(String docId);
}
```

#### 13.1.2 LarkApiClient底层实现设计

```java
@Component
public class LarkApiClient {

    @Autowired
    private LarkProperties larkProperties;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String TOKEN_KEY = "lark:tenant_access_token";
    private static final String TOKEN_LOCK_KEY = "lark:token_lock";

    public String getTenantAccessToken() {
        String token = redisTemplate.opsForValue().get(TOKEN_KEY);
        if (StringUtils.isNotBlank(token)) {
            return token;
        }
        return refreshToken();
    }

    private String refreshToken() {
        RLock lock = RedissonClient.getLock(TOKEN_LOCK_KEY);
        try {
            lock.lock(10, TimeUnit.SECONDS);
            String token = redisTemplate.opsForValue().get(TOKEN_KEY);
            if (StringUtils.isNotBlank(token)) {
                return token;
            }
            Map<String, String> body = new HashMap<>();
            body.put("app_id", larkProperties.getAppId());
            body.put("app_secret", larkProperties.getAppSecret());
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    larkProperties.getApiBaseUrl()
                            + "/open-apis/auth/v3/tenant_access_token/internal",
                    body, Map.class);
            Map<String, Object> data = response.getBody();
            token = (String) data.get("tenant_access_token");
            int expire = (Integer) data.get("expire");
            redisTemplate.opsForValue().set(TOKEN_KEY, token,
                    expire - 600, TimeUnit.SECONDS);
            return token;
        } finally {
            lock.unlock();
        }
    }

    public <T> T get(String url, Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization",
                "Bearer " + getTenantAccessToken());
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<T> response = restTemplate.exchange(
                larkProperties.getApiBaseUrl() + url,
                HttpMethod.GET, entity, responseType);
        return response.getBody();
    }

    public <T, R> R post(String url, T body, Class<R> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization",
                "Bearer " + getTenantAccessToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<T> entity = new HttpEntity<>(body, headers);
        ResponseEntity<R> response = restTemplate.postForEntity(
                larkProperties.getApiBaseUrl() + url,
                entity, responseType);
        return response.getBody();
    }
}
```

#### 13.1.3 令牌管理（Redis缓存+分布式锁）

| 策略 | 说明 |
|------|------|
| 缓存Key | `lark:tenant_access_token` |
| 缓存时间 | 飞书返回的expire秒数减去600秒（提前10分钟刷新） |
| 分布式锁 | 使用Redisson分布式锁，Key为`lark:token_lock`，锁定时间10秒 |
| 刷新逻辑 | 先检查缓存，缓存不存在时获取锁，双重检查后请求飞书API |
| 异常处理 | 令牌获取失败时抛出`LarkApiException(9901002)` |

#### 13.1.4 各方法调用场景说明

| 方法 | 调用场景 | 调用模块 |
|------|----------|----------|
| `createDoc` | 结构分析步骤创建飞书文档 | AnalysisProvider |
| `createBoardInDoc` | 结构分析步骤在文档中创建画板 | AnalysisProvider |
| `getBoardUrl` | 获取画板URL用于iframe嵌入 | AnalysisProvider |
| `updateBoardContent` | AI生成结构框图后更新画板 | AnalysisProvider |
| `getBoardContent` | 用户编辑画板后回读节点和边数据 | AnalysisProvider |
| `sendMessage` | 评审通知、审批通知、入库通知 | ReviewProvider, InboundProvider |
| `sendCardMessage` | 评审提醒卡片消息 | ReviewProvider |
| `exportBoardAsImage` | 导出结构框图为图片 | ExportService |
| `exportDocAsPdf` | 导出评审纪要为PDF | ReviewProvider |

### 13.2 PMS集成（fmea-integration-pms）

#### 13.2.1 PmsQueryService接口完整定义

```java
public interface PmsQueryService {

    PmsProjectInfo getProjectInfo(String pmsProjectId);

    boolean isLevel1Project(String pmsProjectId);

    List<PmsProjectMember> getProjectMembers(String pmsProjectId);

    PmsTrNodeTrigger getTrNodeTrigger(String pmsProjectId);

    List<PmsChangeSource> getChangeSourceData(String pmsProjectId);
}
```

#### 13.2.2 @DS("pms")使用规范

```java
@Service
public class PmsQueryServiceImpl implements PmsQueryService {

    @Autowired
    private PmsMapper pmsMapper;

    @Override
    @DS("pms")
    public PmsProjectInfo getProjectInfo(String pmsProjectId) {
        return pmsMapper.selectProjectInfo(pmsProjectId);
    }

    @Override
    @DS("pms")
    public boolean isLevel1Project(String pmsProjectId) {
        Integer count = pmsMapper.checkLevel1Project(pmsProjectId);
        return count != null && count > 0;
    }

    @Override
    @DS("pms")
    public List<PmsProjectMember> getProjectMembers(String pmsProjectId) {
        return pmsMapper.selectProjectMembers(pmsProjectId);
    }

    @Override
    @DS("pms")
    public PmsTrNodeTrigger getTrNodeTrigger(String pmsProjectId) {
        return pmsMapper.selectTrNodeTrigger(pmsProjectId);
    }

    @Override
    @DS("pms")
    public List<PmsChangeSource> getChangeSourceData(String pmsProjectId) {
        return pmsMapper.selectChangeSourceData(pmsProjectId);
    }
}
```

**使用规范**：

| 规范项 | 说明 |
|--------|------|
| 注解位置 | `@DS("pms")`标注在Service方法上，不标注在类上 |
| 只读限制 | PMS数据源仅允许SELECT操作 |
| 事务隔离 | PMS查询方法不得在`@Transactional`内调用，避免跨数据源事务 |
| 缓存策略 | 查询结果按需缓存至Redis |
| SQL管理 | PMS查询SQL写在独立Mapper XML中（`mapper/pms/`目录） |

#### 13.2.3 缓存策略

| 查询接口 | 缓存Key | 缓存时间 | 刷新策略 |
|----------|---------|----------|----------|
| getProjectInfo | `pms:project:{pmsProjectId}` | 30min | TTL过期自动刷新 |
| isLevel1Project | `pms:level1:{pmsProjectId}` | 30min | TTL过期自动刷新 |
| getProjectMembers | `pms:members:{pmsProjectId}` | 10min | TTL过期自动刷新 |
| getTrNodeTrigger | 不缓存 | — | 实时查询 |
| getChangeSourceData | 不缓存 | — | 实时查询 |

#### 13.2.4 查询接口清单

| 接口 | SQL表(估算) | 返回DTO | 说明 |
|------|------------|---------|------|
| getProjectInfo | pms_project | PmsProjectInfo | 项目名称、BG、PDTL、TR阶段 |
| isLevel1Project | pms_project_level | Boolean | 是否1级项目 |
| getProjectMembers | pms_project_member | List\<PmsProjectMember\> | 项目成员及角色 |
| getTrNodeTrigger | pms_tr_node | PmsTrNodeTrigger | TR节点触发信息 |
| getChangeSourceData | pms_change_source | List\<PmsChangeSource\> | 变更来源数据 |

```java
@Data
public class PmsProjectInfo {
    private String pmsProjectId;
    private String projectName;
    private String bg;
    private String pdtl;
    private String trStage;
    private String projectType;
}

@Data
public class PmsProjectMember {
    private String userId;
    private String userName;
    private String role;
    private String department;
}

@Data
public class PmsTrNodeTrigger {
    private String pmsProjectId;
    private String trStage;
    private LocalDateTime triggerTime;
    private String triggerType;
    private String triggerDesc;
}

@Data
public class PmsChangeSource {
    private String changeId;
    private String changeType;
    private String changeDesc;
    private String sourceSystem;
    private LocalDateTime changeTime;
}
```

### 13.3 AI集成（fmea-integration-ai）

#### 13.3.1 AiService接口完整定义

```java
public interface AiService {

    AiGenerationResult generateRiskEvaluation(AiRequest request);

    AiGenerationResult generateFunctionAnalysis(AiRequest request);

    AiGenerationResult generateFailureMode(AiRequest request);

    AiGenerationResult generateFailureCause(AiRequest request);

    AiGenerationResult generateFailureEffect(AiRequest request);

    AiGenerationResult generatePreventiveMeasure(AiRequest request);

    AiGenerationResult generateDetectionMeasure(AiRequest request);

    AiGenerationResult generateSodRating(AiRequest request);

    AiTaskStatus getTaskStatus(String taskId);

    AiGenerationResult getGenerationResult(String taskId);
}
```

#### 13.3.2 策略模式设计

```java
public interface AiGenerationStrategy {

    String getGenerationType();

    AiGenerationResult generate(AiRequest request);
}
```

```java
@Component
public class RiskEvaluationStrategy implements AiGenerationStrategy {

    @Autowired
    private AiApiClient aiApiClient;

    @Override
    public String getGenerationType() {
        return "RISK_EVALUATION";
    }

    @Override
    public AiGenerationResult generate(AiRequest request) {
        Map<String, Object> prompt = new LinkedHashMap<>();
        prompt.put("tech_novelty_options", request.getDimensionOptions());
        prompt.put("impact_scope_options", request.getDimensionOptions());
        prompt.put("severity_options", request.getDimensionOptions());
        prompt.put("change_complexity_options", request.getDimensionOptions());
        prompt.put("history_issue_options", request.getDimensionOptions());
        prompt.put("context", request.getContext());
        return aiApiClient.callSync(prompt, "RISK_EVALUATION");
    }
}
```

```java
@Component
public class FailureModeStrategy implements AiGenerationStrategy {

    @Autowired
    private AiApiClient aiApiClient;

    @Override
    public String getGenerationType() {
        return "FAILURE_MODE";
    }

    @Override
    public AiGenerationResult generate(AiRequest request) {
        Map<String, Object> prompt = new LinkedHashMap<>();
        prompt.put("function_item", request.getFunctionItem());
        prompt.put("structure_node", request.getStructureNode());
        prompt.put("library_reference", request.getLibraryReference());
        return aiApiClient.callAsync(prompt, "FAILURE_MODE");
    }
}
```

#### 13.3.3 同步/异步调用设计

```java
@Service
public class AiServiceImpl implements AiService {

    @Autowired
    private List<AiGenerationStrategy> strategies;

    @Autowired
    private AiApiClient aiApiClient;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private Map<String, AiGenerationStrategy> strategyMap;

    @PostConstruct
    public void init() {
        strategyMap = strategies.stream()
                .collect(Collectors.toMap(
                        AiGenerationStrategy::getGenerationType,
                        s -> s));
    }

    @Override
    public AiGenerationResult generateRiskEvaluation(AiRequest request) {
        return executeStrategy("RISK_EVALUATION", request);
    }

    @Override
    public AiGenerationResult generateFunctionAnalysis(AiRequest request) {
        return executeStrategy("FUNCTION_ANALYSIS", request);
    }

    @Override
    public AiGenerationResult generateFailureMode(AiRequest request) {
        return executeStrategy("FAILURE_MODE", request);
    }

    @Override
    public AiGenerationResult generateFailureCause(AiRequest request) {
        return executeStrategy("FAILURE_CAUSE", request);
    }

    @Override
    public AiGenerationResult generateFailureEffect(AiRequest request) {
        return executeStrategy("FAILURE_EFFECT", request);
    }

    @Override
    public AiGenerationResult generatePreventiveMeasure(AiRequest request) {
        return executeStrategy("PREVENTIVE_MEASURE", request);
    }

    @Override
    public AiGenerationResult generateDetectionMeasure(AiRequest request) {
        return executeStrategy("DETECTION_MEASURE", request);
    }

    @Override
    public AiGenerationResult generateSodRating(AiRequest request) {
        return executeStrategy("SOD_RATING", request);
    }

    private AiGenerationResult executeStrategy(String type,
                                               AiRequest request) {
        AiGenerationStrategy strategy = strategyMap.get(type);
        if (strategy == null) {
            throw new AiServiceException(9903001,
                    "未找到AI策略：" + type);
        }
        return strategy.generate(request);
    }

    @Override
    public AiTaskStatus getTaskStatus(String taskId) {
        String status = redisTemplate.opsForValue()
                .get("ai:task:" + taskId);
        if (status == null) {
            return AiTaskStatus.FAILED;
        }
        return AiTaskStatus.valueOf(status);
    }

    @Override
    public AiGenerationResult getGenerationResult(String taskId) {
        String json = redisTemplate.opsForValue()
                .get("ai:result:" + taskId);
        if (json == null) {
            return null;
        }
        return JSONUtil.toBean(json, AiGenerationResult.class);
    }
}
```

#### 13.3.4 AiApiClient实现设计

```java
@Component
public class AiApiClient {

    @Autowired
    private AiProperties aiProperties;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private final RestTemplate restTemplate = new RestTemplate();

    public AiGenerationResult callSync(Map<String, Object> prompt,
                                       String type) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization",
                    "Bearer " + aiProperties.getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("type", type);
            body.put("prompt", prompt);

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(body, headers);

            ResponseEntity<AiResponse> response = restTemplate.exchange(
                    aiProperties.getApiUrl() + "/generate",
                    HttpMethod.POST, entity, AiResponse.class,
                    aiProperties.getSyncTimeout());

            if (response.getBody() != null
                    && "success".equals(response.getBody().getStatus())) {
                return response.getBody().getData();
            }
            throw new AiServiceException(9903001,
                    "AI服务返回错误：" + response.getBody().getMessage());
        } catch (RestClientException e) {
            throw new AiServiceException(9903002,
                    "AI服务调用超时：" + e.getMessage());
        }
    }

    public AiGenerationResult callAsync(Map<String, Object> prompt,
                                        String type) {
        String taskId = IdUtil.simpleUUID();
        redisTemplate.opsForValue().set("ai:task:" + taskId,
                AiTaskStatus.PROCESSING.name(), 1, TimeUnit.HOURS);

        CompletableFuture.runAsync(() -> {
            try {
                AiGenerationResult result = callSync(prompt, type);
                redisTemplate.opsForValue().set("ai:result:" + taskId,
                        JSONUtil.toJsonStr(result), 1, TimeUnit.HOURS);
                redisTemplate.opsForValue().set("ai:task:" + taskId,
                        AiTaskStatus.COMPLETED.name(), 1, TimeUnit.HOURS);
            } catch (Exception e) {
                redisTemplate.opsForValue().set("ai:task:" + taskId,
                        AiTaskStatus.FAILED.name(), 1, TimeUnit.HOURS);
            }
        });

        AiGenerationResult asyncResult = new AiGenerationResult();
        asyncResult.setTaskId(taskId);
        asyncResult.setStatus(AiTaskStatus.PROCESSING.name());
        return asyncResult;
    }
}
```

#### 13.3.5 策略路由表

| generationType | 策略类 | 调用方式 | 超时 | 说明 |
|----------------|--------|----------|------|------|
| RISK_EVALUATION | RiskEvaluationStrategy | 同步 | 30s | 五维风险评估建议 |
| FUNCTION_ANALYSIS | FunctionAnalysisStrategy | 异步 | 60s | 功能分析AI补充 |
| FAILURE_MODE | FailureModeStrategy | 异步 | 60s | 失效模式生成 |
| FAILURE_CAUSE | FailureCauseStrategy | 异步 | 60s | 失效原因生成 |
| FAILURE_EFFECT | FailureEffectStrategy | 异步 | 60s | 失效影响生成 |
| PREVENTIVE_MEASURE | PreventiveMeasureStrategy | 异步 | 60s | 预防措施生成 |
| DETECTION_MEASURE | DetectionMeasureStrategy | 异步 | 60s | 探测措施生成 |
| SOD_RATING | SodRatingStrategy | 同步 | 30s | SOD评分建议 |

```java
@Data
public class AiRequest {
    private String generationType;
    private String analysisTaskId;
    private String context;
    private Map<String, Object> dimensionOptions;
    private String functionItem;
    private String structureNode;
    private List<String> libraryReference;
    private String failureMode;
    private String failureCause;
}

@Data
public class AiResponse {
    private String status;
    private String message;
    private AiGenerationResult data;
}

@Data
public class AiGenerationResult {
    private String taskId;
    private String status;
    private String generationType;
    private List<Map<String, Object>> items;
    private LocalDateTime generatedTime;
}
```

### 13.4 邮件集成（fmea-integration-email）

#### 13.4.1 EmailService接口完整定义

```java
public interface EmailService {

    void sendReviewNotification(String reviewerId, String reviewId,
                                String reviewDate, int daysBefore);

    void sendApprovalNotification(String approverId,
                                  String approvalId);

    void sendApprovalResult(String applicantId, String conclusion,
                            String rejectReason);

    void sendRankingReport(String receiverId, String title,
                           List<RankingItemVO> ranking);

    void sendQuarterlyReport(String receiverId,
                             DashboardDataVO data);

    void sendTrNodeReport(String pdtlId, String projectId,
                          List<RankingItemVO> ranking);
}
```

#### 13.4.2 邮件模板设计

邮件模板使用FreeMarker渲染，模板文件位于`resources/templates/email/`目录：

| 模板文件 | 场景 | 关键变量 |
|----------|------|----------|
| review_notification.ftl | 评审通知 | reviewerName, reviewDate, daysBefore, projectName |
| approval_notification.ftl | 审批通知 | approverName, projectName, approvalLevel |
| approval_result.ftl | 审批结果通知 | applicantName, conclusion, rejectReason |
| ranking_report.ftl | 排行榜报告 | title, rankingList, quarter |
| quarterly_report.ftl | 季度报告 | receiverName, data, quarter |

**邮件模板示例**：

```html
<!-- review_notification.ftl -->
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<h3>评审通知</h3>
<p>${reviewerName}，您好：</p>
<p>您有一个FMEA评审任务即将到期：</p>
<ul>
    <li>项目名称：${projectName}</li>
    <li>评审日期：${reviewDate}</li>
    <li>距评审还有：${daysBefore}天</li>
</ul>
<p>请及时登录FMEA系统查看评审详情。</p>
</body>
</html>
```

#### 13.4.3 邮件场景映射

| 场景 | 触发时机 | 收件人 | 模板 | 优先级 |
|------|----------|--------|------|--------|
| 评审一周提醒 | 评审日前7天 | 评审人 | review_notification.ftl | 普通 |
| 评审一天提醒 | 评审日前1天 | 评审人 | review_notification.ftl | 高 |
| 审批通知 | 发起审批时 | 审批人 | approval_notification.ftl | 高 |
| 审批通过通知 | 审批通过时 | 申请人 | approval_result.ftl | 普通 |
| 审批驳回通知 | 审批驳回时 | 申请人 | approval_result.ftl | 高 |
| 基线库调用排行 | 每季度 | 基线库管理员 | ranking_report.ftl | 普通 |
| 措施优化排行(TR) | TR3/TR4节点 | PDTL | ranking_report.ftl | 普通 |
| 评审角色排行 | 每季度 | 直属领导 | ranking_report.ftl | 普通 |
| 分析人员排行 | 每季度 | 直属领导 | ranking_report.ftl | 普通 |

```java
@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private FreeMarkerConfigurer freeMarkerConfigurer;

    @Autowired
    private EmailProperties emailProperties;

    @Override
    public void sendReviewNotification(String reviewerId,
                                       String reviewId,
                                       String reviewDate,
                                       int daysBefore) {
        Map<String, Object> model = new HashMap<>();
        model.put("reviewerName", reviewerId);
        model.put("reviewDate", reviewDate);
        model.put("daysBefore", daysBefore);
        String content = renderTemplate("review_notification.ftl", model);
        sendEmail(reviewerId, "FMEA评审通知", content);
    }

    @Override
    public void sendApprovalResult(String applicantId,
                                   String conclusion,
                                   String rejectReason) {
        Map<String, Object> model = new HashMap<>();
        model.put("applicantName", applicantId);
        model.put("conclusion", conclusion);
        model.put("rejectReason", rejectReason);
        String content = renderTemplate("approval_result.ftl", model);
        sendEmail(applicantId, "FMEA审批结果通知", content);
    }

    private String renderTemplate(String templateName,
                                 Map<String, Object> model) {
        try {
            Template template = freeMarkerConfigurer.getConfiguration()
                    .getTemplate("email/" + templateName);
            return FreeMarkerTemplateUtils
                    .processTemplateIntoString(template, model);
        } catch (Exception e) {
            throw new BusinessException(9904001,
                    "邮件模板渲染失败：" + e.getMessage());
        }
    }

    private void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message,
                    true, "UTF-8");
            helper.setFrom(emailProperties.getFrom());
            helper.setTo(to + "@" + emailProperties.getDomain());
            helper.setSubject(subject);
            helper.setText(content, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new BusinessException(9904001,
                    "邮件发送失败：" + e.getMessage());
        }
    }
}
```

### 13.5 CAS集成

#### 13.5.1 Spring Security + CAS Client配置

```java
@Configuration
@EnableWebSecurity
public class CasSecurityConfig extends WebSecurityConfigurerAdapter {

    @Value("${cas.server.url}")
    private String casServerUrl;

    @Value("${cas.client.url}")
    private String casClientUrl;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                .antMatchers("/static/**", "/login/cas").permitAll()
                .anyRequest().authenticated()
                .and()
                .addFilter(casValidationFilter())
                .addFilter(casAuthenticationFilter())
                .csrf()
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .and();
    }

    // 前端说明：EasyUI的jQuery.ajax请求需在header中携带X-CSRF-TOKEN

    @Bean
    public CasAuthenticationFilter casAuthenticationFilter() throws Exception {
        CasAuthenticationFilter filter = new CasAuthenticationFilter();
        filter.setAuthenticationManager(authenticationManager());
        filter.setFilterProcessesUrl("/login/cas");
        return filter;
    }

    @Bean
    public Cas30ProxyTicketValidator cas30ProxyTicketValidator() {
        return new Cas30ProxyTicketValidator(casServerUrl);
    }

    @Bean
    public CasAuthenticationProvider casAuthenticationProvider() {
        CasAuthenticationProvider provider = new CasAuthenticationProvider();
        provider.setTicketValidator(cas30ProxyTicketValidator());
        provider.setServiceProperties(serviceProperties());
        provider.setAuthenticationUserDetailsService(
                casUserDetailsService());
        provider.setKey("FMEA_CAS_PROVIDER");
        return provider;
    }

    @Bean
    public ServiceProperties serviceProperties() {
        ServiceProperties sp = new ServiceProperties();
        sp.setService(casClientUrl + "/login/cas");
        sp.setSendRenew(false);
        return sp;
    }
}
```

#### 13.5.2 认证流程

```
1. 用户访问FMEA系统任意页面
2. Spring Security拦截未认证请求
3. 重定向至CAS登录页（携带service参数）
4. 用户输入账号密码完成CAS认证
5. CAS认证成功后回调FMEA系统（携带ticket）
6. CasAuthenticationFilter拦截/login/cas请求
7. 使用Cas30ProxyTicketValidator向CAS服务器验证ticket
8. 验证成功后获取用户属性（用户ID、姓名、部门等）
9. 创建Authentication对象并存入SecurityContext
10. 同步用户信息至本地fmea_user表
11. 后续请求通过session识别已认证用户
```

#### 13.5.3 用户信息同步

```java
@Service
public class CasUserDetailsServiceImpl
        implements AuthenticationUserDetailsService<CasAssertionAuthenticationToken> {

    @Autowired
    private UserService userService;

    @Override
    public UserDetails loadUserDetails(
            CasAssertionAuthenticationToken token) throws UsernameNotFoundException {
        AttributePrincipal principal = token.getAssertion().getPrincipal();
        String userId = principal.getName();
        Map<String, Object> attributes = principal.getAttributes();

        User user = userService.getByUserId(userId);
        if (user == null) {
            user = new User();
            user.setUserId(userId);
            user.setUserName((String) attributes.get("displayName"));
            user.setDepartment((String) attributes.get("department"));
            user.setEmail((String) attributes.get("mail"));
            user.setCreatedTime(LocalDateTime.now());
            userService.createUser(user);
        } else {
            user.setUserName((String) attributes.get("displayName"));
            user.setDepartment((String) attributes.get("department"));
            user.setEmail((String) attributes.get("mail"));
            userService.updateUser(user);
        }

        return new FmeaUserDetails(user, AuthorityUtils.NO_AUTHORITIES);
    }
}
```

| 同步策略 | 说明 |
|----------|------|
| 同步时机 | 每次CAS认证成功时同步 |
| 同步字段 | 用户ID、姓名、部门、邮箱 |
| 本地存储 | `fmea_user`表缓存用户基本信息 |
| 权限来源 | 权限信息从PMS同步，不依赖CAS |
| 更新策略 | 每次登录时覆盖更新本地用户信息 |

### 13.6 错误码

| 错误码 | 描述 | 处理建议 |
|--------|------|----------|
| 9901001 | 飞书API调用失败 | 检查飞书应用配置和网络连接 |
| 9901002 | 飞书令牌获取失败 | 检查app_id和app_secret配置 |
| 9902001 | PMS数据源查询失败 | 检查PMS数据库连接和SQL |
| 9903001 | AI服务调用失败 | 检查AI服务配置和请求参数 |
| 9903002 | AI服务超时 | 检查AI服务可用性，适当增加超时时间 |
| 9904001 | 邮件发送失败 | 检查SMTP配置和收件人地址 |
| 9905001 | CAS认证失败 | 检查CAS服务器配置和ticket有效性 |


---

## 文档变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| V1.0 | 2026-05-28 | 初始版本，合并第1-13章详细设计 | — |
