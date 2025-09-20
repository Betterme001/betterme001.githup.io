// controllers/progressShow.js
// 从 services/progress.js 重命名移动

(function () {
    window.updateProgressDisplay = function updateProgressDisplay() {
        const testProgress = (window.reviewStore && window.reviewStore.meta && window.reviewStore.meta.globalProgressIndex) || 0;
        const reviewProgress = (window.reviewStore && window.reviewStore.meta && window.reviewStore.meta.reviewProgress) || 0;
        const totalQuestions = (window.questions && window.questions.length) || 0;

        const elTest = document.getElementById('testProgress');
        const elTotal = document.getElementById('totalQuestions');
        if (elTest) elTest.textContent = String(testProgress);
        if (elTotal) elTotal.textContent = String(totalQuestions);

        const elReview = document.getElementById('reviewProgress');
        const elTotal2 = document.getElementById('totalQuestions2');
        if (elReview) elReview.textContent = String(reviewProgress);
        if (elTotal2) elTotal2.textContent = String(testProgress);

        let masteredHighCount = 0;
        const limit = Math.min(testProgress, (window.questions && window.questions.length) || 0);
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
        const elReviewed = document.getElementById('reviewedCount');
        const elReviewedTotal = document.getElementById('totalReviewed');
        if (elReviewed) elReviewed.textContent = String(masteredHighCount);
        if (elReviewedTotal) elReviewedTotal.textContent = String(testProgress);
    };
})();


