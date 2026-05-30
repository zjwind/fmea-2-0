/* 菜单结构 —— 严格依照《系统主页和菜单说明》 */
window.MENU = [
    { id: 'home', text: '首页', page: 'home.html', icon: 'home' },
    {
        id: 'eval', text: '评估任务', icon: 'eval', children: [
            { id: 'eval-system', text: '系统级', page: 'eval-list.html?level=system' },
            { id: 'eval-part', text: '部件级', page: 'eval-list.html?level=part' }
        ]
    },
    { id: 'analysis', text: 'DRBFM分析任务', page: 'analysis-list.html', icon: 'analysis' },
    {
        id: 'opinion', text: '评审意见管理', icon: 'opinion', children: [
            { id: 'opinion-mine', text: '我提出的意见', page: 'opinion-list.html?type=mine' },
            { id: 'opinion-todo', text: '待我处理的意见', page: 'opinion-list.html?type=todo', badge: 3 }
        ]
    },
    {
        id: 'kb', text: '知识库', icon: 'kb', children: [
            { id: 'kb-baseline', text: '基线库', page: 'kb.html?type=baseline' },
            { id: 'kb-measure', text: '措施库', page: 'kb.html?type=measure' },
            { id: 'kb-history', text: '历史问题库', page: 'kb.html?type=history' }
        ]
    },
    {
        id: 'sys', text: '系统菜单', icon: 'sys', children: [
            { id: 'sod-standard', text: 'SOD评价标准', page: 'sod-standard.html' }
        ]
    }
];

window.ICONS = {
    home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    eval: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    analysis: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>',
    opinion: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    kb: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    sys: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    chev: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>'
};
