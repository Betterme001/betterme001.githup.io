// 时间统计与题目计时（MVC：Service 层）
// 依赖：全局 window.reviewStore、CONFIG

(function(){
    // 导出用于其它模块访问的状态
    window.questionStartTime = null;
    window.currentQuestionId = null;

    // 开始题目计时
    window.startQuestionTimer = function startQuestionTimer(questionId) {
        window.currentQuestionId = questionId;
        window.questionStartTime = new Date();
    };


    // 添加题目到今日学习统计
    window.addQuestionToTodayCount = function addQuestionToTodayCount(questionId) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        if (window.reviewStore.meta.lastStudyDate !== todayStr) {
            // 新的一天，重置今日题目统计
            window.reviewStore.meta.todayQuestionCount = 0;
            window.reviewStore.meta.todayQuestionIds = [];
            window.reviewStore.meta.lastStudyDate = todayStr;
        }

        // 如果题目ID不在今日列表中，则添加
        if (!window.reviewStore.meta.todayQuestionIds.includes(questionId)) {
            window.reviewStore.meta.todayQuestionIds.push(questionId);
            window.reviewStore.meta.todayQuestionCount = window.reviewStore.meta.todayQuestionIds.length;
            window.saveStore();
            // 不在这里调用updateTimeDisplay，由调用方统一处理
        }
    };

    // 记录题目学习（翻动卡片时立即记录）
    window.recordQuestionStudy = function recordQuestionStudy(questionId) {
        // 记录题目数量（去重）
        window.addQuestionToTodayCount(questionId);
        
        // 计算实际学习时间（从开始到结束，最多1分钟）
        let studyTime = 1; // 默认1秒
        if (window.questionStartTime) {
            const endTime = new Date();
            const actualTime = Math.floor((endTime - window.questionStartTime) / 1000); // 转换为秒
            studyTime = Math.min(actualTime, 60); // 最多1分钟
        }
        
        // 记录学习时间（不重复调用updateTimeDisplay）
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        if (window.reviewStore.meta.lastStudyDate !== todayStr) {
            // 新的一天，重置今日学习时间
            window.reviewStore.meta.todayStudyTime = studyTime;
            window.reviewStore.meta.lastStudyDate = todayStr;
        } else {
            // 同一天，累加学习时间
            window.reviewStore.meta.todayStudyTime += studyTime;
        }

        // 更新总学习时间
        window.reviewStore.meta.totalStudyTime += studyTime;

        window.saveStore();
        // 只调用一次updateTimeDisplay
        window.updateTimeDisplay();
        console.log(`今日总学习时间更新：+${studyTime}秒，总计：${window.reviewStore.meta.totalStudyTime}秒`);

    };

    // 辅助：格式化时间
    window.formatTime = function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60); // 向下取整
        if (minutes === 0) {
            return `0分钟`;
        }
        return `${minutes}分钟`;
    };

    // 渲染管理界面时间显示（修改为合并所有题库）
    window.updateTimeDisplay = function updateTimeDisplay() {
        // 计算今天的实时统计（所有题库）
        let todayStudyTime = 0;
        let todayQuestionCount = 0;
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        
        // 遍历所有题库，累加今日学习时间和题目数量
        Object.keys(CONFIG.BANKS).forEach(bankId => {
            try {
                const key = `${CONFIG.STORAGE_KEY_PREFIX}:${bankId}`;
                const raw = localStorage.getItem(key);
                if (raw) {
                    const bankData = JSON.parse(raw);
                    const meta = bankData.meta || {};
                    // 只累加今天的统计数据（如果lastStudyDate是今天）
                    if (meta.lastStudyDate === todayStr) {
                        todayStudyTime += meta.todayStudyTime || 0;
                        todayQuestionCount += meta.todayQuestionCount || 0;
                    }
                }
            } catch (e) {
                console.warn(`读取题库 ${bankId} 今日数据失败:`, e);
            }
        });
        
        // 获取昨天的学习时间（合并所有题库）
        let yesterdayStudyTime = 0;
        let yesterdayQuestionCount = 0;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
        
        // 使用合并后的统计数据获取昨天的数据
        if (typeof window.mergeAllBankStats === 'function') {
            const mergedStats = window.mergeAllBankStats();
            if (mergedStats[yesterdayStr]) {
                yesterdayStudyTime = mergedStats[yesterdayStr].studyTime || 0;
                yesterdayQuestionCount = mergedStats[yesterdayStr].questionCount || 0;
            }
        }
        
        const timeInfo = document.getElementById('timeInfo');
        if (timeInfo) {
            timeInfo.innerHTML = `
                <div class="time-stats">
                    <div class="time-item">今日学习：${window.formatTime(todayStudyTime)}</div>
                    <div class="time-item">今日题目：${todayQuestionCount} 道</div>
                </div>
            `;
        }
        
        // 更新历史列表（如果存在）- 显示昨天的学习数据
        const historyList = document.getElementById('historyList');
        if (historyList) {
            historyList.innerHTML = '';
            
            // 显示昨天的学习数据
            if (yesterdayStudyTime > 0 || yesterdayQuestionCount > 0) {
                const yesterdayItem = document.createElement('div');
                yesterdayItem.className = 'history-item';
                yesterdayItem.innerHTML = `
                    <div style="display:flex;gap:12px;">
                        <div style="width:120px;">${yesterdayStr.replace(/-/g,'')}</div>
                        <div style="width:120px;">${window.formatTime(yesterdayStudyTime)}</div>
                        <div style="width:120px;">${yesterdayQuestionCount} 道</div>
                    </div>
                `;
                historyList.appendChild(yesterdayItem);
            } else {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'history-item';
                emptyItem.textContent = '暂无历史学习记录';
                historyList.appendChild(emptyItem);
            }
        }
    };

    // 完成屏幕计时器相关
    window.completionScreenStartTime = null;
    window.completionScreenTimerInterval = null;
    window.completionScreenMaxTime = 60; // 最多1分钟（60秒）

    // 开始完成屏幕计时
    window.startCompletionScreenTimer = function startCompletionScreenTimer() {
        // 清除之前的计时器（如果存在）
        if (window.completionScreenTimerInterval) {
            clearInterval(window.completionScreenTimerInterval);
        }
        
        // 记录开始时间
        window.completionScreenStartTime = new Date();
        
        // 更新显示
        updateCompletionScreenTimeDisplay(0);
        
        // 每秒更新一次显示
        window.completionScreenTimerInterval = setInterval(function() {
            if (!window.completionScreenStartTime) return;
            
            const elapsed = Math.floor((new Date() - window.completionScreenStartTime) / 1000);
            const displayTime = Math.min(elapsed, window.completionScreenMaxTime);
            
            updateCompletionScreenTimeDisplay(displayTime);
            
            // 如果达到上限，停止计时
            if (elapsed >= window.completionScreenMaxTime) {
                stopCompletionScreenTimer();
            }
        }, 1000);
    };

    // 停止完成屏幕计时并记录时间
    window.stopCompletionScreenTimer = function stopCompletionScreenTimer() {
        if (window.completionScreenTimerInterval) {
            clearInterval(window.completionScreenTimerInterval);
            window.completionScreenTimerInterval = null;
        }
        
        if (!window.completionScreenStartTime) return 0;
        
        // 计算实际学习时间（最多1分钟）
        const endTime = new Date();
        const actualTime = Math.floor((endTime - window.completionScreenStartTime) / 1000);
        const studyTime = Math.min(actualTime, window.completionScreenMaxTime);
        
        // 记录学习时间
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        if (window.reviewStore.meta.lastStudyDate !== todayStr) {
            window.reviewStore.meta.todayStudyTime = studyTime;
            window.reviewStore.meta.lastStudyDate = todayStr;
        } else {
            window.reviewStore.meta.todayStudyTime += studyTime;
        }

        window.reviewStore.meta.totalStudyTime += studyTime;
        window.saveStore();
        
        // 重置开始时间
        window.completionScreenStartTime = null;
        
        // 更新管理界面时间显示
        if (typeof window.updateTimeDisplay === 'function') {
            window.updateTimeDisplay();
        }
        
        console.log(`完成屏幕学习时间记录：${studyTime}秒`);
        return studyTime;
    };

    // 更新完成屏幕时间显示（如果需要的话，目前不显示在界面上）
    function updateCompletionScreenTimeDisplay(seconds) {
        // 界面不需要显示时间，所以这个函数暂时保留但不做任何操作
        // 如果需要调试，可以在控制台输出
        // console.log('完成屏幕查看时间：', seconds, '秒');
    }
})();


