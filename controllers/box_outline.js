// controllers/box_outline.js
// 语法盒子相关函数

(function () {
    // 显示语法盒子
    window.showGrammarBox = function showGrammarBox() {
        try {
            // 获取当前题库ID
            const currentBankId = window.currentBankId || CONFIG.DEFAULT_BANK_ID;
            
            // 从配置中获取对应的大纲文件路径
            const bank = CONFIG.BANKS[currentBankId];
            if (!bank || !bank.outline) {
                console.error('未找到题库对应的大纲文件:', currentBankId);
                alert('该题库暂无语法大纲');
                return;
            }
            
            // 加载大纲文件内容
            loadOutlineContent(bank.outline).then(content => {
                // 调用View层显示界面
                if (typeof window.showOutlineScreen === 'function') {
                    window.showOutlineScreen(content, bank.name);
                }
            }).catch(error => {
                console.error('加载大纲文件失败:', error);
                alert('加载语法大纲失败，请重试');
            });
            
        } catch (e) {
            console.error('显示语法盒子失败:', e);
            alert('显示语法盒子失败，请重试');
        }
    };

    // 加载大纲文件内容
    function loadOutlineContent(outlinePath) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', outlinePath, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                }
            };
            xhr.onerror = function() {
                reject(new Error('网络错误，无法加载大纲文件'));
            };
            xhr.send();
        });
    }

    // 解析Markdown内容为HTML
    window.parseOutlineMarkdown = function parseOutlineMarkdown(markdownText) {
        if (!markdownText || typeof markdownText !== 'string') return '';
        
        // 优先使用marked.js解析
        if (typeof marked !== 'undefined') {
            try {
                // 配置marked.js选项
                marked.setOptions({
                    breaks: true,        // 支持换行
                    gfm: true,          // 支持GitHub风格的markdown
                    sanitize: false,    // 允许HTML标签
                    smartLists: true,   // 智能列表
                    smartypants: true   // 智能标点
                });
                
                return marked.parse(markdownText);
            } catch (error) {
                console.warn('marked.js解析失败，使用降级方案:', error);
            }
        }
        
        // 降级方案：使用现有的parseMarkdown函数
        return window.parseMarkdown ? window.parseMarkdown(markdownText) : markdownText;
    };

})();
