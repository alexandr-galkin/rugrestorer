const TIERS=[
 {key:'dusty',from:1,intensity:.42,reward:50,required:['brush'],stains:5,types:['dust']},
 {key:'dirty',from:7,intensity:.54,reward:75,required:['brush','cleaner'],stains:8,types:['dust','mud']},
 {key:'veryDirty',from:13,intensity:.65,reward:95,required:['brush','cleaner'],stains:12,types:['dust','mud','spots']},
 {key:'greasy',from:19,intensity:.74,reward:120,required:['brush','cleaner'],stains:15,types:['dust','grease','spots']},
 {key:'neglected',from:25,intensity:.82,reward:160,required:['scrubber','cleaner'],stains:20,types:['dust','grease','mud']},
 {key:'heavy',from:31,intensity:.89,reward:225,required:['scrubber','washer'],stains:25,types:['dust','grease','mud','deep']},
 {key:'horrible',from:37,intensity:.95,reward:310,required:['scrubber','cleaner','washer'],stains:32,types:['dust','grease','mud','deep','spots']},
 {key:'restoration',from:43,intensity:1,reward:425,required:['brush','detail','scrubber','cleaner','washer'],stains:40,types:['dust','grease','mud','deep','spots']}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function generateLevels(carpets,count=48){
 return Array.from({length:count},(_,i)=>{
  const id=i+1,tier=TIERS[Math.min(TIERS.length-1,Math.floor(i/6))],carpet=carpets[i%carpets.length];
  const step=i%6;
  return {id,key:tier.key,reward:Math.round(tier.reward+step*tier.reward*.035),intensity:clamp(tier.intensity+step*.012,0,1),required:[...tier.required],stains:tier.stains+step*2,stainTypes:[...tier.types],carpetId:carpet.id,carpetIndex:i%carpets.length,tier:Math.floor(i/6)+1,variation:(i*37+11)%1000,unlockAfter:id-1};
 });
}
export {TIERS};
