// Common JavaScript - 공통 JavaScript

// Smooth Scroll
function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Debounce Function
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

// Throttle Function
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

// Intersection Observer for Animations
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

// Initialize animations on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
});

// Local Storage Utilities
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

// Format Number
function formatNumber(num, decimals = 0) {
    return num.toLocaleString('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format Percentage
function formatPercent(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}

// Generate Random Data (for demo purposes)
function generateRandomData(length, min, max) {
    return Array.from({ length }, () => 
        Math.floor(Math.random() * (max - min + 1)) + min
    );
}

// Copy to Clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        console.error('Failed to copy:', e);
        return false;
    }
}

// Show Toast Notification (simple version)
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

// Get Query Parameter
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Set Query Parameter
function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// Check if mobile device
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get Screen Size
function getScreenSize() {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

// Prevent Default
function preventDefault(e) {
    e.preventDefault();
}

// Stop Propagation
function stopPropagation(e) {
    e.stopPropagation();
}

// Add Event Listener with cleanup
function addEventListenerWithCleanup(element, event, handler) {
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
}

// Wait for element to exist
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

// Export utilities
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

// dashboard에서 사용할 common 코드
// Navigation
function navigateToIntro() {
    window.location.href = '/';
}

// Chart Configuration (공통 Chart 옵션 추가)
Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.2)';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ✅ 공통 Chart 옵션 객체 추가 (A/B에서 공통 사용)
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

// ✅ 전역 Chart 인스턴스 분리 방지용 네임스페이스 추가
window.chartInstances_A = {};
window.chartInstances_B = {};

document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");

    // ✅ 최초 페이지 진입 시 A탭 활성화 + Accuracy 표시
    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById("tab-preprocessing1")?.classList.add("active");
    navItems.forEach(i => i.classList.remove("active"));
    document.querySelector(".nav-item[data-tab='preprocessing1']")?.classList.add("active");

    // ✅ A탭일 때 Accuracy 보이기
    const accItem = document.querySelector(".info-accuracy");
    if (accItem) accItem.style.display = "flex";

    window.switchTab = function (tabName) {
        tabContents.forEach(c => c.classList.remove("active"));
        navItems.forEach(i => i.classList.remove("active"));

        document.getElementById(`tab-${tabName}`)?.classList.add("active");
        document.querySelector(`.nav-item[data-tab='${tabName}']`)?.classList.add("active");
        document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });

        // ✅ Accuracy 표시/숨김 제어
        const accItem = document.querySelector(".info-accuracy");
        if (accItem) {
            if (tabName === "preprocessing1") {
                accItem.style.display = "flex";
            } else if (tabName === "preprocessing2") {
                accItem.style.display = "none";
            }
        }

        // ✅ 각 탭 기본 상태 초기화 + 렌더 호출
        if (tabName === "preprocessing1") {
            document.querySelectorAll("#tab-preprocessing1 .subtab").forEach(t => t.classList.remove("active"));
            document.querySelector("#tab-preprocessing1 .subtab[data-target='subtab-predict']")?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing1 .subtab-content").forEach(c => c.classList.remove("active"));
            document.getElementById("subtab-predict")?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing1 .filter-button").forEach(b => b.classList.remove("active"));
            document.querySelector("#tab-preprocessing1 .filter-button")?.classList.add("active");
            if (window.renderCharts_A) window.renderCharts_A("Product_8");
        }

        if (tabName === "preprocessing2") {
            document.querySelectorAll("#tab-preprocessing2 .subtab").forEach(t => t.classList.remove("active"));
            document.querySelector("#tab-preprocessing2 .subtab[data-target='subtab-predict-b']")?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing2 .subtab-content").forEach(c => c.classList.remove("active"));
            document.getElementById("subtab-predict-b")?.classList.add("active");
            document.querySelectorAll("#tab-preprocessing2 .filter-button").forEach(b => b.classList.remove("active"));
            document.querySelector("#tab-preprocessing2 .filter-button")?.classList.add("active");
            if (window.renderCharts_B) window.renderCharts_B("Product_8");

            // 탭이 전환된 후 약간의 지연으로 Chart.js 리사이즈 강제
            setTimeout(() => {
                Object.values(window.chartInstances_B || {}).forEach(ch => {
                    if (ch && ch.resize) ch.resize();
                });
            }, 300);
        }
    };
});