// views/statsCharts.js
// 学习统计图表功能

(function () {
    'use strict';

    // 学习时间等级定义
    const studyTimeLevels = {
        0: { label: '0-19分钟', color: '#f5faf5', grade: '不及格' },
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

    // 获取统计数据（修改为合并所有题库）
    function getDailyStats() {
        // 先合并所有题库的统计数据
        const mergedStats = window.mergeAllBankStats();
        
        const todayStr = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();

        // 计算今天的实时统计（所有题库）
        let todayStudyTime = 0;
        let todayQuestionCount = 0;
        
        Object.keys(CONFIG.BANKS).forEach(bankId => {
            try {
                const key = getStorageKey(bankId);
                const raw = localStorage.getItem(key);
                if (raw) {
                    const bankData = JSON.parse(raw);
                    const meta = bankData.meta || {};
                    todayStudyTime += meta.todayStudyTime || 0;
                    todayQuestionCount += meta.todayQuestionCount || 0;
                }
            } catch (e) {
                console.warn(`读取题库 ${bankId} 今日数据失败:`, e);
            }
        });

        const result = { ...mergedStats };
        result[todayStr] = {
            studyTime: todayStudyTime,
            questionCount: todayQuestionCount,
            timestamp: Date.now()
        };

        // 如果没有历史数据，创建一些测试数据用于演示
        if (Object.keys(result).length === 1 && todayStudyTime === 0) {
            console.log('No historical data found, creating demo data');
            const demoData = createDemoData();
            Object.assign(result, demoData);
        }

        return result;
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
        const todayStr = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();
        
        // 只获取今天及之前的日期
        const dates = Object.keys(dailyStats)
            .filter(date => date <= todayStr)
            .sort((a, b) => a.localeCompare(b));
        
        console.log('Heatmap - Daily stats:', dailyStats);
        console.log('Heatmap - Dates (filtered to today):', dates);
        
        if (dates.length === 0) {
            heatmapGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">暂无学习数据</div>';
            return;
        }

        // 按周组织数据，从周一开始显示
        const weeks = [];
        
        // 确保数据按日期排序
        const sortedDates = dates.sort((a, b) => a.localeCompare(b));
        
        if (sortedDates.length === 0) {
            return;
        }
        
        // 找到第一个学习日期
        const firstDate = new Date(sortedDates[0]);
        // 转换为周一的日期（getDay(): 0=周日, 1=周一, ..., 6=周六）
        // 计算需要回退多少天到周一
        const firstDayOfWeek = firstDate.getDay();
        const daysToMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 如果周日，回退6天；否则回退到周一
        const weekStartDate = new Date(firstDate);
        weekStartDate.setDate(firstDate.getDate() - daysToMonday);
        
        // 找到最后一个日期
        const lastDate = new Date(sortedDates[sortedDates.length - 1]);
        const lastDayOfWeek = lastDate.getDay();
        const daysToSunday = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek; // 计算到周日需要的天数
        const weekEndDate = new Date(lastDate);
        weekEndDate.setDate(lastDate.getDate() + daysToSunday);
        
        // 生成从第一个周一到最后一个周日的所有日期
        const allDates = [];
        const currentDate = new Date(weekStartDate);
        while (currentDate <= weekEndDate) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
            allDates.push({
                date: dateStr,
                studyTime: dailyStats[dateStr] ? dailyStats[dateStr].studyTime : null,
                isFuture: dateStr > todayStr
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // 按周组织（每7天一周）
        for (let i = 0; i < allDates.length; i += 7) {
            const week = allDates.slice(i, i + 7);
            weeks.push(week);
        }

        console.log('Weeks data:', weeks);

        // 渲染热力图（每周一行，从周一开始）
        weeks.forEach((week) => {
            // 容器：一周
            const weekRow = document.createElement('div');
            weekRow.className = 'heatmap-week';

            // 遍历周一到周日（week数组已经是按周一到周日排序的）
            week.forEach((dayInfo) => {
                // 如果是未来的日期，显示为非常浅的灰色
                if (dayInfo.isFuture) {
                    const square = document.createElement('div');
                    square.className = 'heatmap-square';
                    square.style.backgroundColor = '#f5f5f5'; // 比无数据日更浅的灰色，表示未来日期
                    square.style.border = '1px dashed #ddd'; // 虚线边框进一步区分
                    square.title = '未来日期';
                    square.addEventListener('click', function() {
                        showDateInfo(dayInfo.date, null);
                    });
                    weekRow.appendChild(square);
                    return;
                }
                
                const square = document.createElement('div');
                square.className = 'heatmap-square';

                if (dayInfo.studyTime !== null) {
                    const level = getStudyTimeLevel(dayInfo.studyTime);
                    const levelInfo = studyTimeLevels[level];
                    const minutes = Math.floor(dayInfo.studyTime / 60);

                    square.style.backgroundColor = levelInfo.color;
                    square.title = `${dayInfo.date}: ${minutes}分钟 (${levelInfo.label} - ${levelInfo.grade})`;
                    square.dataset.date = dayInfo.date;
                    square.dataset.studyTime = dayInfo.studyTime;
                    
                    // 添加点击事件
                    square.addEventListener('click', function() {
                        const dailyStats = getDailyStats();
                        const dayData = dailyStats[dayInfo.date];
                        showDateInfo(dayInfo.date, dayData);
                    });
                } else {
                    // 无数据日：比未来日期更浅的灰色
                    square.style.backgroundColor = '#fafafa';
                    square.title = '无学习记录';
                    
                    // 添加点击事件
                    square.addEventListener('click', function() {
                        showDateInfo(dayInfo.date, null);
                    });
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

    // 显示日期信息弹窗
    function showDateInfo(dateStr, dayData) {
        // 解析日期
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // 格式化日期显示（中文格式）
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekDay = weekDays[date.getDay()];
        const dateDisplay = `${year}年${month}月${day}日 ${weekDay}`;
        
        let message = `日期：${dateDisplay}\n`;
        
        if (dayData && dayData.studyTime !== null && dayData.studyTime !== undefined) {
            const minutes = Math.floor(dayData.studyTime / 60);
            const seconds = dayData.studyTime % 60;
            const level = getStudyTimeLevel(dayData.studyTime);
            const levelInfo = studyTimeLevels[level];
            
            message += `学习时间：${minutes}分钟${seconds > 0 ? seconds + '秒' : ''}\n`;
            message += `题目数量：${dayData.questionCount || 0}道\n`;
            message += `等级：${levelInfo.label} (${levelInfo.grade})\n`;
            
            // 如果有时间戳，显示记录时间
            if (dayData.timestamp) {
                const recordDate = new Date(dayData.timestamp);
                const recordDateStr = recordDate.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                message += `记录时间：${recordDateStr}`;
            }
        } else {
            message += `学习时间：无记录\n`;
            message += `题目数量：0道`;
        }
        
        alert(message);
    }

})();
