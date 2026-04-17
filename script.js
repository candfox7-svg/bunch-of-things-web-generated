/**
 * Premium Interaction Suite - Logic Script
 * Features: Firebase Sync, Timer, YouTube Player, Lucky Draw, Marquee, Particles
 */

// --- 1. Firebase Initialization (Compat SDK) ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db;
let isFirebaseConnected = false;

// Try to initialize Firebase
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        isFirebaseConnected = true;
        console.log("Firebase Connected Successfully");
    } else {
        console.warn("Firebase not configured or script not loaded. Interaction sync will be local only.");
    }
} catch (error) {
    console.error("Firebase Init Error:", error);
}

// --- 2. State Management ---
const state = {
    timer: {
        interval: null,
        timeLeft: 0,
        isRunning: false
    },
    draw: {
        history: new Set(),
        currentResults: []
    },
    interactions: {
        like: 0,
        star: 0,
        rocket: 0
    }
};

// --- 3. DOM Elements ---
const dom = {
    // Activity Title
    activityTitle: document.getElementById('activity-title'),
    inputTitle: document.getElementById('input-title'),
    
    // Marquee
    marqueeContent: document.getElementById('marquee-content'),
    marqueeContainer: document.getElementById('marquee-container'),
    inputMarquee: document.getElementById('input-marquee'),
    marqueeColor: document.getElementById('marquee-color'),
    marqueeBg: document.getElementById('marquee-bg'),
    marqueeSpeed: document.getElementById('marquee-speed'),
    
    // Timer
    timerDisplay: document.getElementById('timer-display'),
    timerMin: document.getElementById('timer-min'),
    timerSec: document.getElementById('timer-sec'),
    btnStartTimer: document.getElementById('start-timer'),
    btnResetTimer: document.getElementById('reset-timer'),
    
    // YouTube
    ytUrl: document.getElementById('yt-url'),
    btnLoadYt: document.getElementById('load-yt'),
    ytPlaceholder: document.getElementById('yt-placeholder'),
    ytIframeWrapper: document.getElementById('yt-iframe-wrapper'),
    
    // Lucky Draw
    drawMin: document.getElementById('draw-min'),
    drawMax: document.getElementById('draw-max'),
    drawExclude: document.getElementById('draw-exclude'),
    drawCount: document.getElementById('draw-count'),
    drawUnique: document.getElementById('draw-unique'),
    btnStartDraw: document.getElementById('start-draw'),
    btnClearDraw: document.getElementById('clear-draw'),
    drawResultContainer: document.getElementById('draw-result-container'),
    drawHistoryCount: document.getElementById('draw-history-count'),
    
    // Interactions
    btnLike: document.getElementById('btn-like'),
    btnStar: document.getElementById('btn-star'),
    btnRocket: document.getElementById('btn-rocket'),
    countLike: document.getElementById('count-like'),
    countStar: document.getElementById('count-star'),
    countRocket: document.getElementById('count-rocket'),
    
    // Background Settings
    inputBgColor: document.getElementById('input-bg-color'),
    inputGradColor1: document.getElementById('input-grad-color-1'),
    inputGradColor2: document.getElementById('input-grad-color-2'),
    inputGradPos1X: document.getElementById('input-grad-pos-1-x'),
    inputGradPos1Y: document.getElementById('input-grad-pos-1-y'),
    inputGradPos2X: document.getElementById('input-grad-pos-2-x'),
    inputGradPos2Y: document.getElementById('input-grad-pos-2-y'),
    btnUpdateBgSettings: document.getElementById('update-bg-settings'),
    
    // Global
    btnUpdateSettings: document.getElementById('update-settings'),
    notification: document.getElementById('notification'),
    particleContainer: document.getElementById('particle-container')
};

// --- 4. Initialization ---
function init() {
    loadSettings();
    setupEventListeners();
    if (isFirebaseConnected) {
        syncInteractions();
    }
}

