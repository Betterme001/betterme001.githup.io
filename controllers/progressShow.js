// controllers/progressShow.js
// 从 services/progress.js 重命名移动

(function () {
    // 共享的计算函数，避免重复计算
    function calculateProgressData() {
        const testProgress = (window.reviewStore && window.reviewStore.meta && window.reviewStore.meta.globalProgressIndex) || 0;
        const reviewProgress = (window.reviewStore && window.reviewStore.meta && window.reviewStore.meta.reviewProgress) || 0;
        const totalQuestions = (window.questions && window.questions.length) || 0;

        // 计算掌握度高的题目数量
        let masteredHighCount = 0;
        const limit = Math.min(testProgress, totalQuestions);
        if (limit > 0 && window.reviewStore && window.reviewStore.items) {
            for (let i = 0; i < limit; i++) {
                const q = window.questions[i];
                const key = window.getQuestionKey(q);
                const entry = window.reviewStore.items[key];
                if (entry && Array.isArray(entry.history) && entry.history.length > 0) {
                    const mastery = window.calculateMastery(entry.history);
                    if (typeof CONFIG !== 'undefined' && mastery >= CONFIG.MASTERY_THRESHOLD) masteredHighCount++;
                }
            }
        }

        return {
            testProgress,
            reviewProgress,
            totalQuestions,
            masteredHighCount
        };
    }

    window.updateProgressDisplay = function updateProgressDisplay() {
        const data = calculateProgressData();
        const { testProgress, reviewProgress, totalQuestions, masteredHighCount } = data;

        const elTest = document.getElementById('testProgress');
        const elTotal = document.getElementById('totalQuestions');
        if (elTest) elTest.textContent = String(testProgress);
        if (elTotal) elTotal.textContent = String(totalQuestions);

        const elReview = document.getElementById('reviewProgress');
        const elTotal2 = document.getElementById('totalQuestions2');
        if (elReview) elReview.textContent = String(reviewProgress);
        if (elTotal2) elTotal2.textContent = String(testProgress);

        const elReviewed = document.getElementById('reviewedCount');
        const elReviewedTotal = document.getElementById('totalReviewed');
        if (elReviewed) elReviewed.textContent = String(masteredHighCount);
        if (elReviewedTotal) elReviewedTotal.textContent = String(testProgress);
        
        // 更新header颜色进度，传递已计算的数据
        if (typeof window.updateHeaderProgress === 'function') {
            window.updateHeaderProgress(data);
        }
    };

    // 更新header标题的颜色进度
    window.updateHeaderProgress = function updateHeaderProgress(data) {
        const headerTitle = document.querySelector('.header-title');
        const headerLightProgress = document.getElementById('headerLightProgress');
        const headerDarkProgress = document.getElementById('headerDarkProgress');
        
        console.log('updateHeaderProgress called', { headerTitle, headerLightProgress, headerDarkProgress });
        
        if (!headerTitle || !headerLightProgress || !headerDarkProgress) {
            console.log('Header elements not found');
            return;
        }
        
        // 如果没有传入数据，则重新计算（用于独立调用的情况）
        if (!data) {
            data = calculateProgressData();
        }
        const { testProgress, totalQuestions, masteredHighCount } = data;
        
        // 计算测试进度百分比
        const percent = totalQuestions > 0 ? (testProgress / totalQuestions) * 100 : 0;
        
        // 计算深绿色宽度（掌握度高的题目占比）
        const masteredPercent = totalQuestions > 0 ? (masteredHighCount / totalQuestions) * 100 : 0;
        
        console.log('Progress calculation', { 
            testProgress, 
            totalQuestions, 
            percent, 
            masteredHighCount, 
            masteredPercent 
        });
        
  

         // 更新深绿色文字层的宽度
         headerDarkProgress.style.width = `${masteredPercent}%`;
         headerDarkProgress.style.display = masteredPercent > 0 ? 'inline-block' : 'none';

        // 更新浅绿色文字层的宽度（测试进度减去掌握度高的部分）
        const lightGreenPercent = percent;
        headerLightProgress.style.width = `${lightGreenPercent}%`;
        headerLightProgress.style.display = lightGreenPercent > 0 ? 'inline-block' : 'none';
        
        console.log(`Set dark green width to ${masteredPercent}%, light green width to ${lightGreenPercent}%`);
    };

    // 测试header进度效果的函数
    window.testHeaderProgress = function testHeaderProgress() {
        console.log('Testing header progress...');
        
        const headerTitle = document.querySelector('.header-title');
        const headerLightGreen = document.getElementById('headerLightProgress');
        const headerDarkGreen = document.getElementById('headerDarkProgress');
        
        console.log('Found elements:', { 
            headerTitle: !!headerTitle, 
            headerLightGreen: !!headerLightGreen, 
            headerDarkGreen: !!headerDarkGreen 
        });
        
        if (!headerTitle) {
            alert('找不到header-title元素！');
            return;
        }
        if (!headerLightGreen) {
            alert('找不到headerProgress元素！');
            return;
        }
        if (!headerDarkGreen) {
            alert('找不到headerDarkProgress元素！');
            return;
        }
        
        // 测试效果：深绿色25%，浅绿色50%，白色25%
        headerDarkGreen.style.width = '25%';
        headerDarkGreen.style.display = 'inline-block';
        
        headerLightGreen.style.width = '50%';
        headerLightGreen.style.display = 'inline-block';
        
        console.log('Set dark green to 25%, light green to 50%');
        
        // 3秒后恢复
        setTimeout(() => {
            if (typeof window.updateHeaderProgress === 'function') {
                window.updateHeaderProgress(null);
            }
            console.log('Restored original progress');
        }, 3000);
    };
})();


