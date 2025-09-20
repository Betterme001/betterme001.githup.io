// app.js
// 全局状态与应用初始化

(function () {
    // 全局运行时状态（由其它模块读写）
    window.currentQuestionIndex = 0;
    window.testQuestions = [];
    window.stats = { mastered: 0, unclear: 0, forgot: 0 };
    window.reviewQuestions = [];
    window.isReviewSession = false;

    // 应用启动：加载本地数据与题目，刷新首页
    window.addEventListener('load', async function () {
        try {
            window.currentBankId = window.currentBankId || CONFIG.DEFAULT_BANK_ID;
            if (typeof window.loadStore === 'function') {
                window.loadStore(window.currentBankId);
            }
            if (typeof window.loadQuestions === 'function') {
                await window.loadQuestions(window.currentBankId);
            }
            if (typeof window.updateTimeDisplay === 'function') {
                window.updateTimeDisplay();
            }
            if (typeof window.updateHeaderProgress === 'function') {
                window.updateHeaderProgress(null);
            }
            if (typeof window.showManagementScreen === 'function') {
                window.showManagementScreen();
            }
        } catch (e) {
            console.warn('应用初始化失败:', e);
        }
    });
})();


