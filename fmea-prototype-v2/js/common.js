var App = (function () {

    function init() {
        renderNav();
        bindEvents();
        openPage('首页', 'pages/dashboard.html', 'dashboard');
    }

    var menuConfig = [
        { id: 'dashboard', text: '首页', icon: '🏠', url: 'pages/dashboard.html' },
        {
            id: 'evaluation', text: '评估任务', icon: '📋', children: [
                { id: 'evaluation-system', text: '系统级', url: 'pages/evaluation-system.html' },
                { id: 'evaluation-part', text: '部件级', url: 'pages/evaluation-part.html' }
            ]
        },
        { id: 'analysis', text: 'DRBFM分析任务', icon: '🔬', url: 'pages/analysis-task-list.html' },
        {
            id: 'review-opinion', text: '评审意见管理', icon: '💬', children: [
                { id: 'review-my', text: '我提出的意见', url: 'pages/review-my-opinions.html' },
                { id: 'review-pending', text: '待我处理的意见', url: 'pages/review-pending-opinions.html' }
            ]
        },
        {
            id: 'knowledge', text: '知识库', icon: '📚', children: [
                { id: 'knowledge-baseline', text: '基线库', url: 'pages/knowledge-baseline.html' },
                { id: 'knowledge-measures', text: '措施库', url: 'pages/knowledge-measures.html' },
                { id: 'knowledge-history', text: '历史问题库', url: 'pages/knowledge-history.html' }
            ]
        },
        {
            id: 'system', text: '系统菜单', icon: '⚙️', children: [
                { id: 'sod-standard', text: 'SOD评价标准', url: 'pages/sod-standard.html' }
            ]
        }
    ];

    function renderNav() {
        var nav = document.getElementById('aac-nav');
        if (!nav) return;
        var html = '';
        menuConfig.forEach(function (item) {
            if (item.children) {
                html += '<div class="aac-nav-item" data-id="' + item.id + '" onclick="App.toggleNavGroup(\'' + item.id + '\')">';
                html += '<span class="nav-icon">' + item.icon + '</span>';
                html += '<span>' + item.text + '</span>';
                html += '<span class="nav-arrow">▶</span>';
                html += '</div>';
                html += '<div class="aac-nav-group" id="nav-group-' + item.id + '">';
                item.children.forEach(function (child) {
                    html += '<div class="aac-nav-item" data-id="' + child.id + '" onclick="App.openPage(\'' + child.text + '\', \'' + child.url + '\', \'' + child.id + '\')">';
                    html += '<span>' + child.text + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            } else {
                html += '<div class="aac-nav-item" data-id="' + item.id + '" onclick="App.openPage(\'' + item.text + '\', \'' + item.url + '\', \'' + item.id + '\')">';
                html += '<span class="nav-icon">' + item.icon + '</span>';
                html += '<span>' + item.text + '</span>';
                html += '</div>';
            }
        });
        nav.innerHTML = html;
    }

    function bindEvents() {
        var toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                var sidebar = document.querySelector('.aac-sidebar');
                if (sidebar) sidebar.classList.toggle('collapsed');
            });
        }
    }

    var tabs = [];
    var activeTabId = null;

    function openPage(title, url, id) {
        setActiveNav(id);
        var existing = tabs.find(function (t) { return t.id === id; });
        if (existing) {
            selectTab(id);
            return;
        }
        tabs.push({ id: id, title: title, url: url });
        renderTabs();
        selectTab(id);
    }

    function selectTab(id) {
        activeTabId = id;
        renderTabs();
        var content = document.getElementById('aac-content');
        if (content) {
            content.innerHTML = '<iframe src="' + getTabUrl(id) + '" style="width:100%;height:100%;border:none;"></iframe>';
        }
    }

    function closeTab(id, e) {
        if (e) e.stopPropagation();
        var idx = tabs.findIndex(function (t) { return t.id === id; });
        if (idx === -1) return;
        tabs.splice(idx, 1);
        if (activeTabId === id) {
            if (tabs.length > 0) {
                var newIdx = Math.min(idx, tabs.length - 1);
                selectTab(tabs[newIdx].id);
            } else {
                activeTabId = null;
                renderTabs();
                document.getElementById('aac-content').innerHTML = '';
            }
        } else {
            renderTabs();
        }
    }

    function getTabUrl(id) {
        var tab = tabs.find(function (t) { return t.id === id; });
        return tab ? tab.url : '';
    }

    function renderTabs() {
        var container = document.getElementById('aac-tabs');
        if (!container) return;
        var html = '';
        tabs.forEach(function (tab) {
            var cls = tab.id === activeTabId ? 'aac-tab active' : 'aac-tab';
            var closable = tab.id !== 'dashboard' ? '<span class="tab-close" onclick="App.closeTab(\'' + tab.id + '\', event)">✕</span>' : '';
            html += '<div class="' + cls + '" onclick="App.selectTab(\'' + tab.id + '\')">';
            html += '<span>' + tab.title + '</span>';
            html += closable;
            html += '</div>';
        });
        container.innerHTML = html;
    }

    function setActiveNav(id) {
        var items = document.querySelectorAll('.aac-nav-item');
        items.forEach(function (item) {
            item.classList.remove('active');
            if (item.getAttribute('data-id') === id) {
                item.classList.add('active');
            }
        });
    }

    function toggleNavGroup(id) {
        var group = document.getElementById('nav-group-' + id);
        var trigger = document.querySelector('.aac-nav-item[data-id="' + id + '"]');
        if (group) {
            group.classList.toggle('open');
        }
        if (trigger) {
            trigger.classList.toggle('expanded');
        }
    }

    function statusFormatter(value) {
        var map = {
            'draft': '<span class="aac-badge aac-badge-draft">草稿</span>',
            'submitted': '<span class="aac-badge aac-badge-submitted">已提交</span>',
            'approved': '<span class="aac-badge aac-badge-approved">已批准</span>',
            'confirmed': '<span class="aac-badge aac-badge-confirmed">已确认</span>',
            'completed': '<span class="aac-badge aac-badge-completed">已完成</span>',
            'rejected': '<span class="aac-badge aac-badge-rejected">已驳回</span>',
            'pending': '<span class="aac-badge aac-badge-pending">待处理</span>',
            'in-progress': '<span class="aac-badge aac-badge-in-progress">进行中</span>',
            'closed': '<span class="aac-badge aac-badge-closed">已关闭</span>',
            'reviewing': '<span class="aac-badge aac-badge-reviewing">评审中</span>',
            'replied': '<span class="aac-badge aac-badge-submitted">已回复</span>'
        };
        return map[value] || '<span class="aac-badge">' + (value || '-') + '</span>';
    }

    function riskFormatter(value) {
        var map = {
            'H': '<span class="aac-risk aac-risk-H">H</span>',
            'M': '<span class="aac-risk aac-risk-M">M</span>',
            'L': '<span class="aac-risk aac-risk-L">L</span>'
        };
        return map[value] || value || '-';
    }

    function showNotification(title, msg, type) {
        type = type || 'info';
        var el = document.createElement('div');
        el.className = 'aac-notification ' + type;
        el.innerHTML = '<div class="notif-title">' + title + '</div><div class="notif-msg">' + msg + '</div>';
        document.body.appendChild(el);
        setTimeout(function () {
            el.style.animation = 'aac-slideInRight .3s ease reverse';
            setTimeout(function () { el.remove(); }, 300);
        }, 3000);
    }

    function showModal(title, bodyHtml, onConfirm) {
        var overlay = document.createElement('div');
        overlay.className = 'aac-modal-overlay';
        overlay.innerHTML =
            '<div class="aac-modal">' +
            '<div class="aac-modal-header"><span class="modal-title">' + title + '</span><button class="modal-close" onclick="App.closeModal(this)">✕</button></div>' +
            '<div class="aac-modal-body">' + bodyHtml + '</div>' +
            '<div class="aac-modal-footer"><button class="aac-btn aac-btn-secondary" onclick="App.closeModal(this)">取消</button><button class="aac-btn aac-btn-primary" id="modal-confirm-btn">确定</button></div>' +
            '</div>';
        document.body.appendChild(overlay);
        document.getElementById('modal-confirm-btn').onclick = function () {
            if (onConfirm) onConfirm();
            overlay.remove();
        };
    }

    function closeModal(el) {
        var overlay = el.closest('.aac-modal-overlay');
        if (overlay) overlay.remove();
    }

    function buildStepProgress(steps, currentStep) {
        var html = '<div class="aac-step-progress">';
        for (var i = 0; i < steps.length; i++) {
            var cls = '';
            if (i < currentStep) cls = 'done';
            else if (i === currentStep) cls = 'active';
            html += '<div class="aac-step ' + cls + '">';
            html += '<div class="aac-step-circle">' + (i < currentStep ? '✓' : (i + 1)) + '</div>';
            html += '<div class="aac-step-title">' + steps[i] + '</div>';
            if (i < steps.length - 1) html += '<div class="aac-step-line"></div>';
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    return {
        init: init,
        openPage: openPage,
        selectTab: selectTab,
        closeTab: closeTab,
        toggleNavGroup: toggleNavGroup,
        statusFormatter: statusFormatter,
        riskFormatter: riskFormatter,
        showNotification: showNotification,
        showModal: showModal,
        closeModal: closeModal,
        buildStepProgress: buildStepProgress
    };
})();
