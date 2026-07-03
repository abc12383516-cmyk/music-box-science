/**
 * ============================================
 * 🎼 music-box-3d.js — 音樂盒結構分解動畫
 * ============================================
 * 
 * 功能：
 *   - 用 SVG 繪製音樂盒的 4 個零件（外殼、滾筒、音梳、發條）
 *   - 預設組合狀態；點「拆解」→ 零件飛散 + 顯示標籤
 *   - 點「組裝」→ 零件飛回 + 音梳振動動畫
 *   - 點擊任一零件 → 顯示說明文字到 #part-info
 * 
 * 所需 HTML 元素：
 *   <div id="music-box-explode">
 *   <button id="explode-btn">
 *   <button id="assemble-btn">
 *   <div id="part-info">
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var explodeContainer = document.getElementById('music-box-explode');
  if (!explodeContainer) return;

  var explodeBtn  = document.getElementById('explode-btn');
  var assembleBtn = document.getElementById('assemble-btn');
  var partInfo    = document.getElementById('part-info');

  var isExploded = false;

  // ── 零件資料 ──
  var PARTS = [
    {
      id: 'mb-case',
      name: '🪵 外殼（木盒）',
      desc: '音樂盒的外殼通常由木頭製成，它不只是保護零件，還是重要的「共鳴箱」！木盒會放大音梳振動產生的聲音，就像吉他的琴身一樣。不同木材會產生不同的音色。',
      // 組合位置 (相對舞台中心的 transform)
      assembled: 'translate(0px, 0px) scale(1)',
      exploded:  'translate(-200px, -120px) scale(0.85)',
      labelPos:  { top: '-30px', left: '50%', transform: 'translateX(-50%)' }
    },
    {
      id: 'mb-cylinder',
      name: '🥇 滾筒（圓柱）',
      desc: '滾筒是音樂盒的「記憶」，表面的凸點（突起）排列決定了旋律。當滾筒旋轉時，凸點會撥動音梳的齒片。凸點的位置 = 音符，凸點的間距 = 節拍，整支滾筒 = 一首歌！',
      assembled: 'translate(0px, 0px) scale(1)',
      exploded:  'translate(200px, -120px) scale(0.85)',
      labelPos:  { top: '-30px', left: '50%', transform: 'translateX(-50%)' }
    },
    {
      id: 'mb-comb',
      name: '🎵 音梳（梳齒）',
      desc: '音梳是一塊鋼板，切割成長短不一的「齒片」。短的齒片振動快 → 高音；長的齒片振動慢 → 低音。這就是「弦越短，頻率越高」的原理！當滾筒的凸點撥動齒片時，齒片振動發出聲音。',
      assembled: 'translate(0px, 0px) scale(1)',
      exploded:  'translate(-200px, 140px) scale(0.85)',
      labelPos:  { bottom: '-30px', left: '50%', transform: 'translateX(-50%)' }
    },
    {
      id: 'mb-spring',
      name: '🔩 發條（彈簧）',
      desc: '發條是音樂盒的「動力來源」。轉動發條時，彈簧儲存了彈性位能。放開後，彈簧慢慢釋放能量，透過齒輪帶動滾筒穩定旋轉。能量轉換：手的動能 → 彈性位能 → 動能 → 聲能！',
      assembled: 'translate(0px, 0px) scale(1)',
      exploded:  'translate(200px, 140px) scale(0.85)',
      labelPos:  { bottom: '-30px', left: '50%', transform: 'translateX(-50%)' }
    }
  ];

  // ── 建立 SVG 舞台 ──
  function buildStage() {
    var stage = document.createElement('div');
    stage.className = 'music-box-stage';
    stage.style.position = 'relative';
    stage.style.width = '100%';
    stage.style.minHeight = '420px';

    // 大 SVG 視窗
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 600 380');
    svg.setAttribute('width', '100%');
    svg.style.maxWidth = '600px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    // 漸層定義
    var defs = document.createElementNS(svgNS, 'defs');

    // 木紋漸層
    var woodGrad = createLinearGradient(svgNS, 'wood-grad',
      [{ offset: '0%', color: '#8B6914' }, { offset: '50%', color: '#A0782C' },
       { offset: '100%', color: '#8B6914' }], '0', '0', '0', '1');
    defs.appendChild(woodGrad);

    // 金屬色漸層
    var goldGrad = createLinearGradient(svgNS, 'gold-grad',
      [{ offset: '0%', color: '#FFD700' }, { offset: '50%', color: '#FFF8DC' },
       { offset: '100%', color: '#DAA520' }], '0', '0', '1', '0');
    defs.appendChild(goldGrad);

    // 銀色漸層
    var silverGrad = createLinearGradient(svgNS, 'silver-grad',
      [{ offset: '0%', color: '#C0C0C0' }, { offset: '50%', color: '#F0F0F0' },
       { offset: '100%', color: '#A8A8A8' }], '0', '0', '0', '1');
    defs.appendChild(silverGrad);

    // 灰鐵色漸層
    var ironGrad = createLinearGradient(svgNS, 'iron-grad',
      [{ offset: '0%', color: '#708090' }, { offset: '50%', color: '#B0C4DE' },
       { offset: '100%', color: '#778899' }], '0', '0', '1', '1');
    defs.appendChild(ironGrad);

    svg.appendChild(defs);

    // ── 1. 外殼（木盒） ──
    var caseGroup = createGroup(svgNS, 'mb-case');
    // 盒身
    var caseRect = createRect(svgNS, 150, 100, 300, 200, 18, 'url(#wood-grad)', '#6B4E1B', 3);
    caseGroup.appendChild(caseRect);
    // 盒蓋裝飾線
    var caseLine = createLine(svgNS, 165, 140, 435, 140, '#6B4E1B', 2, '8,4');
    caseGroup.appendChild(caseLine);
    // 鎖扣裝飾
    var lockCircle = createCircle(svgNS, 300, 295, 8, '#DAA520', '#6B4E1B', 2);
    caseGroup.appendChild(lockCircle);
    svg.appendChild(caseGroup);

    // ── 2. 滾筒（圓柱） ──
    var cylGroup = createGroup(svgNS, 'mb-cylinder');
    // 圓柱體
    var cylRect2 = createRect(svgNS, 220, 155, 160, 60, 8, 'url(#gold-grad)', '#B8860B', 2);
    cylGroup.appendChild(cylRect2);
    // 上橢圓（3D 效果）
    var cylEllipseTop = createEllipse(svgNS, 300, 155, 80, 14, '#FFD700', '#B8860B', 2);
    cylGroup.appendChild(cylEllipseTop);
    // 下橢圓
    var cylEllipseBot = createEllipse(svgNS, 300, 215, 80, 14, '#DAA520', '#B8860B', 2);
    cylGroup.appendChild(cylEllipseBot);
    // 凸點
    var bumps = [
      [240, 170], [260, 180], [285, 168], [310, 185],
      [330, 172], [350, 190], [370, 175], [250, 195],
      [275, 200], [300, 192], [325, 205], [355, 198]
    ];
    bumps.forEach(function (pos) {
      var b = createCircle(svgNS, pos[0], pos[1], 3, '#FFF8DC', '#B8860B', 1);
      cylGroup.appendChild(b);
    });
    svg.appendChild(cylGroup);

    // ── 3. 音梳（梳齒） ──
    var combGroup = createGroup(svgNS, 'mb-comb');
    combGroup.setAttribute('id', 'mb-comb');
    // 底座
    var combBase = createRect(svgNS, 205, 240, 190, 12, 3, 'url(#silver-grad)', '#808080', 2);
    combGroup.appendChild(combBase);
    // 齒片（長短不一代表不同音高）
    var teethLengths = [40, 36, 33, 30, 27, 25, 23, 21, 20, 19, 21, 23, 25, 27, 30, 33];
    teethLengths.forEach(function (len, i) {
      var x = 213 + i * 11;
      var tooth = createRect(svgNS, x, 240 - len, 6, len, 2, 'url(#silver-grad)', '#999', 1);
      tooth.classList.add('comb-tooth');
      combGroup.appendChild(tooth);
    });
    svg.appendChild(combGroup);

    // ── 4. 發條（螺旋） ──
    var springGroup = createGroup(svgNS, 'mb-spring');
    // 外框
    var springBox = createRect(svgNS, 400, 170, 50, 50, 8, 'rgba(112,128,144,0.3)', '#708090', 2);
    springGroup.appendChild(springBox);
    // 螺旋路徑
    var spiral = document.createElementNS(svgNS, 'path');
    spiral.setAttribute('d',
      'M425,195 ' +
      'C425,185 435,185 435,195 ' +
      'C435,205 415,205 415,195 ' +
      'C415,180 440,180 440,195 ' +
      'C440,210 410,210 410,195 ' +
      'C410,175 445,175 445,195'
    );
    spiral.setAttribute('fill', 'none');
    spiral.setAttribute('stroke', 'url(#iron-grad)');
    spiral.setAttribute('stroke-width', '3');
    spiral.setAttribute('stroke-linecap', 'round');
    springGroup.appendChild(spiral);
    // 旋鈕
    var knob = createCircle(svgNS, 425, 195, 5, '#B0C4DE', '#708090', 2);
    springGroup.appendChild(knob);
    svg.appendChild(springGroup);

    // ── 把 SVG 與 overlay div 組合 ──
    // 我們需要每個零件有獨立的 DOM wrapper 以支援 CSS transform
    // 所以改用 foreignObject 或直接 overlay div
    // 為了最佳相容性，使用 div overlay 方案

    stage.appendChild(svg);

    // 建立 overlay div（for labels）
    PARTS.forEach(function (part, i) {
      var label = document.createElement('div');
      label.className = 'mb-part-label';
      label.id = part.id + '-label';
      label.textContent = part.name;
      label.style.position = 'absolute';
      label.style.opacity = '0';
      label.style.pointerEvents = 'none';
      label.style.zIndex = '30';
      label.style.background = 'white';
      label.style.borderRadius = '50px';
      label.style.padding = '4px 14px';
      label.style.fontSize = '0.82rem';
      label.style.fontWeight = '700';
      label.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      label.style.whiteSpace = 'nowrap';
      label.style.transition = 'opacity 0.5s ease';
      stage.appendChild(label);
    });

    explodeContainer.insertBefore(stage, explodeContainer.firstChild);

    return { svg: svg, stage: stage };
  }

  // ── SVG 輔助函數 ──
  function createLinearGradient(ns, id, stops, x1, y1, x2, y2) {
    var grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', id);
    grad.setAttribute('x1', x1); grad.setAttribute('y1', y1);
    grad.setAttribute('x2', x2); grad.setAttribute('y2', y2);
    stops.forEach(function (s) {
      var stop = document.createElementNS(ns, 'stop');
      stop.setAttribute('offset', s.offset);
      stop.setAttribute('stop-color', s.color);
      grad.appendChild(stop);
    });
    return grad;
  }

  function createGroup(ns, id) {
    var g = document.createElementNS(ns, 'g');
    g.setAttribute('id', id);
    g.style.cursor = 'pointer';
    g.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease';
    return g;
  }

  function createRect(ns, x, y, w, h, r, fill, stroke, sw) {
    var rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', h);
    rect.setAttribute('rx', r); rect.setAttribute('ry', r);
    rect.setAttribute('fill', fill);
    if (stroke) { rect.setAttribute('stroke', stroke); rect.setAttribute('stroke-width', sw); }
    return rect;
  }

  function createCircle(ns, cx, cy, r, fill, stroke, sw) {
    var c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', fill);
    if (stroke) { c.setAttribute('stroke', stroke); c.setAttribute('stroke-width', sw); }
    return c;
  }

  function createEllipse(ns, cx, cy, rx, ry, fill, stroke, sw) {
    var e = document.createElementNS(ns, 'ellipse');
    e.setAttribute('cx', cx); e.setAttribute('cy', cy);
    e.setAttribute('rx', rx); e.setAttribute('ry', ry);
    e.setAttribute('fill', fill);
    if (stroke) { e.setAttribute('stroke', stroke); e.setAttribute('stroke-width', sw); }
    return e;
  }

  function createLine(ns, x1, y1, x2, y2, stroke, sw, dash) {
    var l = document.createElementNS(ns, 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('stroke', stroke); l.setAttribute('stroke-width', sw);
    if (dash) l.setAttribute('stroke-dasharray', dash);
    return l;
  }

  // ── 拆解動畫 ──
  function explode() {
    if (isExploded) return;
    isExploded = true;

    var svg = explodeContainer.querySelector('svg');
    var groups = [
      { el: svg.getElementById('mb-case'),     tx: -120, ty: -60 },
      { el: svg.getElementById('mb-cylinder'), tx: 120,  ty: -60 },
      { el: svg.getElementById('mb-comb'),     tx: -120, ty: 80 },
      { el: svg.getElementById('mb-spring'),   tx: 120,  ty: 80 }
    ];

    groups.forEach(function (g, i) {
      if (!g.el) return;
      g.el.style.transform = 'translate(' + g.tx + 'px, ' + g.ty + 'px) scale(0.82)';

      // 顯示標籤
      var label = document.getElementById(PARTS[i].id + '-label');
      if (label) {
        // 粗略定位標籤
        var stage = explodeContainer.querySelector('.music-box-stage');
        var stageRect = stage.getBoundingClientRect();
        var cx = stageRect.width / 2;
        var cy = stageRect.height / 2;
        label.style.left = (cx + g.tx * 1.5 - 40) + 'px';
        label.style.top  = (cy + g.ty * 1.2 - 50) + 'px';
        label.style.opacity = '1';
      }
    });

    // 更新按鈕狀態
    if (explodeBtn) explodeBtn.disabled = true;
    if (assembleBtn) assembleBtn.disabled = false;
  }

  // ── 組裝動畫 ──
  function assemble() {
    if (!isExploded) return;
    isExploded = false;

    var svg = explodeContainer.querySelector('svg');
    var ids = ['mb-case', 'mb-cylinder', 'mb-comb', 'mb-spring'];

    ids.forEach(function (id, i) {
      var el = svg.getElementById(id);
      if (!el) return;
      el.style.transform = 'translate(0px, 0px) scale(1)';

      // 隱藏標籤
      var label = document.getElementById(PARTS[i].id + '-label');
      if (label) label.style.opacity = '0';
    });

    // 組裝完成後音梳振動動畫
    setTimeout(function () {
      startCombVibration(svg);
    }, 900);

    if (explodeBtn) explodeBtn.disabled = false;
    if (assembleBtn) assembleBtn.disabled = true;
  }

  // ── 音梳振動動畫 ──
  var combAnimId = null;
  function startCombVibration(svg) {
    var teeth = svg.querySelectorAll('.comb-tooth');
    if (teeth.length === 0) return;

    var frame = 0;
    function vibrate() {
      teeth.forEach(function (tooth, i) {
        var offset = Math.sin(frame * 0.3 + i * 0.8) * 2;
        tooth.style.transform = 'translateY(' + offset + 'px)';
      });
      frame++;
      if (frame < 120) { // 約 2 秒
        combAnimId = requestAnimationFrame(vibrate);
      } else {
        teeth.forEach(function (tooth) {
          tooth.style.transform = '';
        });
      }
    }
    if (combAnimId) cancelAnimationFrame(combAnimId);
    vibrate();
  }

  // ── 零件點擊說明 ──
  function handlePartClick(event) {
    var target = event.target;
    // 向上查找最近的 <g> 零件群組
    while (target && target.tagName !== 'g' && target.tagName !== 'svg') {
      target = target.parentElement;
    }
    if (!target || target.tagName !== 'g') return;

    var partId = target.getAttribute('id');
    var part = PARTS.find(function (p) { return p.id === partId; });
    if (!part || !partInfo) return;

    partInfo.innerHTML = '<strong>' + part.name + '</strong><br>' + part.desc;
    partInfo.style.animation = 'none';
    partInfo.offsetHeight; // force reflow
    partInfo.style.animation = 'fadeSlideIn 0.4s ease forwards';
  }

  // ── 建構與綁定 ──
  var built = buildStage();

  if (explodeBtn) explodeBtn.addEventListener('click', explode);
  if (assembleBtn) {
    assembleBtn.addEventListener('click', assemble);
    assembleBtn.disabled = true;
  }

  // SVG 內零件點擊
  built.svg.addEventListener('click', handlePartClick);

  // hover 效果
  built.svg.querySelectorAll('g[id^="mb-"]').forEach(function (g) {
    g.addEventListener('mouseenter', function () {
      g.style.filter = 'brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
    });
    g.addEventListener('mouseleave', function () {
      g.style.filter = '';
    });
  });

  // 預設說明
  if (partInfo) {
    partInfo.innerHTML = '👆 點擊任何零件查看說明';
  }
});
