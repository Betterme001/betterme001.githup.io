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
})();


