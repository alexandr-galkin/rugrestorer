let ysdk=null;

function loadSdk(){
  if(window.YaGames) return Promise.resolve();
  return new Promise(resolve=>{
    const script=document.createElement('script');
    script.src='/sdk.js';
    script.async=true;
    script.onload=()=>resolve();
    script.onerror=()=>resolve();
    document.head.appendChild(script);
  });
}

export async function initYandex(){
  try{
    await loadSdk();
    if(!window.YaGames) return {sdk:null,lang:null,platform:false};
    ysdk=await window.YaGames.init();
    const lang=ysdk?.environment?.i18n?.lang||null;
    console.info('[Yandex SDK] initialized',lang?`language=${lang}`:'');
    return {sdk:ysdk,lang,platform:true};
  }catch(error){
    console.warn('[Yandex SDK] unavailable, using local mode',error);
    return {sdk:null,lang:null,platform:false};
  }
}

export function gameReady(){
  try{ysdk?.features?.LoadingAPI?.ready()}catch(error){console.warn('[Yandex SDK] Game Ready failed',error)}
}

export function gameplayStart(){
  try{ysdk?.features?.GameplayAPI?.start()}catch(error){console.warn('[Yandex SDK] Gameplay start failed',error)}
}

export function gameplayStop(){
  try{ysdk?.features?.GameplayAPI?.stop()}catch(error){console.warn('[Yandex SDK] Gameplay stop failed',error)}
}

export function getYsdk(){return ysdk}
