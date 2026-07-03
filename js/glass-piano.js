/**
 * ============================================
 * 🥂 glass-piano.js — 水杯鐘琴互動器
 * ============================================
 * 
 * 功能：
 *   - 動態生成 8 個 SVG 水杯（C4-C5 音階）
 *   - 每個杯子可調整水位（懸停顯示滑桿）
 *   - 點擊杯子播放 Web Audio 合成音（水位越高音越低）
 *   - 搖晃動畫與彩虹色水面
 *   - 「🎵 小星星挑戰」功能：依序高亮應敲杯子
 * 
 * 所需 HTML 元素：
 *   <div id="glass-piano-container">
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const container = document.getElementById('glass-piano-container');
  if (!container) return;

  // ── 音階頻率（C4 到 C5） ──
  const NOTES = [
    { name: 'Do',  note: 'C4',  freq: 261.63 },
    { name: 'Re',  note: 'D4',  freq: 293.66 },
    { name: 'Mi',  note: 'E4',  freq: 329.63 },
    { name: 'Fa',  note: 'F4',  freq: 349.23 },
    { name: 'Sol', note: 'G4',  freq: 392.00 },
    { name: 'La',  note: 'A4',  freq: 440.00 },
    { name: 'Si',  note: 'B4',  freq: 493.88 },
    { name: 'Do',  note: 'C5',  freq: 523.25 }
  ];

  // ── 彩虹色 ──
  const COLORS = [
    '#FF6B6B', // 紅
    '#FFA94D', // 橘
    '#FFD43B', // 黃
    '#69DB7C', // 綠
    '#38BDF8', // 藍
    '#748FFC', // 靛
    '#C084FC', // 紫
    '#FF6B9D'  // 粉
  ];

  // 每個杯子的水位（0~1），預設依序遞增（水越多音越低）
  const waterLevels = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

  // ── 建立杯子 SVG ──
  function createGlassSVG(index) {
    const color = COLORS[index];
    const waterLevel = waterLevels[index];
    const waterH = 70 * waterLevel; // 杯子內部高度約 70
    const waterY = 110 - waterH;    // 水面 Y 位置

    const svg = `
    <svg viewBox="0 0 70 130" class="glass-svg" data-index="${index}">
      <!-- 杯身（圓潤梯形） -->
      <defs>
        <clipPath id="glass-clip-${index}">
          <path d="M12,20 Q10,20 11,100 Q12,115 35,118 Q58,115 59,100 Q60,20 58,20 Z"/>
        </clipPath>
        <linearGradient id="water-grad-${index}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="glass-shine-${index}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
          <stop offset="30%" stop-color="white" stop-opacity="0.05"/>
          <stop offset="70%" stop-color="white" stop-opacity="0"/>
          <stop offset="100%" stop-color="white" stop-opacity="0.15"/>
        </linearGradient>
      </defs>
      
      <!-- 杯身外輪廓 -->
      <path d="M12,20 Q10,20 11,100 Q12,115 35,118 Q58,115 59,100 Q60,20 58,20 Z" 
            fill="rgba(200,220,240,0.25)" stroke="rgba(150,180,210,0.6)" stroke-width="2"/>
      
      <!-- 水 -->
      <g clip-path="url(#glass-clip-${index})">
        <rect class="water-rect" x="10" y="${waterY}" width="50" height="${waterH + 20}" 
              fill="url(#water-grad-${index})"/>
        <!-- 水面波紋 -->
        <ellipse class="water-surface" cx="35" cy="${waterY}" rx="24" ry="3" 
                 fill="${color}" opacity="0.5"/>
      </g>
      
      <!-- 玻璃反光 -->
      <path d="M12,20 Q10,20 11,100 Q12,115 35,118 Q58,115 59,100 Q60,20 58,20 Z" 
            fill="url(#glass-shine-${index})" stroke="none"/>
      
      <!-- 杯口橢圓 -->
      <ellipse cx="35" cy="20" rx="24" ry="5" 
               fill="rgba(200,220,240,0.15)" stroke="rgba(150,180,210,0.5)" stroke-width="1.5"/>
      
      <!-- 可愛小氣泡 -->
      <circle cx="25" cy="${waterY + 15}" r="2" fill="white" opacity="0.4"/>
      <circle cx="40" cy="${waterY + 25}" r="1.5" fill="white" opacity="0.3"/>
      <circle cx="30" cy="${waterY + 35}" r="2.5" fill="white" opacity="0.25"/>
    </svg>`;

    return svg;
  }

  // ── 建立水位滑桿 ──
  function createWaterSlider(index) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '10';
    slider.max = '95';
    slider.value = String(Math.round(waterLevels[index] * 100));
    slider.className = 'sim-slider glass-water-slider';
    slider.style.cssText = 'width:60px;opacity:0;transition:opacity 0.3s;position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);';
    slider.dataset.index = index;
    return slider;
  }

  // ── 產生鋼琴區域 HTML ──
  function buildPiano() {
    // 鋼琴區
    const pianoArea = document.createElement('div');
    pianoArea.className = 'glass-piano-area';

    NOTES.forEach(function (note, i) {
      const wrapper = document.createElement('div');
      wrapper.className = 'glass-wrapper';
      wrapper.dataset.index = i;
      wrapper.style.position = 'relative';

      wrapper.innerHTML = createGlassSVG(i);

      // 音名標籤
      const label = document.createElement('div');
      label.className = 'glass-label';
      label.textContent = note.name;

      const noteTag = document.createElement('div');
      noteTag.className = 'glass-note';
      noteTag.textContent = note.note;

      // 水位滑桿
      const slider = createWaterSlider(i);

      wrapper.appendChild(label);
      wrapper.appendChild(noteTag);
      wrapper.appendChild(slider);

      // 懸停顯示/隱藏滑桿
      wrapper.addEventListener('mouseenter', function () {
        slider.style.opacity = '1';
      });
      wrapper.addEventListener('mouseleave', function () {
        slider.style.opacity = '0';
      });

      // 滑桿調水位
      slider.addEventListener('input', function (e) {
        e.stopPropagation();
        waterLevels[i] = parseInt(e.target.value) / 100;
        updateGlassVisual(wrapper, i);
      });

      // 點擊播放
      wrapper.addEventListener('click', function (e) {
        if (e.target.tagName === 'INPUT') return; // 排除滑桿操作
        playGlass(i);
        triggerAnimation(wrapper);
      });

      pianoArea.appendChild(wrapper);
    });

    container.appendChild(pianoArea);

    // 小星星挑戰按鈕
    const challengeBtn = document.createElement('button');
    challengeBtn.className = 'sim-play-btn';
    challengeBtn.style.cssText = 'display:block;margin:20px auto 0;';
    challengeBtn.textContent = '🎵 小星星挑戰';
    challengeBtn.addEventListener('click', startTwinkleChallenge);
    container.appendChild(challengeBtn);
  }

  // ── 更新杯子視覺 ──
  function updateGlassVisual(wrapper, index) {
    const svg = wrapper.querySelector('.glass-svg');
    const waterLevel = waterLevels[index];
    const waterH = 70 * waterLevel;
    const waterY = 110 - waterH;

    const waterRect = svg.querySelector('.water-rect');
    const waterSurface = svg.querySelector('.water-surface');

    if (waterRect) {
      waterRect.setAttribute('y', waterY);
      waterRect.setAttribute('height', waterH + 20);
    }
    if (waterSurface) {
      waterSurface.setAttribute('cy', waterY);
    }
  }

  // ── Web Audio 播放單個杯子 ──
  function playGlass(index) {
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // 水位越高 → 音越低（反轉頻率映射）
    var baseFreq = NOTES[index].freq;
    // 水位影響：水越多 → 頻率越低（模擬真實物理）
    var waterFactor = 1 - waterLevels[index] * 0.4; // 0.6 ~ 1.0
    var freq = baseFreq * waterFactor;

    // 使用三角波 + 正弦波混合模擬玻璃杯音色
    var osc1 = audioCtx.createOscillator();
    var osc2 = audioCtx.createOscillator();
    var gain1 = audioCtx.createGain();
    var gain2 = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2; // 倍頻

    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

    osc1.connect(gain1).connect(audioCtx.destination);
    osc2.connect(gain2).connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 1.5);
    osc2.stop(audioCtx.currentTime + 0.8);

    osc1.onended = function () { audioCtx.close(); };
  }

  // ── 搖晃動畫 ──
  function triggerAnimation(wrapper) {
    wrapper.classList.add('playing');
    setTimeout(function () {
      wrapper.classList.remove('playing');
    }, 400);
  }

  // ── 小星星挑戰 ──
  // 小星星旋律：Do Do Sol Sol La La Sol — Fa Fa Mi Mi Re Re Do
  var twinkleSequence = [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0];
  // -1 = 休止符

  function startTwinkleChallenge() {
    var wrappers = container.querySelectorAll('.glass-wrapper');
    var delay = 0;
    var tempo = 450; // ms per note

    twinkleSequence.forEach(function (noteIdx, i) {
      setTimeout(function () {
        if (noteIdx === -1) return; // 休止符
        var w = wrappers[noteIdx];
        if (!w) return;

        // 高亮效果
        w.style.boxShadow = '0 0 20px ' + COLORS[noteIdx];
        w.style.transform = 'translateY(-12px) scale(1.1)';
        triggerAnimation(w);
        playGlass(noteIdx);

        setTimeout(function () {
          w.style.boxShadow = '';
          w.style.transform = '';
        }, tempo - 50);
      }, delay);
      delay += tempo;
    });
  }

  // ── 初始化 ──
  buildPiano();
});
