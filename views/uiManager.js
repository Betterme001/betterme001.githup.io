// views/uiManager.js
// 由 services/uiManager.js 移动

(function () {
    window.showManagementScreen = function showManagementScreen() {
        // 停止完成屏幕计时并记录时间（如果计时器正在运行）
        if (typeof window.stopCompletionScreenTimer === 'function') {
            window.stopCompletionScreenTimer();
        }
        
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

        // 获取过滤后的题目列表
        let filteredQuestions = (window.questions || []).filter(q => {
            // 处理label筛选
            if (labelFilter) {
                const labels = [];
                if (q.label) {
                    if (Array.isArray(q.label)) {
                        labels.push(...q.label);
                    } else if (typeof q.label === 'string') {
                        const labelStr = q.label.trim();
                        if (labelStr.includes(';')) {
                            labels.push(...labelStr.split(';').map(l => l.trim()).filter(l => l));
                        } else {
                            labels.push(labelStr);
                        }
                    }
                }
                if (!labels.includes(labelFilter)) return false;
            }
            
            // 处理收藏筛选
            if (favOnly) {
                const key = window.getQuestionKey ? window.getQuestionKey(q) : q.question;
                const entry = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[key]) || {};
                if (!entry.favorited) return false;
            }
            return true;
        });

        // 如果启用按掌握度排序，则排序
        if (window.sortByMastery) {
            filteredQuestions.sort((a, b) => {
                const keyA = window.getQuestionKey ? window.getQuestionKey(a) : a.question;
                const keyB = window.getQuestionKey ? window.getQuestionKey(b) : b.question;
                const entryA = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[keyA]) || {};
                const entryB = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[keyB]) || {};
                const masteryA = typeof window.calculateMastery === 'function' ? window.calculateMastery(entryA.history || []) : 0;
                const masteryB = typeof window.calculateMastery === 'function' ? window.calculateMastery(entryB.history || []) : 0;
                return masteryA - masteryB; // 升序排列，掌握度低的在前
            });
        }

        filteredQuestions.forEach((q, index) => {
            const item = document.createElement('div');
            item.className = 'library-item';
            const key = window.getQuestionKey ? window.getQuestionKey(q) : (q.question || index);
            const entry = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[key]) || {};
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
            // 处理多个label
            const labels = [];
            if (q.label) {
                // 支持多种格式的label
                if (Array.isArray(q.label)) {
                    labels.push(...q.label);
                } else if (typeof q.label === 'string') {
                    // 检查是否是多个label用分号分隔
                    const labelStr = q.label.trim();
                    if (labelStr.includes(';')) {
                        labels.push(...labelStr.split(';').map(l => l.trim()).filter(l => l));
                    } else {
                        labels.push(labelStr);
                    }
                }
            }
            
            // 生成label显示HTML
            const labelHtml = labels.length > 0 ? 
                `<div style="margin-bottom: 8px;">
                    ${labels.map(label => `<span style="font-size: 0.85rem; color: #fff; background: #4a7c59; padding: 2px 6px; border-radius: 12px; margin-right: 4px; display: inline-block;">${label}</span>`).join('')}
                </div>` : '';

            item.innerHTML = `
                <div class="library-question">
                    <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 8px; color:#111; display:flex; justify-content:space-between; align-items:center;">
                        <span>${index + 1}. ${q.question}</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size: 0.9rem; color: #666; background: #e8f5e8; padding: 2px 6px; border-radius: 4px;">${mastery}%</span>
                            <button data-key="${key}" class="icon-back" style="width:auto; padding:2px 6px; font-size:0.8rem;" onclick="toggleFavoriteFromLibrary('${key}')">${entry.favorited ? '★' : '☆'}</button>
                        </div>
                    </div>
                    ${labelHtml}
                    <div style="font-size: 1.1rem; color: #1565c0; margin: 0 0 8px 0;">${transHtml}</div>
                    <div style="font-size: 1rem; color: #444; margin-bottom: 8px; white-space: pre-wrap; word-break: break-word;">${window.parseMarkdown(q.knowledge_point || '')}</div>
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

        // 默认显示热力图模式
        window.switchStatsMode('heatmap');
    };

    // 渲染统计列表（修改为合并所有题库）
    window.renderStatsList = function renderStatsList() {
        const statsList = document.getElementById('statsList');
        if (!statsList) return;

        // 渲染历史学习统计：按日期倒序（合并所有题库）
        statsList.innerHTML = '';
        
        // 使用合并后的统计数据
        const mergedStats = window.mergeAllBankStats();
        const todayStr = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();

        // 计算今天的实时统计（所有题库）
        let todayStudyTime = 0;
        let todayQuestionCount = 0;
        
        Object.keys(CONFIG.BANKS).forEach(bankId => {
            try {
                const key = getStorageKey(bankId);
                const raw = localStorage.getItem(key);
                if (raw) {
                    const bankData = JSON.parse(raw);
                    const meta = bankData.meta || {};
                    todayStudyTime += meta.todayStudyTime || 0;
                    todayQuestionCount += meta.todayQuestionCount || 0;
                }
            } catch (e) {
                console.warn(`读取题库 ${bankId} 今日数据失败:`, e);
            }
        });

        const merged = { ...mergedStats };
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
        // 停止完成屏幕计时并记录时间（如果计时器正在运行）
        if (typeof window.stopCompletionScreenTimer === 'function') {
            window.stopCompletionScreenTimer();
        }
        
        if (typeof window.updateTimeDisplay === 'function') window.updateTimeDisplay();
        var statsScreen = document.getElementById('statsScreen');
        if (statsScreen) statsScreen.style.display = 'none';
        var outlineScreen = document.getElementById('outlineScreen');
        if (outlineScreen) outlineScreen.style.display = 'none';
        
        // 隐藏完成屏幕
        const completionScreen = document.getElementById('completionScreen');
        if (completionScreen) completionScreen.classList.remove('show');
        
        window.showManagementScreen();
    };

    // 全局排序状态
    window.sortByMastery = false;

    // 切换按掌握度排序
    window.toggleSortByMastery = function toggleSortByMastery() {
        window.sortByMastery = !window.sortByMastery;
        const btn = document.getElementById('sortByMasteryBtn');
        if (btn) {
            btn.textContent = window.sortByMastery ? '取消排序' : '排序M';
            btn.style.background = window.sortByMastery ? '#e3f2fd' : '#fff';
        }
        // 重新显示题库
        window.showQuestionBank();
    };

    // 计算并渲染题库底部的label筛选按钮
    window.renderLabelFilters = function renderLabelFilters() {
        const screen = document.getElementById('libraryScreen');
        if (!screen) return;

        let bar = document.getElementById('labelFilterBar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'labelFilterBar';
            // 插入到libraryScreen底部
            screen.appendChild(bar);
        }

        // 计算label集合，并按配置的排序方式排序
        const questions = Array.isArray(window.questions) ? window.questions : [];
        const seen = Object.create(null);
        const orderedLabels = [];
        questions.forEach(q => {
            if (!q || !q.label) return;
            
            // 处理多个label的情况
            const labels = [];
            if (Array.isArray(q.label)) {
                labels.push(...q.label);
            } else if (typeof q.label === 'string') {
                const labelStr = q.label.trim();
                if (labelStr.includes(';')) {
                    labels.push(...labelStr.split(';').map(l => l.trim()).filter(l => l));
                } else {
                    labels.push(labelStr);
                }
            }
            
            // 添加到有序列表
            labels.forEach(lb => {
                if (lb && !seen[lb]) {
                    seen[lb] = true;
                    orderedLabels.push(lb);
                }
            });
        });
        
        // 根据当前题库的配置对labels进行排序
        const currentBankId = window.currentBankId || CONFIG.DEFAULT_BANK_ID;
        const bankConfig = CONFIG.BANKS && CONFIG.BANKS[currentBankId];
        const sortOrder = (bankConfig && bankConfig.labelSortOrder) || 'default';
        
        if (sortOrder === 'alphabetical') {
            // 按字母排序
            orderedLabels.sort((a, b) => a.localeCompare(b, 'zh-CN'));
        }
        // 如果 sortOrder === 'default'，保持原有的首次出现顺序（不排序）

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
        wrap.style.cssText = 'padding:8px 12px;background:#f8f9fa;border-top:1px solid #e9ecef;display:flex;flex-wrap:wrap;gap:4px;overflow-y:auto;margin-top:auto;';
        // 高度由CSS控制，但确保滚动功能正常
        wrap.style.maxHeight = 'inherit';

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

    // 取消全部收藏（仅当前题库）
    window.clearAllFavorites = function clearAllFavorites() {
        if (!confirm('此操作只会取消当前题库的所有收藏，确认吗')) {
            return;
        }

        let clearedCount = 0;

        // 只处理当前题库
        const currentBankId = window.currentBankId || CONFIG.DEFAULT_BANK_ID;
        
        if (!window.reviewStore || !window.reviewStore.items) {
            alert('当前题库没有数据');
            return;
        }

        // 遍历当前题库的所有题目
        Object.keys(window.reviewStore.items).forEach(itemKey => {
            const entry = window.reviewStore.items[itemKey];
            if (entry && entry.favorited) {
                entry.favorited = false;
                clearedCount++;
            }
        });

        // 保存当前题库的数据
        window.saveStore();

        // 刷新题库显示
        if (typeof window.showQuestionBank === 'function') {
            window.showQuestionBank();
        }

        if (clearedCount > 0) {
            alert(`已取消 ${clearedCount} 个题目的收藏`);
        } else {
            alert('当前题库没有收藏的题目');
        }
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
        
        // 获取DOM元素
        const contentEl = document.getElementById('outlineContent');
        const treeEl = document.getElementById('outlineTree');
        
        // 解析markdown并创建treeview数据
        const treeData = window.parseOutlineToTreeData ? 
            window.parseOutlineToTreeData(content) : [];
        
        console.log('TreeView数据:', treeData);
        console.log('treeEl存在:', !!treeEl);
        console.log('contentEl存在:', !!contentEl);
        console.log('treeData长度:', treeData.length);
        
        // 使用自定义树形结构
        if (treeData.length > 0 && treeEl) {
            console.log('使用自定义树形结构');
            
            // 隐藏传统内容，显示树形结构
            if (contentEl) contentEl.style.display = 'none';
            treeEl.style.display = 'block';
            
            const customHtml = generateCustomTreeHtml(treeData);
            console.log('生成的HTML长度:', customHtml.length);
            console.log('HTML预览:', customHtml.substring(0, 200) + '...');
            
            treeEl.innerHTML = customHtml;
            console.log('HTML已插入到treeEl');
        } else {
            console.log('使用传统显示');
            // 降级：使用传统显示
            if (treeEl) treeEl.style.display = 'none';
            if (contentEl) {
                contentEl.style.display = 'block';
                const htmlContent = window.parseOutlineMarkdown ? 
                    window.parseOutlineMarkdown(content) : content;
                contentEl.innerHTML = htmlContent;
            }
        }
        
        // 滚动到顶部
        window.scrollTo(0, 0);
    };

    // 解析markdown大纲为TreeView数据格式
    window.parseOutlineToTreeData = function parseOutlineToTreeData(markdownText) {
        if (!markdownText || typeof markdownText !== 'string') return [];
        
        const lines = markdownText.split('\n');
        const tree = [];
        const stack = [];
        let nodeId = 0;
        
        // 解析每一行，构建层级结构
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            // 匹配markdown标题行 (# ## ### #### 等)
            let headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            let level = 0;
            let title = '';
            
            if (headerMatch) {
                level = headerMatch[1].length;
                title = headerMatch[2];
            } else {
                // 先匹配缩进项目格式 (空格 + 数字)
                const subMatch = line.match(/^(\s+)(\d+)\.\s*(.+)$/);
                if (subMatch) {
                    const spaces = subMatch[1].length;
                    level = Math.floor(spaces / 3) + 2; // 根据空格数量确定层级，每3个空格一级
                    title = subMatch[3];
                } else {
                    // 匹配顶级数字列表格式 (1. 2. 3. 等)
                    const numberMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
                    if (numberMatch) {
                        level = 1;
                        title = numberMatch[2];
                    } else {
                        // 匹配列表项格式 (- 开头)
                        const listMatch = line.match(/^(\s*)(-)\s+(.+)$/);
                        if (listMatch) {
                            const spaces = listMatch[1].length;
                            level = Math.floor(spaces / 2) + 3; // 根据空格数量确定层级，每2个空格一级
                            title = listMatch[3];
                        }
                    }
                }
            }
            
            if (level > 0 && title) {
                const node = {
                    text: title,
                    id: `outline-${nodeId++}`,
                    level: level,
                    state: {
                        expanded: level <= 2, // 默认展开Level 1和2
                        selected: false
                    },
                    nodes: []
                };
                
                // 找到合适的父节点
                while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                    stack.pop();
                }
                
                if (stack.length > 0) {
                    stack[stack.length - 1].nodes.push(node);
                } else {
                    tree.push(node);
                }
                
                stack.push(node);
            }
        });
        
        return tree;
    };

    // 生成自定义树形HTML
    function generateCustomTreeHtml(nodes, depth = 0) {
        let html = '';
        
        nodes.forEach(node => {
            const hasChildren = node.nodes && node.nodes.length > 0;
            const isExpanded = node.state && node.state.expanded;
            const indent = depth * 20;
            
            html += `
                <div class="custom-tree-node" style="margin-left: ${indent}px; margin: 2px 0;">
                    <div class="custom-tree-header" onclick="toggleCustomNode('${node.id}')" style="cursor: pointer; padding: 8px 12px; display: flex; align-items: center; border-radius: 4px; transition: background-color 0.2s ease;">
                        <span class="custom-tree-icon" style="width: 20px; text-align: center; font-weight: bold; color: #4a7c59; font-size: 16px; margin-right: 8px;">${hasChildren ? (isExpanded ? '−' : '+') : ''}</span>
                        <span class="custom-tree-title" style="flex: 1; font-weight: ${node.level <= 2 ? 'bold' : 'normal'}; color: #2d4a2d; font-size: ${node.level <= 2 ? '1.1rem' : '1rem'}; word-break: break-word; white-space: normal;">${node.text}</span>
                    </div>
                    <div class="custom-tree-children" id="custom-children-${node.id}" style="display: ${isExpanded ? 'block' : 'none'}; overflow-x: auto; max-width: 100%;">
                        ${hasChildren ? generateCustomTreeHtml(node.nodes, depth + 1) : ''}
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    // 切换自定义节点展开/折叠状态
    window.toggleCustomNode = function toggleCustomNode(nodeId) {
        const childrenEl = document.getElementById(`custom-children-${nodeId}`);
        const iconEl = document.querySelector(`[onclick="toggleCustomNode('${nodeId}')"] .custom-tree-icon`);
        
        if (childrenEl && iconEl) {
            const isExpanded = childrenEl.style.display !== 'none';
            childrenEl.style.display = isExpanded ? 'none' : 'block';
            iconEl.textContent = isExpanded ? '+' : '−';
        }
    };

    // 处理重设所有题目掌握度的操作
    window.handleResetMastery = function handleResetMastery(mode) {
        const modeText = mode === 'clear' ? '清空为0%' : '设置为50%';
        const warningText = mode === 'clear' 
            ? '⚠️ 警告：此操作将清空当前题库所有题目的学习历史记录，掌握度将变为0%。\n\n此操作不可恢复，请谨慎操作！'
            : '⚠️ 警告：此操作将重置当前题库所有题目的学习历史记录，掌握度将变为50%。\n\n原始学习记录将被清除，但可以通过后续复习重新提高掌握度。';
        
        // 双重确认，避免误操作
        const confirm1 = window.confirm(
            warningText + '\n\n确认要继续吗？'
        );
        
        if (!confirm1) {
            return;
        }
        
        const confirm2 = window.confirm(
            `⚠️ 最后确认：\n\n确定要将当前题库所有题目的掌握度${modeText}吗？\n\n点击"确定"将立即执行此操作。`
        );
        
        if (!confirm2) {
            return;
        }
        
        // 检查函数是否存在
        if (typeof window.resetAllMastery !== 'function') {
            alert('错误：功能未找到，请刷新页面后重试。');
            return;
        }
        
        // 执行操作
        try {
            const result = window.resetAllMastery(mode);
            
            if (result.success) {
                // 更新界面显示
                if (typeof window.updateProgressDisplay === 'function') {
                    window.updateProgressDisplay();
                }
                if (typeof window.updateTimeDisplay === 'function') {
                    window.updateTimeDisplay();
                }
                
                // 如果当前在展示题库页面，刷新题库显示
                const libraryScreen = document.getElementById('libraryScreen');
                if (libraryScreen && libraryScreen.classList.contains('show')) {
                    if (typeof window.showQuestionBank === 'function') {
                        window.showQuestionBank();
                    }
                }
                
                alert(
                    '✅ 操作完成！\n\n' +
                    result.message + '\n\n' +
                    (mode === 'clear' 
                        ? '提示：当前题库所有题目的学习历史已清空，掌握度已重置为0%。'
                        : '提示：当前题库所有题目的掌握度已设置为50%。通过后续复习可以重新提高掌握度。')
                );
            } else {
                alert('❌ 操作失败：' + result.message);
            }
        } catch (error) {
            console.error('重设掌握度时出错：', error);
            alert('❌ 操作时发生错误：' + error.message);
        }
    };

    // 处理降低所有题目掌握度的操作
    window.handleReduceMastery = function handleReduceMastery() {
        // 双重确认，避免误操作
        const confirm1 = window.confirm(
            '⚠️ 警告：此操作将在所有题目的历史记录中添加负面记录，使掌握度降低约50%。\n\n' +
            '此操作会影响所有题目的掌握度，但不会删除原始学习记录。\n' +
            '通过后续复习，题目可以恢复到原来的掌握度水平。\n\n' +
            '确认要继续吗？'
        );
        
        if (!confirm1) {
            return;
        }
        
        const confirm2 = window.confirm(
            '⚠️ 最后确认：\n\n' +
            '确定要将所有题目的掌握度降低50%吗？\n\n' +
            '点击"确定"将立即执行此操作。'
        );
        
        if (!confirm2) {
            return;
        }
        
        // 检查函数是否存在
        if (typeof window.reduceAllMasteryBy50Percent !== 'function') {
            alert('错误：功能未找到，请刷新页面后重试。');
            return;
        }
        
        // 执行操作
        try {
            const result = window.reduceAllMasteryBy50Percent();
            
            if (result.success) {
                // 更新界面显示
                if (typeof window.updateProgressDisplay === 'function') {
                    window.updateProgressDisplay();
                }
                if (typeof window.updateTimeDisplay === 'function') {
                    window.updateTimeDisplay();
                }
                
                alert(
                    '✅ 操作完成！\n\n' +
                    result.message + '\n\n' +
                    '提示：通过后续复习，题目可以恢复到原来的掌握度水平。'
                );
            } else {
                alert('❌ 操作失败：' + result.message);
            }
        } catch (error) {
            console.error('降低掌握度时出错：', error);
            alert('❌ 操作时发生错误：' + error.message);
        }
    };
})();


