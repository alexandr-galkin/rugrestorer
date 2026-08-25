import classic from '../assets/rugs/classic.svg';
import classicDirt from '../assets/rugs/classic-dirt.svg';
import garden from '../assets/rugs/garden.svg';
import gardenDirt from '../assets/rugs/garden-dirt.svg';
import sunset from '../assets/rugs/sunset.svg';
import sunsetDirt from '../assets/rugs/sunset-dirt.svg';

export const tools={brush:{id:'brush',name:'Brush',radius:34,power:0.9}};

export const carpets=[
 {id:'classic',name:'Persian Classic',ratio:1.55,shape:'rounded',asset:classic,dirtMask:classicDirt},
 {id:'garden',name:'Garden Runner',ratio:2.25,shape:'rounded',asset:garden,dirtMask:gardenDirt},
 {id:'sunset',name:'Sunset Medallion',ratio:1.18,shape:'oval',asset:sunset,dirtMask:sunsetDirt}
];
