import './style.css';
import {carpets,tools} from './data/game.js';
import {CleaningController} from './cleaning/CleaningController.js';
import brushAsset from './assets/brush.svg';

const app=document.querySelector('#app');
let index=0,controller;

const menu=()=>{
  app.innerHTML=`<main class="screen menu workshop"><div class="workshop-glow"></div><div class="brand"><span>RUG</span> RESTORER</div><p>Clean · Restore · Satisfy</p><div class="workshop-card"><div class="card-rug"></div><div class="card-tools"><img src="${brushAsset}" alt="Brush"><span>RESTORATION WORKSHOP</span></div></div><button id="start">START JOB</button><small>v0.0.0.2</small></main>`;
  document.querySelector('#start').onclick=()=>start();
};

function start(){
  const carpet=carpets[index];
  app.innerHTML=`<main class="screen game"><header><div><b>RUG #${String(index+1).padStart(3,'0')}</b><span>${carpet.name}</span></div><strong id="progress">0%</strong></header><section class="work"><div class="hint">Hold and brush the carpet</div><canvas id="rug"></canvas><div class="brush"><img src="${brushAsset}" alt=""><span>BRUSH</span></div></section><div class="bar"><i id="bar"></i></div></main>`;
  controller=new CleaningController(document.querySelector('#rug'),carpet,tools.brush);
  let completed=false;
  const tick=()=>{
    const p=controller.progress();
    document.querySelector('#progress').textContent=p+'%';
    document.querySelector('#bar').style.width=p+'%';
    if(p>=100&&!completed){completed=true;setTimeout(result,450);return;}
    requestAnimationFrame(tick);
  };
  tick();
}

function result(){
  app.innerHTML=`<main class="screen result"><div class="check">✓</div><h1>CLEAN!</h1><div class="stars">★★★</div><p>Another rug restored. Nice work.</p><button id="next">${index<carpets.length-1?'NEXT CARPET':'BACK TO WORKSHOP'}</button></main>`;
  document.querySelector('#next').onclick=()=>{if(index<carpets.length-1){index++;start()}else{index=0;menu()}};
}

menu();
