/**
 * ============================================
 * 🎵 wave-sim.js — 聲音波形模擬器
 * ============================================
 * 
 * 功能：
 *   - 在 Canvas 上繪製即時正弦波動畫
 *   - 兩個滑桿：弦的長度 / 弦的粗細 → 影響頻率
 *   - Web Audio API OscillatorNode 播放 1 秒聲音
 *   - 即時顯示頻率值與音高描述（高音/中音/低音）
 * 
 * 所需 HTML 元素：
 *   <canvas id="wave-canvas">
 *   <input id="wave-length" type="range" min="1" max="10">
 *   <input id="wave-thickness" type="range" min="1" max="10">
 *   <button id="wave-play-btn">
 *   <span id="wave-freq-display">
 *   <span id="wave-pitch-label">
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ── DOM 元素 ──
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return; // 若頁面上沒有此模組的元素就跳過

  const ctx = canvas.getContext('2d');
  const lengthSlider   = document.getElementById('wave-length');
  const thicknessSlider = document.getElementById('wave-thickness');
  const playBtn        = document.getElementById('wave-play-btn');
  const freqDisplay    = document.getElementById('wave-freq-display');
  const pitchLabel     = document.getElementById('wave-pitch-label');

  // ── 參數 ──
  const FREQ_MIN = 200;
  const FREQ_MAX = 800;
  let animId = null;
  let phase = 0;           // 波形相位
  let isPlaying = false;   // 是否正在播放聲音

  // ── 頻率計算 ──
  // 長度越長 → 頻率越低；粗細越粗 → 頻率越低
  // 兩者都是 1~10，映射到 0~1 後取平均影響
  function calcFrequency() {
    const len = parseFloat(lengthSlider.value);   // 1-10
    const thk = parseFloat(thicknessSlider.value); // 1-10
    // 將長度和粗細正規化為 0~1（越大 → 值越大）
    const lenNorm = (len - 1) / 9;   // 0 = 最短, 1 = 最長
    const thkNorm = (thk - 1) / 9;   // 0 = 最細, 1 = 最粗
    // 綜合影響因子：兩者平均（越大 → 頻率應越低）
    const factor = (lenNorm + thkNorm) / 2;
    // factor 0 → FREQ_MAX, factor 1 → FREQ_MIN
    return FREQ_MAX - factor * (FREQ_MAX - FREQ_MIN);
  }

  // ── 音高描述 ──
  function pitchDescription(freq) {
    if (freq >= 600) return '🔔 高音';
    if (freq >= 400) return '🎵 中音';
    return '🥁 低音';
  }

  // ── 更新顯示 ──
  function updateDisplay() {
    const freq = calcFrequency();
    if (freqDisplay) freqDisplay.textContent = Math.round(freq) + ' Hz';
    if (pitchLabel)  pitchLabel.textContent  = pitchDescription(freq);
  }

  // ── Canvas 自適應尺寸 ──
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  // ── 繪製波形 ──
  function drawWave() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const freq = calcFrequency();

    // 清除畫面
    ctx.clearRect(0, 0, w, h);

    // 背景已由 CSS 處理，這裡只繪製波形

    // 建立漸層筆刷 #FF6B9D → #C084FC
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#FF6B9D');
    grad.addColorStop(1, '#C084FC');

    // 波形參數
    const amplitude = h * 0.3;                       // 振幅
    const wavelength = w / ((freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN) * 3 + 1.5); // 頻率越高 → 波長越短
    const thickness = parseFloat(thicknessSlider.value); // 用於視覺線寬
    const lineWidth = 2 + thickness * 0.6;

    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let x = 0; x <= w; x += 1) {
      const y = h / 2 + amplitude * Math.sin((x / wavelength) * Math.PI * 2 + phase);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 發光效果
    ctx.shadowColor = '#FF6B9D';
    ctx.shadowBlur = isPlaying ? 20 : 8;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 107, 157, 0.3)';
    ctx.lineWidth = lineWidth + 4;
    for (let x = 0; x <= w; x += 2) {
      const y = h / 2 + amplitude * Math.sin((x / wavelength) * Math.PI * 2 + phase);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 更新相位（動畫速度與頻率掛鉤）
    phase += (freq / FREQ_MAX) * 0.12;

    animId = requestAnimationFrame(drawWave);
  }

  // ── Web Audio API 播放 ──
  function playSound() {
    if (isPlaying) return;
    isPlaying = true;
    playBtn.textContent = '🔊 播放中...';
    playBtn.disabled = true;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(calcFrequency(), audioCtx.currentTime);

    // 平滑淡入淡出避免爆音
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.9);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.0);

    osc.onended = function () {
      audioCtx.close();
      isPlaying = false;
      playBtn.textContent = '🔊 播放聲音';
      playBtn.disabled = false;
    };
  }

  // ── 事件綁定 ──
  lengthSlider.addEventListener('input', updateDisplay);
  thicknessSlider.addEventListener('input', updateDisplay);
  playBtn.addEventListener('click', playSound);

  // 視窗大小變化時重新設定 Canvas
  window.addEventListener('resize', resizeCanvas);

  // ── 初始化 ──
  resizeCanvas();
  updateDisplay();
  drawWave();
});
