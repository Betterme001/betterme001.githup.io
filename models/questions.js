// models/questions.js
// 题目数据模型与掌握度计算（由 services/questions.js 移动）

(function(){
    window.questions = [];

    window.loadQuestions = async function loadQuestions(bankId, url) {
        try {
            const id = bankId || (window.currentBankId || CONFIG.DEFAULT_BANK_ID);
            const cfg = url ? { url } : (CONFIG.BANKS[id] || CONFIG.BANKS[CONFIG.DEFAULT_BANK_ID]);
            window.currentBankId = id;
            const response = await fetch(cfg.url);
            window.questions = await response.json();
            console.log(`加载了 ${window.questions.length} 个题目（题库: ${id}）`);
            window.loadStore(id);
        } catch (error) {
            console.error('加载题目数据失败:', error);
            window.questions = [
                { question: "一个感到无聊的人", translation: "a bored man", knowledge_point: "形容词" },
                { question: "令人厌烦的人", translation: "a boring man", knowledge_point: "形容词" },
                { question: "她没有被逗笑", translation: "She was not amused", knowledge_point: "形容词" }
            ];
        }
    };

    window.getQuestionKey = function getQuestionKey(q) {
        return q.question;
    };

    /**
     * 掌握度计算（仅基于历史结果数组）
     * - 只按“最近几次更重要”（序号衰减），不再兼容旧的 m/u/f 累计。
     * - 规则：
     *   1) 若无 history，返回 0；若仅1次，返回 50%（至少练2次）。
     *   2) 窗口 N=6，λ=0.8；记分 m=1, u=0.5, f=0；
     *      mastery = round(100 * Σ(w_i * score_i) / Σ(w_i))，i 从最新往旧。
     * 
     * * 参考设定（用于评估，不在函数内强制）：
     * - 窗口 N=6，λ=0.8，新→旧权重约 [1, 0.8, 0.64, 0.512, 0.4096, 0.32768]
     * - 目标掌握度阈值常用：80%/85%/90%
     * 
     * 阈值示例（N=6, λ=0.8）：
     * - 80%：
     *   · 最近出现1次 u：再做2次 m（总3次）即可 ≥80%
     *   · 最近出现1次 f：再做3次 m（总4次）即可 ≥80%
     * - 85%：
     *   · 含1次 u：满6次时在任意位置均可 ≥85%
     *   · 含1次 f：需把 f 挤到第4新或更旧；最坏从最新 f 起，再做3次 m
     * - 90%：
     *   · 含1次 u：把 u 挤到第3新或更旧；最坏从最新 u 起，再做2次 m
     *   · 含1次 f：需把 f 挤到最旧；最坏从最新 f 起，再做5次 m
     */
    window.calculateMastery = function calculateMastery(history) {
        if (!Array.isArray(history) || history.length === 0) return 0;
        if (history.length === 1) return 50;

        const N = 6;
        const lambda = 0.8;
        const recent = history.slice(-N); // 末尾为最新

        let wSum = 0;
        let sSum = 0;
        for (let i = recent.length - 1, rank = 0; i >= 0; i--, rank++) {
            const r = recent[i];
            const w = Math.pow(lambda, rank);
            const score = r === 'm' ? 1 : (r === 'u' ? 0.5 : 0);
            wSum += w;
            sSum += w * score;
        }
        if (wSum === 0) return 0;
        return Math.round((sSum / wSum) * 100);
    };

    window.getLowMasteryQuestionsFromCandidates = function getLowMasteryQuestionsFromCandidates(candidates) {
        const result = [];
        const targetCount = (typeof CONFIG !== 'undefined' && CONFIG.SESSION_SIZE) || 10;
        const masteryThreshold = (typeof CONFIG !== 'undefined' && CONFIG.MASTERY_THRESHOLD) || 80;
        
        for (let i = 0; i < candidates.length && result.length < targetCount; i++) {
            const q = candidates[i];
            const key = window.getQuestionKey(q);
            const entry = (window.reviewStore && window.reviewStore.items && window.reviewStore.items[key]) || {};
            const mastery = window.calculateMastery(entry.history || []);
            if (mastery <= masteryThreshold) {
                result.push(q);
            }
        }
        return result;
    };

    window.buildSequentialQuestions = function buildSequentialQuestions(startIndex, count) {
        const result = [];
        const totalQuestions = window.questions.length || 0;
        
        // 计算从startIndex开始到题库末尾还有多少题目
        const remainingQuestions = totalQuestions - startIndex;
        
        // 取剩余题目数量和目标数量的较小值，不循环重复使用题目
        const actualCount = Math.min(count, remainingQuestions);
        
        for (let i = 0; i < actualCount; i++) {
            const idx = startIndex + i;
            if (idx < totalQuestions) {
                result.push(window.questions[idx]);
            }
        }
        return result;
    };

    /**
     * 测试函数：计算添加3个'f'后的掌握度变化
     * 用于分析不同初始掌握度添加3个'f'后的效果
     */
    window.testAddThreeF = function testAddThreeF() {
        // 测试不同初始掌握度的情况
        const testCases = [
            // 100%掌握度的情况（2个'm'）
            { name: '100% (2个m)', history: ['m', 'm'] },
            // 90%掌握度的情况（需要找到能产生90%的组合）
            // 例如：['m', 'm', 'm', 'u'] 或者 ['m', 'u'] 等
            { name: '90% (4m1u)', history: ['m', 'm', 'm', 'm', 'u'] },
            { name: '90% (1m1u)', history: ['m', 'u'] },
            // 80%掌握度的情况
            { name: '80% (1m1u)', history: ['m', 'u'] },
            { name: '80% (2m2u)', history: ['m', 'm', 'u', 'u'] },
        ];

        console.log('=== 测试添加3个"f"后的掌握度变化 ===\n');
        
        testCases.forEach(testCase => {
            const originalHistory = [...testCase.history];
            const originalMastery = window.calculateMastery(originalHistory);
            
            // 添加3个'f'
            const newHistory = [...originalHistory, 'f', 'f', 'f'];
            const newMastery = window.calculateMastery(newHistory);
            
            const reduction = originalMastery - newMastery;
            const reductionPercent = originalMastery > 0 ? (reduction / originalMastery * 100).toFixed(1) : 0;
            
            console.log(`${testCase.name}:`);
            console.log(`  原始: ${originalMastery}% (history: [${originalHistory.join(', ')}])`);
            console.log(`  添加3个'f'后: ${newMastery}% (history: [${newHistory.join(', ')}])`);
            console.log(`  降低: ${reduction}% (降低 ${reductionPercent}%)`);
            console.log('');
        });
        
        // 特别测试100%、90%、80%的情况
        console.log('=== 针对100%、90%、80%的精确测试 ===\n');
        
        // 找出能产生100%、90%、80%的history
        const findHistoryForMastery = (targetMastery) => {
            // 尝试不同的组合
            const combinations = [
                ['m', 'm'],
                ['m', 'm', 'm'],
                ['m', 'm', 'm', 'm'],
                ['m', 'u'],
                ['m', 'm', 'u'],
                ['m', 'm', 'm', 'u'],
                ['m', 'm', 'm', 'm', 'u'],
            ];
            
            for (const combo of combinations) {
                const mastery = window.calculateMastery(combo);
                if (Math.abs(mastery - targetMastery) <= 2) { // 允许2%误差
                    return combo;
                }
            }
            return null;
        };
        
        [100, 90, 80].forEach(target => {
            const history = findHistoryForMastery(target);
            if (history) {
                const originalMastery = window.calculateMastery(history);
                const newHistory = [...history, 'f', 'f', 'f'];
                const newMastery = window.calculateMastery(newHistory);
                const reduction = originalMastery - newMastery;
                
                console.log(`${target}%掌握度:`);
                console.log(`  原始history: [${history.join(', ')}] → ${originalMastery}%`);
                console.log(`  添加3个'f': [${newHistory.join(', ')}] → ${newMastery}%`);
                console.log(`  降低: ${reduction}% (降低 ${(reduction/originalMastery*100).toFixed(1)}%)`);
                console.log('');
            }
        });
    };

    /**
     * 重设所有题目的掌握度
     * @param {string} mode - 'clear': 清空为0%, 'set50': 设置为50%
     * @returns {object} 操作结果
     */
    window.resetAllMastery = function resetAllMastery(mode) {
        if (!window.reviewStore || !window.reviewStore.items) {
            console.warn('没有找到学习数据');
            return { success: false, message: '没有找到学习数据' };
        }

        if (mode !== 'clear' && mode !== 'set50') {
            return { success: false, message: '无效的模式，请使用 "clear" 或 "set50"' };
        }

        let processedCount = 0;
        let resetCount = 0;
        const targetHistory = mode === 'clear' ? [] : ['m']; // 清空用[]，50%用['m']

        // 遍历所有题目
        Object.keys(window.reviewStore.items).forEach(key => {
            const entry = window.reviewStore.items[key];
            if (!entry || typeof entry !== 'object') {
                return; // 跳过无效条目（确保entry是对象）
            }

            processedCount++;

            // 检查是否已经有history（确保history是数组）
            const hasHistory = Array.isArray(entry.history) && entry.history.length > 0;
            
            // 如果当前已经是目标状态，跳过
            if (mode === 'clear' && !hasHistory) {
                return; // 已经是空的了（包括undefined、null、空数组）
            }
            // set50模式：如果已经是1条记录且是'm'，跳过（统一使用'm'表示50%）
            if (mode === 'set50' && Array.isArray(entry.history) && entry.history.length === 1 && entry.history[0] === 'm') {
                return; // 已经是50%了（使用'm'表示）
            }

            // 重置history（确保entry.history被设置为数组）
            try {
                entry.history = [...targetHistory]; // 使用展开运算符创建新数组
                resetCount++;

                const newMastery = window.calculateMastery(entry.history);
                console.log(`题目 "${String(key).substring(0, 30)}..." 掌握度已${mode === 'clear' ? '清空' : '设置为50%'} (新掌握度: ${newMastery}%)`);
            } catch (error) {
                console.error(`处理题目 "${String(key).substring(0, 30)}..." 时出错:`, error);
                // 继续处理下一个题目，不中断整个流程
            }
        });

        // 保存数据
        window.saveStore();

        const modeText = mode === 'clear' ? '清空为0%' : '设置为50%';
        const message = `已处理 ${processedCount} 个题目，成功${modeText} ${resetCount} 个题目`;
        console.log(message);
        
        return {
            success: true,
            message: message,
            processedCount: processedCount,
            resetCount: resetCount,
            mode: mode
        };
    };

    /**
     * 将所有题目的掌握度减少50%
     * 实现方式：在每条题目的history末尾添加适量的'f'记录
     * 这样掌握度会立即降低，但后续通过复习可以恢复到原来的水平
     */
    window.reduceAllMasteryBy50Percent = function reduceAllMasteryBy50Percent() {
        if (!window.reviewStore || !window.reviewStore.items) {
            console.warn('没有找到学习数据');
            return { success: false, message: '没有找到学习数据' };
        }

        let processedCount = 0;
        let reducedCount = 0;
        const maxAttempts = 10; // 最多尝试添加10条负面记录，避免无限循环

        // 遍历所有题目
        Object.keys(window.reviewStore.items).forEach(key => {
            const entry = window.reviewStore.items[key];
            if (!entry || !Array.isArray(entry.history) || entry.history.length === 0) {
                return; // 跳过没有历史记录的题目
            }

            processedCount++;
            
            // 计算当前掌握度
            const currentMastery = window.calculateMastery(entry.history);
            if (currentMastery <= 0) {
                return; // 已经是0，跳过
            }

            // 目标掌握度（减少50%）
            const targetMastery = Math.round(currentMastery * 0.5);
            
            // 在history末尾添加'f'记录，直到达到目标掌握度
            let attempts = 0;
            let newHistory = [...entry.history]; // 复制数组
            
            while (attempts < maxAttempts) {
                const currentMasteryAfterAdd = window.calculateMastery(newHistory);
                
                // 如果已经达到或低于目标掌握度，停止
                if (currentMasteryAfterAdd <= targetMastery) {
                    break;
                }
                
                // 添加一条'f'记录
                newHistory.push('f');
                attempts++;
            }
            
            // 更新history
            if (attempts > 0) {
                entry.history = newHistory;
                reducedCount++;
                const finalMastery = window.calculateMastery(newHistory);
                console.log(`题目 "${key.substring(0, 20)}..." 掌握度: ${currentMastery}% → ${finalMastery}% (添加了 ${attempts} 条负面记录)`);
            }
        });

        // 保存数据
        window.saveStore();

        const message = `已处理 ${processedCount} 个题目，成功降低 ${reducedCount} 个题目的掌握度（约50%）`;
        console.log(message);
        
        return {
            success: true,
            message: message,
            processedCount: processedCount,
            reducedCount: reducedCount
        };
    };
})();


