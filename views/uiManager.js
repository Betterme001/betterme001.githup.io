// views/uiManager.js
// 由 services/uiManager.js 移动

(function () {
    window.showManagementScreen = function showManagementScreen() {
        document.getElementById('managementScreen').style.display = 'block';
        var ss3 = document.getElementById('startScreen');
        if (ss3) ss3.style.display = 'none';
        document.getElementById('testScreen').style.display = 'none';
        document.getElementById('completionScreen').classList.remove('show');
        document.getElementById('libraryScreen').classList.remove('show');
        var statsScreen = document.getElementById('statsScreen');
        if (statsScreen) statsScreen.style.display = 'none';
        document.body.classList.remove('top-align');
        document.body.classList.remove('library-mode');

        if (typeof window.updateProgressDisplay === 'function') window.updateProgressDisplay();
        if (typeof window.updateTimeDisplay === 'function') window.updateTimeDisplay();
        window.scrollTo(0, 0);
    };

    window.toggleHistoryStats = function toggleHistoryStats() {
        const historyInfo = document.getElementById('historyInfo');
        const statsBtn = document.querySelector('.mgmt-btn.stats');
        if (!historyInfo || !statsBtn) return;
        if (historyInfo.style.display === 'none') {
            historyInfo.style.display = 'block';
            statsBtn.textContent = '隐藏统计';
            if (typeof window.updateTimeDisplay === 'function') window.updateTimeDisplay();
        } else {
            historyInfo.style.display = 'none';
            statsBtn.textContent = '学习统计';
        }
    };

    window.showQuestionBank = function showQuestionBank() {
        document.getElementById('managementScreen').style.display = 'none';
        document.getElementById('libraryScreen').classList.add('show');
        document.body.classList.add('top-align');
        document.body.classList.add('library-mode');

        // 渲染顶部的label筛选按钮
        if (typeof window.renderLabelFilters === 'function') window.renderLabelFilters();

        const libraryList = document.getElementById('libraryList');
        if (!libraryList) return;
        libraryList.innerHTML = '';

        const favOnlyToggle = document.getElementById('favOnlyToggle');
        const favOnly = favOnlyToggle ? favOnlyToggle.checked : false;

        const labelFilter = window.currentLabelFilter || null;

        (window.questions || []).forEach((q, index) => {
            if (labelFilter && (q.label || '').trim() !== labelFilter) return;
            const item = document.createElement('div');
            item.className = 'library-item';
            const key = window.getQuestionKey ? window.getQuestionKey(q) : (q.question || index);
            const entry = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[key]) || {};
            if (favOnly && !entry.favorited) return;
            const m = entry.masteredCount || 0;
            const u = entry.unclearCount || 0;
            const f = entry.forgotCount || 0;
            const mastery = typeof window.calculateMastery === 'function' ? window.calculateMastery(entry.history || []) : 0;
            const translationText = ((q && q.translation) ? String(q.translation) : '')
                .replace(/^[：:]\s*/, '')
                .replace(/[\s\r\n]+$/, '');
            // 解析markdown后去除包裹段落，避免额外空行
            let transHtml = (typeof window.parseMarkdown === 'function') ? window.parseMarkdown(translationText) : translationText;
            if (typeof transHtml === 'string') {
                transHtml = transHtml.replace(/^<p>/, '').replace(/<\/p>\s*$/, '');
            }
            item.innerHTML = `
                <div class="library-question">
                    <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 8px; color:#111;">${index + 1}. ${q.question}</div>
                    <div style="font-size: 1.1rem; color: #1565c0; margin: 0 0 8px 0;">${transHtml}</div>
                    <div style="font-size: 1rem; color: #444; margin-bottom: 8px; white-space: pre-wrap; word-break: break-word;">${window.parseMarkdown(q.knowledge_point || '')}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 8px; display:flex; justify-content:space-between; align-items:center;">
                        <span>掌握度: ${mastery}% | 掌握: ${m} | 模糊: ${u} | 忘记: ${f}</span>
                        <button data-key="${key}" class="icon-back" style="width:auto; padding:0 10px;" onclick="toggleFavoriteFromLibrary('${key}')">${entry.favorited ? '★ 已收藏' : '☆ 收藏'}</button>
                    </div>
                </div>`;
            libraryList.appendChild(item);
        });
    };

    // 展示学习统计页面
    window.showStatsScreen = function showStatsScreen() {
        const mgmt = document.getElementById('managementScreen');
        const statsScreen = document.getElementById('statsScreen');
        if (!mgmt || !statsScreen) return;

        mgmt.style.display = 'none';
        statsScreen.style.display = 'block';
        document.body.classList.add('top-align');
        document.body.classList.add('library-mode');

        // 默认显示列表模式
        window.switchStatsMode('list');
    };

    // 渲染统计列表
    window.renderStatsList = function renderStatsList() {
        const statsList = document.getElementById('statsList');
        if (!statsList) return;

        // 渲染历史学习统计：按日期倒序
        statsList.innerHTML = '';
        const dailyStats = (window.reviewStore && window.reviewStore.meta && window.reviewStore.meta.dailyStats) || {};
        const todayStr = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();

        // 将"今天"的实时统计也并入展示
        const todayStudyTime = (window.reviewStore && window.reviewStore.meta && (window.reviewStore.meta.todayStudyTime||0)) || 0;
        const todayQuestionCount = (window.reviewStore && window.reviewStore.meta && (window.reviewStore.meta.todayQuestionCount||0)) || 0;
        const merged = { ...dailyStats };
        merged[todayStr] = {
            studyTime: todayStudyTime,
            questionCount: todayQuestionCount,
            timestamp: Date.now()
        };

        const dates = Object.keys(merged).sort((a,b) => b.localeCompare(a));
        if (dates.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'library-item';
            empty.textContent = '暂无学习记录';
            statsList.appendChild(empty);
            return;
        }

        // 表头
        const header = document.createElement('div');
        header.className = 'library-item';
        header.style.fontWeight = 'bold';
        header.innerHTML = `<div style="display:flex;gap:12px;">
            <div style="width:120px;">日期</div>
            <div style="width:120px;">学习时间</div>
            <div style="width:120px;">题目数量</div>
        </div>`;
        statsList.appendChild(header);

        dates.forEach(date => {
            const s = merged[date] || { studyTime: 0, questionCount: 0 };
            const item = document.createElement('div');
            item.className = 'library-item';
            const minutes = Math.floor((s.studyTime||0) / 60);
            item.innerHTML = `<div style="display:flex;gap:12px;">
                <div style="width:120px;">${date.replace(/-/g,'')}</div>
                <div style="width:120px;">${minutes}m</div>
                <div style="width:120px;">${s.questionCount||0}</div>
            </div>`;
            statsList.appendChild(item);
        });
    };

    window.backToManagement = function backToManagement() {
        if (typeof window.updateTimeDisplay === 'function') window.updateTimeDisplay();
        var statsScreen = document.getElementById('statsScreen');
        if (statsScreen) statsScreen.style.display = 'none';
        var outlineScreen = document.getElementById('outlineScreen');
        if (outlineScreen) outlineScreen.style.display = 'none';
        window.showManagementScreen();
    };

    // 计算并渲染题库顶部的label筛选按钮
    window.renderLabelFilters = function renderLabelFilters() {
        const screen = document.getElementById('libraryScreen');
        if (!screen) return;

        let bar = document.getElementById('labelFilterBar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'labelFilterBar';
            // 插入到libraryScreen顶部
            screen.insertBefore(bar, screen.firstChild);
        }

        // 计算label集合，并按首次出现顺序排序
        const questions = Array.isArray(window.questions) ? window.questions : [];
        const seen = Object.create(null);
        const orderedLabels = [];
        questions.forEach(q => {
            const lb = (q && q.label ? String(q.label).trim() : '');
            if (!lb) return;
            if (!seen[lb]) {
                seen[lb] = true;
                orderedLabels.push(lb);
            }
        });

        // 若无label则隐藏
        if (orderedLabels.length === 0) {
            bar.style.display = 'none';
            return;
        }
        bar.style.display = 'block';

        // 渲染按钮
        const current = window.currentLabelFilter || '';
        const btnStyle = 'display:inline-block;margin:3px 4px 4px 0;padding:3px 8px;border:1px solid #ccc;border-radius:12px;background:#fafafa;color:#333;cursor:pointer;font-size:0.8rem;user-select:none;white-space:nowrap;';
        const btnActiveStyle = 'background:#1565c0;color:#fff;border-color:#1565c0;';
        // 包装容器，避免与其它元素混杂
        bar.innerHTML = '';
        const wrap = document.createElement('div');
        // 与页面一起滚动；多行显示，最多五行，超出部分在内部滚动
        wrap.style.cssText = 'padding:4px 0;background:#fff;display:flex;flex-wrap:wrap;gap:4px;max-height:128px;overflow-y:auto;';

        // 全部按钮
        const allBtn = document.createElement('button');
        allBtn.type = 'button';
        allBtn.textContent = '全部';
        allBtn.style.cssText = btnStyle + (current ? '' : btnActiveStyle);
        allBtn.onclick = function () {
            window.currentLabelFilter = '';
            window.showQuestionBank();
        };
        wrap.appendChild(allBtn);

        // 其余label按钮
        orderedLabels.forEach(lb => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = lb;
            b.style.cssText = btnStyle + (current === lb ? btnActiveStyle : '');
            b.onclick = function () {
                window.currentLabelFilter = lb;
                window.showQuestionBank();
            };
            wrap.appendChild(b);
        });

        bar.appendChild(wrap);
    };

    // 测试/复习页收藏按钮
    window.toggleFavorite = function toggleFavorite() {
        const questionSource = window.isReviewSession ? window.reviewSessionQuestions : window.testSessionQuestions;
        const question = questionSource[window.currentQuestionIndex];
        if (!question) return;
        const key = window.getQuestionKey ? window.getQuestionKey(question) : question.question;
        const entry = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[key]) || {};
        entry.favorited = !entry.favorited;
        if (!window.reviewStore.items) window.reviewStore.items = {};
        window.reviewStore.items[key] = entry;
        window.saveStore();
        const btn = document.getElementById('favBtn');
        if (btn) btn.textContent = entry.favorited ? '★' : '☆';
    };

    // 题库内收藏/取消
    window.toggleFavoriteFromLibrary = function toggleFavoriteFromLibrary(key) {
        const entry = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[key]) || {};
        entry.favorited = !entry.favorited;
        if (!window.reviewStore.items) window.reviewStore.items = {};
        window.reviewStore.items[key] = entry;
        window.saveStore();
        window.showQuestionBank();
    };

    // 显示语法盒子界面
    window.showOutlineScreen = function showOutlineScreen(content, bankName) {
        // 隐藏管理界面
        document.getElementById('managementScreen').style.display = 'none';
        
        // 显示语法盒子界面
        const outlineScreen = document.getElementById('outlineScreen');
        if (outlineScreen) {
            outlineScreen.style.display = 'block';
        }
        
        // 设置标题
        const titleEl = document.getElementById('outlineTitle');
        if (titleEl) {
            titleEl.textContent = bankName ? `${bankName} - 语法大纲` : '语法大纲';
        }
        
        // 渲染大纲内容
        const contentEl = document.getElementById('outlineContent');
        if (contentEl) {
            // 使用解析函数处理markdown内容
            const htmlContent = window.parseOutlineMarkdown ? 
                window.parseOutlineMarkdown(content) : content;
            contentEl.innerHTML = htmlContent;
        }
        
        // 滚动到顶部
        window.scrollTo(0, 0);
    };
})();


