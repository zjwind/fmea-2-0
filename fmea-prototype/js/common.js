var Common = (function () {

    function addTab(title, url) {
        var tabs = $('#main-tabs');
        if (tabs.tabs('exists', title)) {
            tabs.tabs('select', title);
            return;
        }
        var content = '<iframe scrolling="auto" frameborder="0" src="' + url + '" style="width:100%;height:100%;border:none;"></iframe>';
        tabs.tabs('add', {
            title: title,
            content: content,
            closable: true,
            fit: true
        });
    }

    function closeTab(title) {
        var tabs = $('#main-tabs');
        if (tabs.tabs('exists', title)) {
            tabs.tabs('close', title);
        }
    }

    function getTab(title) {
        var tabs = $('#main-tabs');
        if (tabs.tabs('exists', title)) {
            return tabs.tabs('getTab', title);
        }
        return null;
    }

    function getMockData(key) {
        return MockData.get(key);
    }

    function findById(array, id) {
        return MockData.findById(array, id);
    }

    function dateFormatter(value) {
        if (!value) return '-';
        return value;
    }

    function statusFormatter(value) {
        var map = {
            'draft': '<span class="badge badge-draft">草稿</span>',
            'submitted': '<span class="badge badge-submitted">已提交</span>',
            'approved': '<span class="badge badge-approved">已批准</span>',
            'confirmed': '<span class="badge badge-confirmed">已确认</span>',
            'completed': '<span class="badge badge-completed">已完成</span>',
            'rejected': '<span class="badge badge-rejected">已驳回</span>',
            'pending': '<span class="badge badge-pending">待处理</span>',
            'in-progress': '<span class="badge badge-in-progress">进行中</span>',
            'closed': '<span class="badge badge-closed">已关闭</span>',
            'active': '<span class="badge badge-approved">有效</span>'
        };
        return map[value] || '<span class="badge">' + (value || '-') + '</span>';
    }

    function riskLevelFormatter(value) {
        var map = {
            'H': '<span class="risk-badge risk-H">H</span>',
            'M': '<span class="risk-badge risk-M">M</span>',
            'L': '<span class="risk-badge risk-L">L</span>'
        };
        return map[value] || '<span class="risk-badge">' + (value || '-') + '</span>';
    }

    function apLevelFormatter(value) {
        var map = {
            'A': '<span class="ap-badge ap-A">A</span>',
            'B': '<span class="ap-badge ap-B">B</span>',
            'C': '<span class="ap-badge ap-C">C</span>'
        };
        return map[value] || '<span class="ap-badge">' + (value || '-') + '</span>';
    }

    function showConfirm(msg, callback) {
        $.messager.confirm('确认', msg, function (r) {
            if (r) {
                if (callback) callback();
            }
        });
    }

    function showInfo(msg) {
        $.messager.alert('提示', msg, 'info');
    }

    function showError(msg) {
        $.messager.alert('错误', msg, 'error');
    }

    function showNotification(title, msg, type) {
        type = type || 'info';
        var $notif = $('<div class="notification ' + type + '">' +
            '<div class="notif-title">' + title + '</div>' +
            '<div class="notif-msg">' + msg + '</div>' +
            '</div>');
        $('body').append($notif);
        var offset = $('.notification').length;
        $notif.css('top', (60 + (offset - 1) * 80) + 'px');
        setTimeout(function () {
            $notif.fadeOut(300, function () {
                $notif.remove();
            });
        }, 3000);
    }

    function showLoading(container) {
        var $container = container ? $(container) : $('body');
        var $mask = $('<div class="loading-mask"><div class="loading-spinner"></div></div>');
        if (!container) {
            $mask.css('position', 'fixed');
        }
        $container.append($mask);
        return $mask;
    }

    function hideLoading(container) {
        var $container = container ? $(container) : $('body');
        $container.find('.loading-mask').remove();
    }

    function initDatagrid(id, options) {
        var defaults = {
            fit: true,
            border: false,
            striped: true,
            rownumbers: true,
            pagination: true,
            pageSize: 20,
            pageList: [10, 20, 50, 100],
            singleSelect: true,
            ctrlSelect: true,
            nowrap: true,
            scrollbarSize: 8
        };
        var settings = $.extend({}, defaults, options);
        $('#' + id).datagrid(settings);
    }

    function buildStepProgress(steps, currentStep) {
        var html = '<div class="step-progress">';
        for (var i = 0; i < steps.length; i++) {
            var cls = '';
            if (i < currentStep) cls = 'done';
            else if (i === currentStep) cls = 'active';
            html += '<div class="step ' + cls + '">';
            html += '<div class="step-circle">' + (i < currentStep ? '✓' : (i + 1)) + '</div>';
            html += '<div class="step-title">' + steps[i].name + '</div>';
            if (i < steps.length - 1) {
                html += '<div class="step-line"></div>';
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    function buildFiveDimTable(dimensions) {
        var dimLabels = {
            function_change: '功能变更',
            structure_change: '结构变更',
            material_change: '材料变更',
            process_change: '工艺变更',
            interface_change: '接口变更'
        };
        var html = '<table class="five-dim-table">';
        html += '<tr><th>评估维度</th><th>评分(1-10)</th><th>评估说明</th></tr>';
        var total = 0;
        for (var key in dimensions) {
            if (dimensions.hasOwnProperty(key)) {
                var dim = dimensions[key];
                total += dim.score;
                var scoreCls = dim.score >= 7 ? 'score-high' : (dim.score >= 4 ? 'score-medium' : 'score-low');
                html += '<tr>';
                html += '<td class="dim-label">' + (dimLabels[key] || key) + '</td>';
                html += '<td class="' + scoreCls + '">' + dim.score + '</td>';
                html += '<td style="text-align:left;">' + dim.desc + '</td>';
                html += '</tr>';
            }
        }
        html += '<tr><td class="dim-label" style="font-weight:700;">合计</td><td style="font-weight:700;font-size:14px;">' + total + '</td><td style="text-align:left;">触发阈值: 25' + (total >= 25 ? ' → <span style="color:#c62828;font-weight:700;">需触发DRBFM</span>' : ' → <span style="color:#2e7d32;">无需触发</span>') + '</td></tr>';
        html += '</table>';
        return html;
    }

    function buildFunctionMatrix(matrixData) {
        var html = '<div style="overflow-x:auto;"><table class="func-matrix">';
        html += '<tr><th>功能</th><th>描述</th>';
        for (var i = 0; i < matrixData.structures.length; i++) {
            html += '<th>' + matrixData.structures[i] + '</th>';
        }
        html += '</tr>';
        for (var j = 0; j < matrixData.functions.length; j++) {
            var func = matrixData.functions[j];
            html += '<tr>';
            html += '<td class="row-header">' + func.name + '</td>';
            html += '<td style="text-align:left;font-size:11px;">' + func.desc + '</td>';
            for (var k = 0; k < func.markers.length; k++) {
                var marker = func.markers[k];
                if (marker === 'H') {
                    html += '<td><span class="marker-h">H</span></td>';
                } else if (marker === 'M') {
                    html += '<td><span class="marker-m">M</span></td>';
                } else if (marker === 'Y') {
                    html += '<td><span class="marker-y">Y</span></td>';
                } else {
                    html += '<td></td>';
                }
            }
            html += '</tr>';
        }
        html += '</table></div>';
        return html;
    }

    function buildReviewThread(reviewers) {
        var html = '<div class="review-thread">';
        for (var i = 0; i < reviewers.length; i++) {
            var r = reviewers[i];
            var opinionCls = 'opinion-' + (r.opinion || 'pending');
            var opinionText = { agree: '同意', disagree: '不同意', conditional: '有条件同意', pending: '待评审' };
            html += '<div class="review-item">';
            html += '<div class="reviewer-avatar">' + r.name.charAt(0) + '</div>';
            html += '<div class="review-content">';
            html += '<span class="reviewer-name">' + r.name + '</span>';
            html += '<span class="review-time">' + (r.time || '-') + '</span>';
            if (r.role) html += ' <span class="tag tag-primary">' + r.role + '</span>';
            html += '<span class="review-opinion ' + opinionCls + '">' + (opinionText[r.opinion] || '待评审') + '</span>';
            if (r.comment) {
                html += '<div class="review-text">' + r.comment + '</div>';
            }
            html += '</div></div>';
        }
        html += '</div>';
        return html;
    }

    function buildBaselineCard(item) {
        var landingCls = 'landing-' + item.landing_status;
        var landingText = { done: '已落地', partial: '部分落地', pending: '未落地' };
        var html = '<div class="baseline-card">';
        html += '<div class="card-header">';
        html += '<div><div class="card-title">' + item.name + '</div>';
        html += '<div class="card-meta"><span>' + item.category + '</span><span>' + item.owner + '</span><span>' + item.created_at + '</span></div></div>';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += riskLevelFormatter(item.risk_level);
        html += '<span class="landing-status ' + landingCls + '">' + (landingText[item.landing_status] || '-') + '</span>';
        html += '</div></div>';
        html += '<div class="card-body">' + item.content + '</div>';
        html += '<div style="margin-top:10px;"><div style="display:flex;justify-content:space-between;font-size:11px;color:#868e96;margin-bottom:4px;"><span>落地进度</span><span>' + item.landing_progress + '%</span></div>';
        html += '<div style="background:#e9ecef;border-radius:4px;height:6px;overflow:hidden;"><div style="background:' + (item.landing_progress === 100 ? '#34a853' : item.landing_progress > 0 ? '#1a73e8' : '#dee2e6') + ';height:100%;width:' + item.landing_progress + '%;border-radius:4px;transition:width .3s;"></div></div></div>';
        html += '</div>';
        return html;
    }

    function padZero(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function getToday() {
        var d = new Date();
        return d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate());
    }

    function getNow() {
        var d = new Date();
        return d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate()) + ' ' + padZero(d.getHours()) + ':' + padZero(d.getMinutes());
    }

    return {
        addTab: addTab,
        closeTab: closeTab,
        getTab: getTab,
        getMockData: getMockData,
        findById: findById,
        dateFormatter: dateFormatter,
        statusFormatter: statusFormatter,
        riskLevelFormatter: riskLevelFormatter,
        apLevelFormatter: apLevelFormatter,
        showConfirm: showConfirm,
        showInfo: showInfo,
        showError: showError,
        showNotification: showNotification,
        showLoading: showLoading,
        hideLoading: hideLoading,
        initDatagrid: initDatagrid,
        buildStepProgress: buildStepProgress,
        buildFiveDimTable: buildFiveDimTable,
        buildFunctionMatrix: buildFunctionMatrix,
        buildReviewThread: buildReviewThread,
        buildBaselineCard: buildBaselineCard,
        getToday: getToday,
        getNow: getNow
    };
})();
