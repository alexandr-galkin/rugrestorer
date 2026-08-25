import ru from './ru.json';
import en from './en.json';

const dictionaries={ru,en};
let locale='en';
let manual=false;

export function initI18n(platformLang){
  if(!manual) locale=dictionaries[platformLang] ? platformLang : 'en';
  document.documentElement.lang=locale;
  return locale;
}

export function setLocale(next){
  if(!dictionaries[next]) return locale;
  manual=true;
  locale=next;
  document.documentElement.lang=locale;
  return locale;
}

export function getLocale(){return locale}
export function isManualLocale(){return manual}
export function t(key,vars={}){
  let value=dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
  return value.replace(/\{(\w+)\}/g,(_,name)=>vars[name] ?? `{${name}}`);
}

export function translateElement(element,key,vars={}){
  if(element) element.textContent=t(key,vars);
}
