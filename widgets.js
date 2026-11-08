// Widgets para papel de parede: relógio, data, clima (Open-Meteo, sem chave) e calendário no estilo do Google Agenda.
// Configuração (no window.CONFIG do wallpaper.html ou na URL): widgets, city, dim, events
(function(){
const C=Object.assign({},window.CONFIG||{},Object.fromEntries(new URLSearchParams(location.search)));
const $=id=>document.getElementById(id);
const ls={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(_){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
const DIAS=['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'],DIAS3=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],LETRAS=['D','S','T','Q','Q','S','S'];
const p2=n=>String(n).padStart(2,'0'),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtDate=d=>`${p2(d.getDate())}/${p2(d.getMonth()+1)}/${d.getFullYear()} - ${DIAS[d.getDay()]}`;
const fmtTime=d=>`${p2(d.getHours())}:${p2(d.getMinutes())}`;
const isoDay=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
function calCells(y,m){const lead=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),n=Math.ceil((lead+dim)/7)*7,out=[];
 for(let i=0;i<n;i++){const d=new Date(y,m,1-lead+i);out.push({d:d.getDate(),y:d.getFullYear(),m:d.getMonth(),inMonth:d.getMonth()===m})}return out}
const W={0:['☀️','Céu limpo'],1:['🌤️','Poucas nuvens'],2:['⛅','Parcialmente nublado'],3:['☁️','Nublado'],45:['🌫️','Neblina'],48:['🌫️','Neblina com geada'],
 51:['🌦️','Garoa fraca'],53:['🌦️','Garoa'],55:['🌦️','Garoa forte'],56:['🌧️','Garoa congelante'],57:['🌧️','Garoa congelante'],
 61:['🌧️','Chuva fraca'],63:['🌧️','Chuva'],65:['🌧️','Chuva forte'],66:['🌧️','Chuva congelante'],67:['🌧️','Chuva congelante'],
 71:['🌨️','Neve fraca'],73:['🌨️','Neve'],75:['❄️','Neve forte'],77:['🌨️','Grãos de neve'],80:['🌦️','Pancadas de chuva'],81:['🌧️','Pancadas de chuva'],
 82:['⛈️','Pancadas fortes'],85:['🌨️','Pancadas de neve'],86:['🌨️','Pancadas de neve'],95:['⛈️','Tempestade'],96:['⛈️','Tempestade com granizo'],99:['⛈️','Tempestade com granizo']};
const wmo=(c,day=1)=>{const w=W[c]||['🌡️','—'];return(!day&&c<=1)?['🌙',w[1]]:w};
const tmp=v=>v==null?'—':Math.round(v)+'°';

// — HTML de cada bloco (funções puras) —
function calHTML(now,events){const cells=calCells(now.getFullYear(),now.getMonth()),mes=now.toLocaleDateString('pt-BR',{month:'long'}).toUpperCase();
 const today=isoDay(now),evs=(events||[]).filter(e=>e&&(e.date===today||e.date==='todo-dia'));
 const days=cells.map(c=>`<span class="d${c.inMonth?'':' out'}${c.inMonth&&c.d===now.getDate()?' today':''}">${c.d}</span>`).join('');
 const ev=evs.slice(0,2).map(e=>`<div class="ev"><b>${esc(e.title||'')}</b><span>${esc(e.time||'')}</span></div>`).join('');
 return`<div class="cal-card${ev?' has-ev':''}"><div class="cal-main"><div class="cal-month">${mes}</div><div class="cal-grid">${LETRAS.map(l=>`<span class="h">${l}</span>`).join('')}${days}</div></div>${ev?`<div class="cal-evs">${ev}</div>`:''}</div>`}
function nowHTML(wx){if(!wx)return'';const [ico,txt]=wmo(wx.cur.code,wx.cur.day),t=wx.daily[0];
 return`<div class="city">${esc(wx.city)}</div><div class="now"><span class="ico">${ico}</span><span class="temp">${tmp(wx.cur.t)}</span><span class="desc">${esc(txt)}</span></div>`+(t?`<div class="hl">máx ${tmp(t.max)} · mín ${tmp(t.min)}</div>`:'')}
function forecastHTML(wx){if(!wx)return'';return wx.daily.slice(1,5).map(d=>{const dt=new Date(d.date+'T12:00:00');
 return`<div class="fc"><b>${DIAS3[dt.getDay()]}</b><span class="ico">${wmo(d.code)[0]}</span><span>${tmp(d.max)} <i>${tmp(d.min)}</i></span></div>`}).join('')}

// — clima: Open-Meteo (geocodificação + previsão), com cache para funcionar sem internet —
let city=String(C.city||ls.get('asc.city','')||'São Paulo'),wx=ls.get('asc.wx:'+city.toLowerCase(),null);
async function getJSON(url){const ac=new AbortController(),t=setTimeout(()=>ac.abort(),9000);try{const r=await fetch(url,{signal:ac.signal});if(!r.ok)throw new Error(r.status);return await r.json()}finally{clearTimeout(t)}}
async function geocode(name){const k='asc.geo:'+name.toLowerCase(),c=ls.get(k,null);if(c)return c;
 const j=await getJSON('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(name)+'&count=1&language=pt&format=json');
 const r=j.results&&j.results[0];if(!r)throw new Error('cidade não encontrada');const g={lat:r.latitude,lon:r.longitude,name:r.name};ls.set(k,g);return g}
async function loadWeather(){const name=city;try{const g=await geocode(name);
  const j=await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lon}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`);
  if(name!==city)return;const d=j.daily;
  wx={city:g.name,at:Date.now(),cur:{t:j.current.temperature_2m,code:j.current.weather_code,day:j.current.is_day},
   daily:d.time.map((t,i)=>({date:t,code:d.weather_code[i],max:d.temperature_2m_max[i],min:d.temperature_2m_min[i]}))};
  ls.set('asc.wx:'+name.toLowerCase(),wx);renderWeather();setTimeout(loadWeather,30*60e3)
 }catch(e){renderWeather(e);setTimeout(loadWeather,2*60e3)}}
function renderWeather(err){const a=$('wWeather'),b=$('wForecast');if(!a)return;
 a.innerHTML=wx?nowHTML(wx):`<div class="city">${esc(city)}</div><div class="desc">${err?'sem conexão com o clima':'carregando clima…'}</div>`;
 b.innerHTML=forecastHTML(wx)}

// — relógio, data e calendário —
let lastDay='';
function tick(){const n=new Date(),t=$('wTime');if(!t)return;t.textContent=fmtTime(n);
 const k=isoDay(n);if(k!==lastDay){lastDay=k;$('wDate').textContent=fmtDate(n);$('wCal').innerHTML=calHTML(n,C.events)}}

function setOn(on){document.body.classList.toggle('widgets-on',!!on);ls.set('asc.widgets',on?1:0);const b=$('wgBtn');if(b)b.classList.toggle('on',!!on)}
function init(){const root=$('widgets');if(!root)return;
 root.innerHTML='<div class="w-clock"><span id="wTime"></span></div><div class="w-date" id="wDate"></div><div class="w-weather" id="wWeather"></div><div class="w-forecast" id="wForecast"></div><div class="w-cal" id="wCal"></div>';
 if(C.dim!==undefined)document.documentElement.style.setProperty('--dim',C.dim);
 tick();setInterval(tick,1000);renderWeather();loadWeather();
 const inp=$('cityIn');if(inp){inp.value=city;inp.onchange=()=>{const v=inp.value.trim();if(!v)return;city=v;ls.set('asc.city',v);wx=ls.get('asc.wx:'+v.toLowerCase(),null);renderWeather();loadWeather()}}
 const b=$('wgBtn');if(b)b.onclick=()=>setOn(!document.body.classList.contains('widgets-on'));
 addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='w'||e.key==='W')setOn(!document.body.classList.contains('widgets-on'))});
 setOn(C.widgets!==undefined?+C.widgets:ls.get('asc.widgets',0))}
window.AscWidgets={fmtDate,fmtTime,calCells,calHTML,nowHTML,forecastHTML,wmo,init};
init();
})();
