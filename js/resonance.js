/**
 * ============================================
 * 📦 resonance.js — 共鳴箱模擬器
 * ============================================
 * 
 * 功能：
 *   - 中央手機圖示發出聲音
 *   - 4 種容器（紙杯、碗、鞋盒、鐵罐）+ 無容器
 *   - 點選容器 → 手機放入動畫
 *   - Web Audio API 播放持續旋律，根據容器調整
 *     GainNode / BiquadFilterNode / DelayNode
 *   - 動態分貝計 #volume-meter-fill
 *   - 音量文字 #volume-label-text
 * 
 * 所需 HTML 元素：
 *   <div id="resonance-sim">
 *   <div id="volume-meter-fill">
 *   <span id="volume-label-text">
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var simContainer = document.getElementById('resonance-sim');
  if (!simContainer) return;

  // ── 容器設定 ──
  var CONTAINERS = [
    {
      id: 'none',
      icon: '📱',
      name: '無容器',
      gain: 0.10,
      filterFreq: 1000,
      filterQ: 0.5,
      filterType: 'peaking',
      delayTime: 0,
      description: '🔈 小聲',
      meterWidth: 15
    },
    {
      id: 'cup',
      icon: '🥤',
      name: '紙杯',
      gain: 0.20,
      filterFreq: 2500,
      filterQ: 2,
      filterType: 'peaking',
      delayTime: 0.02,
      description: '🔉 中等 — 高音稍增',
      meterWidth: 35
    },
    {
      id: 'bowl',
      icon: '🥣',
      name: '碗',
      gain: 0.30,
      filterFreq: 800,
      filterQ: 3,
      filterType: 'peaking',
      delayTime: 0.05,
      description: '🔉 中偏大 — 中頻增強',
      meterWidth: 55
    },
    {
      id: 'box',
      icon: '📦',
      name: '鞋盒',
      gain: 0.42,
      filterFreq: 500,
      filterQ: 2,
      filterType: 'peaking',
      delayTime: 0.08,
      description: '🔊 大聲 — 飽滿共鳴',
      meterWidth: 75
    },
    {
      id: 'can',
      icon: '🥫',
      name: '鐵罐',
      gain: 0.55,
      filterFreq: 3500,
      filterQ: 5,
      filterType: 'peaking',
      delayTime: 0.15,
      description: '🔊 最大聲 — 金屬回音',
      meterWidth: 95
    }
  ];

  var currentContainer = null;
  var audioCtx = null;
  var masterGain = null;
  var filter = null;
  var delayNode = null;
  var delayGain = null;
  var isAudioPlaying = false;
  var melodyTimeouts = [];

  // ── DOM 參考 ──
  var volumeFill  = document.getElementById('volume-meter-fill');
  var volumeLabel = document.getElementById('volume-label-text');

  // ── 建構 UI ──
  function buildUI() {
    // 如果容器選項已由 HTML 提供，就不再動態生成
    // 這裡動態建立以確保模組完整自包含

    // 檢查是否已有 resonance-stage
    var existingStage = simContainer.querySelector('.resonance-stage');
    if (existingStage) {
      // 已有 HTML，綁定事件即可
      bindContainerEvents(existingStage);
      return;
    }

    // 動態建構
    var stage = document.createElement('div');
    stage.className = 'resonance-stage';

    // 手機圖示
    var phone = document.createElement('div');
    phone.className = 'resonance-phone';
    phone.id = 'resonance-phone';
    phone.innerHTML = '📱';
    stage.appendChild(phone);

    // 容器選項（跳過第一個「無容器」，它用按鈕表達）
    CONTAINERS.forEach(function (c, i) {
      if (i === 0) return; // 無容器作為「移除」按鈕
      var card = document.createElement('div');
      card.className = 'resonance-container-option';
      card.dataset.containerId = c.id;
      card.innerHTML =
        '<div class="container-icon">' + c.icon + '</div>' +
        '<div class="container-name">' + c.name + '</div>';
      stage.appendChild(card);
    });

    simContainer.insertBefore(stage, simContainer.querySelector('.volume-meter') || simContainer.firstChild);

    // 播放 / 停止 / 移除容器 按鈕列
    var controls = document.createElement('div');
    controls.style.cssText = 'display:flex;gap:12px;justify-content:center;margin:16px 0;flex-wrap:wrap;';

    var playBtn = document.createElement('button');
    playBtn.className = 'sim-play-btn';
    playBtn.id = 'resonance-play-btn';
    playBtn.textContent = '🔊 播放聲音';
    playBtn.addEventListener('click', toggleAudio);
    controls.appendChild(playBtn);

    var removeBtn = document.createElement('button');
    removeBtn.className = 'sim-play-btn';
    removeBtn.style.background = 'linear-gradient(135deg, #94a3b8, #64748b)';
    removeBtn.textContent = '📱 移除容器';
    removeBtn.addEventListener('click', function () {
      selectContainer(0); // 無容器
    });
    controls.appendChild(removeBtn);

    simContainer.insertBefore(controls, simContainer.querySelector('.volume-meter') || null);

    bindContainerEvents(stage);
  }

  // ── 綁定容器點擊事件 ──
  function bindContainerEvents(stage) {
    var options = stage.querySelectorAll('.resonance-container-option');
    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        var cid = opt.dataset.containerId;
        var idx = CONTAINERS.findIndex(function (c) { return c.id === cid; });
        if (idx >= 0) selectContainer(idx);

        // 選中狀態
        options.forEach(function (o) { o.classList.remove('selected'); });
        if (idx > 0) opt.classList.add('selected');
      });
    });
  }

  // ── 選擇容器 ──
  function selectContainer(index) {
    currentContainer = CONTAINERS[index];

    // 手機動畫
    var phone = document.getElementById('resonance-phone') ||
                simContainer.querySelector('.resonance-phone');
    if (phone) {
      if (index === 0) {
        phone.style.transform = 'scale(1)';
        phone.style.opacity = '1';
      } else {
        // 手機「縮進」容器的動畫
        phone.style.transform = 'scale(0.7) translateY(10px)';
        phone.style.opacity = '0.7';
      }
    }

    // 更新音量計
    updateMeter();

    // 如果正在播放，即時調整音效
    if (isAudioPlaying && audioCtx) {
      applyContainerEffect();
    }

    // 取消其他容器的選中（如果是「無容器」）
    if (index === 0) {
      var allOpts = simContainer.querySelectorAll('.resonance-container-option');
      allOpts.forEach(function (o) { o.classList.remove('selected'); });
    }
  }

  // ── 更新音量計與標籤 ──
  function updateMeter() {
    if (!currentContainer) currentContainer = CONTAINERS[0];
    if (volumeFill) {
      volumeFill.style.width = currentContainer.meterWidth + '%';
    }
    if (volumeLabel) {
      volumeLabel.textContent = currentContainer.description;
    }
  }

  // ── 套用容器效果到正在播放的音訊 ──
  function applyContainerEffect() {
    if (!currentContainer || !audioCtx) return;
    var c = currentContainer;
    var t = audioCtx.currentTime;

    // 調整音量
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(c.gain, t + 0.3);
    }

    // 調整濾波器
    if (filter) {
      filter.type = c.filterType;
      filter.frequency.cancelScheduledValues(t);
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      filter.frequency.linearRampToValueAtTime(c.filterFreq, t + 0.3);
      filter.Q.cancelScheduledValues(t);
      filter.Q.setValueAtTime(filter.Q.value, t);
      filter.Q.linearRampToValueAtTime(c.filterQ, t + 0.3);
      filter.gain.setValueAtTime(8, t); // peaking boost
    }

    // 調整延遲（模擬回音）
    if (delayNode && delayGain) {
      delayNode.delayTime.cancelScheduledValues(t);
      delayNode.delayTime.setValueAtTime(delayNode.delayTime.value, t);
      delayNode.delayTime.linearRampToValueAtTime(c.delayTime, t + 0.2);
      // 延遲混音量：延遲越長 → feedback 越明顯
      var fbGain = c.delayTime > 0 ? 0.35 : 0;
      delayGain.gain.cancelScheduledValues(t);
      delayGain.gain.setValueAtTime(delayGain.gain.value, t);
      delayGain.gain.linearRampToValueAtTime(fbGain, t + 0.3);
    }
  }

  // ── 開始/停止音訊 ──
  function toggleAudio() {
    if (isAudioPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  }

  function startAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // 節點鏈：oscillators → filter → delay(feedback) → masterGain → destination
    masterGain = audioCtx.createGain();
    filter = audioCtx.createBiquadFilter();
    delayNode = audioCtx.createDelay(1.0);
    delayGain = audioCtx.createGain();

    // 預設值
    var c = currentContainer || CONTAINERS[0];
    masterGain.gain.value = c.gain;
    filter.type = c.filterType;
    filter.frequency.value = c.filterFreq;
    filter.Q.value = c.filterQ;
    filter.gain.value = 8;
    delayNode.delayTime.value = c.delayTime;
    delayGain.gain.value = c.delayTime > 0 ? 0.35 : 0;

    // 連接 delay feedback loop
    // source → filter → masterGain → destination
    //                 ↘ delay → delayGain → masterGain (feedback)
    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);
    filter.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(masterGain);

    // 播放簡單旋律（循環）
    playMelodyLoop(audioCtx, filter);

    isAudioPlaying = true;

    // 更新按鈕
    var btn = document.getElementById('resonance-play-btn') ||
              simContainer.querySelector('.sim-play-btn');
    if (btn) {
      btn.textContent = '⏹ 停止';
      btn.style.background = 'linear-gradient(135deg, #F87171, #DC2626)';
    }

    // 手機振動
    var phone = document.getElementById('resonance-phone') ||
                simContainer.querySelector('.resonance-phone');
    if (phone) phone.classList.add('playing');
  }

  function stopAudio() {
    // 清除旋律排程
    melodyTimeouts.forEach(function (t) { clearTimeout(t); });
    melodyTimeouts = [];

    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    isAudioPlaying = false;

    var btn = document.getElementById('resonance-play-btn') ||
              simContainer.querySelector('.sim-play-btn');
    if (btn) {
      btn.textContent = '🔊 播放聲音';
      btn.style.background = '';
    }

    var phone = document.getElementById('resonance-phone') ||
                simContainer.querySelector('.resonance-phone');
    if (phone) phone.classList.remove('playing');
  }

  // ── 簡單旋律播放器（小星星片段循環） ──
  function playMelodyLoop(ctx, dest) {
    // 旋律：Do Do Sol Sol La La Sol - Fa Fa Mi Mi Re Re Do
    var melody = [
      { freq: 523.25, dur: 0.3 },
      { freq: 523.25, dur: 0.3 },
      { freq: 783.99, dur: 0.3 },
      { freq: 783.99, dur: 0.3 },
      { freq: 880.00, dur: 0.3 },
      { freq: 880.00, dur: 0.3 },
      { freq: 783.99, dur: 0.6 },
      { freq: 698.46, dur: 0.3 },
      { freq: 698.46, dur: 0.3 },
      { freq: 659.25, dur: 0.3 },
      { freq: 659.25, dur: 0.3 },
      { freq: 587.33, dur: 0.3 },
      { freq: 587.33, dur: 0.3 },
      { freq: 523.25, dur: 0.6 }
    ];

    var totalDuration = melody.reduce(function (s, n) { return s + n.dur; }, 0);

    function scheduleLoop() {
      if (!isAudioPlaying || !audioCtx) return;

      var time = audioCtx.currentTime + 0.05;

      melody.forEach(function (note) {
        var osc = audioCtx.createOscillator();
        var noteGain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = note.freq;

        // 柔和包絡
        noteGain.gain.setValueAtTime(0, time);
        noteGain.gain.linearRampToValueAtTime(0.5, time + 0.02);
        noteGain.gain.setValueAtTime(0.5, time + note.dur - 0.05);
        noteGain.gain.linearRampToValueAtTime(0, time + note.dur);

        osc.connect(noteGain);
        noteGain.connect(dest); // 接到 filter → masterGain → output

        osc.start(time);
        osc.stop(time + note.dur);

        time += note.dur;
      });

      // 循環排程
      var tid = setTimeout(function () {
        scheduleLoop();
      }, totalDuration * 1000);
      melodyTimeouts.push(tid);
    }

    scheduleLoop();
  }

  // ── 初始化 ──
  currentContainer = CONTAINERS[0];
  buildUI();
  updateMeter();
});
