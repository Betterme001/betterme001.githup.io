// 本地存储读写（MVC：Storage 层）
// 依赖：全局 CONFIG、全局 reviewStore（由页面初始化）

function getStorageKey(bankId) {
    const id = bankId || (window.currentBankId || (CONFIG && CONFIG.DEFAULT_BANK_ID));
    return `${CONFIG.STORAGE_KEY_PREFIX}:${id}`;
}

window.loadStore = function loadStore(bankId) {
    try {
        const key = getStorageKey(bankId);
        const raw = localStorage.getItem(key);
        if (raw) {
            window.reviewStore = JSON.parse(raw);
        } else {
            window.reviewStore = { items: {}, meta: {} };
        }
        if (!window.reviewStore.meta) window.reviewStore.meta = {};
        if (!window.reviewStore.items) window.reviewStore.items = {};
        
        // 确保基础字段存在
        if (!window.reviewStore.meta.totalStudyTime) window.reviewStore.meta.totalStudyTime = 0;
        if (!window.reviewStore.meta.todayStudyTime) window.reviewStore.meta.todayStudyTime = 0;
        if (!window.reviewStore.meta.lastStudyDate) window.reviewStore.meta.lastStudyDate = '';
        if (!window.reviewStore.meta.todayQuestionCount) window.reviewStore.meta.todayQuestionCount = 0;
        if (!window.reviewStore.meta.todayQuestionIds) window.reviewStore.meta.todayQuestionIds = [];
        if (typeof window.reviewStore.meta.globalProgressIndex !== 'number') window.reviewStore.meta.globalProgressIndex = 0;
        if (typeof window.reviewStore.meta.reviewProgress !== 'number') window.reviewStore.meta.reviewProgress = 0;
        
        // 检查是否需要每日重置
        window.checkAndResetDailyStats();
    } catch (e) {
        console.warn('读取本地数据失败:', e);
        window.reviewStore = { items: {}, meta: {} };
    }
};

window.saveStore = function saveStore(bankId) {
    try {
        const key = getStorageKey(bankId);
        localStorage.setItem(key, JSON.stringify(window.reviewStore));
    } catch (e) {
        console.warn('保存本地数据失败:', e);
    }
};

// 检查并重置每日统计数据
window.checkAndResetDailyStats = function checkAndResetDailyStats() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    // 如果今天不是最后学习日期，说明是新的一天，需要重置今日数据
    if (window.reviewStore.meta.lastStudyDate !== todayStr) {
        console.log(`新的一天开始：${todayStr}，重置今日学习数据`);
        
        // 记录昨天的数据（用于历史统计）
        if (window.reviewStore.meta.lastStudyDate) {
            window.recordDailyStats(window.reviewStore.meta.lastStudyDate, {
                studyTime: window.reviewStore.meta.todayStudyTime || 0,
                questionCount: window.reviewStore.meta.todayQuestionCount || 0
            });
        }
        
        // 重置今日数据
        window.reviewStore.meta.todayStudyTime = 0;
        window.reviewStore.meta.todayQuestionCount = 0;
        window.reviewStore.meta.todayQuestionIds = [];
        window.reviewStore.meta.lastStudyDate = todayStr;
        
        // 保存重置后的数据
        window.saveStore();
    }
};

// 记录每日统计数据到历史记录
window.recordDailyStats = function recordDailyStats(date, stats) {
    if (!window.reviewStore.meta.dailyStats) {
        window.reviewStore.meta.dailyStats = {};
    }
    
    window.reviewStore.meta.dailyStats[date] = {
        studyTime: stats.studyTime,
        questionCount: stats.questionCount,
        timestamp: Date.now()
    };
    
    console.log(`记录 ${date} 的学习数据：学习时间 ${stats.studyTime}秒，题目数量 ${stats.questionCount}道`);
};

// 获取历史学习数据
window.getDailyStats = function getDailyStats() {
    return window.reviewStore.meta.dailyStats || {};
};

// 清除学习进度（保留历史数据）
window.clearProgress = function clearProgress() {
    // 保存历史学习数据
    const dailyStats = window.reviewStore.meta.dailyStats || {};
    
    localStorage.removeItem(getStorageKey());
    window.reviewStore = { 
        items: {}, 
        meta: { 
            globalProgressIndex: 0, 
            reviewProgress: 0, 
            totalStudyTime: 0, 
            todayStudyTime: 0, 
            lastStudyDate: '', 
            todayQuestionCount: 0, 
            todayQuestionIds: [],
            dailyStats: dailyStats // 保留历史学习数据
        } 
    };
    console.log('已清除本地复习记录，但保留了历史学习数据');
};

// 清除所有数据（包括历史数据）
window.clearAllData = function clearAllData() {
    if (confirm('确定要清除所有数据吗？这将删除所有学习记录和历史数据，此操作不可恢复！')) {
        // 删除所有已知 bank 的 key（保守：只删当前）
        localStorage.removeItem(getStorageKey());
        window.reviewStore = { 
            items: {}, 
            meta: { 
                globalProgressIndex: 0, 
                reviewProgress: 0, 
                totalStudyTime: 0, 
                todayStudyTime: 0, 
                lastStudyDate: '', 
                todayQuestionCount: 0, 
                todayQuestionIds: [],
                dailyStats: {}
            } 
        };
        console.log('已清除当前题库的所有数据，包括历史学习数据');
        alert('当前题库数据已清除');
    }
};

// 获取全局统计存储key
function getGlobalStatsKey() {
    return `${CONFIG.STORAGE_KEY_PREFIX}:global_stats`;
}

// 加载全局统计数据
window.loadGlobalStats = function loadGlobalStats() {
    try {
        const key = getGlobalStatsKey();
        const raw = localStorage.getItem(key);
        if (raw) {
            window.globalStats = JSON.parse(raw);
        } else {
            window.globalStats = { dailyStats: {} };
        }
        if (!window.globalStats.dailyStats) window.globalStats.dailyStats = {};
    } catch (e) {
        console.warn('读取全局统计数据失败:', e);
        window.globalStats = { dailyStats: {} };
    }
};

// 保存全局统计数据
window.saveGlobalStats = function saveGlobalStats() {
    try {
        const key = getGlobalStatsKey();
        localStorage.setItem(key, JSON.stringify(window.globalStats));
    } catch (e) {
        console.warn('保存全局统计数据失败:', e);
    }
};

// 合并所有题库的统计数据
window.mergeAllBankStats = function mergeAllBankStats() {
    const mergedStats = {};
    
    // 遍历所有题库
    Object.keys(CONFIG.BANKS).forEach(bankId => {
        try {
            const key = getStorageKey(bankId);
            const raw = localStorage.getItem(key);
            if (raw) {
                const bankData = JSON.parse(raw);
                const bankStats = bankData.meta?.dailyStats || {};
                
                // 合并每日数据
                Object.keys(bankStats).forEach(date => {
                    if (!mergedStats[date]) {
                        mergedStats[date] = {
                            studyTime: 0,
                            questionCount: 0,
                            timestamp: 0
                        };
                    }
                    mergedStats[date].studyTime += bankStats[date].studyTime || 0;
                    mergedStats[date].questionCount += bankStats[date].questionCount || 0;
                    mergedStats[date].timestamp = Math.max(
                        mergedStats[date].timestamp, 
                        bankStats[date].timestamp || 0
                    );
                });
            }
        } catch (e) {
            console.warn(`读取题库 ${bankId} 统计数据失败:`, e);
        }
    });
    
    // 更新全局统计
    window.globalStats.dailyStats = mergedStats;
    window.saveGlobalStats();
    
    return mergedStats;
};


