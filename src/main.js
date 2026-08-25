import './style.css';
import { carpets, tools, toolOrder } from './data/game.js';
import { initYandex, gameReady, gameplayStart, gameplayStop } from './platform/yandex.js';
import { initI18n, setLocale, getLocale, t } from './i18n/index.js';
import { CleaningController } from './cleaning/CleaningController.js';

const app = document.querySelector('#app');
let index = 0;
let controller = null;
let selectedTool = 'brush';
let currentScreen = 'menu';

const carpetKey = (carpet) => carpet.id === 'classic' ? 'persian' : carpet.id;
const gradeKey = (grade) => ({ S: 'master', A: 'expert', B: 'great', C: 'good', D: 'rough' })[grade.short];
const toolText = (id) => ({ brush: 'balanced', scrubber: 'powerful', detail: 'precise' })[id];

function languageButtons() {
  const ruActive = getLocale() === 'ru' ? 'active' : '';
  const enActive = getLocale() === 'en' ? 'active' : '';

  return `
    <div class="language-switch">
      <span>${t('language')}</span>
      <button class="lang ${ruActive}" data-lang="ru">RU</button>
      <button class="lang ${enActive}" data-lang="en">EN</button>
    </div>
  `;
}

function bindLanguage() {
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.onclick = () => {
      setLocale(button.dataset.lang);
      renderCurrentScreen();
    };
  });
}

function menu() {
  currentScreen = 'menu';

  app.innerHTML = `
    <main class="screen menu workshop">
      <div class="workshop-glow"></div>
      <div class="brand"><span>RUG</span> RESTORER</div>
      <p>${t('tagline')}</p>
      <div class="workshop-card">
        <div class="card-rug"></div>
        <div class="card-tools">
          <img src="${tools.brush.asset}" alt="">
          <span>${t('workshop')}</span>
        </div>
      </div>
      <button id="start">${t('start')}</button>
      ${languageButtons()}
      <small>${t('version')}</small>
    </main>
  `;

  document.querySelector('#start').onclick = start;
  bindLanguage();
}

function start() {
  currentScreen = 'game';
  gameplayStart();

  const carpet = carpets[index];
  const tool = tools[selectedTool];
  const rugNumber = String(index + 1).padStart(3, '0');

  app.innerHTML = `
    <main class="screen game">
      <header>
        <div>
          <b>${t('rug', { id: rugNumber })}</b>
          <span>${t(carpetKey(carpet))}</span>
        </div>
        <div class="score">
          <strong id="quality">100</strong>
          <small>${t('quality')}</small>
        </div>
        <strong id="progress">0%</strong>
      </header>

      <section class="work">
        <div class="hint" id="hint">${t('chooseTool')}</div>
        <canvas id="rug"></canvas>
        <div class="brush">
          <img id="tool-image" src="${tool.asset}" alt="">
          <span id="tool-label">${t(tool.id)}</span>
        </div>
        <div class="toolbelt">
          ${toolOrder.map((id) => {
            const item = tools[id];
            const active = id === selectedTool ? 'active' : '';
            return `
              <button class="tool ${active}" data-tool="${id}" title="${t(toolText(id))}">
                <img src="${item.asset}" alt="">
                <span>${t(id)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <div class="bar"><i id="bar"></i></div>
      <div class="metrics">
        <span id="grade">${t('rough')}</span>
        <span id="strokes">${t('strokes', { value: 0 })}</span>
        <span id="distance">${t('distance', { value: 0 })}</span>
      </div>
    </main>
  `;

  const update = (state) => {
    const progress = document.querySelector('#progress');
    const quality = document.querySelector('#quality');
    const grade = document.querySelector('#grade');
    const strokes = document.querySelector('#strokes');
    const distance = document.querySelector('#distance');
    const bar = document.querySelector('#bar');
    const toolLabel = document.querySelector('#tool-label');
    const toolImage = document.querySelector('#tool-image');

    if (!progress) return;

    progress.textContent = `${state.progress}%`;
    quality.textContent = state.quality;
    grade.textContent = t(gradeKey(state.grade));
    strokes.textContent = t('strokes', { value: state.stats.strokes });
    distance.textContent = t('distance', { value: Math.round(state.stats.distance) });
    bar.style.width = `${state.progress}%`;
    toolLabel.textContent = t(state.tool.id);
    toolImage.src = state.tool.asset;
  };

  controller = new CleaningController(
    document.querySelector('#rug'),
    carpet,
    tool,
    update
  );

  let completed = false;

  document.querySelectorAll('.tool').forEach((button) => {
    button.onclick = () => {
      selectedTool = button.dataset.tool;
      controller.setTool(tools[selectedTool]);

      document.querySelectorAll('.tool').forEach((item) => {
        item.classList.toggle('active', item === button);
      });

      document.querySelector('#hint').textContent = t(toolText(selectedTool));
      update({
        progress: controller.progress(),
        quality: controller.quality(),
        grade: controller.grade(),
        tool: controller.tool,
        stats: controller.stats
      });
    };
  });

  const tick = () => {
    if (controller.progress() >= 100 && !completed) {
      completed = true;
      gameplayStop();
      setTimeout(() => result(controller), 500);
      return;
    }

    requestAnimationFrame(tick);
  };

  tick();
}

function result(job) {
  currentScreen = 'result';

  const grade = job.grade();
  const quality = job.quality();
  const stars = '★★★★★'.slice(0, grade.stars) + '☆☆☆☆☆'.slice(0, 5 - grade.stars);
  const nextLabel = index < carpets.length - 1 ? t('next') : t('back');
  const resultText = quality >= 95
    ? 'flawless'
    : quality >= 88
      ? 'excellent'
      : quality >= 76
        ? 'solid'
        : 'roughResult';

  app.innerHTML = `
    <main class="screen result">
      <div class="check">✓</div>
      <div class="grade-rank">${grade.short}</div>
      <h1>${t(gradeKey(grade))}</h1>
      <div class="stars">${stars}</div>

      <div class="final-score">
        <b>${quality}</b>
        <span>${t('qualityScore')}</span>
      </div>

      <div class="result-stats">
        <span>${t('strokes', { value: '' })}<b>${job.stats.strokes}</b></span>
        <span>${t('distance', { value: '' })}<b>${Math.round(job.stats.distance)}</b></span>
        <span>${t('tool')}<b>${t(job.tool.id)}</b></span>
      </div>

      <p>${t(resultText)}</p>
      <button id="next">${nextLabel}</button>
      ${languageButtons()}
    </main>
  `;

  document.querySelector('#next').onclick = () => {
    if (index < carpets.length - 1) {
      index += 1;
      start();
    } else {
      index = 0;
      menu();
    }
  };

  bindLanguage();
}

function renderCurrentScreen() {
  if (currentScreen === 'result' && controller) {
    result(controller);
    return;
  }

  if (currentScreen === 'game') {
    // Re-rendering a live cleaning session would destroy the canvas state.
    // Keep the current game screen intact when changing language during play.
    return;
  }

  menu();
}

async function boot() {
  const platform = await initYandex();
  const browserLanguage = (navigator.language || 'en').slice(0, 2).toLowerCase();

  initI18n(platform.lang || browserLanguage);
  menu();
  gameReady();
}

boot();
