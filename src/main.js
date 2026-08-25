import './style.css';
import {carpets,tools,toolOrder} from './data/game.js';
import {CleaningController} from './cleaning/CleaningController.js';
import brushAsset from './assets/brush.svg';

const app=document.querySelector('#app');
let index=0,controller,selectedTool='brush';

const menu=()=>{
  app.innerHTML=`<main class="screen menu workshop"><div class="workshop-glow"></div><div class="brand"><span>RUG</span> RESTORER</div><p>Clean · Restore · Satisfy</p><div class="workshop-card"><div class="card-rug"></div><div class="card-tools"><img src="${brushAsset}" alt="Brush"><span>RESTORATION WORKSHOP</span></div></div><button id="start">START JOB</button><small>v0.0.0.3</small></main>`;
  document.querySelector('#start').onclick=()=>start();
};

function start(){
  const carpet=carpets[index];
  const tool=tools[selectedTool];
  app.innerHTML=`<main class="screen game"><header><div><b>RUG #${String(index+1).padStart(3,'0')}</b><span>${carpet.name}</span></div><div class="score"><strong id="quality">100</strong><small>QUALITY</small></div><strong id="progress">0%</strong></header><section class="work"><div class="hint" id="hint">Choose a tool, then brush carefully</div><canvas id="rug"></canvas><div class="brush"><img src="${brushAsset}" alt=""><span id="tool-label">${tool.name.toUpperCase()}</span></div><div class="toolbelt" id="toolbelt">${toolOrder.map(id=>{const t=tools[id];return `<button class="tool ${id===selectedTool?'active':''}" data-tool="${id}" title="${t.description}"><b>${t.icon}</b><span>${t.name}</span></button>`}).join('')}</div></section><div class="bar"><i id="bar"></i></div><div class="metrics"><span id="grade">ROUGH CLEAN</span><span id="strokes">STROKES 0</span><span id="distance">DISTANCE 0</span></div></main>`;

  const qualityEl=document.querySelector('#quality');
  const progressEl=document.querySelector('#progress');
  const gradeEl=document.querySelector('#grade');
  const strokesEl=document.querySelector('#strokes');
  const distanceEl=document.querySelector('#distance');
  const bar=document.querySelector('#bar');

  const update=state=>{
    progressEl.textContent=state.progress+'%';
    qualityEl.textContent=state.quality;
    gradeEl.textContent=state.grade.label;
    strokesEl.textContent='STROKES '+state.stats.strokes;
    distanceEl.textContent='DISTANCE '+Math.round(state.stats.distance);
    bar.style.width=state.progress+'%';
    document.querySelector('#tool-label').textContent=state.tool.name.toUpperCase();
  };

  controller=new CleaningController(document.querySelector('#rug'),carpet,tool,update);
  let completed=false;
  document.querySelectorAll('.tool').forEach(button=>button.onclick=()=>{
    selectedTool=button.dataset.tool;
    controller.setTool(tools[selectedTool]);
    document.querySelectorAll('.tool').forEach(x=>x.classList.toggle('active',x===button));
    document.querySelector('#hint').textContent=tools[selectedTool].description;
    update({progress:controller.progress(),quality:controller.quality(),grade:controller.grade(),tool:controller.tool,stats:controller.stats});
  });

  const tick=()=>{
    const p=controller.progress();
    if(p>=100&&!completed){completed=true;setTimeout(()=>result(controller),500);return;}
    requestAnimationFrame(tick);
  };
  tick();
}

function result(job){
  const grade=job.grade();
  const q=job.quality();
  const stars='★★★★★'.slice(0,grade.stars)+'☆☆☆☆☆'.slice(0,5-grade.stars);
  const nextLabel=index<carpets.length-1?'NEXT CARPET':'BACK TO WORKSHOP';
  app.innerHTML=`<main class="screen result"><div class="check">✓</div><div class="grade-rank">${grade.short}</div><h1>${grade.label}</h1><div class="stars">${stars}</div><div class="final-score"><b>${q}</b><span>QUALITY SCORE</span></div><div class="result-stats"><span>STROKES <b>${job.stats.strokes}</b></span><span>DISTANCE <b>${Math.round(job.stats.distance)}</b></span><span>TOOL <b>${job.tool.name}</b></span></div><p>${q>=95?'Flawless restoration. Every movement counted.':q>=88?'Excellent work. The carpet looks beautifully restored.':q>=76?'Clean and solid. A little more precision would make it perfect.':'The carpet is clean, but there was quite a bit of wasted motion.'}</p><button id="next">${nextLabel}</button></main>`;
  document.querySelector('#next').onclick=()=>{if(index<carpets.length-1){index++;start()}else{index=0;menu()}};
}

menu();
