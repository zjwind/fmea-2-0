const { v4: uuidv4 } = require('uuid');

function generateEvaluationTable(changeItems) {
  const dimensions = [
    { id: 'novelty', name: '技术新颖性', weight: 0.15 },
    { id: 'impact', name: '影响范围', weight: 0.30 },
    { id: 'severity', name: '失效严重度', weight: 0.30 },
    { id: 'complexity', name: '变更复杂度', weight: 0.20 },
    { id: 'history', name: '历史问题', weight: 0.05 },
  ];

  const rows = changeItems.map((item, index) => {
    const scores = {};
    dimensions.forEach(dim => {
      const rand = Math.random();
      let level, score;
      if (rand < 0.2) {
        level = 'high';
        score = 10;
      } else if (rand < 0.6) {
        level = 'mid';
        score = 5;
      } else {
        level = 'low';
        score = 1;
      }
      scores[dim.id] = { level, score };
    });

    const weightedScore = dimensions.reduce((sum, dim) => {
      return sum + scores[dim.id].score * dim.weight;
    }, 0);

    const finalScore = Math.round((weightedScore / 10) * 11) + 1;
    
    let riskLevel;
    if (finalScore >= 8) riskLevel = 'H';
    else if (finalScore >= 5) riskLevel = 'M';
    else riskLevel = 'L';

    return {
      id: uuidv4(),
      index: index + 1,
      changeItem: item.name,
      changeDesc: item.description || '',
      partName: item.partName || '',
      level: item.level || 0,
      dimensions: scores,
      finalScore,
      riskLevel,
      conclusion: generateConclusion(riskLevel, item.name),
      assignee: item.assignee || '',
      status: 'draft',
      comments: '',
    };
  });

  return {
    columns: [
      { id: 'index', name: '序号', width: 60, editable: false, pinned: true },
      { id: 'changeItem', name: '变更项', width: 200, editable: true, pinned: true },
      { id: 'changeDesc', name: '变更描述', width: 250, editable: true },
      { id: 'partName', name: '部件名称', width: 150, editable: true },
      ...dimensions.flatMap(dim => [
        { id: `${dim.id}_level`, name: `${dim.name}-等级`, width: 100, editable: true, dimension: dim.id, type: 'level' },
        { id: `${dim.id}_score`, name: `${dim.name}-得分`, width: 80, editable: false, dimension: dim.id, type: 'score' },
      ]),
      { id: 'finalScore', name: '综合评分(1-12)', width: 120, editable: false, type: 'score' },
      { id: 'riskLevel', name: '风险等级', width: 100, editable: false, type: 'risk' },
      { id: 'conclusion', name: '评估结论', width: 200, editable: true },
      { id: 'assignee', name: '负责人', width: 120, editable: true },
      { id: 'status', name: '状态', width: 100, editable: true, type: 'status' },
      { id: 'comments', name: '备注', width: 200, editable: true },
    ],
    rows,
    dimensions,
  };
}

function generateConclusion(riskLevel, changeItem) {
  const conclusions = {
    H: [
      `高风险：${changeItem}变更影响重大，需立即制定详细应对措施`,
      `高风险：建议成立专项小组跟进${changeItem}的风险缓解`,
      `高风险：${changeItem}需要额外的验证和测试`,
    ],
    M: [
      `中风险：${changeItem}需要关注，建议定期跟踪`,
      `中风险：建议制定${changeItem}的应急预案`,
      `中风险：${changeItem}需在评审中重点讨论`,
    ],
    L: [
      `低风险：${changeItem}风险可控，按常规流程处理`,
      `低风险：${changeItem}无需特殊处理`,
      `低风险：建议${changeItem}定期回顾`,
    ],
  };
  const list = conclusions[riskLevel];
  return list[Math.floor(Math.random() * list.length)];
}

function generateChangeItems(count = 10) {
  const templates = [
    { name: '主控芯片型号变更', description: '由A型号更换为B型号，性能提升30%', partName: '主控板', level: 0 },
    { name: '电源管理模块优化', description: '优化电源转换效率，降低功耗', partName: '电源板', level: 0 },
    { name: 'DDR内存容量扩展', description: '从8GB扩展到16GB', partName: '主控板', level: 1 },
    { name: '散热结构重新设计', description: '因功耗增加，需重新设计散热方案', partName: '结构件', level: 0 },
    { name: '以太网接口升级', description: '从千兆升级到万兆', partName: '接口板', level: 1 },
    { name: 'USB接口数量增加', description: '增加2个USB 3.0接口', partName: '接口板', level: 1 },
    { name: '固件存储扩容', description: 'Flash从128MB扩容到256MB', partName: '主控板', level: 2 },
    { name: '时钟电路优化', description: '更换更稳定的晶振', partName: '主控板', level: 2 },
    { name: 'PCB布局调整', description: '因芯片变更导致PCB重新布局', partName: 'PCB', level: 1 },
    { name: 'EMC防护增强', description: '增加EMC防护器件', partName: 'PCB', level: 2 },
    { name: '外壳模具修改', description: '因接口变化需修改外壳模具', partName: '结构件', level: 1 },
    { name: '软件驱动更新', description: '适配新硬件的驱动程序', partName: '软件', level: 0 },
  ];

  const items = [];
  for (let i = 0; i < Math.min(count, templates.length); i++) {
    items.push(templates[i]);
  }
  return items;
}

function analyzeFailureModes(changeItem) {
  const failureModes = [
    { mode: '芯片不工作', cause: '焊接不良', effect: '设备无法启动', severity: 9 },
    { mode: '性能不达标', cause: '散热不足', effect: '系统降频运行', severity: 7 },
    { mode: '兼容性问题', cause: '驱动不匹配', effect: '部分功能异常', severity: 6 },
    { mode: '功耗超标', cause: '电源设计不足', effect: '系统不稳定', severity: 8 },
    { mode: 'EMC测试失败', cause: '屏蔽不足', effect: '认证不通过', severity: 5 },
  ];
  return failureModes;
}

module.exports = {
  generateEvaluationTable,
  generateChangeItems,
  analyzeFailureModes,
};
