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
        console.error("데이터 로드 실패");
        return;
    }

    // 헤더 통계 갱신
    function updateHeaderStats_B(data) {
        if (!data || !data.length) return;
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

    // 사이드바 통계 갱신
    function updateSidebarStats_B(data) {
        if (!data || !data.length) return;
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

    // 필터 생성
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
    ["filter-predict-b", "filter-metrics-b", "filter-accuracy-b"].forEach(id => createFilterTabs_B(id, g => renderCharts_B(g)));

    // Chart 제거
    function destroyChart_B(name) {
        if (window.chartInstances_B[name]) {
            try { window.chartInstances_B[name].destroy(); }
            catch (e) { console.warn(`차트 제거 실패 (${name}):`, e); }
            window.chartInstances_B[name] = null;
        }
    }

    // 메인 렌더
    async function renderCharts_B(prefix) {
        const filtered = dataResult.filter(d => d.Product_Number?.startsWith(prefix));
        const filteredMetrics = dataMetrics.filter(d => d.Product_Number?.startsWith(prefix));
        const products = [...new Set(filtered.map(d => d.Product_Number))];
        const activeTab = tabB.querySelector(".subtab-content.active");
        if (activeTab) {
            activeTab.style.transition = "opacity 0.3s ease";
            activeTab.style.opacity = "0.4";
        }
        await new Promise(r => setTimeout(r, 20));
        ["predChart_B", "featChart_B"].forEach(destroyChart_B);
        renderPredictionChart_B(filteredMetrics, products);
        await new Promise(r => setTimeout(r, 20));
        renderFeatureChart_B(filtered, products);
        await new Promise(r => setTimeout(r, 20));
        if (typeof renderAccuracyChart_B === "function") renderAccuracyChart_B(filtered, products);
        updateHeaderStats_B(filteredMetrics);
        updateSidebarStats_B(dataMetrics);
        setTimeout(() => { if (activeTab) activeTab.style.opacity = "1"; }, 200);
    }

    // MAE 막대그래프
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
                    label: "MAE",
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
                animation: { duration: 600 },
                plugins: {
                    title: { display: true, text: "MAE (Random Forest)" },
                    legend: { display: false },
                    datalabels: {
                        color: "#fff",
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

    // 실제 vs 예측 (라인)
    function renderFeatureChart_B(data) {
        const canvas = document.getElementById("chart-prep2-features");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const filteredData = data.filter(d => {
            if (!d.date_dt) return false;
            const date = new Date(d.date_dt.trim());
            return !isNaN(date) && (date.getMonth() + 1 === 5);
        });
        const sorted = [...filteredData].sort((a, b) => new Date(a.date_dt) - new Date(b.date_dt));
        const labels = [...new Set(sorted.map(d => d.date_dt))];
        const actualValues = labels.map(date => {
            const rows = sorted.filter(d => d.date_dt === date);
            const avg = rows.reduce((s, r) => s + (Number(r.demand_T) || 0), 0) / (rows.length || 1);
            return parseFloat(avg.toFixed(2));
        });
        const predictedValues = labels.map(date => {
            const rows = sorted.filter(d => d.date_dt === date);
            const avg = rows.reduce((s, r) => s + (Number(r.predicted) || 0), 0) / (rows.length || 1);
            return parseFloat(avg.toFixed(2));
        });
        if (window.chartInstances_B.featChart_B) window.chartInstances_B.featChart_B.destroy();
        window.chartInstances_B.featChart_B = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    { label: "실제값", data: actualValues, borderColor: "#10b981", borderWidth: 2.5, tension: 0.35 },
                    { label: "예측값", data: predictedValues, borderColor: "#3b82f6", borderWidth: 2.5, tension: 0.35 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 800 },
                plugins: {
                    title: { display: true, text: "실제 VS 예측 (5월)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: { display: false }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.1)" } },
                    y: { beginAtZero: true, ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.1)" } }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // 실제 vs 예측 테이블 + 드래그 스크롤
    function renderAccuracyChart_B(data) {
        const container = document.getElementById("chart-prep2-epochs");
        if (!container) return;
        const sampleDate = data.find(d => d.date_dt)?.date_dt || "2022-05-01";
        const year = sampleDate.slice(0, 4);
        const start = new Date(`${year}-05-01`);
        const end = new Date(`${year}-05-11`);
        const filtered = data.filter(d => {
            if (!d.date_dt) return false;
            const date = new Date(d.date_dt);
            return date >= start && date <= end;
        });
        if (!filtered.length) {
            container.innerHTML = `<p class="text-center text-muted">데이터 없음</p>`;
            return;
        }
        const dateList = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
            dateList.push(d.toISOString().split("T")[0]);
        const productMap = {};
        filtered.forEach(r => {
            const p = r.Product_Number;
            if (!productMap[p]) productMap[p] = {};
            productMap[p][r.date_dt] = { actual: Number(r.demand_T) || 0, pred: Number(r.predicted) || 0 };
        });
        const thead = `
            <thead><tr><th>#</th><th>제품명</th>
            ${dateList.map(d => `<th>${d}<br>(실제 vs 예측)</th>`).join("")}</tr></thead>`;
        const products = Object.keys(productMap).sort();
        const tbody = products.map((p, i) => {
            const cells = dateList.map(d => {
                const val = productMap[p][d];
                return val ? `<td>${Math.round(val.actual)} / ${Math.round(val.pred)}</td>` : "<td>-</td>";
            }).join("");
            return `<tr><td>${i + 1}</td><td>${p}</td>${cells}</tr>`;
        }).join("");
        const totalWidth = 80 + 150 + dateList.length * 200;
        container.innerHTML = `
            <div class="table-scroll-x-b">
                <table class="prediction-table-b" style="min-width:${totalWidth}px;">
                    ${thead}<tbody>${tbody}</tbody>
                </table>
            </div>
        `;
        const wrapper = container.querySelector(".table-scroll-x-b");
        const table = wrapper.querySelector(".prediction-table-b");
        const fixedCells = table.querySelectorAll("td:nth-child(1), td:nth-child(2), th:nth-child(1), th:nth-child(2)");
        wrapper.addEventListener("scroll", () => {
            const scrollLeft = wrapper.scrollLeft;
            fixedCells.forEach(c => c.style.transform = `translateX(${scrollLeft - 5}px)`);
        });
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

    // 서브탭 전환
    document.querySelectorAll("#tab-preprocessing2 .subtab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll("#tab-preprocessing2 .subtab, #tab-preprocessing2 .subtab-content")
                .forEach(e => e.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.target)?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing2 .filter-button")
                .forEach(b => b.classList.remove("active"));
            document.querySelector("#tab-preprocessing2 .filter-button")?.classList.add("active");
            renderCharts_B("Product_8");
            setTimeout(() => {
                Object.values(window.chartInstances_B || {}).forEach(ch => ch?.resize?.());
            }, 300);
        });
    });
})();