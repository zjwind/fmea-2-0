/* 原型 Mock 数据 */
var DATA = {
    // 评估任务（系统级 / 部件级）
    evalTasks: {
        system: [
            { id: 'ET-2026-001', project: '智能座舱域控 X9', milestone: 'TR1', name: 'X9 系统级DRBFM评估', tse: '张明', pse: '李伟', status: '进行中', start: '2026-05-08', due: '2026-06-05', stepIdx: 2 },
            { id: 'ET-2026-002', project: '高压电池管理系统 B7', milestone: 'TR1', name: 'B7 系统级DRBFM评估', tse: '王芳', pse: '赵强', status: '待审核', start: '2026-05-12', due: '2026-06-10', stepIdx: 3 },
            { id: 'ET-2026-003', project: '智能驾驶域控 AD5', milestone: 'TR1', name: 'AD5 系统级DRBFM评估', tse: '张明', pse: '李伟', status: '已完成', start: '2026-04-20', due: '2026-05-18', stepIdx: 5 },
            { id: 'ET-2026-004', project: '车身域控制器 C3', milestone: 'TR1', name: 'C3 系统级DRBFM评估', tse: '陈晨', pse: '刘洋', status: '待开始', start: '2026-05-28', due: '2026-06-25', stepIdx: 0 }
        ],
        part: [
            { id: 'ET-2026-101', project: '智能座舱域控 X9', milestone: 'TR3', name: 'X9 主控板部件级评估', tse: '张明', pse: '李伟', status: '进行中', start: '2026-05-15', due: '2026-06-12', stepIdx: 2, collaborators: ['孙磊', '周婷'] },
            { id: 'ET-2026-102', project: '智能座舱域控 X9', milestone: 'TR3', name: 'X9 电源模块部件级评估', tse: '王芳', pse: '赵强', status: '协作人签核中', start: '2026-05-18', due: '2026-06-15', stepIdx: 1, collaborators: ['吴昊', '郑爽'] },
            { id: 'ET-2026-103', project: '高压电池管理系统 B7', milestone: 'TR3', name: 'B7 采样模块部件级评估', tse: '陈晨', pse: '刘洋', status: '待开始', start: '2026-05-30', due: '2026-06-28', stepIdx: 0, collaborators: [] }
        ]
    },

    // DRBFM 分析任务
    analysisTasks: [
        { id: 'AN-2026-001', project: '智能座舱域控 X9', name: 'X9 主控板 DRBFM分析', tse: '张明', pse: '李伟', status: '失效分析', start: '2026-05-20', due: '2026-06-18', stepIdx: 2, mine: true },
        { id: 'AN-2026-002', project: '智能驾驶域控 AD5', name: 'AD5 感知融合 DRBFM分析', tse: '王芳', pse: '赵强', status: '评审中', start: '2026-05-10', due: '2026-06-08', stepIdx: 3, mine: false },
        { id: 'AN-2026-003', project: '高压电池管理系统 B7', name: 'B7 BMS主板 DRBFM分析', tse: '张明', pse: '刘洋', status: '结构分析', start: '2026-05-25', due: '2026-06-22', stepIdx: 0, mine: true },
        { id: 'AN-2026-004', project: '车身域控制器 C3', name: 'C3 网关 DRBFM分析', tse: '陈晨', pse: '李伟', status: '审批中', start: '2026-04-28', due: '2026-05-26', stepIdx: 4, mine: false },
        { id: 'AN-2026-005', project: '智能座舱域控 X9', name: 'X9 显示驱动 DRBFM分析', tse: '张明', pse: '李伟', status: '已完成', start: '2026-04-15', due: '2026-05-12', stepIdx: 5, mine: true }
    ],

    // 部件列表（结构分析）
    parts: [
        { pid: 'P01', name: '主控SoC', changed: true, note: '更换为新一代 8核 SoC，主频提升至 2.4GHz' },
        { pid: 'P02', name: 'DDR内存', changed: true, note: 'LPDDR4X → LPDDR5，带宽提升' },
        { pid: 'P03', name: '电源管理PMIC', changed: false, note: '' },
        { pid: 'P04', name: 'CAN收发器', changed: true, note: '新增CAN-FD支持' },
        { pid: 'P05', name: '显示驱动LVDS', changed: false, note: '' }
    ],
    functions: [
        { name: '提供主控运算能力', p1: '主控SoC', p2: 'DDR内存', type: '能量', risk: 'H' },
        { name: '传输CAN总线信号', p1: 'CAN收发器', p2: '主控SoC', type: '信号', risk: 'M' },
        { name: '供应稳定电源', p1: '电源管理PMIC', p2: '主控SoC', type: '能量', risk: 'M' },
        { name: '驱动显示输出', p1: '显示驱动LVDS', p2: '主控SoC', type: '信号', risk: 'L' }
    ],

    // ===== 飞书连接字段预留（凡含飞书画板/文档/表格的交付物均预留以下字段）=====
    // larkObjType: board=画板 / docx=文档 / sheet=电子表格
    // larkAppToken/larkDocToken/larkFileToken: 飞书资源 token
    // larkNodeToken: 画板节点 token（结构框图）
    // larkUrl: 可嵌入/跳转的飞书资源链接；larkSyncTime: 最近同步时间
    larkRefs: {
        // 结构分析交付物：结构框图（飞书文档 + 画板节点）
        structureDiagram: { larkObjType: 'board', larkDocToken: 'docxFmea0X9StructBoard', larkAppToken: '', larkFileToken: '', larkNodeToken: 'boardNodeX9Struct001', larkUrl: 'https://feishu.cn/docx/docxFmea0X9StructBoard', larkSyncTime: '2026-05-22 14:30' },
        // 功能分析交付物：功能矩阵（飞书电子表格嵌入）
        functionMatrix: { larkObjType: 'sheet', larkDocToken: '', larkAppToken: '', larkFileToken: 'shtFmea0X9FuncMatrix', larkNodeToken: '', larkUrl: 'https://feishu.cn/sheets/shtFmea0X9FuncMatrix', larkSyncTime: '2026-05-25 10:05' },
        // 失效分析交付物：失效分析表（飞书电子表格，评审环节展示链接）
        failureAnalysis: { larkObjType: 'sheet', larkDocToken: '', larkAppToken: '', larkFileToken: 'shtFmea0X9FailureTable', larkNodeToken: '', larkUrl: 'https://feishu.cn/sheets/shtFmea0X9FailureTable', larkSyncTime: '2026-05-28 16:40' },
        // 评估交付物：DRBFM 触发评估表（飞书电子表格）
        evaluationTable: { larkObjType: 'sheet', larkDocToken: '', larkAppToken: '', larkFileToken: 'shtFmea0X9EvalTable', larkNodeToken: '', larkUrl: 'https://feishu.cn/sheets/shtFmea0X9EvalTable', larkSyncTime: '2026-05-15 09:12' }
    },

    // 失效分析记录
    failures: [
        { id: 'F01', func: '提供主控运算能力', mode: '减量-运算性能不足', cause: '固有设计缺陷-散热裕度不足', effect: '系统卡顿、功能降级', prevent: '增加散热铜箔面积，预留10%性能裕度', detect: '高温老化试验+性能基准测试', s: 8, o: 4, d: 3, ap: 'H', source: 'AI生成' },
        { id: 'F02', func: '传输CAN总线信号', mode: '异常-信号误码', cause: '应力诱发失效-EMC干扰', effect: '通信中断，控制指令丢失', prevent: '增加共模电感与TVS防护', detect: 'EMC辐射抗扰度测试', s: 9, o: 3, d: 4, ap: 'H', source: 'AI生成' },
        { id: 'F03', func: '供应稳定电源', mode: '过量-输出电压超限', cause: '制造/装配问题-反馈电阻误差', effect: '下游器件过压损坏', prevent: '采用0.1%精度反馈电阻', detect: '上电时序与电压精度测试', s: 7, o: 2, d: 3, ap: 'M', source: '历史' },
        { id: 'F04', func: '驱动显示输出', mode: '空白-无显示输出', cause: '交互性失效-时序不匹配', effect: '黑屏，影响人机交互', prevent: '增加时序约束与上电复位逻辑', detect: '开机点亮率统计测试', s: 6, o: 2, d: 2, ap: 'L', source: 'AI生成' }
    ],

    // 基线 / 措施清单
    measures: [
        { id: 'M01', type: '预防措施', content: '增加散热铜箔面积，预留10%性能裕度', source: 'AI生成', tag: '新增', land: true, owner: '张明', date: '2026-07-10' },
        { id: 'M02', type: '探测措施', content: 'EMC辐射抗扰度测试', source: '历史', tag: '优化', land: true, owner: '王芳', date: '2026-07-15' },
        { id: 'M03', type: '优化措施', content: '采用0.1%精度反馈电阻替代1%', source: 'AI生成', tag: '新增', land: true, owner: '李伟', date: '2026-07-20' },
        { id: 'M04', type: '探测措施', content: '开机点亮率统计测试', source: 'AI生成', tag: '新增', land: false, owner: '', date: '' }
    ],

    // 评审人
    reviewers: [
        { name: '李伟', role: 'PSE', result: '通过', opinion: '失效分析覆盖充分，同意。' },
        { name: '孙磊', role: '专业组长', result: '通过', opinion: '措施可落地，建议补充供应商质量数据。' },
        { name: '周婷', role: '硬件质量经理', result: '待评审', opinion: '' },
        { name: '吴昊', role: 'DFX SE', result: '待评审', opinion: '' }
    ],

    // 评审意见
    opinions: {
        mine: [
            { id: 'OP-001', project: '智能驾驶域控 AD5', task: 'AD5 感知融合 DRBFM分析', owner: '王芳', content: '建议增加针对多传感器时间同步失效的探测措施。', status: '已答复', reply: '已补充PTP时钟同步监控措施，见M07。' },
            { id: 'OP-002', project: '车身域控制器 C3', task: 'C3 网关 DRBFM分析', owner: '陈晨', content: '电源时序失效的发生度评分偏低，建议复核。', status: '待答复', reply: '' },
            { id: 'OP-003', project: '智能座舱域控 X9', task: 'X9 显示驱动 DRBFM分析', owner: '张明', content: '显示黑屏失效影响描述需细化到客户感知层面。', status: '已闭环', reply: '已细化为"客户开机黑屏投诉风险"。' }
        ],
        todo: [
            { id: 'OP-101', project: '智能座舱域控 X9', task: 'X9 主控板 DRBFM分析', owner: '张明', content: '主控SoC散热裕度预防措施缺少量化指标，请补充。', status: '待答复', reply: '' },
            { id: 'OP-102', project: '智能座舱域控 X9', task: 'X9 主控板 DRBFM分析', owner: '张明', content: 'CAN信号误码的探测措施建议增加整车级验证。', status: '待答复', reply: '' },
            { id: 'OP-103', project: '高压电池管理系统 B7', task: 'B7 BMS主板 DRBFM分析', owner: '张明', content: '采样精度失效原因需结合本次变更点具象化描述。', status: '待答复', reply: '' }
        ]
    },

    // 五维评估
    fiveDim: [
        { key: 'tech', name: '技术新颖性', weight: 15, level: '高', score: 9 },
        { key: 'scope', name: '影响范围', weight: 30, level: '高', score: 9 },
        { key: 'severity', name: '失效严重度', weight: 30, level: '中', score: 6 },
        { key: 'complex', name: '变更复杂度', weight: 20, level: '中', score: 6 },
        { key: 'history', name: '历史问题', weight: 5, level: '低', score: 3 }
    ],

    // SOD 评价标准
    sod: {
        severity: [
            { lv: 10, desc: '影响车辆安全运行/不符合法规，无预警' },
            { lv: 9, desc: '影响车辆安全运行/不符合法规，有预警' },
            { lv: 8, desc: '丧失主要功能，车辆无法运行' },
            { lv: 7, desc: '主要功能降级，客户高度不满' },
            { lv: 6, desc: '丧失次要功能' },
            { lv: 5, desc: '次要功能降级，多数客户察觉' },
            { lv: 4, desc: '外观/异响等，多数客户察觉' },
            { lv: 3, desc: '外观/异响等，部分客户察觉' },
            { lv: 2, desc: '外观/异响等，少数挑剔客户察觉' },
            { lv: 1, desc: '无可识别影响' }
        ],
        occurrence: [
            { lv: 10, desc: '极高：新技术/新设计，无预防经验' },
            { lv: 8, desc: '高：与历史失效设计高度相似' },
            { lv: 6, desc: '中：与历史偶发失效设计相似' },
            { lv: 4, desc: '低：与历史少量失效设计相似' },
            { lv: 2, desc: '很低：成熟设计，预防措施充分' },
            { lv: 1, desc: '极低：通过预防措施消除失效' }
        ],
        detection: [
            { lv: 10, desc: '无探测措施或措施无效' },
            { lv: 8, desc: '探测能力很低，后期才能发现' },
            { lv: 6, desc: '探测能力低，单一应力/常规试验' },
            { lv: 4, desc: '探测能力中，综合应力试验' },
            { lv: 2, desc: '探测能力高，早期边界试验' },
            { lv: 1, desc: '探测能力很高，已被验证有效' }
        ]
    }
};

/* 工具函数 */
var Util = {
    statusTag: function (s) {
        var map = {
            '待开始': 'gray', '待审核': 'orange', '协作人签核中': 'orange', '进行中': 'blue',
            '结构分析': 'blue', '功能分析': 'blue', '失效分析': 'blue', '评审中': 'orange',
            '审批中': 'orange', '已完成': 'green', '待答复': 'orange', '已答复': 'blue', '已闭环': 'green'
        };
        return '<span class="tag ' + (map[s] || 'gray') + '">' + s + '</span>';
    },
    riskCell: function (r) { return '<span class="cell-risk ' + r + '">' + r + '</span>'; }
};
