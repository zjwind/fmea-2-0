/* iframe 内页面通用脚本：导航、提示、弹窗、查询参数 */
var Page = (function () {
    function qs(name) {
        var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
        return m ? decodeURIComponent(m[1]) : '';
    }
    function nav(page, activeId) { parent.postMessage({ type: 'navigate', page: page, activeId: activeId }, '*'); }
    function toast(msg, type) { parent.postMessage({ type: 'toast', msg: msg, toastType: type || 'info' }, '*'); }

    function modal(opts) {
        var mask = document.createElement('div');
        mask.className = 'modal-mask show';
        mask.innerHTML = '<div class="modal" style="' + (opts.width ? 'width:' + opts.width + 'px' : '') + '">'
            + '<div class="modal-head"><div class="t">' + opts.title + '</div><div class="x">✕</div></div>'
            + '<div class="modal-body">' + opts.body + '</div>'
            + (opts.foot === false ? '' : '<div class="modal-foot">'
                + '<button class="btn btn-cancel">取消</button>'
                + '<button class="btn btn-primary btn-ok">' + (opts.okText || '确定') + '</button></div>')
            + '</div>';
        document.body.appendChild(mask);
        function close() { mask.remove(); }
        mask.querySelector('.x').onclick = close;
        if (opts.foot !== false) {
            mask.querySelector('.btn-cancel').onclick = close;
            mask.querySelector('.btn-ok').onclick = function () {
                if (!opts.onOk || opts.onOk(mask) !== false) close();
            };
        }
        mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
        return { el: mask, close: close };
    }

    function confirm(msg, onOk) {
        modal({ title: '确认', width: 420, body: '<div style="padding:6px 2px;font-size:14px;color:var(--text-regular)">' + msg + '</div>', onOk: function () { onOk && onOk(); } });
    }

    return { qs: qs, nav: nav, toast: toast, modal: modal, confirm: confirm };
})();
