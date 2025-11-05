// controllers/test.js
// 测试流程相关函数

(function () {
    // 测试模式启动
    window.startTest = function startTest() {
        try {
            if (!window.reviewStore.meta) {
                window.reviewStore.meta = { globalProgressIndex: 0, reviewProgress: 0 };
            }
            var meta = window.reviewStore.meta;
            
            // 检查是否已完成一轮测试
            if ((meta.globalProgressIndex || 0) === (window.questions.length || 0)) {
                var confirmNewTest = window.confirm('是否新的一轮测试？');
                if (confirmNewTest) {
                    meta.globalProgressIndex = 0;
                    meta.reviewProgress = 0; // 同时重置复习进度
                    window.saveStore();
                } else {
                    window.showManagementScreen();
                    return;
                }
            }
            
            // 构建测试题目
            const startIndex = determineSessionStartIndex();
            window.testSessionQuestions = window.buildSequentialQuestions(startIndex, CONFIG.SESSION_SIZE);
            // 不取模，允许等于题库总数，表示整轮结束
            const totalLen = window.questions.length || 0;
            window.reviewStore.meta.pendingProgressIndex = Math.min(startIndex + window.testSessionQuestions.length, totalLen);
            window.saveStore();
            
            // 初始化状态并显示界面
            initializeSessionState(false);
            showSessionInterface();
            
        } catch (e) {
            console.error('测试启动失败:', e);
            alert('测试启动失败，请重试');
        }
    };

    // 确定会话开始索引
    window.determineSessionStartIndex = function determineSessionStartIndex() {
        const total = window.questions.length || 0;
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const meta = window.reviewStore.meta || { globalProgressIndex: 0, lastSessionDate: '' };
        let startIndex;
        if (meta.lastSessionDate !== todayStr) {
            startIndex = meta.globalProgressIndex >= CONFIG.REVIEW_BACK_RANGE ? meta.globalProgressIndex - CONFIG.REVIEW_BACK_RANGE : 0;
            meta.lastSessionDate = todayStr;
        } else {
            startIndex = total > 0 ? (meta.globalProgressIndex % total) : 0;
        }
        window.reviewStore.meta = meta;
        window.saveStore();
        return startIndex;
    };
    // 检查复习前置条件
    function checkReviewPrerequisites() {
        const globalProgress = window.reviewStore.meta.globalProgressIndex || 0;
        const reviewProgress = window.reviewStore.meta.reviewProgress || 0;
        
        if (globalProgress === 0) {
            alert('没有需要复习的题目！请先完成一些测试题目。');
            return false;
        }
        
        // 如果已复习完所有已测试的题目，询问是否重新开始复习
        if (globalProgress > 0 && reviewProgress >= globalProgress) {
            var confirmNewReview = window.confirm('已复习完所有已测试的题目，是否重新开始复习？');
            if (confirmNewReview) {
                window.reviewStore.meta.reviewProgress = 0;
                window.saveStore();
            } else {
                window.showManagementScreen();
                return false;
            }
        }
        return true;
    }

    // 构建复习候选题目列表
    function buildReviewCandidates() {
        const meta = window.reviewStore.meta;
        const total = window.questions.length || 0;
        const globalProgress = meta.globalProgressIndex || 0;
        const reviewProgress = meta.reviewProgress || 0;
        
        // 确保复习进度不超过测试进度
        const startIndex = Math.max(0, Math.min(reviewProgress, globalProgress));
        const endIndex = Math.min(globalProgress, total);
        
        const allCandidates = [];
        console.log('复习扫描范围:', startIndex, '到', endIndex - 1, '(测试进度:', globalProgress, ', 复习进度:', reviewProgress, ')');
        
        // 从reviewProgress开始扫描
        for (let i = startIndex; i < endIndex; i++) {
            allCandidates.push(window.questions[i]);
        }
        
        // 如果从reviewProgress开始没有找到足够的题目，则从头开始扫描
        if (allCandidates.length < CONFIG.SESSION_SIZE && startIndex > 0) {
            console.log('从reviewProgress开始找到的题目不足，从头开始扫描...');
            for (let i = 0; i < startIndex; i++) {
                allCandidates.push(window.questions[i]);
            }
        }
        
        return allCandidates;
    }

    // 筛选低掌握度题目
    function selectLowMasteryQuestions(candidates) {
        if (typeof window.getLowMasteryQuestionsFromCandidates !== 'function') {
            console.error('getLowMasteryQuestionsFromCandidates 函数未定义');
            alert('系统错误：题目筛选函数未定义');
            return null;
        }
        
        const lowMasteryQuestions = window.getLowMasteryQuestionsFromCandidates(candidates);
        
        if (lowMasteryQuestions.length === 0) {
            alert('恭喜！所有已测试的题目都达到了掌握标准！');
            return null;
        }
        
        return lowMasteryQuestions;
    }

    // 初始化会话状态（测试和复习共用）
    function initializeSessionState(isReview) {
        window.isReviewSession = isReview;
        window.currentQuestionIndex = 0;
        window.stats = { mastered: 0, unclear: 0, forgot: 0 };
        window.sessionAnswers = [];
    }

    // 显示会话界面（测试和复习共用）
    function showSessionInterface() {
        var ss = document.getElementById('startScreen');
        if (ss) ss.style.display = 'none';
        document.getElementById('managementScreen').style.display = 'none';
        document.getElementById('testScreen').style.display = 'block';
        document.getElementById('completionScreen').classList.remove('show');
        
        if (typeof window.showQuestion === 'function') {
            window.showQuestion();
        } else {
            console.error('showQuestion 函数未定义');
            alert('系统错误：showQuestion 函数未定义');
            return false;
        }
        window.scrollTo(0, 0);
        return true;
    }

    // 复习模式启动
    window.startReview = function startReview() {
        try {
            if (!window.reviewStore.meta) {
                window.reviewStore.meta = { globalProgressIndex: 0, reviewProgress: 0 };
            }
            
            // 检查前置条件
            if (!checkReviewPrerequisites()) return;
            
            // 构建候选题目
            const candidates = buildReviewCandidates();
            
            // 筛选低掌握度题目
            const lowMasteryQuestions = selectLowMasteryQuestions(candidates);
            if (!lowMasteryQuestions) return;
            
            // 设置复习题目列表
            window.reviewSessionQuestions = lowMasteryQuestions;
            
            // 调试信息
            console.log('复习模式：选择了', lowMasteryQuestions.length, '个掌握度低于', CONFIG.MASTERY_THRESHOLD, '%的题目');
            lowMasteryQuestions.forEach((q, index) => {
                const questionText = typeof q === 'string' ? q : (q.question || '未知题目');
                console.log(`题目${index + 1}: ${questionText.substring(0, 30)}...`);
            });
            
            // 初始化状态并显示界面
            initializeSessionState(true);
            showSessionInterface();
            
        } catch (e) {
            console.error('复习启动失败:', e);
            console.error('错误堆栈:', e.stack);
            alert('复习启动失败，请重试。错误信息：' + e.message);
        }
    };

    // 显示题目
    window.showQuestion = function showQuestion() {
        // 根据模式选择题目源
        const questionSource = window.isReviewSession ? window.reviewSessionQuestions : window.testSessionQuestions;
        const question = questionSource[window.currentQuestionIndex];
        if (!question) return;
        document.getElementById('questionText').textContent = question.question;
        
        // 使用innerHTML和markdown解析来显示翻译，支持加粗格式
        const translationEl = document.getElementById('translationText');
        if (translationEl) {
            translationEl.innerHTML = window.parseMarkdown(question.translation);
        }

        const kb = document.getElementById('knowledgeBelow');
        if (kb) { 
            kb.innerHTML = window.parseMarkdown(question.knowledge_point); 
            kb.classList.remove('show'); 
            kb.style.display = 'none'; 
        }

        // 重置答案区（翻译容器）显示状态
        const answerSection = document.getElementById('answerSection');
        if (answerSection) { answerSection.classList.remove('show'); answerSection.style.display = 'none'; }
        // 显示定时器，居中等待
        const timerEl = document.getElementById('timer');
        if (timerEl) { timerEl.style.display = 'block'; }

        // 重置按钮显隐：每道题都应显示三按钮，隐藏“下一题”
        const masteredBtn = document.getElementById('masteredBtn');
        const unclearBtn = document.getElementById('unclearBtn');
        const forgotBtn = document.getElementById('forgotBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (masteredBtn) { masteredBtn.classList.remove('hide'); masteredBtn.style.display = ''; }
        if (unclearBtn) { unclearBtn.classList.remove('hide'); unclearBtn.style.display = ''; }
        if (forgotBtn) { forgotBtn.classList.remove('hide'); forgotBtn.style.display = ''; }
        if (nextBtn) { nextBtn.classList.remove('show'); nextBtn.style.display = 'none'; }

        // 开始题目计时
        const questionId = window.getQuestionKey ? window.getQuestionKey(question) : question.question;
        if (typeof window.startQuestionTimer === 'function') window.startQuestionTimer(questionId);
        const entry = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[questionId]) || {};
        const mastery = window.calculateMastery(entry.history || []);

        document.getElementById('masteryScoreText').textContent = `掌握度：${mastery}%`;

        // 更新收藏按钮状态
        const favoriteBtn = document.getElementById('favBtn');
        if (favoriteBtn) {
            const isFavorited = entry.favorited || false;
            favoriteBtn.textContent = isFavorited ? '★' : '☆';
        }

        // 计算进度显示
        let progressText;
        if (window.isReviewSession) {
            // 复习模式：保持原来的显示方式（当前会话中的位置）
            const progress = `${window.currentQuestionIndex + 1} / ${window.reviewSessionQuestions.length}`;
            progressText = `第 ${progress} 题`;
        } else {
            // 测试模式：显示在整个题库中的位置
            const globalProgressIndex = window.reviewStore.meta.globalProgressIndex || 0;
            const currentGlobalIndex = globalProgressIndex + window.currentQuestionIndex + 1;
            const totalQuestions = window.questions.length;
            
            progressText = `第 ${currentGlobalIndex} / ${totalQuestions} 题`;
        }
        
        document.getElementById('overallProgressTop').textContent = progressText;

        // 更新顶部进度条
        updateTopProgressBar();

        // 启动答题可视计时与揭示逻辑
        if (typeof window.startAnswerTimer === 'function') window.startAnswerTimer();
    };

    // 选择答案
    window.selectAnswer = function selectAnswer(type) {
        stopAnswerTimer();
        const questionSource = window.isReviewSession ? window.reviewSessionQuestions : window.testSessionQuestions;
        const question = questionSource[window.currentQuestionIndex];
        if (!question) return;

        const key = window.getQuestionKey ? window.getQuestionKey(question) : question.question;
        const entry = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[key]) || {};
        const before = {
            mastered: entry.masteredCount || 0,
            unclear: entry.unclearCount || 0,
            forgot: entry.forgotCount || 0
        };
        console.log('[selectAnswer] start', {
            type,
            isReviewSession: !!window.isReviewSession,
            index: window.currentQuestionIndex,
            key,
            before
        });
        if (type === 'forgot') entry.forgotCount = (entry.forgotCount || 0) + 1;
        else if (type === 'unclear') entry.unclearCount = (entry.unclearCount || 0) + 1;
        else if (type === 'mastered') entry.masteredCount = (entry.masteredCount || 0) + 1;

        // 更新最近结果历史（新→旧队尾为最新），最多保留20条
        if (!Array.isArray(entry.history)) entry.history = [];
        const marker = type === 'mastered' ? 'm' : (type === 'unclear' ? 'u' : 'f');
        entry.history.push(marker);
        if (entry.history.length > 20) entry.history.splice(0, entry.history.length - 20);
        window.reviewStore.items[key] = entry;
        try {
            if (!Array.isArray(window.sessionAnswers)) window.sessionAnswers = [];
            window.sessionAnswers.push({ key, type });
        } catch (e) {}
        window.saveStore();

        console.log('[selectAnswer] saved', { key, history: entry.history });

        // 隐藏定时器
        const timer = document.getElementById('timer');
        if (timer) { 
            timer.classList.remove('animate'); 
            timer.style.display = 'none'; 
        }
        
        // 检查答案区是否已经显示
        const answerSection = document.getElementById('answerSection');
        const isAnswerShown = answerSection && answerSection.classList.contains('show') && answerSection.style.display === 'block';
        
        if (isAnswerShown) {
            // 如果答案区已经显示，直接进入下一题
            window.nextQuestion();
        } else {
            // 如果答案区还没显示，保持原有逻辑
            const kb = document.getElementById('knowledgeBelow');
            if (kb) { kb.classList.add('show'); kb.style.display = 'block'; }
            if (answerSection) { answerSection.classList.add('show'); answerSection.style.display = 'block'; }

            document.getElementById('masteredBtn').classList.add('hide');
            document.getElementById('unclearBtn').classList.add('hide');
            document.getElementById('forgotBtn').classList.add('hide');
            const nextBtn = document.getElementById('nextBtn');
            nextBtn.classList.add('show');
            nextBtn.style.display = 'inline-block'; // 覆盖先前的 display:none

            // 打印按钮显隐状态，便于定位后续题目按钮不出现的问题
            const states = {
                masteredHidden: document.getElementById('masteredBtn').classList.contains('hide'),
                unclearHidden: document.getElementById('unclearBtn').classList.contains('hide'),
                forgotHidden: document.getElementById('forgotBtn').classList.contains('hide'),
                nextShown: document.getElementById('nextBtn').classList.contains('show')
            };
            console.log('[selectAnswer] buttons state', states);
        }

        // 管理界面展示时再统一刷新进度
    };

    // 开始答题计时器
    window.startAnswerTimer = function startAnswerTimer() {
        if (window.answerTimer) clearTimeout(window.answerTimer);

        // 重置并启动4秒圆环动画
        const timer = document.getElementById('timer');
        if (timer) {
            const circle = timer.querySelector('.timer-circle-progress');
            timer.classList.remove('animate');
            if (circle) {
                circle.style.strokeDashoffset = '107';
                // 强制重排，确保可以重新触发动画
                // eslint-disable-next-line no-unused-expressions
                circle.getBoundingClientRect();
            }
            timer.classList.add('animate');
        }

        window.answerTimer = setTimeout(() => {
            // 定时器结束：隐藏定时器，显示答案区，但保持三个按钮显示
            const t = document.getElementById('timer');
            if (t) { t.classList.remove('animate'); t.style.display = 'none'; }
            const kb = document.getElementById('knowledgeBelow');
            if (kb) { kb.classList.add('show'); kb.style.display = 'block'; }
            const answerSection = document.getElementById('answerSection');
            if (answerSection) { answerSection.classList.add('show'); answerSection.style.display = 'block'; }
            // 保持三个按钮显示，不显示"下一题"按钮
        }, CONFIG.TIMER_DURATION);
    };

    // 停止答题计时器clearTimeout
    function stopAnswerTimer() {
        if (window.answerTimer) {
            clearTimeout(window.answerTimer);
            window.answerTimer = null;
        }
        // 停止并清理圆环动画
        const timer = document.getElementById('timer');
        if (timer) timer.classList.remove('animate');
    }

    // 下一题
    window.nextQuestion = function nextQuestion() {
        stopAnswerTimer();
        const t2 = document.getElementById('timer');
        if (t2) { t2.classList.remove('animate'); t2.style.display = 'none'; }
        // 记录本题学习到"今日统计"
        try {
            const questionSource = window.isReviewSession ? window.reviewSessionQuestions : window.testSessionQuestions;
            const current = questionSource[window.currentQuestionIndex];
            if (current) {
                const questionId = window.getQuestionKey ? window.getQuestionKey(current) : current.question;
                if (typeof window.recordQuestionStudy === 'function') {
                    window.recordQuestionStudy(questionId);
                }
            }
        } catch (e) { /* 忽略统计异常，不影响主流程 */ }

        window.currentQuestionIndex++;
        
        // 根据模式选择题目源
        const questionSource = window.isReviewSession ? window.reviewSessionQuestions : window.testSessionQuestions;
        
        if (window.currentQuestionIndex >= questionSource.length) {
            updateSessionProgress();
            showCompletion();
        } else {
            showQuestion();
        }
    };

    // 更新会话进度（测试模式和复习模式通用）
    function updateSessionProgress() {
        if (window.isReviewSession) {
            // 复习模式：更新复习进度（基于本次复习的题目数量）
            if (window.reviewSessionQuestions.length > 0) {
                const lastQuestion = window.reviewSessionQuestions[window.reviewSessionQuestions.length - 1];
                const lastIndex = (window.questions || []).findIndex(q => q.question === lastQuestion.question);
                
                if (lastIndex !== -1) {
                    // 确保复习进度不超过测试进度
                    const globalProgress = window.reviewStore.meta.globalProgressIndex || 0;
                    const newReviewProgress = Math.min(lastIndex + 1, globalProgress);
                    window.reviewStore.meta.reviewProgress = newReviewProgress;
                    window.saveStore();
                    console.log('复习进度已更新，下次复习从位置', newReviewProgress, '开始 (测试进度:', globalProgress, ')');
                }
            }
        } else {
            // 测试模式：更新全局进度（直接使用 pendingProgressIndex）
            window.reviewStore.meta.globalProgressIndex = (window.reviewStore.meta.pendingProgressIndex || 0);
            window.saveStore();
            console.log('测试进度已更新，下次测试从位置', window.reviewStore.meta.globalProgressIndex, '开始');
        }
    }

    // 显示完成界面
    window.showCompletion = function showCompletion() {
        if (typeof window.updateTimeDisplay === 'function') window.updateTimeDisplay();
        document.getElementById('testScreen').style.display = 'none';
        document.getElementById('completionScreen').classList.add('show');
        
        // 启动完成屏幕计时器
        if (typeof window.startCompletionScreenTimer === 'function') {
            window.startCompletionScreenTimer();
        }

        // 完成后将进度条设为100%
        const pf = document.getElementById('progressFill');
        if (pf) pf.style.width = '100%';

        const list = document.getElementById('completionList');
        if (!list) return;
        list.innerHTML = '';
        // 设置标题与题源
        const titleEl = document.querySelector('.completion-title');
        if (titleEl) titleEl.textContent = window.isReviewSession ? '复习完成！' : '测试完成！';
        const questions = window.isReviewSession ? (window.reviewSessionQuestions || []) : (window.testSessionQuestions || []);
        const toShow = new Set((window.sessionAnswers || []).filter(a => a && a.type !== 'mastered').map(a => a.key));
        let shown = 0;
        questions.forEach((q, index) => {
            const k = window.getQuestionKey ? window.getQuestionKey(q) : q.question;
            if (!toShow.has(k)) return;
            const item = document.createElement('div');
            item.className = 'completion-item';
            item.innerHTML = `
                <div class="q">Q${index + 1}: ${q.question}</div>
                <div class="t">A: ${window.parseMarkdown(q.translation)}</div>
            `;
            list.appendChild(item);
            shown++;
        });
        if (shown === 0) {
            const item = document.createElement('div');
            item.className = 'completion-item';
            item.textContent = '本次会话没有未掌握的题目（未选择模糊/忘记）';
            list.appendChild(item);
        }
    };

    // 顶部进度条：根据当前题号/总题数更新宽度
    function updateTopProgressBar() {
        const questionSource = window.isReviewSession ? (window.reviewSessionQuestions || []) : (window.testSessionQuestions || []);
        const total = questionSource.length || 0;
        const current = Math.min(total, window.currentQuestionIndex + 1);
        const percent = total > 0 ? (current / total) * 100 : 0;
        const pf = document.getElementById('progressFill');
        if (pf) pf.style.width = `${percent}%`;
    }

})();
