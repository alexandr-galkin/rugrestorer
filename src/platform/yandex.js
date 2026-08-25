let ysdk=null;
function loadSdk(){if(window.YaGames)return Promise.resolve();return new Promise(resolve=>{const script=document.createElement('script');script.src='/sdk.js';script.async=true;script.onload=()=>resolve();script.onerror=()=>resolve()})}
export async function initYandex(){try{await loadSdk();if(!window.YaGames)return{sdk:null,lang:null,platform:false};ysdk=await window.YaGames.init();const lang=ysdk?.environment?.i18n?.lang||null;console.info('[Yandex SDK] initialized',lang?`language=${lang}`:'');return{sdk:ysdk,lang,platform:true}}catch(error){console.warn('[Yandex SDK] unavailable, using local mode',error);return{sdk:null,lang:null,platform:false}}}
export function gameReady(){try{ysdk?.features?.LoadingAPI?.ready()}catch(error){console.warn('[Yandex SDK] Game Ready failed',error)}}
export function gameplayStart(){try{ysdk?.features?.GameplayAPI?.start()}catch(error){console.warn('[Yandex SDK] Gameplay start failed',error)}}
export function gameplayStop(){try{ysdk?.features?.GameplayAPI?.stop()}catch(error){console.warn('[Yandex SDK] Gameplay stop failed',error)}}
export function showRewardedAd({onRewarded,onOpen,onClose,onError}={}){if(!ysdk?.adv?.showRewardedVideo){onError?.(new Error('Rewarded video is unavailable outside Yandex Games'));return false}try{ysdk.adv.showRewardedVideo({callbacks:{onOpen,onRewarded,onClose,onError}});return true}catch(error){onError?.(error);return false}}
export function showInterstitialAd({onOpen,onClose,onError}={}){if(!ysdk?.adv?.showFullscreenAdv){onClose?.();return false}try{ysdk.adv.showFullscreenAdv({callbacks:{onOpen,onClose,onError}});return true}catch(error){onError?.(error);onClose?.();return false}}
export function getYsdk(){return ysdk}
