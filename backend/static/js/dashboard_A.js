Chart.register(ChartDataLabels);

(async () => {
    const tabA = document.getElementById("tab-preprocessing1");
    if (!tabA || !tabA.classList.contains("active")) return;

    window.chartInstances = window.chartInstances || {};

    const res = await fetch("/api/preprocessing-a");
    const data = await res.json();
    if (data.error) return console.error("데이터 로드 실패:", data.error);

    // 헤더 통계 갱신
    function updateHeaderStats(data) {
        if (!data.length) return;
        const avgMAE = (data.reduce((s, d) => s + (d.MAE ?? 0), 0) / data.length).toFixed(2);
        const avgSMAPE = (data.reduce((s, d) => s + (d.SMAPE ?? 0), 0) / data.length).toFixed(2);
        const avgAcc = (data.reduce((s, d) => s + (d.Accuracy ?? 0), 0) / data.length).toFixed(2);

        document.querySelectorAll(".header-stats .stat-badge").forEach(b => {
            const label = b.querySelector(".stat-label")?.textContent || "";
            const val = b.querySelector(".stat-value");
            if (!val) return;
            if (label.includes("MAE")) val.textContent = `${avgMAE}%`;
            else if (label.includes("SMAPE")) val.textContent = `${avgSMAPE}%`;
            else if (label.includes("Accuracy")) val.textContent = `${avgAcc}%`;
        });
    }

    // 사이드바 평균 갱신
    function updateSidebarStats(allData) {
        if (!allData.length) return;
        const avgMAE = (allData.reduce((s, d) => s + (d.MAE ?? 0), 0) / allData.length).toFixed(2);
        const avgSMAPE = (allData.reduce((s, d) => s + (d.SMAPE ?? 0), 0) / allData.length).toFixed(2);
        const avgAcc = (allData.reduce((s, d) => s + (d.Accuracy ?? 0), 0) / allData.length).toFixed(2);

        document.querySelectorAll(".model-info .info-item").forEach(item => {
            const label = item.querySelector(".info-label")?.textContent || "";
            const val = item.querySelector(".info-value");
            if (!val) return;
            if (label.includes("MAE")) val.textContent = `${avgMAE}%`;
            else if (label.includes("SMAPE")) val.textContent = `${avgSMAPE}%`;
            else if (label.includes("Accuracy")) val.textContent = `${avgAcc}%`;
        });
    }

    updateSidebarStats(data);

    // 탭 활성화 감시
    const tabAObserver = new MutationObserver(muts => {
        for (const m of muts) {
            if (m.attributeName === "class" && m.target.classList.contains("active")) {
                requestAnimationFrame(() => renderCharts("Product_8"));
            }
        }
    });
    tabAObserver.observe(tabA, { attributes: true });

    // 서브탭 전환 이벤트
    document.querySelectorAll(".subtab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".subtab, .subtab-content").forEach(e => e.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.add("active");
            renderCharts("Product_8");
            document.querySelectorAll(".filter-button").forEach(btn => {
                btn.classList.toggle("active", btn.textContent.startsWith("Product_8"));
            });
        });
    });

    // 필터 생성
    const groups = ["Product_8", "Product_9", "Product_a", "Product_b", "Product_c", "Product_d", "Product_e", "Product_f"];
    function createFilterTabs(containerId, onClick) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        groups.forEach((group, idx) => {
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

    ["filter-predict", "filter-table", "filter-metrics", "filter-accuracy"].forEach(id => {
        createFilterTabs(id, g => renderCharts(g));
    });

    // 메인 렌더
    async function renderCharts(prefix) {
        const filtered = data.filter(d => d.Product_Number.startsWith(prefix));
        const products = [...new Set(filtered.map(d => d.Product_Number))];

        const activeTab = tabA.querySelector(".subtab-content.active");
        if (activeTab) {
            activeTab.style.transition = "opacity 0.3s ease";
            activeTab.style.opacity = "0.4";
        }

        await new Promise(r => setTimeout(r, 20));
        ["predChart", "featChart", "accChart"].forEach(destroyChart);
        renderPredictionChart(filtered, products);

        await new Promise(r => setTimeout(r, 20));
        renderTable(filtered);

        await new Promise(r => setTimeout(r, 20));
        renderFeatureChart(filtered, products);

        await new Promise(r => setTimeout(r, 20));
        renderAccuracyChart(filtered, products);

        updateHeaderStats(filtered);
        updateSidebarStats(data);

        setTimeout(() => { if (activeTab) activeTab.style.opacity = "1"; }, 200);
    }

    // 기존 차트 제거
    function destroyChart(name) {
        if (window.chartInstances[name]) {
            try { window.chartInstances[name].destroy(); } 
            catch (e) { console.warn(`[WARN] Chart destroy 실패 (${name}):`, e); }
            window.chartInstances[name] = null;
        }
    }

    // 예측 수주량 (막대)
    function renderPredictionChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-prediction");
        if (!canvas) return;
        destroyChart("predChart");
        const ctx = canvas.getContext("2d");
        const colors = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948"];

        const allVals = data.map(d => d.Pred_Value ?? 0);
        const maxV = Math.max(...allVals);
        const step = maxV <= 50 ? 10 : maxV <= 200 ? 20 : maxV <= 500 ? 50 : maxV <= 1000 ? 100 : maxV <= 2000 ? 200 : 500;
        const yMax = Math.ceil(maxV / step + 1) * step;

        window.chartInstances.predChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["T+1", "T+2", "T+3"],
                datasets: prods.map((p, i) => ({
                    label: p,
                    data: data.filter(d => d.Product_Number === p).slice(-3).map(r => r.Pred_Value),
                    backgroundColor: colors[i % colors.length]
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 600, easing: "easeInOutCubic" },
                plugins: {
                    title: { display: true, text: "예측 vs 실제 (3일 예측 수주량)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#fff",
                        anchor: "end",
                        align: "top",
                        font: { weight: "bold", size: 11 },
                        formatter: v => (v ?? "").toLocaleString()
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

    // 예측 수주량 (테이블)
    function renderTable(data) {
        const container = document.getElementById("chart-prep1-table");
        if (!container) return;
        const grouped = {};
        data.forEach(r => (grouped[r.Product_Number] = grouped[r.Product_Number] || []).push(r));
        const allDates = [...new Set(data.map(d => d.Date))].sort((a, b) => new Date(b) - new Date(a));
        const recent = allDates.slice(0, 3).reverse();
        const dateLabels = recent.map((d, i) => `${d} (T+${i + 1})`);
        const rows = Object.entries(grouped).map(([prod, items]) => {
            const byDate = {}; items.forEach(i => (byDate[i.Date] = i.Pred_Value ?? "-"));
            return { Product_Number: prod, T1: byDate[recent[0]] ?? "-", T2: byDate[recent[1]] ?? "-", T3: byDate[recent[2]] ?? "-" };
        });
        container.innerHTML = `
            <table class="prediction-table-a">
                <thead><tr><th>#</th><th>Product_Number</th>
                <th>${dateLabels[0]}</th><th>${dateLabels[1]}</th><th>${dateLabels[2]}</th></tr></thead>
                <tbody>${rows.map((r, i) => 
                    `<tr><td>${i + 1}</td><td>${r.Product_Number}</td><td>${r.T1}</td><td>${r.T2}</td><td>${r.T3}</td></tr>`).join("")}</tbody>
            </table>`;
    }

    // 지표 비교 (막대)
    function renderFeatureChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-features");
        if (!canvas) return;
        destroyChart("featChart");
        const ctx = canvas.getContext("2d");
        const colors = ["#4e79a7", "#f28e2b", "#e15759"];
        const metrics = ["MAE", "SMAPE", "Accuracy"];
        const vals = data.flatMap(d => [d.MAE ?? 0, d.SMAPE ?? 0, d.Accuracy ?? 0]);
        const maxV = Math.max(...vals);
        const step = maxV <= 50 ? 10 : maxV <= 200 ? 20 : 50;
        const yMax = Math.ceil(maxV / step + 1) * step;

        window.chartInstances.featChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: prods,
                datasets: metrics.map((m, i) => ({
                    label: m,
                    data: prods.map(p => data.find(d => d.Product_Number === p)?.[m] ?? 0),
                    backgroundColor: colors[i]
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 600 },
                plugins: {
                    title: { display: true, text: "지표 비교 (MAE / SMAPE / Accuracy)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#fff",
                        anchor: "end",
                        align: "top",
                        font: { weight: "bold", size: 11 },
                        formatter: v => (v ?? "").toLocaleString()
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

    // 정확도 비교 (라인)
    function renderAccuracyChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-epochs");
        if (!canvas) return;
        destroyChart("accChart");
        const ctx = canvas.getContext("2d");

        window.chartInstances.accChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: prods,
                datasets: [{
                    label: "Accuracy(%)",
                    data: prods.map(p => data.find(d => d.Product_Number === p)?.Accuracy ?? 0),
                    borderColor: "#4e79a7",
                    backgroundColor: "rgba(78,121,167,0.2)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 600 },
                plugins: {
                    title: { display: true, text: "제품별 Accuracy 변화" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#fff",
                        anchor: "center",
                        align: "bottom",
                        font: { weight: "bold", size: 10 },
                        formatter: v => (v ?? 0).toFixed(1) + "%"
                    }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, max: 100, ticks: { color: "#cbd5e1" } }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    window.renderCharts_A = renderCharts;
    renderCharts("Product_8");
})();