// Common JavaScript - 공통 JavaScript

// 부드러운 스크롤 이동
function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 쓰로틀 함수
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 스크롤 애니메이션 초기화
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(element);
    });
}

// DOM 로드 시 애니메이션 초기화
document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
});

// 로컬 스토리지 유틸리티
const storage = {
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },
    
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },
    
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    }
};

// 숫자 포맷팅
function formatNumber(num, decimals = 0) {
    return num.toLocaleString('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// 퍼센트 포맷팅
function formatPercent(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}

// 랜덤 데이터 생성
function generateRandomData(length, min, max) {
    return Array.from({ length }, () => 
        Math.floor(Math.random() * (max - min + 1)) + min
    );
}

// 클립보드 복사
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        console.error('Failed to copy:', e);
        return false;
    }
}

// 토스트 알림 표시
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'rgba(52, 211, 153, 0.9)' : 
                     type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                     'rgba(59, 130, 246, 0.9)'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// URL 쿼리 파라미터 가져오기
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// URL 쿼리 파라미터 설정
function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// 모바일 기기 체크
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 화면 크기 체크
function getScreenSize() {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

// 기본 동작 방지
function preventDefault(e) {
    e.preventDefault();
}

// 이벤트 전파 중지
function stopPropagation(e) {
    e.stopPropagation();
}

// 이벤트 리스너 추가 및 정리
function addEventListenerWithCleanup(element, event, handler) {
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
}

// 요소가 생성될 때까지 대기
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

// 유틸리티 함수 전역 노출
window.utils = {
    smoothScrollTo,
    debounce,
    throttle,
    initScrollAnimations,
    storage,
    formatNumber,
    formatPercent,
    generateRandomData,
    copyToClipboard,
    showToast,
    getQueryParam,
    setQueryParam,
    isMobile,
    getScreenSize,
    preventDefault,
    stopPropagation,
    addEventListenerWithCleanup,
    waitForElement
};

// 인트로 페이지로 이동
function navigateToIntro() {
    window.location.href = '/';
}

// Chart.js 기본 설정
Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.2)';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// 공통 Chart 옵션
window.chartBaseOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: true,
            labels: {
                color: '#cbd5e1',
                padding: 12,
                font: { size: 12 }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            borderWidth: 1,
            padding: 12,
            displayColors: true
        }
    },
    scales: {
        x: {
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8' }
        },
        y: {
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8' }
        }
    }
};

// Chart 인스턴스 저장소
window.chartInstances_A = {};
window.chartInstances_B = {};

// 대시보드 탭 전환 로직
document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");

    // 최초 A탭 활성화
    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById("tab-preprocessing1")?.classList.add("active");
    navItems.forEach(i => i.classList.remove("active"));
    document.querySelector(".nav-item[data-tab='preprocessing1']")?.classList.add("active");

    // Accuracy 표시
    const accItem = document.querySelector(".info-accuracy");
    if (accItem) accItem.style.display = "flex";

    // 탭 전환 함수
    window.switchTab = function (tabName) {
        tabContents.forEach(c => c.classList.remove("active"));
        navItems.forEach(i => i.classList.remove("active"));

        document.getElementById(`tab-${tabName}`)?.classList.add("active");
        document.querySelector(`.nav-item[data-tab='${tabName}']`)?.classList.add("active");
        document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });

        // Accuracy 표시/숨김
        const accItem = document.querySelector(".info-accuracy");
        if (accItem) {
            if (tabName === "preprocessing1") {
                accItem.style.display = "flex";
            } else if (tabName === "preprocessing2") {
                accItem.style.display = "none";
            }
        }

        // A탭 초기화 및 렌더링
        if (tabName === "preprocessing1") {
            document.querySelectorAll("#tab-preprocessing1 .subtab").forEach(t => t.classList.remove("active"));
            document.querySelector("#tab-preprocessing1 .subtab[data-target='subtab-predict']")?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing1 .subtab-content").forEach(c => c.classList.remove("active"));
            document.getElementById("subtab-predict")?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing1 .filter-button").forEach(b => b.classList.remove("active"));
            document.querySelector("#tab-preprocessing1 .filter-button")?.classList.add("active");
            if (window.renderCharts_A) window.renderCharts_A("Product_8");
        }

        // B탭 초기화 및 렌더링
        if (tabName === "preprocessing2") {
            document.querySelectorAll("#tab-preprocessing2 .subtab").forEach(t => t.classList.remove("active"));
            document.querySelector("#tab-preprocessing2 .subtab[data-target='subtab-predict-b']")?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing2 .subtab-content").forEach(c => c.classList.remove("active"));
            document.getElementById("subtab-predict-b")?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing2 .filter-button").forEach(b => b.classList.remove("active"));
            document.querySelector("#tab-preprocessing2 .filter-button")?.classList.add("active");
            if (window.renderCharts_B) window.renderCharts_B("Product_8");

            // Chart 리사이즈
            setTimeout(() => {
                Object.values(window.chartInstances_B || {}).forEach(ch => {
                    if (ch && ch.resize) ch.resize();
                });
            }, 300);
        }
    };
});