// --- 5. Settings & LocalStorage ---
function loadSettings() {
    const saved = JSON.parse(localStorage.getItem('appSettings')) || {};
    
    // Activity Title
    const titleText = saved.title || "互動式活動大廳 ✨";
    dom.activityTitle.textContent = titleText;
    dom.inputTitle.value = titleText;
    
    // Marquee
    const marqueeText = saved.marquee || "歡迎光臨！準備開始我們的精彩活動 ✨ 🚀 🌈";
    const mColor = saved.marqueeColor || "#ffffff";
    const mBg = saved.marqueeBg || "#6366f1";
    const mSpeed = saved.marqueeSpeed || 15;
    
    updateMarqueeUI(marqueeText, mColor, mBg, mSpeed);
    
    dom.inputMarquee.value = marqueeText;
    dom.marqueeColor.value = mColor;
    dom.marqueeBg.value = mBg;
    dom.marqueeSpeed.value = mSpeed;

    // Background Customization
    const bg = saved.background || {
        color: '#0f172a',
        grad1: '#63e0f1',
        grad2: '#f5c31e',
        pos1x: 0,
        pos1y: 0,
        pos2x: 100,
        pos2y: 100
    };
    
    applyBgSettings(bg);
    
    // Set Input values
    dom.inputBgColor.value = bg.color;
    dom.inputGradColor1.value = bg.grad1;
    dom.inputGradColor2.value = bg.grad2;
    dom.inputGradPos1X.value = bg.pos1x;
    dom.inputGradPos1Y.value = bg.pos1y;
    dom.inputGradPos2X.value = bg.pos2x;
    dom.inputGradPos2Y.value = bg.pos2y;
}

function applyBgSettings(bg) {
    document.documentElement.style.setProperty('--bg-color', bg.color);
    document.documentElement.style.setProperty('--grad-color-1', bg.grad1);
    document.documentElement.style.setProperty('--grad-color-2', bg.grad2);
    document.documentElement.style.setProperty('--grad-pos-1', `${bg.pos1x}% ${bg.pos1y}%`);
    document.documentElement.style.setProperty('--grad-pos-2', `${bg.pos2x}% ${bg.pos2y}%`);
}

function updateMarqueeUI(text, color, bg, speed) {
    dom.marqueeContent.textContent = text;
    dom.marqueeContent.style.color = color;
    dom.marqueeContainer.style.backgroundColor = bg;
    dom.marqueeContent.style.animationDuration = `${speed}s`;
    
    // Reset animation to ensure it picks up new duration correctly
    dom.marqueeContent.style.animation = 'none';
    dom.marqueeContent.offsetHeight; // trigger reflow
    dom.marqueeContent.style.animation = `marquee ${speed}s linear infinite`;
}

function saveSettings() {
    const settings = {
        title: dom.inputTitle.value,
        marquee: dom.inputMarquee.value,
        marqueeColor: dom.marqueeColor.value,
        marqueeBg: dom.marqueeBg.value,
        marqueeSpeed: dom.marqueeSpeed.value
    };
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Apply immediately
    dom.activityTitle.textContent = settings.title;
    updateMarqueeUI(settings.marquee, settings.marqueeColor, settings.marqueeBg, settings.marqueeSpeed);
    
    showNotification("設定已儲存並更新！");
}

function saveBgSettings() {
    const bg = {
        color: dom.inputBgColor.value,
        grad1: dom.inputGradColor1.value,
        grad2: dom.inputGradColor2.value,
        pos1x: dom.inputGradPos1X.value,
        pos1y: dom.inputGradPos1Y.value,
        pos2x: dom.inputGradPos2X.value,
        pos2y: dom.inputGradPos2Y.value
    };
    
    const saved = JSON.parse(localStorage.getItem('appSettings')) || {};
    saved.background = bg;
    localStorage.setItem('appSettings', JSON.stringify(saved));
    
    applyBgSettings(bg);
    showNotification("背景樣式已套用！");
}

