/* 主框架逻辑：渲染侧边栏、导航、Toast、跨 iframe 通信 */
var App = (function () {
    var frame = function () { return document.getElementById('content-frame'); };

    function renderSidebar() {
        var sb = document.getElementById('sidebar');
        var html = '';
        MENU.forEach(function (m) {
            if (m.children) {
                var badge = m.children.reduce(function (s, c) { return s + (c.badge || 0); }, 0);
                html += '<div class="nav-group">';
                html += '<div class="nav-item" data-group="' + m.id + '" onclick="App.toggleGroup(\'' + m.id + '\')">'
                    + '<span class="nav-ico">' + (ICONS[m.icon] || '') + '</span><span>' + m.text + '</span>'
                    + (badge ? '<span class="nav-badge">' + badge + '</span>' : '')
                    + '<span class="nav-arrow">' + ICONS.chev + '</span></div>';
                html += '<div class="nav-sub" data-sub="' + m.id + '">';
                m.children.forEach(function (c) {
                    html += '<div class="nav-subitem" data-page="' + c.id + '" onclick="App.go(\'' + c.page + '\',\'' + c.id + '\',event)">'
                        + '<span>' + c.text + '</span>'
                        + (c.badge ? '<span class="sub-badge">' + c.badge + '</span>' : '') + '</div>';
                });
                html += '</div></div>';
            } else {
                html += '<div class="nav-group"><div class="nav-item" data-page="' + m.id + '" onclick="App.go(\'' + m.page + '\',\'' + m.id + '\',event)">'
                    + '<span class="nav-ico">' + (ICONS[m.icon] || '') + '</span><span>' + m.text + '</span></div></div>';
            }
        });
        sb.innerHTML = html;
        setActive('home');
    }

    function toggleGroup(id) {
        var item = document.querySelector('.nav-item[data-group="' + id + '"]');
        var sub = document.querySelector('.nav-sub[data-sub="' + id + '"]');
        item.classList.toggle('open');
        sub.classList.toggle('open');
    }

    function setActive(pageId) {
        document.querySelectorAll('.nav-subitem, .nav-item[data-page]').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-page') === pageId);
        });
        // 自动展开所属分组
        MENU.forEach(function (m) {
            if (m.children && m.children.some(function (c) { return c.id === pageId; })) {
                var item = document.querySelector('.nav-item[data-group="' + m.id + '"]');
                var sub = document.querySelector('.nav-sub[data-sub="' + m.id + '"]');
                if (item && !item.classList.contains('open')) { item.classList.add('open'); sub.classList.add('open'); }
            }
        });
    }

    function go(page, pageId, ev) {
        if (ev) ev.stopPropagation();
        frame().src = 'pages/' + page;
        if (pageId) setActive(pageId);
    }

    /* 供 iframe 内页面调用：导航并高亮 */
    function navigate(page, activeId) {
        frame().src = 'pages/' + page;
        if (activeId) setActive(activeId);
    }

    function toast(msg, type) {
        var wrap = document.getElementById('toast-wrap');
        var t = document.createElement('div');
        t.className = 'toast ' + (type || '');
        var ico = type === 'success' ? '✓' : type === 'warning' ? '!' : type === 'error' ? '✕' : 'i';
        t.innerHTML = '<b style="color:var(--' + (type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'primary') + ')">' + ico + '</b><span>' + msg + '</span>';
        wrap.appendChild(t);
        setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = 'all .3s'; setTimeout(function () { t.remove(); }, 300); }, 2600);
    }

    return { renderSidebar: renderSidebar, toggleGroup: toggleGroup, go: go, navigate: navigate, setActive: setActive, toast: toast };
})();

document.addEventListener('DOMContentLoaded', App.renderSidebar);

/* iframe 内页面通过 parent.App 调用导航与提示 */
window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'navigate') { App.navigate(e.data.page, e.data.activeId); }
    if (e.data && e.data.type === 'toast') { App.toast(e.data.msg, e.data.toastType); }
});
