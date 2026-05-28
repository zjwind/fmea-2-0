var MockData = (function () {
    var projects = [
        {
            id: 'P2026001',
            name: 'CloudEngine S12700E系列交换机DRBFM分析',
            bg: 'CBG',
            pdtl: '数据中心交换机产品线',
            tr_stage: 'TR4',
            is_level1: true,
            created_at: '2026-01-15',
            status: 'in-progress',
            owner: '张三',
            change_count: 23,
            risk_count: 8,
            baseline_count: 15,
            completion: 72
        },
        {
            id: 'P2026002',
            name: 'NetEngine AR8000系列路由器DRBFM分析',
            bg: 'CBG',
            pdtl: '企业路由器产品线',
            tr_stage: 'TR3',
            is_level1: true,
            created_at: '2026-02-08',
            status: 'in-progress',
            owner: '李四',
            change_count: 18,
            risk_count: 5,
            baseline_count: 12,
            completion: 45
        },
        {
            id: 'P2026003',
            name: 'OptiXstar P815光接入设备DRBFM分析',
            bg: 'SBG',
            pdtl: '光接入产品线',
            tr_stage: 'TR5',
            is_level1: false,
            created_at: '2025-11-20',
            status: 'completed',
            owner: '王五',
            change_count: 31,
            risk_count: 11,
            baseline_count: 22,
            completion: 100
        },
        {
            id: 'P2026004',
            name: 'AirEngine 6760-X1无线AP DRBFM分析',
            bg: 'SBG',
            pdtl: 'WLAN产品线',
            tr_stage: 'TR2',
            is_level1: true,
            created_at: '2026-03-10',
            status: 'draft',
            owner: '赵六',
            change_count: 9,
            risk_count: 2,
            baseline_count: 4,
            completion: 18
        },
        {
            id: 'P2026005',
            name: 'FusionServer Pro 2288H V7服务器DRBFM分析',
            bg: 'EBG',
            pdtl: '服务器产品线',
            tr_stage: 'TR4',
            is_level1: false,
            created_at: '2025-12-05',
            status: 'submitted',
            owner: '孙七',
            change_count: 27,
            risk_count: 7,
            baseline_count: 19,
            completion: 88
        },
        {
            id: 'P2026006',
            name: 'CloudEngine CE6881交换机DRBFM分析',
            bg: 'CBG',
            pdtl: '园区交换机产品线',
            tr_stage: 'TR3',
            is_level1: true,
            created_at: '2026-04-01',
            status: 'in-progress',
            owner: '周八',
            change_count: 14,
            risk_count: 4,
            baseline_count: 8,
            completion: 35
        }
    ];

    var changeList = [
        {
            id: 'CL001',
            level: 'SYSTEM',
            structure_name: 'CloudEngine S12700E整机系统',
            dev_type: 'NEW',
            imn_option: '必选',
            change_point: '新增400GE接口板卡支持',
            parent_id: null,
            children: [
                {
                    id: 'CL001-01',
                    level: 'SUBSYSTEM',
                    structure_name: '主控板子系统',
                    dev_type: 'MODIFY',
                    imn_option: '必选',
                    change_point: '主控板CPU升级至ARM A72架构',
                    parent_id: 'CL001',
                    children: [
                        {
                            id: 'CL001-01-01',
                            level: 'COMPONENT',
                            structure_name: '主控板PCB',
                            dev_type: 'MODIFY',
                            imn_option: '必选',
                            change_point: 'PCB层数从12层增加到16层',
                            parent_id: 'CL001-01',
                            children: []
                        },
                        {
                            id: 'CL001-01-02',
                            level: 'COMPONENT',
                            structure_name: '主控板散热模组',
                            dev_type: 'MODIFY',
                            imn_option: '必选',
                            change_point: '散热片尺寸增大20%',
                            parent_id: 'CL001-01',
                            children: []
                        }
                    ]
                },
                {
                    id: 'CL001-02',
                    level: 'SUBSYSTEM',
                    structure_name: '交换网板子系统',
                    dev_type: 'MODIFY',
                    imn_option: '必选',
                    change_point: '交换芯片带宽升级至25.6Tbps',
                    parent_id: 'CL001',
                    children: [
                        {
                            id: 'CL001-02-01',
                            level: 'COMPONENT',
                            structure_name: '交换芯片',
                            dev_type: 'NEW',
                            imn_option: '必选',
                            change_point: '采用新一代SDN交换芯片',
                            parent_id: 'CL001-02',
                            children: []
                        }
                    ]
                },
                {
                    id: 'CL001-03',
                    level: 'SUBSYSTEM',
                    structure_name: '接口板子系统',
                    dev_type: 'NEW',
                    imn_option: '可选',
                    change_point: '新增400GE QSFP-DD接口板',
                    parent_id: 'CL001',
                    children: []
                }
            ]
        },
        {
            id: 'CL002',
            level: 'SYSTEM',
            structure_name: '电源子系统',
            dev_type: 'MODIFY',
            imn_option: '必选',
            change_point: '电源模块从1500W升级至3000W',
            parent_id: null,
            children: [
                {
                    id: 'CL002-01',
                    level: 'SUBSYSTEM',
                    structure_name: 'AC电源模块',
                    dev_type: 'MODIFY',
                    imn_option: '必选',
                    change_point: '功率密度提升，散热结构重新设计',
                    parent_id: 'CL002',
                    children: []
                }
            ]
        }
    ];

    var qualityPlan = {
        id: 'QP2026001',
        project_id: 'P2026001',
        plan_name: 'CloudEngine S12700E质量保证计划',
        tr_stage: 'TR4',
        created_at: '2026-01-20',
        status: 'approved',
        objectives: [
            '确保400GE接口板卡信号完整性满足IEEE 802.3bs标准',
            '主控板ARM A72架构切换后系统稳定性不低于99.999%',
            '散热系统满足55°C环境温度运行要求',
            '电源模块3000W输出纹波≤1%'
        ],
        standards: [
            'IEEE 802.3bs 400GbE标准',
            'YD/T 2821-2015 通信设备环境试验方法',
            'GB/T 5080.7 设备可靠性试验'
        ],
        team: [
            { name: '张三', role: 'TSE/项目经理' },
            { name: '李四', role: '硬件设计工程师' },
            { name: '王五', role: '可靠性工程师' },
            { name: '赵六', role: '测试工程师' },
            { name: '孙七', role: '工艺工程师' }
        ]
    };

    var evaluationTasks = [
        {
            id: 'EVAL001',
            project_id: 'P2026001',
            type: 'system',
            evaluator: '张三',
            evaluated_at: '2026-01-18',
            dimensions: {
                function_change: { score: 8, desc: '新增400GE接口功能，功能变更幅度大' },
                structure_change: { score: 7, desc: '主控板和交换网板结构均有重大调整' },
                material_change: { score: 5, desc: 'PCB材料升级，散热材料变更' },
                process_change: { score: 6, desc: 'SMT工艺参数需调整，新增BGA焊接' },
                interface_change: { score: 9, desc: '400GE接口为全新接口标准，接口变更极大' }
            },
            total_score: 35,
            threshold: 25,
            triggered: true,
            status: 'confirmed'
        },
        {
            id: 'EVAL002',
            project_id: 'P2026002',
            type: 'part',
            evaluator: '李四',
            evaluated_at: '2026-02-12',
            dimensions: {
                function_change: { score: 5, desc: '路由协议功能扩展，核心功能不变' },
                structure_change: { score: 4, desc: '机箱结构微调，布局优化' },
                material_change: { score: 3, desc: '少量元器件替换' },
                process_change: { score: 4, desc: '装配工艺略有调整' },
                interface_change: { score: 6, desc: '新增10GE光接口' }
            },
            total_score: 22,
            threshold: 25,
            triggered: false,
            status: 'confirmed'
        },
        {
            id: 'EVAL003',
            project_id: 'P2026004',
            type: 'system',
            evaluator: '赵六',
            evaluated_at: '2026-03-15',
            dimensions: {
                function_change: { score: 9, desc: 'WiFi7新协议支持，功能变更极大' },
                structure_change: { score: 8, desc: '天线阵列重新设计，结构大幅变更' },
                material_change: { score: 6, desc: '射频前端材料更换为GaN' },
                process_change: { score: 7, desc: '新封装工艺，散热工艺变更' },
                interface_change: { score: 8, desc: '新增2.5GE以太网接口' }
            },
            total_score: 38,
            threshold: 25,
            triggered: true,
            status: 'submitted'
        }
    ];

    var historyIssues = [
        {
            id: 'HI001',
            project: 'CloudEngine S12800',
            product: '数据中心交换机',
            failure_mode: '主控板高温下复位',
            cause: '散热设计余量不足，环境温度50°C时CPU温度超过阈值',
            effect: '设备重启，业务中断',
            severity: 'H',
            occurred_at: '2024-06-15',
            status: 'closed'
        },
        {
            id: 'HI002',
            project: 'NetEngine AR6100',
            product: '企业路由器',
            failure_mode: '光模块识别异常',
            cause: 'I2C总线信号完整性不足，高速信号串扰',
            effect: '光模块无法被系统识别，链路中断',
            severity: 'H',
            occurred_at: '2024-09-22',
            status: 'closed'
        },
        {
            id: 'HI003',
            project: 'OptiXstar P600',
            product: '光接入设备',
            failure_mode: '电源模块输出纹波超标',
            cause: '输出滤波电容ESR偏高，高温下电容值衰减',
            effect: '下行光信号误码率升高',
            severity: 'M',
            occurred_at: '2025-01-10',
            status: 'closed'
        },
        {
            id: 'HI004',
            project: 'AirEngine 5760',
            product: '无线AP',
            failure_mode: 'WiFi6E 6GHz频段吞吐量下降',
            cause: '射频前端滤波器带宽不足，带外抑制不够',
            effect: '6GHz频段实际吞吐量仅为标称的60%',
            severity: 'M',
            occurred_at: '2025-03-18',
            status: 'closed'
        }
    ];

    var analysisTasks = [
        {
            id: 'AT001',
            project_id: 'P2026001',
            name: 'CloudEngine S12700E结构分析',
            steps: [
                { name: '结构分析', status: 'completed' },
                { name: '功能分析', status: 'completed' },
                { name: '失效分析', status: 'completed' },
                { name: 'SOD评分', status: 'in-progress' },
                { name: '措施制定', status: 'pending' },
                { name: '基线输出', status: 'pending' }
            ],
            current_step: 3,
            total_steps: 6,
            status: 'in-progress',
            assignee: '张三',
            started_at: '2026-01-22'
        },
        {
            id: 'AT002',
            project_id: 'P2026002',
            name: 'NetEngine AR8000结构分析',
            steps: [
                { name: '结构分析', status: 'completed' },
                { name: '功能分析', status: 'in-progress' },
                { name: '失效分析', status: 'pending' },
                { name: 'SOD评分', status: 'pending' },
                { name: '措施制定', status: 'pending' },
                { name: '基线输出', status: 'pending' }
            ],
            current_step: 1,
            total_steps: 6,
            status: 'in-progress',
            assignee: '李四',
            started_at: '2026-02-15'
        },
        {
            id: 'AT003',
            project_id: 'P2026004',
            name: 'AirEngine 6760-X1结构分析',
            steps: [
                { name: '结构分析', status: 'pending' },
                { name: '功能分析', status: 'pending' },
                { name: '失效分析', status: 'pending' },
                { name: 'SOD评分', status: 'pending' },
                { name: '措施制定', status: 'pending' },
                { name: '基线输出', status: 'pending' }
            ],
            current_step: 0,
            total_steps: 6,
            status: 'draft',
            assignee: '赵六',
            started_at: null
        }
    ];

    var structureNodes = [
        { id: 'SN01', name: 'CloudEngine S12700E整机', type: 'SYSTEM', parent_id: null },
        { id: 'SN02', name: '主控板', type: 'SUBSYSTEM', parent_id: 'SN01' },
        { id: 'SN03', name: '交换网板', type: 'SUBSYSTEM', parent_id: 'SN01' },
        { id: 'SN04', name: '接口板', type: 'SUBSYSTEM', parent_id: 'SN01' },
        { id: 'SN05', name: '电源模块', type: 'SUBSYSTEM', parent_id: 'SN01' },
        { id: 'SN06', name: '风扇模块', type: 'SUBSYSTEM', parent_id: 'SN01' },
        { id: 'SN07', name: '机箱', type: 'SUBSYSTEM', parent_id: 'SN01' },
        { id: 'SN08', name: '主控板CPU', type: 'COMPONENT', parent_id: 'SN02' },
        { id: 'SN09', name: '主控板FPGA', type: 'COMPONENT', parent_id: 'SN02' },
        { id: 'SN10', name: '主控板PCB', type: 'COMPONENT', parent_id: 'SN02' },
        { id: 'SN11', name: '主控板散热模组', type: 'COMPONENT', parent_id: 'SN02' },
        { id: 'SN12', name: '交换芯片', type: 'COMPONENT', parent_id: 'SN03' },
        { id: 'SN13', name: '网板连接器', type: 'COMPONENT', parent_id: 'SN03' },
        { id: 'SN14', name: '400GE光模块', type: 'COMPONENT', parent_id: 'SN04' },
        { id: 'SN15', name: '接口板PHY', type: 'COMPONENT', parent_id: 'SN04' },
        { id: 'SN16', name: 'AC电源', type: 'COMPONENT', parent_id: 'SN05' },
        { id: 'SN17', name: 'DC电源', type: 'COMPONENT', parent_id: 'SN05' },
        { id: 'SN18', name: '风扇控制器', type: 'COMPONENT', parent_id: 'SN06' },
        { id: 'SN19', name: '散热风扇', type: 'COMPONENT', parent_id: 'SN06' },
        { id: 'SN20', name: '背板', type: 'COMPONENT', parent_id: 'SN07' }
    ];

    var structureEdges = [
        { source: 'SN01', target: 'SN02', relation: '包含' },
        { source: 'SN01', target: 'SN03', relation: '包含' },
        { source: 'SN01', target: 'SN04', relation: '包含' },
        { source: 'SN01', target: 'SN05', relation: '包含' },
        { source: 'SN01', target: 'SN06', relation: '包含' },
        { source: 'SN01', target: 'SN07', relation: '包含' },
        { source: 'SN02', target: 'SN03', relation: '数据交互' },
        { source: 'SN02', target: 'SN04', relation: '控制管理' },
        { source: 'SN03', target: 'SN04', relation: '数据转发' },
        { source: 'SN05', target: 'SN02', relation: '供电' },
        { source: 'SN05', target: 'SN03', relation: '供电' },
        { source: 'SN05', target: 'SN04', relation: '供电' },
        { source: 'SN06', target: 'SN02', relation: '散热' },
        { source: 'SN06', target: 'SN03', relation: '散热' },
        { source: 'SN06', target: 'SN04', relation: '散热' },
        { source: 'SN07', target: 'SN02', relation: '物理承载' },
        { source: 'SN07', target: 'SN03', relation: '物理承载' },
        { source: 'SN07', target: 'SN04', relation: '物理承载' }
    ];

    var functionMatrix = {
        structures: ['整机系统', '主控板', '交换网板', '接口板', '电源模块', '风扇模块', '机箱'],
        functions: [
            { name: '数据转发', desc: '实现报文的高速转发处理', markers: ['', 'Y', 'H', 'H', '', '', ''] },
            { name: '路由计算', desc: '运行路由协议计算最优路径', markers: ['', 'H', 'M', '', '', '', ''] },
            { name: '设备管理', desc: '提供CLI/SNMP/NETCONF管理接口', markers: ['', 'H', '', 'M', '', '', ''] },
            { name: '供电保障', desc: '提供稳定可靠的电源供应', markers: ['', 'M', 'M', 'M', 'H', '', ''] },
            { name: '散热管理', desc: '维持设备在安全温度范围内运行', markers: ['', 'M', 'M', 'M', '', 'H', ''] },
            { name: '物理承载', desc: '提供各模块物理安装和互联', markers: ['', '', '', '', '', '', 'H'] },
            { name: '信号处理', desc: '完成物理层信号编解码', markers: ['', '', 'M', 'H', '', '', ''] },
            { name: '时钟同步', desc: '提供IEEE 1588精确时钟同步', markers: ['', 'H', 'M', 'M', '', '', ''] },
            { name: '安全防护', desc: '提供ACL/防火墙/DDoS防护', markers: ['', 'H', 'H', 'M', '', '', ''] },
            { name: 'QoS保障', desc: '提供流量分类和队列调度', markers: ['', 'M', 'H', 'H', '', '', ''] }
        ]
    };

    var failureModes = [
        { code: 'ABNORMAL', name: '异常功能', desc: '系统或部件执行了规定以外的功能', example: '交换芯片误转发报文到错误端口' },
        { code: 'REVERSE', name: '反向功能', desc: '系统或部件执行了与规定相反的功能', example: '路由协议计算出错误路径，流量走向相反' },
        { code: 'ACCOMPANY', name: '伴随功能', desc: '在执行规定功能时伴随产生了非预期功能', example: '高速信号传输时产生电磁干扰影响邻近通道' },
        { code: 'EXCESS', name: '过剩功能', desc: '系统或部件执行了超过规定限度的功能', example: '风扇转速过高导致噪音超标和功耗增加' },
        { code: 'REDUCE', name: '功能降级', desc: '系统或部件的功能低于规定水平', example: '400GE端口实际吞吐量低于标称值' },
        { code: 'PARTIAL', name: '部分功能丧失', desc: '系统或部件仅能完成部分规定功能', example: '多槽位交换机仅部分槽位可正常工作' },
        { code: 'BLANK', name: '功能丧失', desc: '系统或部件完全无法执行规定功能', example: '主控板故障导致整机无法启动' }
    ];

    var failureCauses = [
        { code: 'DESIGN', name: '设计原因', desc: '因设计方案缺陷导致失效', examples: ['电路拓扑设计不合理', '时序裕量不足', '散热路径设计缺陷'] },
        { code: 'MANUFACTURE', name: '制造原因', desc: '因制造工艺偏差导致失效', examples: ['焊接虚焊', 'PCB阻抗偏差', '贴片偏移'] },
        { code: 'STRESS', name: '应力原因', desc: '因环境应力超出设计极限导致失效', examples: ['高温老化', '振动冲击', '湿热腐蚀'] },
        { code: 'WEAR', name: '磨损原因', desc: '因长期使用磨损导致失效', examples: ['连接器插拔磨损', '风扇轴承磨损', '继电器触点磨损'] },
        { code: 'INTERACTION', name: '交互原因', desc: '因系统间交互异常导致失效', examples: ['总线信号串扰', '电源纹波耦合', '热叠加效应'] },
        { code: 'COMPOSITE', name: '复合原因', desc: '因多种因素组合导致失效', examples: ['设计余量不足叠加制造偏差', '高温环境下材料加速老化'] }
    ];

    var failureEffects = [
        { code: 'SYSTEM', name: '系统级影响', desc: '对设备自身功能的影响', level: 1 },
        { code: 'MACHINE', name: '设备级影响', desc: '对整机或网络的影响', level: 2 },
        { code: 'CUSTOMER', name: '客户级影响', desc: '对最终用户业务的影响', level: 3 }
    ];

    var failureRecords = [
        {
            id: 'FR001',
            project_id: 'P2026001',
            structure: '交换网板',
            function: '数据转发',
            failure_mode: 'REDUCE',
            failure_mode_name: '功能降级',
            cause_type: 'DESIGN',
            cause_desc: '交换芯片SerDes预加重参数设置不当，高速信号眼图闭合',
            effect_system: '交换网板转发性能下降，丢包率升高',
            effect_machine: '整机转发吞吐量降至标称的70%',
            effect_customer: '数据中心业务响应延迟增大，SLA不达标',
            severity: 8,
            occurrence: 5,
            detection: 4,
            sop_before: 160,
            ap_before: 'A',
            preventive_measures: ['优化SerDes预加重参数设计', '增加信号完整性仿真验证'],
            detection_measures: ['增加眼图测试项', '增加高温下信号质量测试'],
            sop_after: 56,
            ap_after: 'B',
            status: 'completed'
        },
        {
            id: 'FR002',
            project_id: 'P2026001',
            structure: '主控板',
            function: '设备管理',
            failure_mode: 'BLANK',
            failure_mode_name: '功能丧失',
            cause_type: 'STRESS',
            cause_desc: '高温环境下CPU热保护触发系统复位',
            effect_system: '主控板复位，管理功能中断',
            effect_machine: '整机管理平面中断，业务转发不受影响',
            effect_customer: '无法远程管理设备，但业务不中断',
            severity: 7,
            occurrence: 3,
            detection: 6,
            sop_before: 126,
            ap_before: 'A',
            preventive_measures: ['优化散热设计，增加散热片面积', '提高CPU热保护阈值至95°C'],
            detection_measures: ['增加高温环境长期运行测试', '增加CPU温度监控告警'],
            sop_after: 42,
            ap_after: 'B',
            status: 'completed'
        },
        {
            id: 'FR003',
            project_id: 'P2026001',
            structure: '接口板',
            function: '信号处理',
            failure_mode: 'ACCOMPANY',
            failure_mode_name: '伴随功能',
            cause_type: 'INTERACTION',
            cause_desc: '400GE信号与相邻10GE信号串扰，导致10GE端口误码',
            effect_system: '10GE端口误码率升高',
            effect_machine: '混合业务场景下部分端口通信质量下降',
            effect_customer: '企业客户部分业务链路不稳定',
            severity: 6,
            occurrence: 4,
            detection: 5,
            sop_before: 120,
            ap_before: 'A',
            preventive_measures: ['优化接口板布线，增加屏蔽隔离', '调整端口间距设计'],
            detection_measures: ['增加串扰测试项', '增加混合业务压力测试'],
            sop_after: 48,
            ap_after: 'B',
            status: 'in-progress'
        },
        {
            id: 'FR004',
            project_id: 'P2026001',
            structure: '电源模块',
            function: '供电保障',
            failure_mode: 'EXCESS',
            failure_mode_name: '过剩功能',
            cause_type: 'DESIGN',
            cause_desc: '电源模块输出电压上冲超限，过压保护频繁触发',
            effect_system: '电源模块过压保护触发，输出中断',
            effect_machine: '整机供电中断，设备重启',
            effect_customer: '业务中断，数据丢失风险',
            severity: 9,
            occurrence: 2,
            detection: 3,
            sop_before: 54,
            ap_before: 'B',
            preventive_measures: ['优化电源反馈环路补偿参数', '增加输出过压保护延时'],
            detection_measures: ['增加负载跳变测试', '增加输出纹波和过冲测试'],
            sop_after: 18,
            ap_after: 'C',
            status: 'completed'
        },
        {
            id: 'FR005',
            project_id: 'P2026001',
            structure: '风扇模块',
            function: '散热管理',
            failure_mode: 'PARTIAL',
            failure_mode_name: '部分功能丧失',
            cause_type: 'WEAR',
            cause_desc: '风扇轴承磨损导致转速下降，散热能力降低',
            effect_system: '风扇转速低于阈值告警',
            effect_machine: '机箱内温度升高，可能触发器件热保护',
            effect_customer: '设备长期运行可靠性降低',
            severity: 5,
            occurrence: 4,
            detection: 7,
            sop_before: 140,
            ap_before: 'A',
            preventive_measures: ['选用高可靠性轴承风扇', '增加风扇冗余设计'],
            detection_measures: ['增加风扇老化测试', '增加风扇转速监控和预警'],
            sop_after: 56,
            ap_after: 'B',
            status: 'pending'
        }
    ];

    var preventiveMeasures = [
        { id: 'PM001', failure_id: 'FR001', type: 'preventive', desc: '优化SerDes预加重参数设计', owner: '李四', due_date: '2026-03-15', status: 'completed' },
        { id: 'PM002', failure_id: 'FR001', type: 'preventive', desc: '增加信号完整性仿真验证', owner: '李四', due_date: '2026-03-20', status: 'completed' },
        { id: 'PM003', failure_id: 'FR002', type: 'preventive', desc: '优化散热设计，增加散热片面积', owner: '王五', due_date: '2026-04-01', status: 'in-progress' },
        { id: 'PM004', failure_id: 'FR002', type: 'preventive', desc: '提高CPU热保护阈值至95°C', owner: '李四', due_date: '2026-03-25', status: 'completed' },
        { id: 'PM005', failure_id: 'FR003', type: 'preventive', desc: '优化接口板布线，增加屏蔽隔离', owner: '李四', due_date: '2026-04-10', status: 'pending' },
        { id: 'PM006', failure_id: 'FR004', type: 'preventive', desc: '优化电源反馈环路补偿参数', owner: '孙七', due_date: '2026-03-30', status: 'completed' }
    ];

    var detectionMeasures = [
        { id: 'DM001', failure_id: 'FR001', type: 'detection', desc: '增加眼图测试项', owner: '赵六', due_date: '2026-04-05', status: 'completed' },
        { id: 'DM002', failure_id: 'FR001', type: 'detection', desc: '增加高温下信号质量测试', owner: '赵六', due_date: '2026-04-10', status: 'in-progress' },
        { id: 'DM003', failure_id: 'FR002', type: 'detection', desc: '增加高温环境长期运行测试', owner: '赵六', due_date: '2026-04-15', status: 'pending' },
        { id: 'DM004', failure_id: 'FR002', type: 'detection', desc: '增加CPU温度监控告警', owner: '李四', due_date: '2026-04-01', status: 'completed' }
    ];

    var optimizationMeasures = [
        { id: 'OM001', failure_id: 'FR003', type: 'optimization', desc: '调整端口间距设计，增加隔离度', owner: '李四', due_date: '2026-04-20', status: 'pending' },
        { id: 'OM002', failure_id: 'FR005', type: 'optimization', desc: '选用高可靠性轴承风扇', owner: '孙七', due_date: '2026-04-15', status: 'pending' }
    ];

    var sodRatings = [
        { id: 'SOD001', failure_id: 'FR001', s: 8, o: 5, d: 4, sop: 160, ap: 'A', s_after: 6, o_after: 2, d_after: 3, sop_after: 36, ap_after: 'B' },
        { id: 'SOD002', failure_id: 'FR002', s: 7, o: 3, d: 6, sop: 126, ap: 'A', s_after: 5, o_after: 2, d_after: 3, sop_after: 30, ap_after: 'B' },
        { id: 'SOD003', failure_id: 'FR003', s: 6, o: 4, d: 5, sop: 120, ap: 'A', s_after: null, o_after: null, d_after: null, sop_after: null, ap_after: null },
        { id: 'SOD004', failure_id: 'FR004', s: 9, o: 2, d: 3, sop: 54, ap: 'B', s_after: 7, o_after: 1, d_after: 2, sop_after: 14, ap_after: 'C' },
        { id: 'SOD005', failure_id: 'FR005', s: 5, o: 4, d: 7, sop: 140, ap: 'A', s_after: null, o_after: null, d_after: null, sop_after: null, ap_after: null }
    ];

    var baselineItems = [
        {
            id: 'BL001',
            project_id: 'P2026001',
            name: '交换网板信号完整性设计基线',
            category: 'DESIGN',
            content: 'SerDes预加重参数：400GE 8dB/10GE 4dB；PCB材料：Megtron6；阻抗控制：100Ω±10%',
            risk_level: 'H',
            landing_status: 'partial',
            landing_progress: 60,
            created_at: '2026-02-28',
            owner: '李四'
        },
        {
            id: 'BL002',
            project_id: 'P2026001',
            name: '主控板散热设计基线',
            category: 'DESIGN',
            content: '散热片面积≥3500mm²；导热硅脂热阻≤0.2°C/W；风道设计：前后通风',
            risk_level: 'M',
            landing_status: 'done',
            landing_progress: 100,
            created_at: '2026-03-05',
            owner: '王五'
        },
        {
            id: 'BL003',
            project_id: 'P2026001',
            name: '电源模块过压保护基线',
            category: 'DESIGN',
            content: '过压保护阈值：3.6V；保护延时：100μs；输出纹波≤50mVpp',
            risk_level: 'H',
            landing_status: 'done',
            landing_progress: 100,
            created_at: '2026-03-10',
            owner: '孙七'
        },
        {
            id: 'BL004',
            project_id: 'P2026001',
            name: '接口板串扰控制基线',
            category: 'DESIGN',
            content: '端口间距≥3mm；屏蔽罩接地电阻≤10mΩ；串扰指标：近端串扰≤-40dB',
            risk_level: 'H',
            landing_status: 'pending',
            landing_progress: 0,
            created_at: '2026-03-15',
            owner: '李四'
        },
        {
            id: 'BL005',
            project_id: 'P2026001',
            name: '风扇模块可靠性基线',
            category: 'RELIABILITY',
            content: '风扇MTBF≥100000h；轴承类型：双滚珠；转速范围：6000-12000RPM',
            risk_level: 'M',
            landing_status: 'pending',
            landing_progress: 0,
            created_at: '2026-03-18',
            owner: '孙七'
        }
    ];

    var reviewData = [
        {
            id: 'REV001',
            project_id: 'P2026001',
            type: '结构分析评审',
            status: 'completed',
            reviewers: [
                { name: '陈工', role: '评审组长', opinion: 'agree', comment: '结构分解合理，层级清晰，建议补充电源模块与主控板的交互关系', time: '2026-02-10 14:30' },
                { name: '刘工', role: '评审专家', opinion: 'conditional', comment: '接口板子系统需进一步细化到光模块和PHY芯片层级', time: '2026-02-10 15:20' },
                { name: '黄工', role: '评审专家', opinion: 'agree', comment: '同意通过，建议在功能分析阶段关注400GE信号完整性', time: '2026-02-10 16:05' }
            ],
            result: '通过（有条件）',
            created_at: '2026-02-10'
        },
        {
            id: 'REV002',
            project_id: 'P2026001',
            type: '失效分析评审',
            status: 'in-progress',
            reviewers: [
                { name: '陈工', role: '评审组长', opinion: 'agree', comment: '失效模式识别全面，建议增加电源模块的复合原因分析', time: '2026-03-20 10:15' },
                { name: '刘工', role: '评审专家', opinion: 'pending', comment: '', time: '' }
            ],
            result: '',
            created_at: '2026-03-20'
        }
    ];

    var approvalData = [
        {
            id: 'APR001',
            project_id: 'P2026001',
            type: 'DRBFM触发评估审批',
            status: 'approved',
            applicant: '张三',
            approver: '马总',
            opinion: '同意触发DRBFM分析，请按流程执行',
            created_at: '2026-01-19',
            approved_at: '2026-01-20'
        },
        {
            id: 'APR002',
            project_id: 'P2026001',
            type: '结构分析评审审批',
            status: 'approved',
            applicant: '张三',
            approver: '马总',
            opinion: '同意评审结论，请继续推进功能分析',
            created_at: '2026-02-11',
            approved_at: '2026-02-12'
        },
        {
            id: 'APR003',
            project_id: 'P2026001',
            type: '基线输出审批',
            status: 'pending',
            applicant: '张三',
            approver: '马总',
            opinion: '',
            created_at: '2026-03-25',
            approved_at: null
        }
    ];

    var landingTasks = [
        {
            id: 'LT001',
            baseline_id: 'BL001',
            name: 'SerDes预加重参数验证',
            assignee: '李四',
            due_date: '2026-04-30',
            status: 'in-progress',
            progress: 60,
            items: [
                { name: '参数仿真验证', status: 'completed' },
                { name: '原型板测试验证', status: 'in-progress' },
                { name: '量产参数固化', status: 'pending' }
            ]
        },
        {
            id: 'LT002',
            baseline_id: 'BL002',
            name: '散热设计验证',
            assignee: '王五',
            due_date: '2026-04-15',
            status: 'completed',
            progress: 100,
            items: [
                { name: '热仿真验证', status: 'completed' },
                { name: '温升测试', status: 'completed' },
                { name: '设计文档归档', status: 'completed' }
            ]
        },
        {
            id: 'LT003',
            baseline_id: 'BL003',
            name: '电源过压保护验证',
            assignee: '孙七',
            due_date: '2026-04-20',
            status: 'completed',
            progress: 100,
            items: [
                { name: '环路稳定性测试', status: 'completed' },
                { name: '负载跳变测试', status: 'completed' },
                { name: '设计文档归档', status: 'completed' }
            ]
        }
    ];

    var baselineLibrary = [
        { id: 'LIB001', name: '交换机SerDes信号完整性设计规范', category: 'DESIGN', product_type: '交换机', version: 'V3.2', status: 'active', reference_count: 12, created_at: '2024-06-01' },
        { id: 'LIB002', name: '路由器散热设计基线规范', category: 'DESIGN', product_type: '路由器', version: 'V2.8', status: 'active', reference_count: 8, created_at: '2024-03-15' },
        { id: 'LIB003', name: '通信设备电源设计基线', category: 'DESIGN', product_type: '通用', version: 'V4.1', status: 'active', reference_count: 25, created_at: '2023-11-20' },
        { id: 'LIB004', name: 'PCB阻抗控制设计规范', category: 'DESIGN', product_type: '通用', version: 'V2.5', status: 'active', reference_count: 18, created_at: '2024-01-10' },
        { id: 'LIB005', name: '光模块接口设计基线', category: 'DESIGN', product_type: '交换机', version: 'V1.9', status: 'active', reference_count: 6, created_at: '2025-02-28' },
        { id: 'LIB006', name: '无线AP射频设计基线', category: 'DESIGN', product_type: '无线AP', version: 'V2.0', status: 'active', reference_count: 4, created_at: '2025-05-15' }
    ];

    var failureLibrary = [
        { id: 'FL001', name: '高速信号眼图闭合', category: 'SIGNAL', product_type: '交换机', cause: 'SerDes预加重参数不当', frequency: 15, last_occurred: '2025-08-12' },
        { id: 'FL002', name: 'CPU高温复位', category: 'THERMAL', product_type: '通用', cause: '散热设计余量不足', frequency: 8, last_occurred: '2025-06-20' },
        { id: 'FL003', name: '电源输出纹波超标', category: 'POWER', product_type: '通用', cause: '滤波电容ESR偏高', frequency: 12, last_occurred: '2025-09-05' },
        { id: 'FL004', name: '光模块识别异常', category: 'SIGNAL', product_type: '交换机', cause: 'I2C总线信号完整性不足', frequency: 6, last_occurred: '2025-04-18' },
        { id: 'FL005', name: '连接器接触不良', category: 'MECHANICAL', product_type: '通用', cause: '连接器镀层磨损或氧化', frequency: 20, last_occurred: '2025-11-03' },
        { id: 'FL006', name: '风扇转速下降', category: 'MECHANICAL', product_type: '通用', cause: '轴承磨损或灰尘堆积', frequency: 10, last_occurred: '2025-07-25' }
    ];

    var measureLibrary = [
        { id: 'ML001', name: 'SerDes参数优化方案', category: 'PREVENTIVE', applicable: '高速信号设计', effectiveness: 'H', reference_count: 12 },
        { id: 'ML002', name: '散热片面积增大方案', category: 'PREVENTIVE', applicable: '散热设计', effectiveness: 'M', reference_count: 8 },
        { id: 'ML003', name: '电源环路补偿优化方案', category: 'PREVENTIVE', applicable: '电源设计', effectiveness: 'H', reference_count: 15 },
        { id: 'ML004', name: '眼图测试方案', category: 'DETECTION', applicable: '高速信号验证', effectiveness: 'H', reference_count: 20 },
        { id: 'ML005', name: '高温长期运行测试方案', category: 'DETECTION', applicable: '散热验证', effectiveness: 'M', reference_count: 10 },
        { id: 'ML006', name: '负载跳变测试方案', category: 'DETECTION', applicable: '电源验证', effectiveness: 'H', reference_count: 14 }
    ];

    var functionLibrary = [
        { id: 'FNL001', name: '数据转发', category: '核心功能', desc: '实现报文的高速转发处理', applicable_products: ['交换机', '路由器'] },
        { id: 'FNL002', name: '路由计算', category: '核心功能', desc: '运行路由协议计算最优路径', applicable_products: ['路由器'] },
        { id: 'FNL003', name: '设备管理', category: '管理功能', desc: '提供CLI/SNMP/NETCONF管理接口', applicable_products: ['交换机', '路由器', '无线AP'] },
        { id: 'FNL004', name: '供电保障', category: '支撑功能', desc: '提供稳定可靠的电源供应', applicable_products: ['通用'] },
        { id: 'FNL005', name: '散热管理', category: '支撑功能', desc: '维持设备在安全温度范围内运行', applicable_products: ['通用'] },
        { id: 'FNL006', name: '信号处理', category: '核心功能', desc: '完成物理层信号编解码', applicable_products: ['交换机', '路由器', '光接入'] },
        { id: 'FNL007', name: '时钟同步', category: '核心功能', desc: '提供IEEE 1588精确时钟同步', applicable_products: ['交换机', '路由器'] },
        { id: 'FNL008', name: '安全防护', category: '安全功能', desc: '提供ACL/防火墙/DDoS防护', applicable_products: ['交换机', '路由器', '防火墙'] },
        { id: 'FNL009', name: 'QoS保障', category: '核心功能', desc: '提供流量分类和队列调度', applicable_products: ['交换机', '路由器'] },
        { id: 'FNL010', name: '无线接入', category: '核心功能', desc: '提供WiFi无线接入服务', applicable_products: ['无线AP'] }
    ];

    var aiGenerateData = {
        failure_suggestions: [
            { structure: '交换网板', function: '数据转发', mode: 'REDUCE', confidence: 0.92, reason: '基于历史项目CloudEngine S12800同类失效模式' },
            { structure: '主控板', function: '设备管理', mode: 'BLANK', confidence: 0.87, reason: '基于失效库中CPU高温复位高频模式' },
            { structure: '接口板', function: '信号处理', mode: 'ACCOMPANY', confidence: 0.85, reason: '基于400GE新接口标准引入的串扰风险' }
        ],
        measure_suggestions: [
            { type: 'preventive', desc: '增加SerDes预加重参数扫描验证', confidence: 0.95, source: '措施库ML001' },
            { type: 'detection', desc: '增加400GE眼图模板测试', confidence: 0.93, source: '措施库ML004' }
        ],
        sod_suggestions: [
            { failure_id: 'FR001', s: 8, o: 5, d: 4, confidence: 0.90, reason: '基于同类产品历史数据统计' }
        ]
    };

    var statisticsData = {
        overview: {
            total_projects: 6,
            active_projects: 4,
            total_failures: 5,
            high_risk_count: 3,
            baseline_completion: 68,
            landing_completion: 55
        },
        by_bg: [
            { bg: 'CBG', project_count: 3, failure_count: 3, avg_ap: 'B' },
            { bg: 'SBG', project_count: 2, failure_count: 1, avg_ap: 'C' },
            { bg: 'EBG', project_count: 1, failure_count: 1, avg_ap: 'B' }
        ],
        by_tr_stage: [
            { stage: 'TR2', count: 1 },
            { stage: 'TR3', count: 2 },
            { stage: 'TR4', count: 2 },
            { stage: 'TR5', count: 1 }
        ],
        monthly_trend: [
            { month: '2026-01', new_projects: 1, new_failures: 0, completed_baselines: 0 },
            { month: '2026-02', new_projects: 1, new_failures: 2, completed_baselines: 1 },
            { month: '2026-03', new_projects: 1, new_failures: 2, completed_baselines: 2 },
            { month: '2026-04', new_projects: 1, new_failures: 1, completed_baselines: 1 },
            { month: '2026-05', new_projects: 0, new_failures: 0, completed_baselines: 1 }
        ],
        risk_distribution: {
            H: 3,
            M: 5,
            L: 2
        },
        ap_distribution: {
            A: 3,
            B: 5,
            C: 2
        }
    };

    var systemConfig = {
        sod_standards: {
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
            occurrence: [
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
        },
        ap_reference: generateAPTable(),
        review_roles: [
            { id: 'RR001', name: '评审组长', desc: '负责组织评审会议，汇总评审意见', required: true },
            { id: 'RR002', name: '设计评审专家', desc: '负责评审设计方案的合理性', required: true },
            { id: 'RR003', name: '可靠性评审专家', desc: '负责评审可靠性分析和措施的充分性', required: true },
            { id: 'RR004', name: '工艺评审专家', desc: '负责评审可制造性和工艺措施', required: false },
            { id: 'RR005', name: '测试评审专家', desc: '负责评审检测措施的充分性', required: false }
        ],
        approval_roles: [
            { id: 'AR001', name: '项目经理', desc: '审批项目级DRBFM触发决策', level: 1 },
            { id: 'AR002', name: '部门主管', desc: '审批部门级基线输出', level: 2 },
            { id: 'AR003', name: '质量总监', desc: '审批高风险基线和重大变更', level: 3 },
            { id: 'AR004', name: '公司VP', desc: '审批跨部门重大决策', level: 4 }
        ],
        domains: [
            { id: 'DM001', name: 'CBG-数据中心交换机', bg: 'CBG', pdtl: '数据中心交换机产品线' },
            { id: 'DM002', name: 'CBG-园区交换机', bg: 'CBG', pdtl: '园区交换机产品线' },
            { id: 'DM003', name: 'CBG-企业路由器', bg: 'CBG', pdtl: '企业路由器产品线' },
            { id: 'DM004', name: 'SBG-光接入', bg: 'SBG', pdtl: '光接入产品线' },
            { id: 'DM005', name: 'SBG-WLAN', bg: 'SBG', pdtl: 'WLAN产品线' },
            { id: 'DM006', name: 'EBG-服务器', bg: 'EBG', pdtl: '服务器产品线' },
            { id: 'DM007', name: 'EBG-存储', bg: 'EBG', pdtl: '存储产品线' }
        ],
        export_settings: {
            formats: ['Excel', 'PDF', 'Word'],
            template: '华为DRBFM标准模板V2.0',
            include_measures: true,
            include_sod: true,
            include_baselines: true,
            include_review: true
        },
        baseline_admins: [
            { id: 'BA001', name: '张三', domain: 'CBG-数据中心交换机', role: '管理员' },
            { id: 'BA002', name: '李四', domain: 'CBG-企业路由器', role: '管理员' },
            { id: 'BA003', name: '王五', domain: 'SBG-光接入', role: '管理员' },
            { id: 'BA004', name: '赵六', domain: 'SBG-WLAN', role: '审核员' },
            { id: 'BA005', name: '孙七', domain: 'EBG-服务器', role: '管理员' }
        ],
        permissions: [
            { role: 'TSE', modules: ['全部模块'], operations: ['增删改查', '提交评审', '提交审批'] },
            { role: '设计工程师', modules: ['DRBFM分析', '基线输出与落地跟踪'], operations: ['查看', '编辑', '提交'] },
            { role: '评审专家', modules: ['评审与审批'], operations: ['查看', '评审'] },
            { role: '审批人', modules: ['评审与审批'], operations: ['查看', '审批'] },
            { role: '基线库管理员', modules: ['基线库与知识图谱', '入库管理'], operations: ['增删改查', '审核入库'] },
            { role: '系统管理员', modules: ['系统配置'], operations: ['全部操作'] }
        ]
    };

    function generateAPTable() {
        var table = [];
        for (var s = 1; s <= 10; s++) {
            for (var o = 1; o <= 10; o++) {
                for (var d = 1; d <= 10; d++) {
                    var sop = s * o * d;
                    var ap;
                    if (sop <= 27) {
                        ap = 'C';
                    } else if (sop <= 80) {
                        ap = 'B';
                    } else {
                        ap = 'A';
                    }
                    table.push({ s: s, o: o, d: d, sop: sop, ap: ap });
                }
            }
        }
        return table;
    }

    var dataMap = {
        projects: projects,
        changeList: changeList,
        qualityPlan: qualityPlan,
        evaluationTasks: evaluationTasks,
        historyIssues: historyIssues,
        analysisTasks: analysisTasks,
        structureNodes: structureNodes,
        structureEdges: structureEdges,
        functionMatrix: functionMatrix,
        failureModes: failureModes,
        failureCauses: failureCauses,
        failureEffects: failureEffects,
        failureRecords: failureRecords,
        preventiveMeasures: preventiveMeasures,
        detectionMeasures: detectionMeasures,
        optimizationMeasures: optimizationMeasures,
        sodRatings: sodRatings,
        baselineItems: baselineItems,
        reviewData: reviewData,
        approvalData: approvalData,
        landingTasks: landingTasks,
        baselineLibrary: baselineLibrary,
        failureLibrary: failureLibrary,
        measureLibrary: measureLibrary,
        functionLibrary: functionLibrary,
        aiGenerateData: aiGenerateData,
        statisticsData: statisticsData,
        systemConfig: systemConfig
    };

    return {
        get: function (key) {
            return dataMap[key] || null;
        },
        getAll: function () {
            return dataMap;
        },
        findById: function (array, id) {
            if (!array) return null;
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === id) return array[i];
                if (array[i].children) {
                    var found = this.findById(array[i].children, id);
                    if (found) return found;
                }
            }
            return null;
        }
    };
})();
