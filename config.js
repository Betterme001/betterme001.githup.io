// 语法题目卡片测试 - 配置文件

// Markdown解析函数：将**文字**转换为<strong>文字</strong>
window.parseMarkdown = function parseMarkdown(text) {
    if (!text || typeof text !== 'string') return text;
    
    // 将**文字**转换为<strong>文字</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

const CONFIG = {
    // 测试配置
    SESSION_SIZE: 10,                    // 每次测试题量
    TIMER_DURATION: 4000,                // 每个卡片等待时间（毫秒）
    MAX_QUESTION_STUDY_TIME: 60000,     // 每道题最大学习时间（毫秒）- 1分钟
    MIN_QUESTION_STUDY_TIME: 1000,       // 每道题最小学习时间（毫秒）- 1秒
    
    // 掌握度配置
    MASTERY_THRESHOLD: 80,               // 掌握度阈值（百分比）
    
    // 存储配置（多题库隔离：方案A）
    STORAGE_KEY_PREFIX: 'grammar_review_multi', // localStorage 前缀
    DEFAULT_BANK_ID: 'grammarpoint1_order',
    BANKS: {
        grammarpoint1_order: { 
            name: '语法题库1-句子成分篇-顺序模式', 
            url: 'assets/data/grammarpoint_upperpart_order.json',
            outline: 'assets/data/grammarpoint_upperpart_box_outline.md'
        },
        // 可追加更多题库：
        grammarpoint1_reverse: { 
            name: '语法题库2-句子成分篇-倒叙模式', 
            url: 'assets/data/grammarpoint_upperpart_reverse.json',
            outline: 'assets/data/grammarpoint_upperpart_box_outline.md'
        }
    },
    
    // 界面配置
    CARD_HEIGHT: '80vh',                 // 卡片高度
    CARD_PADDING: '40px',                // 卡片内边距
    MOBILE_CARD_HEIGHT: '85vh',          // 移动端卡片高度
    MOBILE_CARD_PADDING: '20px',         // 移动端卡片内边距
    
    // 动画配置
    CARD_HOVER_TRANSFORM: 'translateY(-5px)',  // 卡片悬停变换
    BUTTON_HOVER_TRANSFORM: 'translateY(-2px)', // 按钮悬停变换
    TRANSITION_DURATION: '0.3s',         // 过渡动画时长
    
    // 颜色配置
    COLORS: {
        PRIMARY: '#667eea',
        SECONDARY: '#764ba2',
        SUCCESS: '#4CAF50',
        WARNING: '#ff9800',
        DANGER: '#f44336',
        INFO: '#2196F3',
        PURPLE: '#9C27B0',
        WHITE: '#ffffff',
        LIGHT_GRAY: '#f8f9fa',
        DARK_GRAY: '#333333',
        MEDIUM_GRAY: '#666666',
        LIGHT_TEXT: '#888888'
    },
    
    // 字体大小配置
    FONT_SIZES: {
        TITLE: '2.5rem',
        QUESTION: '1.8rem',
        MOBILE_QUESTION: '1.4rem',
        TRANSLATION: '1.4rem',
        KNOWLEDGE_POINT: '1.1rem',
        BUTTON: '1.1rem',
        MOBILE_BUTTON: '1rem',
        PROGRESS: '0.95rem',
        REVIEW_COUNT: '0.95rem',
        MASTERY_SCORE: '0.9rem'
    },
    
    // 间距配置
    SPACING: {
        CARD_MARGIN_BOTTOM: '30px',
        QUESTION_MARGIN_BOTTOM: '30px',
        BUTTON_GAP: '15px',
        MOBILE_BUTTON_GAP: '10px',
        ANSWER_SECTION_MARGIN: '20px',
        ANSWER_SECTION_PADDING: '20px'
    },
    
    // 圆角配置
    BORDER_RADIUS: {
        CARD: '20px',
        BUTTON: '25px',
        ANSWER_SECTION: '10px',
        KNOWLEDGE_POINT: '5px',
        PROGRESS_BAR: '25px',
        ICON_BACK: '18px'
    },
    
    // 阴影配置
    SHADOWS: {
        CARD: '0 10px 30px rgba(0, 0, 0, 0.3)',
        ICON_BACK: '0 2px 6px rgba(0,0,0,0.2)',
        ICON_BACK_HOVER: '0 4px 10px rgba(0,0,0,0.25)'
    }
};

// 导出配置（如果在模块环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
