/**
 * 파일명 : dashboard_B.js (개선)
 * 설명   : 전처리 B 탭 (Random Forest) - 부드러운 페이드 효과 추가
 * 개선   : 서브탭 전환 시 A탭처럼 부드러운 fade-in/out 효과
 * 수정   : prediction-table-b 클래스 적용 (B탭 테이블 독립화)
 */

Chart.register(ChartDataLabels);

(async () => {
    const tabB = document.getElementById("tab-preprocessing2");
    if (!tabB) return;

    window.chartInstances_B = window.chartInstances_B || {};

    const resResult = await fetch("/api/randomforest-results");
    const resMetrics = await fetch("/api/randomforest-metrics");

    const dataResult = await resResult.json();
    const dataMetrics = await resMetrics.json();

    if (dataResult.error || dataMetrics.error) {
        console.error("B탭 데이터 로드 실패:", dataResult.error || dataMetrics.error);
        return;
    }

    // --------------------------------
    // 통계 계산
    // --------------------------------
    function updateHeaderStats_B(data) {
        if (!data || data.length === 0) return;
        const avgMAE = (data.reduce((s, d) => s + (Number(d.MAE) || 0), 0) / data.length).toFixed(2);
        const avgRMSE = (data.reduce((s, d) => s + (Number(d.RMSE) || 0), 0) / data.length).toFixed(2);

        document.querySelectorAll("#tab-preprocessing2 .header-stats .stat-badge").forEach(b => {
            const label = b.querySelector(".stat-label")?.textContent || "";
            const val = b.querySelector(".stat-value");
            if (!val) return;
            if (label.includes("MAE")) val.textContent = `${avgMAE}%`;
            else if (label.includes("RMSE")) val.textContent = `${avgRMSE}%`;
        });
    }

    function updateSidebarStats_B(data) {
        if (!Array.isArray(data) || data.length === 0) return;
        const avgMAE = (data.reduce((s, d) => s + (Number(d.MAE) || 0), 0) / data.length).toFixed(2);
        const avgRMSE = (data.reduce((s, d) => s + (Number(d.RMSE) || 0), 0) / data.length).toFixed(2);

        document.querySelectorAll(".model-info .info-item").forEach(item => {
            const label = item.querySelector(".info-label")?.textContent || "";
            const val = item.querySelector(".info-value");
            if (!val) return;
            if (label.includes("MAE")) val.textContent = `${avgMAE}%`;
            else if (label.includes("RMSE")) val.textContent = `${avgRMSE}%`;
        });
    }

    updateSidebarStats_B(dataMetrics);

    // --------------------------------
    // 필터 생성
    // --------------------------------
    const groups_B = ["Product_8", "Product_9", "Product_a", "Product_b", "Product_c", "Product_d", "Product_e", "Product_f"];

    function createFilterTabs_B(containerId, onClick) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        groups_B.forEach((group, idx) => {
            const btn = document.createElement("button");
            btn.className = "filter-button" + (idx === 0 ? " active" : "");
            btn.textContent = group + "~";
            btn.dataset.group = group;
            btn.addEventListener("click", () => {
                container.querySelectorAll(".filter-button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                onClick(group);
            });
            container.appendChild(btn);
        });
    }

    ["filter-predict-b", "filter-metrics-b", "filter-accuracy-b"].forEach(id => {
        createFilterTabs_B(id, g => renderCharts_B(g));
    });

    // --------------------------------
    // Chart.js 인스턴스 안전제거
    // --------------------------------
    function destroyChart_B(name) {
        if (window.chartInstances_B[name]) {
            try { 
                window.chartInstances_B[name].destroy(); 
            }
            catch (e) { 
                console.warn(`차트 제거 실패 (${name}):`, e); 
            }
            window.chartInstances_B[name] = null;
        }
    }

    // --------------------------------
    // 메인 렌더 (A탭처럼 부드러운 페이드 + Chart 애니메이션)
    // --------------------------------
    async function renderCharts_B(prefix) {
        const filtered = dataResult.filter(d => d.Product_Number?.startsWith(prefix));
        const filteredMetrics = dataMetrics.filter(d => d.Product_Number?.startsWith(prefix));
        const products = [...new Set(filtered.map(d => d.Product_Number))];

        // ✅ 페이드 아웃 (하지만 완전히 사라지지 않도록)
        const activeTab = tabB.querySelector(".subtab-content.active");
        if (activeTab) {
            activeTab.style.transition = "opacity 0.3s ease";
            activeTab.style.opacity = "0.4";
        }

        // 순차 렌더링으로 CPU 부하 분산 (A탭과 동일)
        await new Promise(r => setTimeout(r, 20));
        ["predChart_B", "featChart_B"].forEach(destroyChart_B);
        renderPredictionChart_B(filteredMetrics, products);

        await new Promise(r => setTimeout(r, 20));
        renderFeatureChart_B(filtered, products);

        await new Promise(r => setTimeout(r, 20));
        if (typeof renderAccuracyChart_B === "function") {
            renderAccuracyChart_B(filtered, products);
        }

        // 통계 갱신
        updateHeaderStats_B(filteredMetrics);
        updateSidebarStats_B(dataMetrics);

        // ✅ 페이드 인 (Chart 애니메이션과 함께 부드럽게)
        setTimeout(() => {
            if (activeTab) activeTab.style.opacity = "1";
        }, 200);
    }

    // --------------------------------
    // 예측 막대그래프
    // --------------------------------
    function renderPredictionChart_B(data, prods) {
        const canvas = document.getElementById("chart-prep2-prediction");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const colors = ["#3b82f6"];

        const allVals = data.map(d => parseFloat(d.MAE) || 0);
        const maxV = Math.max(...allVals);
        const step = maxV <= 10 ? 2 : maxV <= 50 ? 5 : 10;
        const yMax = Math.ceil(maxV / step + 1) * step;

        window.chartInstances_B.predChart_B = new Chart(ctx, {
            type: "bar",
            data: {
                labels: prods,
                datasets: [{
                    label: "MAE (Mean Absolute Error)",
                    data: prods.map(p => {
                        const found = data.find(d => d.Product_Number === p);
                        return found ? parseFloat(found.MAE) || 0 : 0;
                    }),
                    backgroundColor: colors[0]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 600, easing: "easeInOutCubic", animateScale: true },
                plugins: {
                    title: { display: true, text: "MAE (Mean Absolute Error) - Random Forest" },
                    legend: { display: false },
                    datalabels: {
                        color: "#ffffff",
                        anchor: "end",
                        align: "top",
                        font: { weight: "bold", size: 11 },
                        formatter: v => (v ? v.toFixed(2) : "")
                    }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, max: yMax, ticks: { color: "#cbd5e1", stepSize: step } }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // --------------------------------
    // 실제 VS 예측 비교 (선형)
    // --------------------------------
    function renderFeatureChart_B(data, prods) {
        const canvas = document.getElementById("chart-prep2-features");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        // ✅ date_dt 기준으로 5월 데이터만 필터링
        const filteredData = data.filter(d => {
            if (!d.date_dt) return false;
            const date = new Date(d.date_dt.trim());
            return !isNaN(date) && (date.getMonth() + 1 === 5); // 5월만 (month는 0부터 시작)
        });

        // ✅ 날짜 오름차순 정렬
        const sortedData = [...filteredData].sort((a, b) => new Date(a.date_dt) - new Date(b.date_dt));

        // ✅ 중복 없는 날짜 추출
        const labels = [...new Set(sortedData.map(d => d.date_dt))];

        // ✅ 실제값(demand_T)과 예측값(predicted) 추출 (같은 날짜 평균값)
        const actualValues = labels.map(date => {
            const rows = sortedData.filter(d => d.date_dt === date);
            const avg = rows.reduce((sum, r) => sum + (Number(r.demand_T) || 0), 0) / (rows.length || 1);
            return parseFloat(avg.toFixed(2));
        });

        const predictedValues = labels.map(date => {
            const rows = sortedData.filter(d => d.date_dt === date);
            const avg = rows.reduce((sum, r) => sum + (Number(r.predicted) || 0), 0) / (rows.length || 1);
            return parseFloat(avg.toFixed(2));
        });

        // ✅ 기존 차트 제거 후 새로 생성
        if (window.chartInstances_B.featChart_B) {
            window.chartInstances_B.featChart_B.destroy();
        }

        // ✅ 라인 차트 생성
        window.chartInstances_B.featChart_B = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "실제값 (demand_T)",
                        data: actualValues,
                        borderColor: "#10b981",
                        backgroundColor: "transparent",
                        borderWidth: 2.5,
                        tension: 0.35,
                        pointRadius: 3,
                        pointBackgroundColor: "#10b981"
                    },
                    {
                        label: "예측값 (predicted)",
                        data: predictedValues,
                        borderColor: "#3b82f6",
                        backgroundColor: "transparent",
                        borderWidth: 2.5,
                        tension: 0.35,
                        pointRadius: 3,
                        pointBackgroundColor: "#3b82f6"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 800, easing: "easeInOutQuart" },
                plugins: {
                    title: {
                        display: true,
                        text: "실제 VS 예측 비교 (5월 데이터만)",
                        color: "#e5e7eb"
                    },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: "#cbd5e1" },
                        grid: { color: "rgba(148,163,184,0.1)" }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: "#cbd5e1" },
                        grid: { color: "rgba(148,163,184,0.1)" }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // --------------------------------
    // 실제 VS 예측 비교 (테이블)
    // --------------------------------
    function renderAccuracyChart_B(data, prods) {
        const container = document.getElementById("chart-prep2-epochs");
        if (!container) return;

        // ✅ 자동 연도 감지
        const sampleDate = data.find(d => d.date_dt)?.date_dt || "2022-05-01";
        const baseYear = sampleDate.slice(0, 4);
        const startDate = new Date(`${baseYear}-05-01`);
        const endDate = new Date(`${baseYear}-05-11`);

        // ✅ 데이터 필터링
        const filtered = data.filter(d => {
            if (!d.date_dt) return false;
            const date = new Date(d.date_dt);
            return date >= startDate && date <= endDate;
        });

        if (filtered.length === 0) {
            container.innerHTML = `<p class="text-center text-muted">⚠️ 표시할 데이터가 없습니다.</p>`;
            return;
        }

        // ✅ 날짜 목록 생성
        const dateList = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dateList.push(d.toISOString().split("T")[0]);
        }

        // ✅ 제품별 데이터 매핑
        const productMap = {};
        filtered.forEach(row => {
            const p = row.Product_Number;
            if (!productMap[p]) productMap[p] = {};
            productMap[p][row.date_dt] = {
                actual: Number(row.demand_T) || 0,
                pred: Number(row.predicted) || 0
            };
        });

        // ✅ 테이블 헤더
        const thead = `
            <thead>
                <tr>
                    <th style="width:80px;">#</th>
                    <th style="width:150px;">제품명</th>
                    ${dateList
                        .map(
                            date =>
                                `<th style="width:200px;">${date}<br><span style="font-weight:400;">(실제 vs 예측)</span></th>`
                        )
                        .join("")}
                </tr>
            </thead>
        `;

        // ✅ 테이블 바디
        const products = Object.keys(productMap).sort();
        const tbody = products.map((product, idx) => {
            const cells = dateList.map(date => {
                const val = productMap[product][date];
                return val
                    ? `<td>${Math.round(val.actual)} / ${Math.round(val.pred)}</td>`
                    : `<td>-</td>`;
            }).join("");

            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${product}</td>
                    ${cells}
                </tr>
            `;
        }).join("");

        // ✅ 날짜 수에 따라 동적 폭 계산
        const totalWidth = 80 + 150 + dateList.length * 200; // # + 제품명 + 날짜 개수×200px
        const minWidth = Math.max(totalWidth, container.clientWidth); // 화면보다 작으면 화면 폭으로

        container.innerHTML = `
            <div class="table-scroll-x-b">
                <table class="prediction-table-b" style="min-width:${minWidth}px;">
                    ${thead}
                    <tbody>${tbody}</tbody>
                </table>
            </div>
        `;

        // ✅ 고정 열 동기화 스크롤 (-5px 오프셋)
        const wrapper = container.querySelector(".table-scroll-x-b");
        const table = wrapper.querySelector(".prediction-table-b");
        const fixedCells = table.querySelectorAll("td:nth-child(1), td:nth-child(2), th:nth-child(1), th:nth-child(2)");
        
        wrapper.addEventListener("scroll", () => {
            const scrollLeft = wrapper.scrollLeft;
            fixedCells.forEach(cell => {
                cell.style.transform = `translateX(${scrollLeft - 5}px)`;
            });
        });
        
        // ✅ 마우스 드래그 XYN스크롤
        let isDown = false, startX, scrollLeft;
        
        wrapper.addEventListener("mousedown", e => {
            isDown = true;
            wrapper.classList.add("dragging");
            startX = e.pageX - wrapper.offsetLeft;
            scrollLeft = wrapper.scrollLeft;
        });
        wrapper.addEventListener("mouseleave", () => {
            isDown = false;
            wrapper.classList.remove("dragging");
        });
        wrapper.addEventListener("mouseup", () => {
            isDown = false;
            wrapper.classList.remove("dragging");
        });
        wrapper.addEventListener("mousemove", e => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - wrapper.offsetLeft;
            const walk = (x - startX) * 1.5;
            wrapper.scrollLeft = scrollLeft - walk;
        });
    }

    window.renderCharts_B = renderCharts_B;
    renderCharts_B("Product_8");

    // --------------------------------
    // ✅ 서브탭 클릭 (A탭과 동일한 로직)
    // --------------------------------
    document.querySelectorAll("#tab-preprocessing2 .subtab").forEach(tab => {
        tab.addEventListener("click", () => {
            // 서브탭 활성화 처리
            document.querySelectorAll("#tab-preprocessing2 .subtab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll("#tab-preprocessing2 .subtab-content").forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.target)?.classList.add("active");
            
            // 필터 버튼 리셋 (Product_8으로)
            document.querySelectorAll("#tab-preprocessing2 .filter-button").forEach(b => b.classList.remove("active"));
            document.querySelector("#tab-preprocessing2 .filter-button")?.classList.add("active");
            
            // renderCharts_B 호출 (부드러운 페이드 페이드 포함)
            renderCharts_B("Product_8");
            
            // 차트 리사이즈 (약간의 지연)
            setTimeout(() => {
                Object.values(window.chartInstances_B || {}).forEach(ch => {
                    if (ch && ch.resize) ch.resize();
                });
            }, 300);
        });
    });
})();