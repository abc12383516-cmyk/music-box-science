/**
 * main.js — 核心互動功能
 * 導覽列、捲動動畫、步驟卡片系統、測驗功能
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initStepSystems();
  initQuiz();
});

/* ========== 導覽列 ========== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('.experiment-section, .hero, .quiz-section');

  // 捲動時加陰影
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // 捲動時高亮當前 section 的導覽按鈕
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

  sections.forEach(section => observer.observe(section));
}

/* ========== 捲動進場動畫 ========== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => revealObserver.observe(el));
}

/* ========== 步驟卡片系統 ========== */
function initStepSystems() {
  const containers = document.querySelectorAll('.steps-container');
  containers.forEach(container => {
    const key = container.dataset.steps;
    const cards = container.querySelectorAll('.step-card');
    const progressEl = container.querySelector('.steps-progress');
    const prevBtn = container.querySelector('[data-dir="prev"]');
    const nextBtn = container.querySelector('[data-dir="next"]');
    let current = 0;

    // 建立進度指示點
    cards.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'step-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goToStep(i));
      progressEl.appendChild(dot);
    });

    function goToStep(idx) {
      if (idx < 0 || idx >= cards.length) return;
      cards[current].classList.remove('active');
      current = idx;
      cards[current].classList.remove('active');
      // 觸發重新動畫
      void cards[current].offsetWidth;
      cards[current].classList.add('active');

      // 更新進度點
      const dots = progressEl.querySelectorAll('.step-dot');
      dots.forEach((dot, i) => {
        dot.classList.remove('active', 'done');
        if (i < current) dot.classList.add('done');
        if (i === current) dot.classList.add('active');
      });

      // 更新按鈕狀態
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === cards.length - 1;
    }

    prevBtn.addEventListener('click', () => goToStep(current - 1));
    nextBtn.addEventListener('click', () => goToStep(current + 1));
  });
}

/* ========== 測驗系統 ========== */
function initQuiz() {
  const quizCards = document.querySelectorAll('.quiz-card');
  let score = 0;
  let answered = 0;

  quizCards.forEach(card => {
    const options = card.querySelectorAll('.quiz-option');
    const explanation = card.querySelector('.quiz-explanation');

    options.forEach(option => {
      option.addEventListener('click', () => {
        // 防止重複作答
        if (card.dataset.answered) return;
        card.dataset.answered = 'true';

        const isCorrect = option.dataset.correct === 'true';

        if (isCorrect) {
          option.classList.add('correct');
          score++;
        } else {
          option.classList.add('wrong');
          // 高亮正確答案
          options.forEach(opt => {
            if (opt.dataset.correct === 'true') opt.classList.add('correct');
          });
        }

        // 停用其他選項
        options.forEach(opt => { opt.style.pointerEvents = 'none'; });

        // 顯示解釋
        explanation.classList.add('show');

        answered++;
        if (answered === quizCards.length) {
          setTimeout(showResult, 800);
        }
      });
    });
  });

  function showResult() {
    const resultEl = document.getElementById('quiz-result');
    const scoreEl = document.getElementById('quiz-score');
    scoreEl.textContent = `${score} / ${quizCards.length}`;
    resultEl.classList.add('show');
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 重試按鈕
  document.getElementById('quiz-retry').addEventListener('click', () => {
    score = 0;
    answered = 0;
    document.getElementById('quiz-result').classList.remove('show');
    quizCards.forEach(card => {
      delete card.dataset.answered;
      const options = card.querySelectorAll('.quiz-option');
      const explanation = card.querySelector('.quiz-explanation');
      options.forEach(opt => {
        opt.classList.remove('correct', 'wrong');
        opt.style.pointerEvents = '';
      });
      explanation.classList.remove('show');
    });
    quizCards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
