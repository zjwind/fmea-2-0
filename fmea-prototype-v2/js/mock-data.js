var MockData = (function () {
    var evaluationTasksSystem = [
        { id: 'ET-S001', project: 'CloudEngine S12700E系列交换机', milestone: 'TR4', taskName: '系统级DRBFM评估', tse: '张三', pse: '李四', status: 'in-progress', startTime: '2026-01-15', expectedEndTime: '2026-03-15', canSkip: true },
        { id: 'ET-S002', project: 'NetEngine AR8000系列路由器', milestone: 'TR3', taskName: '系统级DRBFM评估', tse: '王五', pse: '赵六', status: 'submitted', startTime: '2026-02-08', expectedEndTime: '2026-04-08', canSkip: true },
        { id: 'ET-S003', project: 'OptiXstar P815光接入设备', milestone: 'TR5', taskName: '系统级DRBFM评估', tse: '孙七', pse: '周八', status: 'completed', startTime: '2025-11-20', expectedEndTime: '2026-01-20', canSkip: false },
        { id: 'ET-S004', project: 'AirEngine 6760-X1无线AP', milestone: 'TR2', taskName: '系统级DRBFM评估', tse: '吴九', pse: '郑十', status: 'draft', startTime: '2026-03-10', expectedEndTime: '2026-05-10', canSkip: true },
        { id: 'ET-S005', project: 'FusionServer Pro 2288H V7', milestone: 'TR4', taskName: '系统级DRBFM评估', tse: '陈一', pse: '林二', status: 'confirmed', startTime: '2025-12-05', expectedEndTime: '2026-02-05', canSkip: false }
    ];

    var evaluationTasksPart = [
        { id: 'ET-P001', project: 'CloudEngine S12700E系列交换机', milestone: 'TR4', taskName: '主控板部件级DRBFM评估', tse: '张三', pse: '李四', status: 'in-progress', startTime: '2026-02-01', expectedEndTime: '2026-04-01', canSkip: true },
        { id: 'ET-P002', project: 'CloudEngine S12700E系列交换机', milestone: 'TR4', taskName: '交换网板部件级DRBFM评估', tse: '张三', pse: '李四', status: 'draft', startTime: '2026-02-15', expectedEndTime: '2026-04-15', canSkip: true },
        { id: 'ET-P003', project: 'NetEngine AR8000系列路由器', milestone: 'TR3', taskName: '路由引擎部件级DRBFM评估', tse: '王五', pse: '赵六', status: 'submitted', startTime: '2026-03-01', expectedEndTime: '2026-05-01', canSkip: false }
    ];

    var analysisTasks = [
        { id: 'AT001', taskName: 'CloudEngine S12700E DRBFM分析', tse: '张三', pse: '李四', status: 'in-progress', startTime: '2026-01-22', expectedEndTime: '2026-04-22', currentStep: 2, steps: ['结构分析', '功能分析', '失效分析', '评审', '审批'] },
        { id: 'AT002', taskName: 'NetEngine AR8000 DRBFM分析', tse: '王五', pse: '赵六', status: 'in-progress', startTime: '2026-02-15', expectedEndTime: '2026-05-15', currentStep: 1, steps: ['结构分析', '功能分析', '失效分析', '评审', '审批'] },
        { id: 'AT003', taskName: 'OptiXstar P815 DRBFM分析', tse: '孙七', pse: '周八', status: 'completed', startTime: '2025-12-01', expectedEndTime: '2026-03-01', currentStep: 5, steps: ['结构分析', '功能分析', '失效分析', '评审', '审批'] },
        { id: 'AT004', taskName: 'AirEngine 6760-X1 DRBFM分析', tse: '吴九', pse: '郑十', status: 'draft', startTime: '2026-03-20', expectedEndTime: '2026-06-20', currentStep: 0, steps: ['结构分析', '功能分析', '失效分析', '评审', '审批'] }
    ];

    var myOpinions = [
        { id: 'OP001', project: 'CloudEngine S12700E', analysisTask: 'CloudEngine S12700E DRBFM分析', owner: '陈工', content: '交换网板信号完整性分析需补充高温场景下的SerDes参数裕量验证', status: 'pending', reply: '', createdAt: '2026-03-15' },
        { id: 'OP002', project: 'CloudEngine S12700E', analysisTask: 'CloudEngine S12700E DRBFM分析', owner: '刘工', content: '接口板子系统的失效模式分析不够充分，建议增加400GE光模块热插拔场景的失效分析', status: 'replied', reply: '已补充400GE光模块热插拔场景分析，详见失效分析表第FR006行', createdAt: '2026-03-10' },
        { id: 'OP003', project: 'NetEngine AR8000', analysisTask: 'NetEngine AR8000 DRBFM分析', owner: '黄工', content: '电源模块的预防措施需增加输出过压保护的具体阈值参数', status: 'closed', reply: '已补充过压保护阈值参数：3.6V，保护延时100μs', createdAt: '2026-02-28' }
    ];

    var pendingOpinions = [
        { id: 'OP004', project: 'CloudEngine S12700E', analysisTask: 'CloudEngine S12700E DRBFM分析', proposer: '陈工', content: '主控板散热设计需考虑55°C环境温度下的长期运行可靠性', status: 'pending', reply: '', createdAt: '2026-03-18' },
        { id: 'OP005', project: 'CloudEngine S12700E', analysisTask: 'CloudEngine S12700E DRBFM分析', proposer: '刘工', content: '建议增加交换芯片SerDes信号的眼图测试作为探测措施', status: 'pending', reply: '', createdAt: '2026-03-16' },
        { id: 'OP006', project: 'NetEngine AR8000', analysisTask: 'NetEngine AR8000 DRBFM分析', proposer: '黄工', content: '路由协议切换场景下的失效模式需要进一步细化', status: 'replied', reply: '已补充OSPF/BGP协议切换场景的失效模式分析', createdAt: '2026-03-05' }
    ];

    var structureComponents = [
        { id: 'SC01', componentId: 'SYS-001', name: 'CloudEngine S12700E整机', isChanged: true, changeDesc: '新增400GE接口板卡支持' },
        { id: 'SC02', componentId: 'SUB-001', name: '主控板', isChanged: true, changeDesc: 'CPU升级至ARM A72架构' },
        { id: 'SC03', componentId: 'SUB-002', name: '交换网板', isChanged: true, changeDesc: '交换芯片带宽升级至25.6Tbps' },
        { id: 'SC04', componentId: 'SUB-003', name: '接口板', isChanged: true, changeDesc: '新增400GE QSFP-DD接口板' },
        { id: 'SC05', componentId: 'SUB-004', name: '电源模块', isChanged: true, changeDesc: '功率从1500W升级至3000W' },
        { id: 'SC06', componentId: 'SUB-005', name: '风扇模块', isChanged: false, changeDesc: '' },
        { id: 'SC07', componentId: 'SUB-006', name: '机箱', isChanged: false, changeDesc: '' }
    ];

    var structureFunctions = [
        { id: 'SF01', name: '数据转发', component1: '主控板', component2: '交换网板', type: '核心功能' },
        { id: 'SF02', name: '路由计算', component1: '主控板', component2: '', type: '核心功能' },
        { id: 'SF03', name: '信号处理', component1: '接口板', component2: '交换网板', type: '核心功能' },
        { id: 'SF04', name: '供电保障', component1: '电源模块', component2: '', type: '支撑功能' },
        { id: 'SF05', name: '散热管理', component1: '风扇模块', component2: '', type: '支撑功能' },
        { id: 'SF06', name: '设备管理', component1: '主控板', component2: '', type: '管理功能' }
    ];

    var failureRecords = [
        { id: 'FR001', structure: '交换网板', function: '数据转发', mode: '功能降级', cause: 'SerDes预加重参数设置不当', effect: '转发吞吐量降至标称70%', s: 8, o: 5, d: 4, sop: 160, ap: 'H' },
        { id: 'FR002', structure: '主控板', function: '设备管理', mode: '功能丧失', cause: '高温CPU热保护触发复位', effect: '管理平面中断', s: 7, o: 3, d: 6, sop: 126, ap: 'H' },
        { id: 'FR003', structure: '接口板', function: '信号处理', mode: '伴随功能', cause: '400GE与10GE信号串扰', effect: '10GE端口误码率升高', s: 6, o: 4, d: 5, sop: 120, ap: 'H' },
        { id: 'FR004', structure: '电源模块', function: '供电保障', mode: '过剩功能', cause: '输出电压上冲超限', effect: '过压保护触发，整机重启', s: 9, o: 2, d: 3, sop: 54, ap: 'M' },
        { id: 'FR005', structure: '风扇模块', function: '散热管理', mode: '部分功能丧失', cause: '轴承磨损导致转速下降', effect: '机箱温度升高', s: 5, o: 4, d: 7, sop: 140, ap: 'H' }
    ];

    var reviewers = [
        { name: '陈工', role: '专业组长', opinion: 'agree', comment: '结构分解合理，层级清晰', time: '2026-03-20 14:30' },
        { name: '刘工', role: 'PSE', opinion: 'conditional', comment: '接口板子系统需进一步细化', time: '2026-03-20 15:20' },
        { name: '黄工', role: '硬件质量经理', opinion: 'agree', comment: '同意通过', time: '2026-03-21 09:05' },
        { name: '赵工', role: 'DFX SE', opinion: 'pending', comment: '', time: '' }
    ];

    var sodStandards = {
        severity: [
            { level: 10, desc: '客户安全风险，可能造成人身伤害' },
            { level: 9, desc: '法规不符合，产品无法上市' },
            { level: 8, desc: '核心功能完全丧失，客户业务中断' },
            { level: 7, desc: '核心功能严重降级，客户业务受重大影响' },
            { level: 6, desc: '核心功能轻微降级，客户业务受轻微影响' },
            { level: 5, desc: '辅助功能丧失，客户体验显著下降' },
            { level: 4, desc: '辅助功能降级，客户体验轻微下降' },
            { level: 3, desc: '外观或非功能性问题，客户可感知' },
            { level: 2, desc: '制造或装配不便，不影响最终功能' },
            { level: 1, desc: '极轻微影响，几乎不可感知' }
        ],
        occurrence_mode1: [
            { level: 10, desc: '几乎必然发生（≥1/2）' },
            { level: 9, desc: '极可能发生（1/3）' },
            { level: 8, desc: '很可能发生（1/8）' },
            { level: 7, desc: '可能发生（1/20）' },
            { level: 6, desc: '偶尔发生（1/80）' },
            { level: 5, desc: '较少发生（1/400）' },
            { level: 4, desc: '很少发生（1/2000）' },
            { level: 3, desc: '极少发生（1/15000）' },
            { level: 2, desc: '几乎不发生（1/150000）' },
            { level: 1, desc: '几乎不可能发生（≤1/1500000）' }
        ],
        occurrence_mode2: [
            { level: 10, desc: '≥100次/千件' },
            { level: 9, desc: '50次/千件' },
            { level: 8, desc: '20次/千件' },
            { level: 7, desc: '10次/千件' },
            { level: 6, desc: '5次/千件' },
            { level: 5, desc: '2次/千件' },
            { level: 4, desc: '0.5次/千件' },
            { level: 3, desc: '0.1次/千件' },
            { level: 2, desc: '0.01次/千件' },
            { level: 1, desc: '≤0.001次/千件' }
        ],
        detection: [
            { level: 10, desc: '无任何检测手段' },
            { level: 9, desc: '仅靠偶然发现' },
            { level: 8, desc: '仅靠客户反馈发现' },
            { level: 7, desc: '仅靠定期检查发现' },
            { level: 6, desc: '靠人工检验发现（效率低）' },
            { level: 5, desc: '靠人工检验发现（效率高）' },
            { level: 4, desc: '靠统计过程控制发现' },
            { level: 3, desc: '靠自动化检测发现（检出率一般）' },
            { level: 2, desc: '靠自动化检测发现（检出率高）' },
            { level: 1, desc: '靠设计防错，不可能产生缺陷' }
        ]
    };

    var dashboardStats = {
        totalProjects: 6,
        activeEvaluations: 4,
        activeAnalysis: 3,
        pendingReviews: 5,
        pendingApprovals: 2,
        highRiskCount: 3,
        baselineCompletion: 68,
        landingCompletion: 55
    };

    var dataMap = {
        evaluationTasksSystem: evaluationTasksSystem,
        evaluationTasksPart: evaluationTasksPart,
        analysisTasks: analysisTasks,
        myOpinions: myOpinions,
        pendingOpinions: pendingOpinions,
        structureComponents: structureComponents,
        structureFunctions: structureFunctions,
        failureRecords: failureRecords,
        reviewers: reviewers,
        sodStandards: sodStandards,
        dashboardStats: dashboardStats
    };

    return {
        get: function (key) { return dataMap[key] || null; },
        getAll: function () { return dataMap; }
    };
})();
