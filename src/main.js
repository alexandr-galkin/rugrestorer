import './style.css';
import {carpets,tools,toolOrder} from './data/game.js';
import {CleaningController} from './cleaning/CleaningController.js';
import {initYandex,gameReady,gameplayStart,gameplayStop} from './platform/yandex.js';
import {initI18n,setLocale,getLocale,t} from './i18n/index.js';

const app=document.querySelector('#app');
let index=0,controller,selectedTool='brush';
const carpetKey=c=>c.id==='classic'?'persian':c.id;
const gradeKey=g=>({S:'master',A:'expert',B:'great',C:'good',D:'rough'}[g.short]);
const toolText=id=>id==='brush'?'balanced':id==='scrubber'?'powerful':'precise';

function languageButtons(){return `<div class="language-switch"><span>${t('language')}</span><button class="lang ${getLocale()==='ru'?'active':''}" data-lang="ru">RU</button><button class="lang ${getLocale()==='en'?'active':''}" data-lang="en">EN</button></div>`}
function bindLanguage(){document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{setLocale(b.dataset.lang);renderCurrentScreen()})}

function menu(){
 app.innerHTML=`<main class="screen menu workshop"><div class="workshop-glow"></div><div class="brand"><span>RUG</span> RESTORER</div><p>${t('tagline')}</p><div class="workshop-card"><div class="card-rug"></div><div class="card-tools"><img src="${tools.brush.asset}" alt=""><span>${t('workshop')}</span></div></div><button id="start">${t('start')}</button>${languageButtons()}<small>${t('version')}</small></main>`;
 document.querySelector('#start').onclick=start;bindLanguage();
}

function start(){
 gameplayStart();
 const carpet=carpets[index],tool=tools[selectedTool];
 app.innerHTML=`<main class="screen game"><header><div><b>${t('rug',{id:String(index+1).padStart(3,'0')})</b><span>${t(carpetKey(carpet))}</span></div><div class="score"><strong id="quality">100</strong><small>${t('quality')}</small></div><strong id="progress">0%</strong></header><section class="work"><div class="hint" id="hint">${t('chooseTool')}</div><canvas id="rug"></canvas><div class="brush"><img id="tool-image" src="${tool.asset}" alt=""><span id="tool-label">${t(tool.id)}</span></div><div class="toolbelt">${toolOrder.map(id=>{const x=tools[id];return `<button class="tool ${id===selectedTool?'active':''}" data-tool="${id}" title="${t(toolText(id))}"><img src="${x.asset}" alt=""><span>${t(id)}</span></button>`}).join('')}</div></section><div class="bar"><i id="bar"></i></div><div class="metrics"><span id="grade">${t('rough')}</span><span id="strokes">${t('strokes',{value:0})}</span><span id="distance">${t('distance',{value:0})}</span></div></main>`;
 const update=s=>{document.querySelector('#progress').textContent=s.progress+'%';document.querySelector('#quality').textContent=s.quality;document.querySelector('#grade').textContent=t(gradeKey(s.grade));document.querySelector('#strokes').textContent=t('strokes',{value:s.stats.strokes});document.querySelector('#distance').textContent=t('distance',{value:Math.round(s.stats.distance)});document.querySelector('#bar').style.width=s.progress+'%';document.querySelector('#tool-label').textContent=t(s.tool.id);document.querySelector('#tool-image').src=s.tool.asset};
 controller=new CleaningController(document.querySelector('#rug'),carpet,tool,update);
 let completed=false;
 document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>{selectedTool=b.dataset.tool;controller.setTool(tools[selectedTool]);document.querySelectorAll('.tool').forEach(x=>x.classList.toggle('active',x===b));document.querySelector('#hint').textContent=t(toolText(selectedTool));update({progress:controller.progress(),quality:controller.quality(),grade:controller.grade(),tool:controller.tool,stats:controller.stats})});
 const tick=()=>{if(controller.progress()>=100&&!completed){completed=true;gameplayStop();setTimeout(()=>result(controller),500);return}requestAnimationFrame(tick)};tick();
}

function result(job){
 const grade=job.grade(),q=job.quality(),stars='★★★★★'.slice(0,grade.stars)+'☆☆☆☆☆'.slice(0,5-grade.stars),next=index<carpets.length-1?t('next'):t('back'),text=q>=95?'flawless':q>=88?'excellent':q>=76?'solid':'roughResult';
 app.innerHTML=`<main class="screen result"><div class="check">✓</div><div class="grade-rank">${grade.short}</div><h1>${t(gradeKey(grade))}</h1><div class="stars">${stars}</div><div class="final-score"><b>${q}</b><span>${t('qualityScore')}</span></div><div class="result-stats"><span>${t('strokes',{value:''})}<b>${job.stats.strokes}</b></span><span>${t('distance',{value:''})}<b>${Math.round(job.stats.distance)}</b></span><span>${t('tool')}<b>${t(job.tool.id)}</b></span></div><p>${t(text)}</p><button id="next">${next}</button>${languageButtons()}</main>`;
 document.querySelector('#next').onclick=()=>{if(index<carpets.length-1){index++;start()}else{index=0;menu()}};bindLanguage();
}

function renderCurrentScreen(){if(document.querySelector('.result'))result(controller);else menu()}
async function boot(){const platform=await initYandex();initI18n(platform.lang||(navigator.language||'en').slice(0,2).toLowerCase());menu();gameReady()}
boot();
