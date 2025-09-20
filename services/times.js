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

    // 渲染管理界面时间显示
    window.updateTimeDisplay = function updateTimeDisplay() {
        const todayTime = window.reviewStore.meta.todayStudyTime || 0;
        const todayQuestions = window.reviewStore.meta.todayQuestionCount || 0;
        const timeInfo = document.getElementById('timeInfo');
        if (timeInfo) {
            timeInfo.innerHTML = `
                <div class="time-stats">
                    <div class="time-item">今日学习：${window.formatTime(todayTime)}</div>
                    <div class="time-item">今日题目：${todayQuestions} 道</div>
                </div>
            `;
        }
    };
})();


