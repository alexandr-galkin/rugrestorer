export const STARTING_COINS=100;
export const STORE_ITEMS=[
{id:'brush',type:'tool',price:30,icon:'🧹',ownedByDefault:true},
{id:'cleaner',type:'consumable',price:25,icon:'🧴',pack:3,max:12},
{id:'scrubber',type:'tool',price:150,icon:'🧽'},
{id:'detail',type:'tool',price:100,icon:'🪥'},
{id:'washer',type:'tool',price:350,icon:'💦'}
];
export const DIRT_LEVELS=[
{id:1,key:'dusty',reward:50,intensity:.45,required:['brush'],unlockAfter:0},
{id:2,key:'dirty',reward:75,intensity:.58,required:['brush','cleaner'],unlockAfter:1},
{id:3,key:'veryDirty',reward:110,intensity:.68,required:['brush','cleaner'],unlockAfter:2},
{id:4,key:'greasy',reward:150,intensity:.76,required:['brush','cleaner'],unlockAfter:3},
{id:5,key:'neglected',reward:200,intensity:.84,required:['scrubber','cleaner'],unlockAfter:4},
{id:6,key:'heavy',reward:275,intensity:.90,required:['scrubber','washer'],unlockAfter:5},
{id:7,key:'horrible',reward:375,intensity:.96,required:['scrubber','cleaner','washer'],unlockAfter:6},
{id:8,key:'restoration',reward:500,intensity:1,required:['brush','detail','scrubber','cleaner','washer'],unlockAfter:7}
];
const read=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
export function getWallet(){const s=read('rugrestorer.wallet');if(s&&Number.isFinite(s.coins))return s;const w={coins:STARTING_COINS};write('rugrestorer.wallet',w);return w}
export function addCoins(n){const w=getWallet();w.coins+=Math.max(0,Math.round(n));write('rugrestorer.wallet',w);return w}
export function spendCoins(n){const w=getWallet();if(w.coins<n)return false;w.coins-=n;write('rugrestorer.wallet',w);return true}
export function getInventory(){const s=read('rugrestorer.inventory');if(s)return s;const i={tools:{brush:true},consumables:{cleaner:0},unlockedDirt:1,completedDirt:0};write('rugrestorer.inventory',i);return i}
export function hasItem(id){const i=getInventory();return id==='cleaner'?i.consumables.cleaner>0:!!i.tools[id]}
export function buyItem(item){if(hasItem(item.id)&&item.type==='tool')return{ok:false,reason:'owned'};if(item.type==='consumable'&&(getInventory().consumables[item.id]||0)>=item.max)return{ok:false,reason:'max'};if(!spendCoins(item.price))return{ok:false,reason:'money'};const i=getInventory();if(item.type==='tool')i.tools[item.id]=true;if(item.type==='consumable')i.consumables[item.id]=(i.consumables[item.id]||0)+item.pack;write('rugrestorer.inventory',i);return{ok:true}}
export function consumeCleaner(){const i=getInventory();if(i.consumables.cleaner<=0)return false;i.consumables.cleaner--;write('rugrestorer.inventory',i);return true}
export function completeDirt(level){const i=getInventory();i.completedDirt=Math.max(i.completedDirt,level);i.unlockedDirt=Math.min(DIRT_LEVELS.length,Math.max(i.unlockedDirt,level+1));write('rugrestorer.inventory',i);return i}
export function isDirtUnlocked(level){return getInventory().unlockedDirt>=level.id}
export function getDirt(id){return DIRT_LEVELS.find(x=>x.id===id)||DIRT_LEVELS[0]}
