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
        if (typeof window.reviewStore.meta.yesterdayQuestionCount !== 'number') window.reviewStore.meta.yesterdayQuestionCount = 0;
        
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
    const lastStudyDate = window.reviewStore.meta.lastStudyDate || '';
    
    // 如果 lastStudyDate 是空字符串，说明是第一次使用或刚清除进度，只更新日期，不重置今日数据
    if (lastStudyDate === '') {
        console.log(`首次使用或刚清除进度：更新 lastStudyDate 为 ${todayStr}，保留今日数据`);
        window.reviewStore.meta.lastStudyDate = todayStr;
        // 不重置今日数据，保留已有的学习记录
        window.saveStore();
        return;
    }
    
    // 如果今天不是最后学习日期，说明是新的一天，需要重置今日数据
    if (lastStudyDate !== todayStr) {
        console.log(`新的一天开始：${todayStr}，重置今日学习数据`);
        
        // 保存昨天的学习数量（在重置 todayQuestionCount 之前）
        const yesterdayCount = window.reviewStore.meta.todayQuestionCount || 0;
        window.reviewStore.meta.yesterdayQuestionCount = yesterdayCount;
        console.log(`昨天学习了 ${yesterdayCount} 道题目`);
        
        // 记录昨天的数据（用于历史统计）
        window.recordDailyStats(lastStudyDate, {
            studyTime: window.reviewStore.meta.todayStudyTime || 0,
            questionCount: yesterdayCount
        });
        
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
            yesterdayQuestionCount: 0,
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
                yesterdayQuestionCount: 0,
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
    // 获取文件数据（优先从全局变量，如果没有则从localStorage读取）
    let fileData = window.statsInitFileData || null;
    let lastFileDate = window.statsInitFileLastDate || null;
    
    if (!fileData) {
        try {
            const fileDataStr = localStorage.getItem('stats_init_file_data');
            if (fileDataStr) {
                fileData = JSON.parse(fileDataStr);
                lastFileDate = localStorage.getItem('stats_init_file_last_date');
            }
        } catch (e) {
            console.warn('读取文件数据失败:', e);
        }
    }
    
    const mergedStats = {};
    
    // 如果有文件数据，先使用文件数据（文件中的日期使用文件数据，不累加localStorage）
    if (fileData && lastFileDate) {
        const fileDates = Object.keys(fileData);
        console.log('[mergeAllBankStats] 使用文件数据，文件中的日期数量:', fileDates.length, '最后一个日期:', lastFileDate);
        Object.keys(fileData).forEach(date => {
            mergedStats[date] = {
                studyTime: fileData[date].studyTime || 0,
                questionCount: fileData[date].questionCount || 0,
                timestamp: fileData[date].timestamp || 0
            };
        });
    }
    
    // 遍历所有题库，合并localStorage中的数据
    Object.keys(CONFIG.BANKS).forEach(bankId => {
        try {
            const key = getStorageKey(bankId);
            const raw = localStorage.getItem(key);
            if (raw) {
                const bankData = JSON.parse(raw);
                const bankStats = bankData.meta?.dailyStats || {};
                
                // 合并每日数据
                let skippedFromFile = 0;
                let addedFromStorage = 0;
                Object.keys(bankStats).forEach(date => {
                    // 如果有文件数据
                    if (fileData && lastFileDate) {
                        // 如果日期在文件中（包括等于最后一个日期），则完全跳过，不累加localStorage的数据
                        // 因为文件数据已经在上面的代码中使用了
                        if (date in fileData) {
                            // 日期在文件中，跳过，使用文件数据
                            skippedFromFile++;
                            return;
                        }
                        
                        // 如果日期在文件最后一个日期之后，才使用localStorage的数据（累加所有题库）
                        if (date > lastFileDate) {
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
                            addedFromStorage++;
                        }
                    } else {
                        // 如果没有文件数据，则使用原来的逻辑（累加所有题库）
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
                    }
                });
                if (fileData && lastFileDate && (skippedFromFile > 0 || addedFromStorage > 0)) {
                    console.log(`[mergeAllBankStats] 题库 ${bankId}: 跳过文件中的日期 ${skippedFromFile} 个，添加localStorage日期 ${addedFromStorage} 个`);
                }
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


