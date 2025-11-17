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

    // ==================== 盒子学习时间统计 ====================
    
    // 盒子学习状态
    window.boxStudyState = {
        startTime: null,              // 当前段的开始时间
        lastActivityTime: null,       // 最后一次操作时间
        isPaused: false,              // 是否暂停
        isActive: false,              // 是否在盒子中
        saveCounter: 0                // 保存计数器（用于30秒保存）
    };
    
    window.boxStudyMainTimer = null;  // 主计时器

    // 主计时器（每秒执行）
    function boxStudyMainTimerTick() {
        if (!window.boxStudyState.isActive) return;
        
        const now = Date.now();
        const lastActivity = window.boxStudyState.lastActivityTime;
        
        // 如果暂停，清零计数器并返回
        if (window.boxStudyState.isPaused) {
            window.boxStudyState.saveCounter = 0;
            return;
        }
        
        // 1. 检查超时（30秒无操作）
        if (now - lastActivity >= 30000) {
            // 暂停计时（不保存时间，因为用户已经30秒无操作，这段时间不应该算作学习时间）
            window.boxStudyState.isPaused = true;
            window.boxStudyState.saveCounter = 0; // 清零计数器
            // 重置开始时间，这样恢复时从0开始计时
            console.log(`重置 startTime 为 null（暂停时）`);
            window.boxStudyState.startTime = null;
            const pauseDuration = Math.floor((now - lastActivity) / 1000);
            console.log(`盒子学习已暂停：30秒无操作（实际无操作时长：${pauseDuration}秒），不记录学习时间`);
            return;
        }
        
        // 2. 每32秒保存一次（作为备份）
        window.boxStudyState.saveCounter++;
        if (window.boxStudyState.saveCounter >= 32) {
            saveBoxCurrentSegment();
            window.boxStudyState.saveCounter = 0;
        }
    }

    // 保存当前段的学习时间到 localStorage
    function saveBoxCurrentSegment() {
        if (!window.boxStudyState.startTime) return;
        
        const now = Date.now();
        // 计算当前段的学习时间（秒）
        const segmentTime = Math.floor((now - window.boxStudyState.startTime) / 1000);
        
        if (segmentTime <= 0) return;
        
        // 获取今天的日期字符串
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        
        // 确保 reviewStore 已加载
        if (!window.reviewStore || !window.reviewStore.meta) {
            if (typeof window.loadStore === 'function') {
                window.loadStore(window.currentBankId);
            }
        }
        
        // 检查是否是新的一天
        if (window.reviewStore.meta.lastStudyDate !== todayStr) {
            // 新的一天，重置今日学习时间
            window.reviewStore.meta.todayStudyTime = segmentTime;
            window.reviewStore.meta.lastStudyDate = todayStr;
        } else {
            // 同一天，累加学习时间
            window.reviewStore.meta.todayStudyTime += segmentTime;
        }
        
        // 更新总学习时间
        window.reviewStore.meta.totalStudyTime += segmentTime;
        
        // 保存到 localStorage
        if (typeof window.saveStore === 'function') {
            window.saveStore();
        }
        
        // 更新界面显示
        if (typeof window.updateTimeDisplay === 'function') {
            window.updateTimeDisplay();
        }
        
        // 重新设置开始时间（为下一段做准备）
        const newStartTime = new Date(now).toLocaleTimeString();
        console.log(`设置 startTime = ${newStartTime}（保存后，为下一段做准备）`);
        window.boxStudyState.startTime = now;
        
        console.log(`盒子学习时间已保存：${segmentTime}秒，今日累计：${window.reviewStore.meta.todayStudyTime}秒`);
    }

    // 开始盒子学习计时
    window.startBoxStudy = function startBoxStudy() {
        // 清理之前的计时器（如果存在）
        if (window.boxStudyMainTimer) {
            clearInterval(window.boxStudyMainTimer);
            window.boxStudyMainTimer = null;
        }
        
        // 初始化状态
        const startTime = Date.now();
        const startTimeStr = new Date(startTime).toLocaleTimeString();
        window.boxStudyState = {
            startTime: startTime,
            lastActivityTime: startTime,
            isPaused: false,
            isActive: true,
            saveCounter: 0
        };
        
        // 启动主计时器（每秒执行）
        window.boxStudyMainTimer = setInterval(boxStudyMainTimerTick, 1000);
        
        // 监听用户操作
        setupBoxActivityListeners();
        
        console.log(`盒子学习计时已开始，startTime = ${startTimeStr}`);
    };

    // 停止盒子学习计时
    window.stopBoxStudy = function stopBoxStudy() {
        // 保存最后一段
        if (window.boxStudyState.isActive && !window.boxStudyState.isPaused) {
            saveBoxCurrentSegment();
        }
        
        // 清理定时器
        if (window.boxStudyMainTimer) {
            clearInterval(window.boxStudyMainTimer);
            window.boxStudyMainTimer = null;
        }
        
        // 移除事件监听
        removeBoxActivityListeners();
        
        // 重置状态
        window.boxStudyState.isActive = false;
        window.boxStudyState.isPaused = false;
        
        console.log('盒子学习计时已停止');
    };

    // 用户操作时调用（恢复计时）
    window.onBoxUserActivity = function onBoxUserActivity() {
        if (!window.boxStudyState.isActive) return;
        
        window.boxStudyState.lastActivityTime = Date.now();
        
        // 如果之前暂停，恢复计时
        if (window.boxStudyState.isPaused) {
            // 重新设置开始时间（关键！）
            const resumeTime = Date.now();
            const resumeTimeStr = new Date(resumeTime).toLocaleTimeString();
            console.log(`设置 startTime = ${resumeTimeStr}（恢复时，重新开始计时）`);
            window.boxStudyState.startTime = resumeTime;
            window.boxStudyState.isPaused = false;
            window.boxStudyState.saveCounter = 0; // 重置保存计数器
            console.log('盒子学习已恢复，重新开始计时');
        }
    };

    // 设置用户操作监听
    function setupBoxActivityListeners() {
        // 监听滚动、点击、键盘事件
        const events = ['scroll', 'click', 'keydown', 'mousemove'];
        events.forEach(eventType => {
            document.addEventListener(eventType, window.onBoxUserActivity, { passive: true });
        });
    }

    // 移除用户操作监听
    function removeBoxActivityListeners() {
        const events = ['scroll', 'click', 'keydown', 'mousemove'];
        events.forEach(eventType => {
            document.removeEventListener(eventType, window.onBoxUserActivity);
        });
    }

    // 页面卸载时保存（防止刷新丢失数据）
    window.addEventListener('beforeunload', function() {
        if (window.boxStudyState && window.boxStudyState.isActive && !window.boxStudyState.isPaused) {
            // 同步保存（不能使用异步操作）
            if (window.boxStudyState.startTime) {
                const now = Date.now();
                const segmentTime = Math.floor((now - window.boxStudyState.startTime) / 1000);
                
                if (segmentTime > 0) {
                    // 直接操作 localStorage（同步）
                    try {
                        const today = new Date();
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                        
                        const currentBankId = window.currentBankId || CONFIG.DEFAULT_BANK_ID;
                        const key = `${CONFIG.STORAGE_KEY_PREFIX}:${currentBankId}`;
                        const raw = localStorage.getItem(key);
                        
                        if (raw) {
                            const data = JSON.parse(raw);
                            if (!data.meta) data.meta = {};
                            
                            if (data.meta.lastStudyDate !== todayStr) {
                                data.meta.todayStudyTime = segmentTime;
                                data.meta.lastStudyDate = todayStr;
                            } else {
                                data.meta.todayStudyTime = (data.meta.todayStudyTime || 0) + segmentTime;
                            }
                            
                            data.meta.totalStudyTime = (data.meta.totalStudyTime || 0) + segmentTime;
                            localStorage.setItem(key, JSON.stringify(data));
                        }
                    } catch (e) {
                        console.warn('页面卸载时保存盒子学习时间失败:', e);
                    }
                }
            }
        }
    });
})();


