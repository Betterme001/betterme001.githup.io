// views/statsCharts.js
// 学习统计图表功能

(function () {
    'use strict';

    // 学习时间等级定义
    const studyTimeLevels = {
        0: { label: '0-19分钟', color: '#ebedf0', grade: '不及格' },
        1: { label: '20-30分钟', color: '#c6e48b', grade: '及格' },
        2: { label: '31-40分钟', color: '#7bc96f', grade: '良好' },
        3: { label: '41-50分钟', color: '#40a9ff', grade: '良好+' },
        4: { label: '51-70分钟', color: '#1890ff', grade: '优秀' },
        5: { label: '71-90分钟', color: '#096dd9', grade: '优秀+' },
        6: { label: '90分钟以上', color: '#003a8c', grade: '卓越' }
    };

    let chartInstance = null;

    // 获取学习时间等级
    function getStudyTimeLevel(studyTime) {
        const minutes = Math.floor(studyTime / 60);
        
        if (minutes <= 19) return 0;           // 0-19分钟：不及格
        if (minutes <= 30) return 1;           // 20-30分钟：及格
        if (minutes <= 40) return 2;           // 31-40分钟：中绿色
        if (minutes <= 50) return 3;           // 41-50分钟：浅蓝色
        if (minutes <= 70) return 4;           // 51-70分钟：中蓝色
        if (minutes <= 90) return 5;           // 71-90分钟：深蓝色
        return 6;                              // 90分钟以上：最深蓝色
    }

    // 获取统计数据
    function getDailyStats() {
        const dailyStats = (window.reviewStore && window.reviewStore.meta && window.reviewStore.meta.dailyStats) || {};
        const todayStr = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();

        // 将"今天"的实时统计也并入展示
        const todayStudyTime = (window.reviewStore && window.reviewStore.meta && (window.reviewStore.meta.todayStudyTime||0)) || 0;
        const todayQuestionCount = (window.reviewStore && window.reviewStore.meta && (window.reviewStore.meta.todayQuestionCount||0)) || 0;
        const merged = { ...dailyStats };
        merged[todayStr] = {
            studyTime: todayStudyTime,
            questionCount: todayQuestionCount,
            timestamp: Date.now()
        };

        // 如果没有历史数据，创建一些测试数据用于演示
        if (Object.keys(merged).length === 1 && todayStudyTime === 0) {
            console.log('No historical data found, creating demo data');
            const demoData = createDemoData();
            Object.assign(merged, demoData);
        }

        return merged;
    }

    // 创建演示数据
    function createDemoData() {
        const demoData = {};
        const today = new Date();
        
        // 创建过去30天的演示数据
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
            
            // 随机生成学习时间（0-120分钟）
            const studyTime = Math.random() * 120 * 60; // 转换为秒
            const questionCount = Math.floor(Math.random() * 20);
            
            demoData[dateStr] = {
                studyTime: studyTime,
                questionCount: questionCount,
                timestamp: date.getTime()
            };
        }
        
        return demoData;
    }

    // 渲染曲线图
    window.renderStatsChart = function renderStatsChart() {
        const chartContainer = document.getElementById('chartContainer');
        const canvas = document.getElementById('statsChart');
        if (!chartContainer || !canvas) {
            console.error('Chart container or canvas not found');
            return;
        }

        // 销毁之前的图表实例
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        const dailyStats = getDailyStats();
        const dates = Object.keys(dailyStats).sort((a, b) => a.localeCompare(b));
        
        console.log('Daily stats:', dailyStats);
        console.log('Dates:', dates);
        
        if (dates.length === 0) {
            canvas.parentElement.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">暂无学习数据</div>';
            return;
        }

        // 检查 Chart.js 是否可用
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            canvas.parentElement.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">图表库加载失败，请刷新页面重试</div>';
            return;
        }

        console.log('Chart.js loaded successfully, version:', Chart.version);

        const labels = dates.map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });
        
        const data = dates.map(date => {
            const s = dailyStats[date] || { studyTime: 0 };
            return Math.floor((s.studyTime || 0) / 60); // 转换为分钟
        });

        const ctx = canvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '学习时间 (分钟)',
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#007bff',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '学习时间趋势图',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '日期'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '学习时间 (分钟)'
                        },
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#0056b3'
                    }
                }
            }
        });
    };

    // 渲染热力图
    window.renderStatsHeatmap = function renderStatsHeatmap() {
        const heatmapContainer = document.getElementById('heatmapContainer');
        const heatmapGrid = document.getElementById('heatmapGrid');
        if (!heatmapContainer || !heatmapGrid) {
            console.error('Heatmap container or grid not found');
            return;
        }

        heatmapGrid.innerHTML = '';

        const dailyStats = getDailyStats();
        const dates = Object.keys(dailyStats).sort((a, b) => a.localeCompare(b));
        
        console.log('Heatmap - Daily stats:', dailyStats);
        console.log('Heatmap - Dates:', dates);
        
        if (dates.length === 0) {
            heatmapGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">暂无学习数据</div>';
            return;
        }

        // 按周组织数据，从第一天开始显示
        const weeks = [];
        let currentWeek = [];
        
        // 确保数据按日期排序
        const sortedDates = dates.sort((a, b) => a.localeCompare(b));
        
        // 找到第一个学习日期的星期几，用于对齐显示
        const firstDate = new Date(sortedDates[0]);
        const firstDayOfWeek = firstDate.getDay(); // 0=周日, 1=周一, ..., 6=周六
        
        // 在第一个学习日期之前添加空的天数，确保对齐
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null);
        }
        
        sortedDates.forEach(date => {
            const d = new Date(date);
            const dayOfWeek = d.getDay(); // 0=周日, 1=周一, ..., 6=周六
            
            // 如果是周日且当前周不为空，开始新的一周
            if (dayOfWeek === 0 && currentWeek.length > 0) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }
            
            // 添加当前日期到当前周
            currentWeek.push({
                date: date,
                studyTime: dailyStats[date] ? dailyStats[date].studyTime : 0
            });
        });
        
        // 添加最后一周
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        console.log('Weeks data:', weeks);

        // 渲染热力图（每周一行）
        weeks.forEach(week => {
            // 容器：一周
            const weekRow = document.createElement('div');
            weekRow.className = 'heatmap-week';

            // 确保每周都有7天
            const fullWeek = new Array(7).fill(null);
            week.forEach(day => {
                const d = new Date(day.date);
                const dayOfWeek = d.getDay();
                fullWeek[dayOfWeek] = day;
            });

            fullWeek.forEach((day) => {
                const square = document.createElement('div');
                square.className = 'heatmap-square';

                if (day) {
                    const level = getStudyTimeLevel(day.studyTime);
                    const levelInfo = studyTimeLevels[level];
                    const minutes = Math.floor(day.studyTime / 60);

                    square.style.backgroundColor = levelInfo.color;
                    square.title = `${day.date}: ${minutes}分钟 (${levelInfo.label} - ${levelInfo.grade})`;
                    square.dataset.date = day.date;
                    square.dataset.studyTime = day.studyTime;
                } else {
                    // 无数据日：更明显的浅灰
                    square.style.backgroundColor = '#e0e0e0';
                    square.title = '无学习记录';
                }

                weekRow.appendChild(square);
            });

            heatmapGrid.appendChild(weekRow);
        });
    };

    // 获取等级统计
    window.getLevelStatistics = function getLevelStatistics() {
        const dailyStats = getDailyStats();
        const stats = {
            0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
        };
        
        Object.values(dailyStats).forEach(day => {
            const level = getStudyTimeLevel(day.studyTime);
            stats[level]++;
        });
        
        return stats;
    };

    // 切换统计模式
    window.switchStatsMode = function switchStatsMode(mode) {
        // 更新按钮状态
        const buttons = document.querySelectorAll('.mode-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });

        // 隐藏所有内容
        const statsList = document.getElementById('statsList');
        const chartContainer = document.getElementById('chartContainer');
        const heatmapContainer = document.getElementById('heatmapContainer');
        
        if (statsList) statsList.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'none';
        if (heatmapContainer) heatmapContainer.style.display = 'none';

        // 显示对应内容
        switch (mode) {
            case 'list':
                if (statsList) statsList.style.display = 'block';
                // 重新渲染列表
                if (typeof window.renderStatsList === 'function') {
                    window.renderStatsList();
                }
                break;
            case 'chart':
                if (chartContainer) chartContainer.style.display = 'block';
                // 渲染曲线图
                setTimeout(() => {
                    if (typeof Chart !== 'undefined') {
                        window.renderStatsChart();
                    } else {
                        console.error('Chart.js not loaded yet, retrying...');
                        setTimeout(() => {
                            if (typeof Chart !== 'undefined') {
                                window.renderStatsChart();
                            } else {
                                const canvas = document.getElementById('statsChart');
                                if (canvas) {
                                    canvas.parentElement.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">图表库加载失败，请刷新页面重试</div>';
                                }
                            }
                        }, 500);
                    }
                }, 100);
                break;
            case 'heatmap':
                if (heatmapContainer) heatmapContainer.style.display = 'block';
                // 渲染热力图
                setTimeout(() => {
                    window.renderStatsHeatmap();
                }, 100);
                break;
        }
    };

})();
