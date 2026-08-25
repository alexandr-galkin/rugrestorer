import {DIRT_LEVELS,getInventory} from '../economy/store.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const LEVEL_COUNT=48;
export function generateLevels(count=LEVEL_COUNT){const levels=[];for(let i=0;i<count;i++){const number=i+1,tier=Math.min(8,1+Math.floor(i/6)),def=DIRT_LEVELS[tier-1],within=i%6;levels.push({id:number,tier,carpetIndex:i%3,intensity:clamp(def.intensity+within*.012,0,1),reward:Math.round(def.reward*(1+within*.025)),required:[...def.required],variation:(i*17+(i%3)*11)%100});}return levels}
export const LEVELS=generateLevels();
export function getLevel(id){return LEVELS.find(x=>x.id===id)||LEVELS[0]}
export function getUnlockedLevel(){return getInventory().unlockedLevel||1}
export function completeLevel(id){const i=getInventory();i.completedLevel=Math.max(i.completedLevel||0,id);i.unlockedLevel=Math.min(LEVELS.length,Math.max(i.unlockedLevel||1,id+1));localStorage.setItem('rugrestorer.inventory',JSON.stringify(i));return i}
