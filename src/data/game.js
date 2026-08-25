import classic from '../assets/rugs/classic.svg';
import classicDirt from '../assets/rugs/classic-dirt.svg';
import garden from '../assets/rugs/garden.svg';
import gardenDirt from '../assets/rugs/garden-dirt.svg';
import sunset from '../assets/rugs/sunset.svg';
import sunsetDirt from '../assets/rugs/sunset-dirt.svg';
import brushAsset from '../assets/brush.svg';
import scrubberAsset from '../assets/tools/scrubber.svg';
import detailAsset from '../assets/tools/detail.svg';
import washerAsset from '../assets/tools/washer.svg';
import {generateLevels} from './levelGenerator.js';
export const tools={
 brush:{id:'brush',name:'Soft Brush',radius:34,power:1,coverage:.82,precision:1,wear:.35,icon:'🧹',asset:brushAsset,description:'Balanced cleaning. Safe and precise.'},
 scrubber:{id:'scrubber',name:'Deep Scrubber',radius:48,power:1.55,coverage:1,precision:.68,wear:1.25,icon:'🧽',asset:scrubberAsset,description:'Fast and powerful, but easy to overwork.'},
 detail:{id:'detail',name:'Detail Brush',radius:19,power:.62,coverage:.48,precision:1.35,wear:.12,icon:'🪥',asset:detailAsset,description:'Slow, precise cleaning for a perfect finish.'},
 washer:{id:'washer',name:'Pressure Washer',radius:58,power:2,coverage:1,precision:.52,wear:1.8,icon:'💦',asset:washerAsset,description:'Maximum cleaning power. Use with care.'}
};
export const toolOrder=['brush','scrubber','detail','washer'];
export const carpets=[
 {id:'classic',name:'Persian Classic',ratio:1.55,shape:'rounded',asset:classic,dirtMask:classicDirt,idealTool:'detail',difficulty:1},
 {id:'garden',name:'Garden Runner',ratio:2.25,shape:'rounded',asset:garden,dirtMask:gardenDirt,idealTool:'brush',difficulty:1.15},
 {id:'sunset',name:'Sunset Medallion',ratio:1.18,shape:'oval',asset:sunset,dirtMask:sunsetDirt,idealTool:'brush',difficulty:1.3}
];
export const levels=generateLevels(carpets,48);
export function getLevel(id){return levels.find(x=>x.id===id)||levels[0]}