// --- 6. Timer Logic ---
function startTimer() {
    if (state.timer.isRunning) {
        clearInterval(state.timer.interval);
        state.timer.isRunning = false;
        dom.btnStartTimer.innerHTML = '<i class="fas fa-play"></i> 開始';
        return;
    }

    const mins = parseInt(dom.timerMin.value) || 0;
    const secs = parseInt(dom.timerSec.value) || 0;
    
    if (state.timer.timeLeft <= 0) {
        state.timer.timeLeft = (mins * 60) + secs;
    }

    if (state.timer.timeLeft <= 0) return;

    state.timer.isRunning = true;
    dom.btnStartTimer.innerHTML = '<i class="fas fa-pause"></i> 暫停';

    state.timer.interval = setInterval(() => {
        state.timer.timeLeft--;
        updateTimerDisplay();

        if (state.timer.timeLeft <= 0) {
            clearInterval(state.timer.interval);
            state.timer.isRunning = false;
            dom.btnStartTimer.innerHTML = '<i class="fas fa-play"></i> 開始';
            timerFinished();
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(state.timer.interval);
    state.timer.isRunning = false;
    state.timer.timeLeft = 0;
    dom.btnStartTimer.innerHTML = '<i class="fas fa-play"></i> 開始';
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = Math.floor(state.timer.timeLeft / 60);
    const secs = state.timer.timeLeft % 60;
    dom.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function timerFinished() {
    showNotification("⏰ 時間到！活動環節結束囉！");
    // Play simple beep or visual alert
    dom.timerDisplay.style.color = '#f43f5e';
    setTimeout(() => dom.timerDisplay.style.color = '', 3000);
}

// --- 7. YouTube Logic ---
function loadYouTube() {
    const url = dom.ytUrl.value.trim();
    if (!url) {
        showNotification("請先輸入 YouTube 網址 ⚠️");
        return;
    }
    
    const videoId = extractYouTubeId(url);
    
    if (videoId) {
        dom.ytPlaceholder.classList.add('hidden');
        dom.ytIframeWrapper.classList.remove('hidden');
        // Refined URL for better compatibility and to avoid common embed errors
        dom.ytIframeWrapper.innerHTML = `
            <iframe width="100%" height="100%" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1" 
                title="YouTube video player" frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen></iframe>
        `;
        showNotification("影片已載入！(已自動靜音播放)");
    } else {
        showNotification("無法識別此網址，請檢查格式 ⚠️");
    }
}

function extractYouTubeId(url) {
    // Standard ID is 11 chars. Let's try multiple common patterns.
    const patterns = [
        /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,
        /(?:embed\/|v\/|youtu.be\/)([0-9A-Za-z_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    
    // Fallback for raw ID
    if (url.length === 11 && /^[0-9A-Za-z_-]+$/.test(url)) return url;
    
    return null;
}

// --- 8. Lucky Draw Logic ---
function runLuckyDraw() {
    const min = parseInt(dom.drawMin.value) || 1;
    const max = parseInt(dom.drawMax.value) || 50;
    const count = parseInt(dom.drawCount.value) || 1;
    const excludeInput = dom.drawExclude.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    const unique = dom.drawUnique.checked;

    if (min >= max) {
        showNotification("範圍設定錯誤 ⚠️");
        return;
    }

    // Create pool
    let pool = [];
    for (let i = min; i <= max; i++) {
        if (!excludeInput.includes(i)) {
            if (!unique || !state.draw.history.has(i)) {
                pool.push(i);
            }
        }
    }

    if (pool.length < count) {
        showNotification("可抽取的號碼不足 ⚠️");
        return;
    }

    // Draw
    const results = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const drawn = pool.splice(randomIndex, 1)[0];
        results.push(drawn);
        if (unique) state.draw.history.add(drawn);
    }

    displayDrawResults(results);
}

function displayDrawResults(results) {
    // Clear display first
    dom.drawResultContainer.innerHTML = '';
    
    results.forEach((num, index) => {
        setTimeout(() => {
            const item = document.createElement('div');
            item.className = 'draw-item';
            item.textContent = num;
            dom.drawResultContainer.appendChild(item);
            
            // Create mini-explosion for each number
            createParticles(
                dom.drawResultContainer.offsetLeft + (dom.drawResultContainer.offsetWidth / 2),
                dom.drawResultContainer.offsetTop + (dom.drawResultContainer.offsetHeight / 2),
                '#6366f1'
            );
        }, index * 300);
    });

    dom.drawHistoryCount.textContent = state.draw.history.size;
}

function clearDraw() {
    state.draw.history.clear();
    dom.drawResultContainer.innerHTML = '';
    dom.drawHistoryCount.textContent = '0';
    showNotification("抽獎歷史已清除");
}

// --- 9. Interaction & Firebase Sync ---
function interact(type, color) {
    // Local Update (UI responsiveness)
    state.interactions[type]++;
    updateCounterUI(type, state.interactions[type]);
    
    // Visual Effect
    const btn = document.getElementById(`btn-${type}`);
    const rect = btn.getBoundingClientRect();
    createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, color);

    // Firebase Update
    if (isFirebaseConnected) {
        db.ref('interactions').update({
            [type]: firebase.database.ServerValue.increment(1)
        });
    }
}

function syncInteractions() {
    db.ref('interactions').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.interactions = { ...state.interactions, ...data };
            updateCounterUI('like', data.like || 0);
            updateCounterUI('star', data.star || 0);
            updateCounterUI('rocket', data.rocket || 0);
        }
    });
}

function updateCounterUI(type, count) {
    const el = document.getElementById(`count-${type}`);
    if (el) {
        // Animate number change
        el.style.transform = 'scale(1.2)';
        el.textContent = count;
        setTimeout(() => el.style.transform = 'scale(1)', 100);
    }
}

// --- 10. Visual Effects (Particles) ---
function createParticles(x, y, color) {
    const count = 15;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color;
        p.style.width = Math.random() * 8 + 4 + 'px';
        p.style.height = p.style.width;
        p.style.borderRadius = '50%';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        
        const destinationX = (Math.random() - 0.5) * 200;
        const destinationY = (Math.random() - 0.5) * 200;
        
        p.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${destinationX}px, ${destinationY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 500 + Math.random() * 500,
            easing: 'cubic-bezier(0, .9, .57, 1)',
            fill: 'forwards'
        });
        
        dom.particleContainer.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    }
}

// --- 11. Helpers ---
function showNotification(msg) {
    dom.notification.textContent = msg;
    dom.notification.classList.remove('hidden');
    setTimeout(() => {
        dom.notification.classList.add('hidden');
    }, 3000);
}

function setupEventListeners() {
    // Settings
    dom.btnUpdateSettings.addEventListener('click', saveSettings);
    dom.btnUpdateBgSettings.addEventListener('click', saveBgSettings);
    
    // Timer
    dom.btnStartTimer.addEventListener('click', startTimer);
    dom.btnResetTimer.addEventListener('click', resetTimer);
    
    // YouTube
    dom.btnLoadYt.addEventListener('click', loadYouTube);
    
    // Lucky Draw
    dom.btnStartDraw.addEventListener('click', runLuckyDraw);
    dom.btnClearDraw.addEventListener('click', clearDraw);
    
    // Interactions
    dom.btnLike.addEventListener('click', () => interact('like', '#f43f5e'));
    dom.btnStar.addEventListener('click', () => interact('star', '#f59e0b'));
    dom.btnRocket.addEventListener('click', () => interact('rocket', '#6366f1'));
}

// Boot
window.addEventListener('DOMContentLoaded', init);
