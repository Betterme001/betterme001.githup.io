// controllers/bankManager.js
// 题库管理相关函数

(function () {
    // 切换题库
    window.switchBank = function switchBank(bankId) {
        try {
            window.currentBankId = bankId;
            // 保存选择的题库ID到localStorage
            localStorage.setItem('selectedBankId', bankId);
            if (typeof window.loadStore === 'function') window.loadStore(bankId);
            const bank = (CONFIG.BANKS && CONFIG.BANKS[bankId]) || CONFIG.BANKS[CONFIG.DEFAULT_BANK_ID];
            if (typeof window.loadQuestions === 'function') window.loadQuestions(bankId, bank.url).then(() => {
                if (typeof window.updateProgressDisplay === 'function') window.updateProgressDisplay();
                if (typeof window.updateTimeDisplay === 'function') window.updateTimeDisplay();
                if (typeof window.showManagementScreen === 'function') window.showManagementScreen();
            });
        } catch (e) { 
            console.error('切换题库失败', e); 
        }
    };

    // 初始化题库下拉选择器
    window.initBankSelector = function initBankSelector() {
        const sel = document.getElementById('bankSelect');
        if (!sel || !CONFIG || !CONFIG.BANKS) return;
        
        // 从localStorage读取上次选择的题库ID
        const savedBankId = localStorage.getItem('selectedBankId');
        const currentBankId = savedBankId || window.currentBankId || CONFIG.DEFAULT_BANK_ID;
        
        sel.innerHTML = '';
        Object.keys(CONFIG.BANKS).forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = CONFIG.BANKS[id].name || id;
            if (id === currentBankId) opt.selected = true;
            sel.appendChild(opt);
        });
        
        // 如果localStorage中有保存的题库ID，自动切换到这个题库
        if (savedBankId && savedBankId !== CONFIG.DEFAULT_BANK_ID) {
            window.currentBankId = savedBankId;
            // 延迟执行切换，确保页面完全加载
            setTimeout(() => {
                switchBank(savedBankId);
            }, 100);
        }
    };

    // 页面加载完成后初始化题库选择器
    window.addEventListener('load', function() {
        if (typeof window.initBankSelector === 'function') {
            window.initBankSelector();
        }
    });

})();
