// The OI race-simulation engine, lifted verbatim out of the single-file
// public/index.html. It still owns its own state and still drives the canvas
// directly; the React layer renders the same ids and classes so every
// getElementById in here keeps resolving. Do not reformat: the diff against the
// original single-file version is the only thing that proves nothing was lost.
(function(){
const LW=1200,LH=700,canvas=document.getElementById('treeCanvas'),ctx=canvas.getContext('2d');canvas.width=LW;canvas.height=LH;
let sp=0,gm=4,maps=[],activeMapIdx=0,remTime=0,remStamina=0,maxStamina=20,maxStaminaActual=20,gameStarted=!1,level=0,totalHistScore=0,levelHistory=[],pendingNext=!1,playerName='',settling=!1;
let timeStock=0,mindStock=0,boostStock=0,inspireStock=0;
let timeBonus=0,mindBonus=0,boostLevel=0,inspireCount=0;
let moneyPowerUsed=!1;
let focusStacks=0,focusMapIdx=-1;
let pendingFoodEffects=[],activeFoodTimeBonus=0,activeFoodMindBonus=0;
let ch={I:!1,II:!1,III:!1,I_exp:!1,IV:!1,V:!1,VI:!1,VII:!1,II_exp:!1,VIII:!1,IX:!1,X:!1,III_exp:!1,fun_I:!1,fun_II:!1,assist_I:!1};
let chTimer=null,obfTimer=null,inferMode=!1;
let tipsAdded=new Set();
let shop={timeToSp:!1,timeMaster:!1,sharpIntuition:!1,focus:!1,inference:!1,convenience:!1,moneyPower:!1};
let nodeAnimations={},spEarnedPending=0,timeToSpBonusPending=0,spEarnedAnim=null,initialTotalTime=0;
let settlingTimeout=null;
let scoreRecordedForLevel=null;
let easyMode=true,hasPlayedBefore=false,everGotNOIMedal=false,easyModeAutoSet=false;
let levelMindOffset=0;
let gameStartTime=0,mapNonCorrectUnlockedCount=0,everBoughtStock=!1;
let sessionAchievements=new Set();
let achievementMode='normal';
const achievements=[
{id:'helloworld',name:'HelloWorld',desc:'AC 一道题目',check:()=>maps.some(m=>m.maxResultScore===100&&m.gameResult==='win')},
{id:'first_win',name:'首战告捷',desc:'通过 CSP-S',check:()=>levelHistory.some(e=>e.level===1&&e.passed&&!e.sim)},
{id:'noip_pass',name:'不平凡者',desc:'通过 NOIP',check:()=>levelHistory.some(e=>e.level===4&&e.passed&&!e.sim)},
{id:'province_pass',name:'万里挑一',desc:'通过省选',check:()=>levelHistory.some(e=>e.level===7&&e.passed)},
{id:'noi_gold',name:'传奇',desc:'获得 NOI 金牌',check:()=>levelHistory.some(e=>e.level===10&&e.passed&&e.medal==='gold')},
{id:'ioi_start',name:'结束了',desc:'开始 IOI 比赛',check:()=>level===13&&gameStarted},
{id:'aker',name:'AKer',desc:'在一场比赛中通过所有题目',check:()=>maps.length>0&&maps.every(m=>m.maxResultScore===100&&m.gameResult==='win')},
{id:'ioi_600',name:'开始了',desc:'在 IOI 中获得 600 分',check:()=>levelHistory.some(e=>e.level===13&&e.totalScore>=600)},
{id:'consolation',name:'安慰奖',desc:'在一道题目中解锁了 5 个非正确结果节点',check:()=>mapNonCorrectUnlockedCount>=5},
{id:'speed_99',name:'手速 99+',desc:'在比赛开始后 3s 内通过一道题',check:()=>maps.some(m=>m.winTimestamp&&m.winTimestamp-gameStartTime<3000)},
{id:'super_speed',name:'超光速',desc:'在比赛开始后 10s 内将总分提升至分数线上',check:()=>{let pass=cfgL(level).pass+(ch.V?30:0);return totalReachPassTime!=null&&totalReachPassTime-gameStartTime<10000&&maps.reduce((s,m)=>s+m.maxResultScore,0)>=pass}},
{id:'time_rich',name:'时间充裕',desc:'在一场比赛中拥有超过 90 时间',check:()=>remTime>90},
{id:'vitality',name:'活力满满',desc:'在一场比赛中拥有超过 120 精力',check:()=>remStamina>120},
{id:'gap_40',name:'心有余而力不足',desc:'在一场比赛中时间和精力的差达到 40',check:()=>Math.abs(remTime-remStamina)>=40},
{id:'rich',name:'我将富有',desc:'拥有超过 50 技能点',check:()=>sp>50},
{id:'no_stock_noip',name:'我已觉醒',desc:'在不够买存量的情况下通过 NOIP',check:()=>levelHistory.some(e=>e.level===4&&e.passed&&!e.sim)&&!everBoughtStock},
{id:'challenge_ioi',name:'结束了……又一次',desc:'在开启挑战的情况下进入 IOI',check:()=>level===13&&gameStarted&&Object.keys(ch).some(k=>ch[k])},
{id:'i_exp_ioi_gold',name:'我已启动',desc:'开启 I EXP 并获得 IOI 金牌',check:()=>ch.I_exp&&levelHistory.some(e=>e.level===13&&e.passed&&e.medal==='gold')},
{id:'i_ii_exp_ioi_gold',name:'我已神化',desc:'开启 I EXP 和 II EXP 并获得 IOI 金牌',check:()=>ch.I_exp&&ch.II_exp&&levelHistory.some(e=>e.level===13&&e.passed&&e.medal==='gold')},
{id:'orz',name:'orz',desc:'开启 I EXP 和 II EXP 以及 III EXP 并获得 NOI 金牌',check:()=>ch.I_exp&&ch.II_exp&&ch.III_exp&&levelHistory.some(e=>e.level===10&&e.passed&&e.medal==='gold')},
{id:'ioi_zero',name:'认真的吗',desc:'IOI 获得 0 分',check:()=>levelHistory.some(e=>e.level===13&&e.totalScore===0)}
];
let totalReachPassTime=null;
// Persistent state lives in D1 behind /api/. The browser keeps a copy purely so
// rendering never has to wait on the network; the server is the source of truth.
let currentRunId=null;
async function api(path,body){
  const res=await fetch('/api'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),credentials:'same-origin'});
  let data=null;try{data=await res.json()}catch(e){}
  if(!res.ok)throw new Error((data&&data.error)||('HTTP '+res.status));
  return data;
}
let achievementData={simple:{},normal:{}};
function unlockAchievement(id){if(sessionAchievements.has(id))return;const ach=achievements.find(a=>a.id===id);if(!ach)return;const mode=easyMode?'simple':'normal';if(achievementData[mode][id]){sessionAchievements.add(id);updateSessionAchievements();return;}achievementData[mode][id]={player:playerName};api('/achievement',{mode,achId:id}).then(r=>{if(r&&r.firstPlayer){achievementData[mode][id].player=r.firstPlayer;updateAchievementDisplay()}}).catch(()=>{});sessionAchievements.add(id);totalHistScore+=100;updateSessionAchievements();showAchievementPopup(ach);}
function showAchievementPopup(ach){const cont=document.getElementById('achievementPopupContainer');const div=document.createElement('div');div.className='achievement-popup';div.innerHTML=`<div class="ach-title">🏅 成就达成：${ach.name}</div><div class="ach-desc">${ach.desc}</div><div class="ach-score">+100 总分</div>`;cont.appendChild(div);setTimeout(()=>div.remove(),4000);}
function updateSessionAchievements(){const list=document.getElementById('sessionAchievementsList');if(!list)return;if(sessionAchievements.size===0){list.textContent='暂无成就';return}let html='';sessionAchievements.forEach(id=>{const ach=achievements.find(a=>a.id===id);if(ach)html+=`<div>🏅 ${ach.name}</div>`});list.innerHTML=html;}
function checkAchievements(){achievements.forEach(a=>{if(!sessionAchievements.has(a.id)&&a.check())unlockAchievement(a.id)});}
function applySettings(st){easyMode=!!st.easyMode;easyModeAutoSet=!!st.easyModeAutoSet;hasPlayedBefore=!!st.hasPlayedBefore;everGotNOIMedal=!!st.everGotNOIMedal}
function saveEasySettings(){api('/settings',{easyMode,easyModeAutoSet,hasPlayedBefore,everGotNOIMedal}).catch(()=>{})}
function getSimpleStamina(lv){if(!easyMode)return null;if(lv===4)return 56;if(lv>=5&&lv<=10)return 96;if(lv>=11)return 120;return null}
const LV=[{name:'CSP-S模拟赛',maps:4,pass:200,stam:40,sim:!0},{name:'CSP-S',maps:4,pass:200,stam:40,sim:!1},{name:'NOIP模拟赛1',maps:4,pass:200,stam:56,sim:!0},{name:'NOIP模拟赛2',maps:4,pass:200,stam:56,sim:!0},{name:'NOIP',maps:4,pass:200,stam:56,sim:!1},{name:'省选模拟赛1',maps:6,pass:400,stam:72,sim:!0},{name:'省选模拟赛2',maps:6,pass:400,stam:72,sim:!0},{name:'省选',maps:6,pass:400,stam:72,sim:!1},{name:'NOI模拟赛1',maps:6,pass:400,stam:72,sim:!0},{name:'NOI模拟赛2',maps:6,pass:400,stam:72,sim:!0},{name:'NOI',maps:6,pass:400,stam:72,sim:!1},{name:'CTT',maps:6,pass:400,stam:72,sim:!1},{name:'CTS',maps:6,pass:400,stam:72,sim:!1},{name:'IOI',maps:6,pass:0,stam:72,sim:!1}];
const TIPS=['你知道吗，题目难度是根据题目顺序排的','时间是非常重要的资源，多找时间库存，多买时间，这样等到后面你会很轻松的。','思维很重要，如果你思维不足会消耗大量精力，让你无法探索','寻找正确节点是有策略的，不要在一条分支里卡到死，多看看别处，指不定正确节点非常浅呢。','你知道吗，省选及以后有 6 道题的比赛是按 T1、T4，然后 T2、T5，最后是 T3、T6 来难度分级的。不要一道一道的做。','推理是十分好的东西，它可以花费精力节约时间，但是你要收集很多思维来少花点精力。','食物对于推理是十分重要的，精力越多，你就能进行越多推理。并且有些还有特殊效果。所以花点技能点买食物吧。','不要吝啬时间和精力，大胆聚焦推理，你会得到宝贵的信息。','骗分也是不错的策略，如果你不能找到正确的节点，为什么不找个 80 分的呢。','其实振奋对于推理是十分超模的结构，你会得到很多精力的。','恭喜进入游戏后期，难度会很大，善用推理和聚焦，以及多吃点食物。','看来你已经掌握技巧了，继续前进吧，闯过下一关就是 IOI！','把你的技能点全部用上，你现在只有一个目标，在 IOI 中打出最好的成绩。'];
function maybeAddTip(lv){if(lv>=0&&lv<TIPS.length&&!tipsAdded.has(lv)){tipsAdded.add(lv);const panel=document.getElementById('shopTipsPanel');if(panel){const tip=document.createElement('div');tip.className='tip-item';tip.textContent=TIPS[lv];panel.appendChild(tip);requestAnimationFrame(()=>{panel.scrollTop=panel.scrollHeight;})}}}
function cfgL(l){return LV[Math.min(l,LV.length-1)]}
function getMapGenParams(lv,mapIdx){const mapsCount=LV[Math.min(lv,LV.length-1)].maps;const i=mapIdx%mapsCount;if(lv<=1){if(i===0)return{minD:2,maxD:3,minN:0};if(i===1)return{minD:3,maxD:5,minN:8};return{minD:4,maxD:999,minN:12}}else if(lv<=4){if(i===0)return{minD:3,maxD:4,minN:10};if(i===1)return{minD:3,maxD:6,minN:15};return{minD:5,maxD:999,minN:18}}else if(lv<=7){if(i===0||i===3)return{minD:3,maxD:6,minN:12};if(i===1||i===4)return{minD:4,maxD:7,minN:18};return{minD:5,maxD:999,minN:22}}else if(lv<=10){if(i===0||i===3)return{minD:4,maxD:6,minN:14};if(i===1||i===4)return{minD:5,maxD:999,minN:20};return{minD:6,maxD:999,minN:24}}else if(lv===11){return getMapGenParams(10,i)}else if(lv===12){const baseNOI=getMapGenParams(10,i);return{minD:baseNOI.minD+2,maxD:baseNOI.maxD===999?999:Math.min(baseNOI.maxD+2,999),minN:baseNOI.minN}}else{if(i===0||i===3)return{minD:6,maxD:999,minN:28};if(i===1||i===4)return{minD:7,maxD:999,minN:32};return{minD:8,maxD:999,minN:40}}}
function rI(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function seedR(s){let x=s;return function(){x=(x*16807)%2147483647;return(x-1)/2147483646}}
function applyMindOffset(lv){if(lv<=1)return 0;else if(lv<=4)return rI(-1,1);else if(lv<=7)return rI(-1,2);else return rI(-2,3)}
function getEffMind(){return gm+focusStacks+mindBonus+activeFoodMindBonus+levelMindOffset}
function getLvMult(){if(level<=4)return 0.75;return 1}
function getBroadMargin(lv){if(lv>=11)return 4;if(lv>=8)return 2;return 0}
function getTimePenaltyK(lv){if(lv<=4)return 1;if(lv<=10)return 2;return 3}
function obf(v){if(!ch.IV)return v;return String(v).replace(/[0-9]/g,()=>'!@#$%&*?~<>|'[Math.floor(Math.random()*11)])}
function setMsg(el,txt,type){el.textContent=txt;el.className='';if(type)el.classList.add(type);if(txt){clearTimeout(el._t);el._t=setTimeout(()=>{el.textContent='';el.className=''},6000)}}
const gmEl=document.getElementById('globalMessage');
function setGM(t,ty){setMsg(gmEl,t,ty)}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function fsp(n){return Number.isInteger(n)?n.toString():n.toFixed(1)}
function isInActiveGame(){return gameStarted&&maps.length>0&&maps.some(m=>!m.gameOver)}
function getBadge(k){return 'badge'+k[0].toUpperCase()+k.slice(1).replace(/_/g,'')}
function canExp(k){if(k==='I_exp')return ch.I&&ch.II&&ch.III;if(k==='II_exp')return ch.IV&&ch.V&&ch.VI&&ch.VII;if(k==='III_exp')return ch.VIII&&ch.IX&&ch.X}
function updateExp(){if(!canExp('I_exp'))ch.I_exp=!1;if(!canExp('II_exp'))ch.II_exp=!1;if(!canExp('III_exp'))ch.III_exp=!1}
function hasPassedNOIP(){return levelHistory.some(e=>e.level===4&&e.passed&&!e.sim)}
function hasPassedIOI(){return levelHistory.some(e=>e.level===13&&e.passed&&!e.sim&&e.easyMode===false&&(e.medal==='gold'||e.medal==='god'))}
function updateChallengeBtnHighlight(){const btn=document.getElementById('btnOpenChallenge');if(btn){if(hasPassedIOI()){btn.classList.add('highlighted')}else{btn.classList.remove('highlighted')}}const warning=document.getElementById('challengeWarning');if(warning){warning.textContent=hasPassedIOI()?'✅ 你已在非简单模式下获得IOI金牌，可以挑战了':'⚠️ 如果你还没有在非简单模式下通关过游戏拿到IOI金牌，那么建议你先通关游戏';}}
function syncChUI(){updateExp();const man=['I','II','III','IV','V','VI','VII','VIII','IX','X'],ex=['I_exp','II_exp','III_exp'],fu=['fun_I','fun_II'],as=['assist_I'],t1=['I','II','III'],t2=['IV','V','VI','VII'],t3=['VIII','IX','X'];
man.forEach(k=>{const it=document.getElementById('ch'+k),bd=document.getElementById(getBadge(k));if(it){it.classList.toggle('manual-enabled',ch[k]);it.classList.remove('tier1-on','tier2-on','tier3-on','exp-override');if(t1.includes(k)){if(ch.I_exp)it.classList.add('exp-override');else if(ch[k])it.classList.add('tier1-on')}else if(t2.includes(k)){if(ch.II_exp)it.classList.add('exp-override');else if(ch[k])it.classList.add('tier2-on')}else if(t3.includes(k)){if(ch.III_exp)it.classList.add('exp-override');else if(ch[k])it.classList.add('tier3-on')}}if(bd){bd.textContent=ch[k]?'开启':'关闭';bd.className='challenge-status-badge '+(ch[k]?'on':'off')}});
ex.forEach(k=>{const it=document.getElementById('ch'+k[0].toUpperCase()+k.slice(1).replace(/_/g,'')),bd=document.getElementById(getBadge(k)),ce=canExp(k);if(it){it.classList.remove('exp-active','exp-locked');if(ch[k])it.classList.add('exp-active');else if(!ce)it.classList.add('exp-locked')}if(bd){if(ch[k]){bd.textContent='已激活';bd.className='challenge-status-badge exp-on'}else if(ce){bd.textContent='可激活';bd.className='challenge-status-badge exp-off'}else{bd.textContent='锁定';bd.className='challenge-status-badge exp-locked'}}});
fu.forEach(k=>{const it=document.getElementById('ch'+k[0].toUpperCase()+k.slice(1).replace(/_/g,'')),bd=document.getElementById(getBadge(k));if(it)it.classList.toggle('fun-active',ch[k]);if(bd){bd.textContent=ch[k]?'开启':'关闭';bd.className='challenge-status-badge '+(ch[k]?'fun-on':'fun-off')}});
as.forEach(k=>{const it=document.getElementById('ch'+k[0].toUpperCase()+k.slice(1).replace(/_/g,'')),bd=document.getElementById(getBadge(k));if(it)it.classList.toggle('assist-active',ch[k]);if(bd){bd.textContent=ch[k]?'开启':'关闭';bd.className='challenge-status-badge '+(ch[k]?'assist-on':'assist-off')}});
updateTierStyles();updateSumRow();updateChallengeBtnHighlight()}
function updateTierStyles(){const t1=document.getElementById('tier1Group'),t2=document.getElementById('tier2Group'),t3=document.getElementById('tier3Group'),fg=document.getElementById('funGroup'),ag=document.getElementById('assistGroup');if(t1){t1.classList.remove('tier1-active','tier1-exp-active');if(ch.I_exp)t1.classList.add('tier1-exp-active');else if(ch.I||ch.II||ch.III)t1.classList.add('tier1-active')}if(t2){t2.classList.remove('tier2-active','tier2-exp-active');if(ch.II_exp)t2.classList.add('tier2-exp-active');else if(ch.IV||ch.V||ch.VI||ch.VII)t2.classList.add('tier2-active')}if(t3){t3.classList.remove('tier3-active','tier3-exp-active');if(ch.III_exp)t3.classList.add('tier3-exp-active');else if(ch.VIII||ch.IX||ch.X)t3.classList.add('tier3-active')}if(fg){fg.classList.toggle('fun-active',ch.fun_I||ch.fun_II)}if(ag){ag.classList.toggle('assist-active',ch.assist_I)}}
function updateSumRow(){const el=document.getElementById('challengeSummaryRow');if(!el)return;const a=[];if(ch.I)a.push('I');if(ch.II)a.push('II');if(ch.III)a.push('III');if(ch.I_exp)a.push('I-EXP');if(ch.IV)a.push('IV');if(ch.V)a.push('V');if(ch.VI)a.push('VI');if(ch.VII)a.push('VII');if(ch.II_exp)a.push('II-EXP');if(ch.VIII)a.push('VIII');if(ch.IX)a.push('IX');if(ch.X)a.push('X');if(ch.III_exp)a.push('III-EXP');if(ch.assist_I)a.push('辅助I');if(ch.fun_I)a.push('FunI');if(ch.fun_II)a.push('FunII');el.innerHTML=a.length?'已启用：'+a.join(', '):'未启用'}
function toggleCh(k){const man=['I','II','III','IV','V','VI','VII','VIII','IX','X'],ex=['I_exp','II_exp','III_exp'],fu=['fun_I','fun_II'],as=['assist_I'];if(man.includes(k)){ch[k]=!ch[k];updateExp();syncChUI()}else if(ex.includes(k)){if(!canExp(k)&&!ch[k])return;ch[k]=!ch[k];updateExp();syncChUI()}else if(fu.includes(k)){ch[k]=!ch[k];syncChUI()}else if(as.includes(k)){ch[k]=!ch[k];syncChUI()}}
function initChClicks(){['I','II','III','I_exp','IV','V','VI','VII','II_exp','VIII','IX','X','III_exp','fun_I','fun_II','assist_I'].forEach(k=>{const id='ch'+k[0].toUpperCase()+k.slice(1).replace(/_/g,''),el=document.getElementById(id);if(el)el.addEventListener('click',()=>toggleCh(k))})}
function resizeC(){const w=canvas.parentElement.clientWidth,scale=Math.min(1,w/LW);canvas.style.width=(LW*scale)+'px';canvas.style.height=(LH*scale)+'px'}
window.addEventListener('resize',resizeC);resizeC();
window._showTip=function(evt,text){const pop=document.getElementById('challengeTipPopup');pop.textContent=text;pop.style.left=Math.min(evt.clientX+10,window.innerWidth-310)+'px';pop.style.top=Math.min(evt.clientY-10,window.innerHeight-100)+'px';pop.classList.add('show');clearTimeout(pop._ht);pop._ht=setTimeout(()=>pop.classList.remove('show'),5000)};
window._toggleShopInferenceHelp=function(){const content=document.getElementById('shopInferenceHelpContent');const toggle=document.getElementById('shopInferenceHelpToggle');if(!content||!toggle)return;const isShowing=content.classList.contains('show');if(isShowing){content.classList.remove('show');toggle.innerHTML='📖 推理模式说明 ▾'}else{content.classList.add('show');toggle.innerHTML='📖 推理模式说明 ▴'}};
function syncAllSp(){const ssp=document.getElementById('shopSkillPoints');if(ssp)ssp.textContent=fsp(sp)}
function animateSpDisplay(from,to,dur=500){const dsp=document.getElementById('shopSkillPoints');if(!dsp)return;const start=performance.now();function step(ts){const p=Math.min(1,(ts-start)/dur);const v=Math.round(from+(to-from)*p);dsp.textContent=v;if(p<1)requestAnimationFrame(step);else dsp.textContent=to}requestAnimationFrame(step)}
function animateScore(el,from,to,mp,dur=2000){if(!el)return;const start=performance.now();function step(ts){const p=Math.min(1,(ts-start)/dur);const v=Math.round(from+(to-from)*p);el.textContent=v+'/'+mp;if(p<1)requestAnimationFrame(step);else el.textContent=to+'/'+mp}requestAnimationFrame(step)}
function getMaxS(lv){if(lv<=1)return 70;if(lv<=4)return 80;if(lv<=10)return 90;return 100}
function getK(){return ch.II_exp?15:10}
function randomReq(depth){const lv=level;let base,k;if(lv<=1){base=2;k=0.5;}else if(lv<=4){base=4;k=0.4;}else if(lv<=7){base=5;k=0.4;}else if(lv<=10){base=5;k=0.6;}else if(lv<=12){base=5;k=0.6;}else{base=5;k=0.7;}if(ch.III_exp)k*=1.5;return Math.floor(base + depth*k);}
function genTree(minCorD,maxCorD,minN){let id=0;function nid(){return 'N'+(id++)}const k=getK(),maxS=getMaxS(level);const root={id:'R',name:'R',type:'process',isCorrect:!1,children:[],parent:null,depth:0,req:randomReq(0),score:null};const all=[root];const exp=[root];const targetNodes=Math.max(minN||0,8);while(all.length<targetNodes){let cand=exp.filter(p=>p.type!=='result'&&p.children.length<(p.type==='important'?2:3));if(!cand.length)cand=all.filter(n=>n.type!=='result'&&n.children.length<(n.type==='important'?2:3));if(!cand.length){const nn={id:nid(),name:nid(),type:'process',isCorrect:!1,children:[],parent:root,depth:1,req:randomReq(1),score:null};root.children.push(nn);all.push(nn);cand=[nn]}const par=cand[rI(0,cand.length-1)];const rem=targetNodes-all.length;const avail=Math.min((par.type==='important'?2:3)-par.children.length,rI(1,Math.min(3,rem)));for(let i=0;i<avail;i++){if(all.length>=targetNodes)break;const cd=par.depth+1;let tp;if(all.length<targetNodes)tp=Math.random()<0.15?'important':(Math.random()<0.85?'process':'result');else tp=Math.random()<0.2?'important':(Math.random()<0.6?'process':'result');const child={id:nid(),name:nid(),type:tp,isCorrect:!1,children:[],parent:par,depth:cd,req:randomReq(cd),score:null};all.push(child);par.children.push(child);if(tp!=='result')exp.push(child)}const i=exp.indexOf(par);if(i>=0&&par.children.length>=(par.type==='important'?2:3))exp.splice(i,1)}let resLeaves=all.filter(n=>n.type==='result');if(!resLeaves.length){const p=all.find(n=>n.type==='process'&&n.children.length<3)||all.find(n=>n.type==='process')||all[0];const ch={id:nid(),name:nid(),type:'result',isCorrect:!1,children:[],parent:p,depth:p.depth+1,req:randomReq(p.depth+1),score:null};p.children.push(ch);all.push(ch);resLeaves.push(ch)}let deep=resLeaves.filter(n=>n.depth>=minCorD&&n.depth<=maxCorD);if(!deep.length){let d=resLeaves.reduce((a,b)=>a.depth>b.depth?a:b);const ridx=resLeaves.indexOf(d);if(ridx>=0)resLeaves.splice(ridx,1);d.type='process';d.isCorrect=!1;while(d.depth<minCorD&&d.depth<maxCorD){const nch={id:nid(),name:nid(),type:'result',isCorrect:!1,children:[],parent:d,depth:d.depth+1,req:randomReq(d.depth+1),score:null};d.children.push(nch);all.push(nch);d=nch;resLeaves.push(nch)}deep=[d]}const cor=deep[rI(0,deep.length-1)];cor.score=100;
function lca(a,b){const p=new Set();let cur=a;while(cur){p.add(cur);cur=cur.parent}cur=b;while(cur){if(p.has(cur))return cur;cur=cur.parent}return null}
resLeaves.forEach(rn=>{if(rn===cor)return;const l=lca(rn,cor);const distMax=Math.max(rn.depth-cor.depth,0)+Math.max(rn.depth-l.depth,cor.depth-l.depth);rn.score=Math.max(1,Math.floor(maxS-distMax*k))});let cur=cor;while(cur){cur.isCorrect=!0;cur=cur.parent}return{defs:all.map(n=>({id:n.id,name:n.name,type:n.type,isCorrect:n.isCorrect,childIds:n.children.map(c=>c.id),req:n.req,score:n.score,depth:n.depth})),correctId:cor.id}}
function buildMap(defs){const m={};defs.forEach(d=>m[d.id]={...d,children:[],parent:null,state:'hidden',x:0,y:0,isFork:!1,req:d.req,score:d.score,depth:d.depth,_b:null,_cb:null,upgradeType:null});Object.values(m).forEach(n=>{n.childIds.forEach(cid=>{const c=m[cid];if(c){n.children.push(c);c.parent=n}});if(n.type==='process'&&n.children.length>1)n.isFork=!0});return m}
function createMap(minD,maxD,minN){const{defs,correctId}=genTree(minD,maxD,minN);const nm=buildMap(defs);const root=nm['R'];Object.values(nm).forEach(n=>n.state='hidden');root.state='visible_locked';if(ch.fun_I){Object.values(nm).forEach(n=>{if(n.id===correctId)return;if(n.type==='result'||n.type==='skill')n.score=0})}return{nodeMap:nm,root,correctResult:nm[correctId],totalUnlocked:0,gameOver:!1,gameResult:null,maxResultScore:0,hasSkillNode:!1,skillNodeId:null,totalStaminaSpent:0,inferResults:new Map(),inferReqs:new Map(),_funIRewardGiven:!1,_funIIRewardGiven:!1,winTimestamp:null}}
function getActive(){return maps[activeMapIdx]}
function computeLayout(md){const{nodeMap,root}=md;const lvls={},nlvl={};function assignLv(n,lv){n.depth=lv;nlvl[n.id]=lv;if(!lvls[lv])lvls[lv]=[];lvls[lv].push(n);n.children.forEach(c=>assignLv(c,lv+1))}assignLv(root,0);const maxLv=Math.max(...Object.keys(lvls).map(Number),0);const lvH=LH/(maxLv+2),topM=lvH*0.9;function leafCnt(n){if(!n.children.length)return 1;return n.children.reduce((s,c)=>s+leafCnt(c),0)}const lc={};Object.values(nodeMap).forEach(n=>lc[n.id]=leafCnt(n));const totalL=lc[root.id]||1,margin=60;function assignX(n,left,right){const w=(right-left)*(lc[n.id]/totalL);n.x=n===root?LW/2:left+w/2;n.y=topM+nlvl[n.id]*lvH;let childLeft=left;n.children.forEach(c=>{const cw=(right-left)*(lc[c.id]/totalL);assignX(c,childLeft,childLeft+cw);childLeft+=cw})}assignX(root,margin,LW-margin);
Object.values(lvls).forEach(lns=>{lns.sort((a,b)=>a.x-b.x);for(let i=1;i<lns.length;i++)if(lns[i].x-lns[i-1].x<70)lns[i].x=lns[i-1].x+70;const avg=lns.reduce((s,n)=>s+n.x,0)/lns.length;lns.forEach(n=>n.x+=LW/2-avg);lns.forEach(n=>n.x=Math.max(margin,Math.min(LW-margin,n.x)))});
const allNodes=Object.values(nodeMap);
const rngOff=seedR(level*137+(maps.length||0)*73+Object.keys(nodeMap).length*41);
allNodes.forEach(n=>{
let ox=0,oy=0;let attempts=0;let bestOx=0,bestOy=0,bestMinDist=0;
while(attempts<30){
ox=(rngOff()-0.5)*10;oy=(rngOff()-0.5)*10;
let collision=!1;let minDist=Infinity;
for(const other of allNodes){
if(other===n)continue;
const dx=(n.x+ox)-(other.x+(other._appliedOx||0));
const dy=(n.y+oy)-(other.y+(other._appliedOy||0));
const dist=Math.sqrt(dx*dx+dy*dy);
if(dist<minDist)minDist=dist;
if(dist<38){collision=!0;break}
}
if(!collision){bestOx=ox;bestOy=oy;bestMinDist=minDist;break}
if(minDist>bestMinDist){bestOx=ox;bestOy=oy;bestMinDist=minDist}
attempts++;
}
n._appliedOx=bestOx;n._appliedOy=bestOy;n.x+=bestOx;n.y+=bestOy
})}
function staminaCost(n){const broadMargin=getBroadMargin(level);return Math.max(1,(n.req||0)-getEffMind()-broadMargin)}
function canUnlock(n,map){return n.state==='visible_locked'&&!map.gameOver&&remTime>0&&remStamina>0&&!n._lockedByExp&&(n===map.root||(n.parent&&(n.parent.state==='unlocked'||n.parent.state==='correct'||n.parent.state==='incorrect')))}
function canCheck(n,map){return n.state==='unlocked'&&!map.gameOver&&remTime>0&&remStamina>0&&(n.type==='important'||n.type==='result'||n.type==='skill')}
function computeMaxScore(map){let max=0;Object.values(map.nodeMap).filter(n=>n.type==='result'||n.type==='skill').forEach(r=>{if((r.state==='correct'||r.state==='incorrect')&&r.score!==null&&r.score>max)max=r.score});if(!max&&map.gameResult==='win'&&map.correctResult?.score!=null)max=map.correctResult.score;return max}
function markCorrect(n){if(n.state!=='correct'){if(n.type==='skill'&&!ch.fun_I&&!ch.fun_II){sp+=0.5+boostLevel;syncAllSp();updateActBar()}n.state='correct'}}
function markIncorrect(n){if(n.state==='incorrect'||n.state==='correct')return;n.state='incorrect';n.children.forEach(c=>markIncorrect(c))}
function checkFork(f){if(!f.isFork||f.state==='incorrect'||f.state==='correct')return;if(f.children.every(c=>c.state==='incorrect')){markIncorrect(f);if(f.parent?.isFork)checkFork(f.parent)}}
function getMaxSub(node){if(node.type==='result'||node.type==='skill')return node.score||0;let m=0;function dfs(n){if((n.type==='result'||n.type==='skill')&&n.score>m)m=n.score;n.children.forEach(dfs)}dfs(node);return m}
function countResInSub(node){if(node.type==='result'||node.type==='skill')return 1;let c=0;node.children.forEach(ch=>c+=countResInSub(ch));return c}
function flashBlueBorder(){const gc=document.getElementById('gameContainer');gc.classList.add('blue-flash');setTimeout(()=>gc.classList.remove('blue-flash'),550)}
function flashCorrectBorder(){const gc=document.getElementById('gameContainer');gc.classList.add('correct-flash');setTimeout(()=>gc.classList.remove('correct-flash'),550)}
function endAllMapsDueToResourceDepletion(){maps.forEach(m=>{if(!m.gameOver){if(m.correctResult&&m.correctResult.state==='correct')endMapGame(m,'win');else endMapGame(m,'lose')}});checkAllComplete();refreshUI()}
function unlockNode(node,map){if(!canUnlock(node,map))return!1;remTime=Math.max(0,remTime-1);const sc=staminaCost(node);remStamina=Math.max(0,remStamina-sc);map.totalStaminaSpent=(map.totalStaminaSpent||0)+sc;map.totalUnlocked++;node.state='unlocked';nodeAnimations[node.id]={type:'unlock',start:performance.now(),dur:300};node.children.forEach(c=>{if(c.state==='hidden')c.state='visible_locked'});if(node===map.correctResult&&node.type==='skill'&&!ch.fun_I&&!ch.fun_II){sp+=0.5+boostLevel;syncAllSp();updateActBar()}if(node.type==='result'&&node!==map.correctResult){mapNonCorrectUnlockedCount++;checkAchievements()}if(remTime<=0||remStamina<=0){endAllMapsDueToResourceDepletion();return!0}refreshUI();checkAchievements();return!0}
function performCheck(node,map){if(!canCheck(node,map))return!1;let tc=ch.VIII?2:1,stc=ch.VIII?2:staminaCost(node);remTime=Math.max(0,remTime-tc);remStamina=Math.max(0,remStamina-stc);map.totalStaminaSpent=(map.totalStaminaSpent||0)+stc;if(node===map.correctResult&&inspireCount>0){const b=2;remStamina+=b*inspireCount;setGM('⚡振奋！精力+'+b*inspireCount,'success')}
if(node.upgradeType){switch(node.upgradeType){case'time':timeStock++;setGM('⏰获得时间存量！('+timeStock+')','success');break;case'mind':mindStock++;setGM('🧠获得思维存量！('+mindStock+')','success');break;case'boost':boostStock++;setGM('💠获得提升存量！('+boostStock+')','success');break;case'inspire':inspireStock++;setGM('⚡获得振奋存量！('+inspireStock+')','success');break}updateSideStocks()}
const wasCorrect=node.isCorrect&&node.state!=='correct';
const prevMaxScore=map.maxResultScore;
if(node.isCorrect){markCorrect(node);if(wasCorrect)flashCorrectBorder();if(ch.fun_I&&node===map.correctResult&&!map._funIRewardGiven){const lvMult=getLvMult();let earned=Math.floor(6*lvMult);if(ch.IX)earned=Math.floor(earned*0.75);sp+=earned;map._funIRewardGiven=!0;syncAllSp();updateActBar();setGM('🎯AC骄傲！+'+fsp(earned)+'技能点','success')}let fork=node.parent;while(fork&&!fork.isFork)fork=fork.parent;if(fork){let cur=node;while(cur&&cur!==fork){if(cur.type==='process'||cur.type==='skill')markCorrect(cur);cur=cur.parent}}if(node===map.correctResult){flashCorrectBorder();if(node.type==='skill')flashBlueBorder();map.maxResultScore=computeMaxScore(map);if(map.maxResultScore>prevMaxScore)triggerScoreAnim();
if(ch.I && !map._timePenaltyDone){
    const k=getTimePenaltyK(level);
    remTime=Math.max(0, remTime - k);
    map._timePenaltyDone = true;
    setGM('⏱️时间不足：满分扣'+k+'时间','warning');
}
if(remTime<=0||remStamina<=0){endAllMapsDueToResourceDepletion();return true;}refreshUI();checkAchievements();return true;}let p=node.parent;while(p){if(p.isCorrect)markCorrect(p);p=p.parent}}else{node.state='incorrect';let fork=node.parent;while(fork&&!fork.isFork)fork=fork.parent;if(fork){let cur=node;while(cur&&cur!==fork){if(cur.type==='process'||cur.type==='skill')cur.state='incorrect';cur=cur.parent}checkFork(fork)}}if(ch.fun_II&&node.upgradeType&&!map._funIIRewardGiven){sp+=3;map._funIIRewardGiven=!0;syncAllSp();updateActBar();setGM('📁特殊节点！+3技能点','success')}if(node.type==='skill')flashBlueBorder();const newMaxScore=computeMaxScore(map);if(newMaxScore>map.maxResultScore){map.maxResultScore=newMaxScore;triggerScoreAnim()}else{map.maxResultScore=newMaxScore}if(remTime<=0||remStamina<=0){endAllMapsDueToResourceDepletion();return!0}refreshUI();checkAchievements();return!0}
function triggerScoreAnim(){const ts=maps.reduce((s,m)=>s+(m.maxResultScore||0),0),mp=maps.length*100;const snEl=document.getElementById('scoreNumber');const prevTs=snEl._prevTs||0;if(ts>prevTs){animateScore(snEl,prevTs,ts,mp,2000)}snEl._prevTs=ts;if(gameStartTime&&ts>=cfgL(level).pass+(ch.V?30:0)&&totalReachPassTime==null)totalReachPassTime=Date.now();checkAchievements()}
function endMapGame(map,result){map.gameOver=!0;map.gameResult=result;map.maxResultScore=computeMaxScore(map);if(result==='win')map.winTimestamp=Date.now();Object.values(map.nodeMap).forEach(n=>{if(n.state==='hidden')n.state='visible_locked'});if(result==='lose'){let cur=map.correctResult;while(cur){if(cur.state!=='incorrect')cur.state='correct';cur=cur.parent}}if(map===getActive())refreshUI();updateMapBtns();updateMapSelectorBtns();if(maps.every(m=>m.gameOver))checkAllComplete();checkAchievements()}
function completeMapManually(map){if(!map||map.gameOver||!map.correctResult||map.correctResult.state!=='correct')return;endMapGame(map,'win')}
function isCorrectFound(map){return map&&map.correctResult&&map.correctResult.state==='correct'}
function stopChTimer(){if(chTimer){clearInterval(chTimer);chTimer=null}}
function startChTimer(){stopChTimer();if(!ch.VII)return;chTimer=setInterval(()=>{if(!gameStarted)return;if(maps.every(m=>m.gameOver)){stopChTimer();return}if(remTime>0&&remStamina>0){remTime=Math.max(0,remTime-1);remStamina=Math.max(0,remStamina-1);refreshUI();checkAchievements();if(remTime<=0||remStamina<=0){maps.forEach(m=>{if(!m.gameOver){if(m.correctResult&&m.correctResult.state==='correct')endMapGame(m,'win');else endMapGame(m,'lose')}});checkAllComplete()}}else stopChTimer()},8000)}
function getMedal(ts){let cl=100,sl=200,gl=400;if(ch.V){cl+=30;sl+=30;gl+=30}if(ts>=gl)return{medal:'gold',name:'金牌'};if(ts>=sl)return{medal:'silver',name:'银牌'};if(ts>=cl)return{medal:'copper',name:'铜牌'};return{medal:'none',name:'无奖牌'}}
function showDiscussion(text){const cont=document.getElementById('discussionContainer');const tag=document.createElement('div');tag.className='discussion-tag';tag.textContent=text;const skOver=document.getElementById('shopOverlay');const skVis=skOver&&!skOver.classList.contains('hidden');if(skVis){tag.style.left=(5+Math.random()*18)+'%';tag.style.top=(15+Math.random()*55)+'%'}else{tag.style.left=(3+Math.random()*28)+'%';tag.style.top=(10+Math.random()*65)+'%'}cont.appendChild(tag);setTimeout(()=>tag.remove(),4000)}
function getInferenceK(lv){return 3}
function getInferenceBaseReq(node,map){
  if(map.inferReqs.has(node.id)) return map.inferReqs.get(node.id);
  const correctNode=map.correctResult;
  const trueDepth=correctNode?correctNode.depth:0;
  const nowDepth=node.depth!=null?node.depth:0;
  let base;
  const lv=level;
  if(lv<=4) base=Infinity;
  else if(lv<=7) base=6;
  else if(lv<=10) base=8;
  else if(lv<=12) base=10;
  else base=12;
  if(base===Infinity){map.inferReqs.set(node.id,Infinity);return Infinity}
  const k=getInferenceK(lv);
  const req=base+Math.abs(trueDepth-nowDepth)*k+rI(-6,2);
  map.inferReqs.set(node.id,req);
  return req;
}
function applyTimeToSp(){if(!shop.timeToSp||ch.fun_I||ch.fun_II)return 0;const bonus=Math.floor(remTime/4);if(bonus>0){sp+=bonus;timeToSpBonusPending+=bonus;syncAllSp()}return bonus}
function getFoodCost(key){const base={shriek:1,snickers:2,coffee:4};let cost=base[key]||0;if(level>=4)cost*=2;return cost}
function forceResetSettling(){if(settling){settling=!1;if(settlingTimeout){clearTimeout(settlingTimeout);settlingTimeout=null}}}
// A level's 用时 is wall-clock from the moment its maps were generated to the
// moment it settled; the shop in between belongs to no level. Clamped to the
// same ceiling the server enforces, so a laptop left asleep mid-contest costs
// the player an accurate time rather than the whole level record.
const MAX_LEVEL_DURATION_MS=6*60*60*1000;
function levelElapsedMs(){if(!gameStartTime)return 0;return Math.min(MAX_LEVEL_DURATION_MS,Math.max(0,Date.now()-gameStartTime))}
function recordScore(){
  if(!currentRunId||scoreRecordedForLevel===level)return;
  const histEntry=levelHistory.find(e=>e.level===level);
  const durationMs=levelElapsedMs();
  // Stamped onto the local history too, so the end-of-run table and the board
  // are reading the same number rather than two independent measurements.
  if(histEntry)histEntry.durationMs=durationMs;
  scoreRecordedForLevel=level;
  api('/run/level',{runId:currentRunId,level,matchName:histEntry?histEntry.name:'',matchScore:histEntry?histEntry.totalScore:0,passed:histEntry?!!histEntry.passed:!1,sim:histEntry?!!histEntry.sim:!1,totalScore:totalHistScore,durationMs})
    .then(()=>refreshLeaderboard())
    .catch(()=>{scoreRecordedForLevel=null});
}
function getChallengeScoreBonus(){let bonus=0;['I','II','III','IV','V','VI','VII','VIII','IX','X'].forEach(k=>{ if(ch[k]) bonus+=0.1; });if(ch.assist_I) bonus+=0.1;if(ch.fun_I) bonus+=0.1;if(ch.fun_II) bonus+=0.1;['I_exp','II_exp','III_exp'].forEach(k=>{ if(ch[k]) bonus+=0.2; });return bonus;}
function getScoreMultiplier(isSim){let base = isSim?1:3;let mult = base + getChallengeScoreBonus();if(easyMode) mult *= 0.5;return mult;}
function checkAllComplete(){if(settling)return;if(!maps.every(m=>m.gameOver))return;settling=!0;if(settlingTimeout){clearTimeout(settlingTimeout)}settlingTimeout=setTimeout(()=>{forceResetSettling()},8000);stopChTimer();let ts=maps.reduce((s,m)=>s+m.maxResultScore,0);const cfg=cfgL(level);const isNOI=level===10,isIOI=level===13,isCTT=level===11,isCTS=level===12;
if(ch.fun_I){const lvMult=getLvMult();let acCount=0;maps.forEach(m=>{if(m.maxResultScore===100){acCount++;if(!m._funIRewardGiven){let earned=Math.floor(6*lvMult);if(ch.IX)earned=Math.floor(earned*0.75);sp+=earned;m._funIRewardGiven=!0;syncAllSp()}}});if(acCount>0){setGM('🎯AC骄傲！'+acCount+'道AC，技能点已结算','success')}}
if(isNOI||isIOI){const mi=getMedal(ts);
if(isNOI){if(mi.medal==='gold'){
totalHistScore += ts * getScoreMultiplier(false);
levelHistory.push({level,name:cfg.name,totalScore:ts,sim:!1,passed:!0,multiplier:getScoreMultiplier(false),easyMode:easyMode,medal:'gold'});
maybeAddTip(level);
if(ts===400)showDiscussion('这么强 TM 诗人啊');
const perfCnt=maps.filter(m=>m.maxResultScore===100).length;
let rewSp=0;
maps.forEach(m=>{Object.values(m.nodeMap).forEach(n=>{if(n.type==='skill'&&n.state==='correct')rewSp+=0.5+boostLevel})});
if(!ch.fun_I&&!ch.fun_II){let earned=Math.floor(ts/50+perfCnt*2+rewSp);let lvMult=getLvMult();earned=Math.floor(earned*lvMult);if(ch.IX)earned=Math.floor(earned*0.75);sp+=earned;spEarnedPending=earned;syncAllSp()}else{spEarnedPending=0}
applyTimeToSp();
if(ch.III){gm=Math.max(1,gm-1);setGM('🧠痴呆症：思维-1','warning')}
everGotNOIMedal=true; if(easyMode){ easyMode=false; saveEasySettings(); }
checkAchievements();
recordScore();
if(level>=0)showShopOverlay(()=>{forceResetSettling();pendingNext=!0;proceedNext()});
else{forceResetSettling();pendingNext=!0;proceedNext()}
return;
}else if(mi.medal==='silver'){
totalHistScore += ts * getScoreMultiplier(false);
levelHistory.push({level,name:cfg.name,totalScore:ts,sim:!1,passed:!0,multiplier:getScoreMultiplier(false),easyMode:easyMode,medal:'silver'});
maybeAddTip(level);
const perfCnt=maps.filter(m=>m.maxResultScore===100).length;
let rewSp=0;
maps.forEach(m=>{Object.values(m.nodeMap).forEach(n=>{if(n.type==='skill'&&n.state==='correct')rewSp+=0.5+boostLevel})});
if(!ch.fun_I&&!ch.fun_II){let earned=Math.floor(ts/50+perfCnt*2+rewSp);let lvMult=getLvMult();earned=Math.floor(earned*lvMult);if(ch.IX)earned=Math.floor(earned*0.75);sp+=earned;spEarnedPending=earned;syncAllSp()}else{spEarnedPending=0}
applyTimeToSp();
if(ch.III){gm=Math.max(1,gm-1);setGM('🧠痴呆症：思维-1','warning')}
everGotNOIMedal=true; if(easyMode){ easyMode=false; saveEasySettings(); }
checkAchievements();
recordScore();
forceResetSettling();
showFinal('🥈NOI银牌','至少，你的 OI 生涯已经圆满了');
return;
}else if(mi.medal==='copper'){
totalHistScore += ts * getScoreMultiplier(false);
levelHistory.push({level,name:cfg.name,totalScore:ts,sim:!1,passed:!0,multiplier:getScoreMultiplier(false),easyMode:easyMode,medal:'copper'});
maybeAddTip(level);
const perfCnt=maps.filter(m=>m.maxResultScore===100).length;
let rewSp=0;
maps.forEach(m=>{Object.values(m.nodeMap).forEach(n=>{if(n.type==='skill'&&n.state==='correct')rewSp+=0.5+boostLevel})});
if(!ch.fun_I&&!ch.fun_II){let earned=Math.floor(ts/50+perfCnt*2+rewSp);let lvMult=getLvMult();earned=Math.floor(earned*lvMult);if(ch.IX)earned=Math.floor(earned*0.75);sp+=earned;spEarnedPending=earned;syncAllSp()}else{spEarnedPending=0}
applyTimeToSp();
if(ch.III){gm=Math.max(1,gm-1);setGM('🧠痴呆症：思维-1','warning')}
checkAchievements();
recordScore();
forceResetSettling();
showFinal('🥉NOI铜牌','首银失败');
return;
}else{
totalHistScore+=0;
levelHistory.push({level,name:cfg.name,totalScore:ts,sim:!1,passed:!1,multiplier:getScoreMultiplier(false),easyMode:easyMode,medal:'none'});
checkAchievements();
recordScore();
forceResetSettling();
showFinal('❌NOI未获奖牌','首银失败');
return;
}}else if(isIOI){totalHistScore += ts * getScoreMultiplier(false);levelHistory.push({level,name:cfg.name,totalScore:ts,sim:!1,passed:!0,multiplier:getScoreMultiplier(false),easyMode:easyMode,medal:(ts>=600?'god':getMedal(ts).medal)});applyTimeToSp();checkAchievements();updateChallengeBtnHighlight();recordScore();forceResetSettling();if(ts>=600)showFinal('👑你是神！','IOI 历史上的传奇');else if(getMedal(ts).medal==='gold')showFinal('🥇IOI金牌！','人类 OI 的顶点');else if(getMedal(ts).medal==='silver')showFinal('🥈IOI银牌','展露风采');else if(getMedal(ts).medal==='copper')showFinal('🥉IOI铜牌','展露风采');else if(ts===0)showFinal('😅IOI0分','搞笑');else showFinal('IOI参赛','展露风采');return}}
if(isCTT||isCTS){let ps=cfg.pass;if(ch.V)ps+=30;let passed=ts>=ps;if(!passed&&shop.moneyPower&&!moneyPowerUsed){moneyPowerUsed=!0;ts=ps;passed=!0;setGM('💰钞能力触发！满分通过','warning')}if(!passed){totalHistScore+=0;levelHistory.push({level,name:cfg.name,totalScore:ts,sim:!1,passed:!1,multiplier:getScoreMultiplier(false),easyMode:easyMode});checkAchievements();recordScore();forceResetSettling();showFinal('❌'+cfg.name+'未通过','国家队岂是那么容易的');return}else{maybeAddTip(level);const contrib=ts * getScoreMultiplier(false);totalHistScore+=contrib;const perfCnt=maps.filter(m=>m.maxResultScore===100).length;let rewSp=0;maps.forEach(m=>{Object.values(m.nodeMap).forEach(n=>{if(n.type==='skill'&&n.state==='correct')rewSp+=0.5+boostLevel})});if(!ch.fun_I&&!ch.fun_II){let earned=Math.floor(ts/50+perfCnt*2+rewSp);let lvMult=getLvMult();earned=Math.floor(earned*lvMult);if(ch.IX)earned=Math.floor(earned*0.75);sp+=earned;spEarnedPending=earned;syncAllSp()}else{spEarnedPending=0}applyTimeToSp();if(ch.III){gm=Math.max(1,gm-1);setGM('🧠痴呆症：思维-1','warning')}levelHistory.push({level,name:cfg.name,totalScore:ts,sim:!1,passed:!0,multiplier:getScoreMultiplier(false),easyMode:easyMode});checkAchievements();recordScore();if(level>=13){forceResetSettling();showFinal('🏆全部通关！','');}else{showDiscussion(level===11?'我去金勾爷':(level===12?'国家队大神啊，那不随便 AK IOI':''));pendingNext=!0;if(level>=0)showShopOverlay(()=>{forceResetSettling();proceedNext()});else{forceResetSettling();proceedNext()}}return}}
let ps=cfg.pass;if(ch.V)ps+=30;let passed=ts>=ps;
if(cfg.sim&&!passed){showDiscussion('我看 xxx 也是不行了');levelHistory.push({level,name:cfg.name,totalScore:ts,sim:!0,passed:!1,multiplier:getScoreMultiplier(true),easyMode:easyMode});checkAchievements();recordScore();forceResetSettling();pendingNext=!0;proceedNext();return}
if(!passed&&!cfg.sim&&shop.moneyPower&&!moneyPowerUsed){moneyPowerUsed=!0;ts=ps;passed=!0;setGM('💰钞能力触发！满分通过','warning')}const contrib=passed?ts*getScoreMultiplier(cfg.sim):0;
if(passed){maybeAddTip(level);totalHistScore+=contrib;const perfCnt=maps.filter(m=>m.maxResultScore===100).length;let rewSp=0;maps.forEach(m=>{Object.values(m.nodeMap).forEach(n=>{if(n.type==='skill'&&n.state==='correct')rewSp+=0.5+boostLevel})});if(!ch.fun_I&&!ch.fun_II){let earned=Math.floor(ts/50+perfCnt*2+rewSp);let lvMult=getLvMult();earned=Math.floor(earned*lvMult);if(ch.IX)earned=Math.floor(earned*0.75);sp+=earned;spEarnedPending=earned;syncAllSp()}else{spEarnedPending=0}applyTimeToSp();if(!cfg.sim){if(ch.III){gm=Math.max(1,gm-1);setGM('🧠痴呆症：思维-1','warning')}}if(cfg.sim&&ts===maps.length*100)showDiscussion('这么强？！');if(!cfg.sim&&ts===maps.length*100)showDiscussion('这么强 TM 诗人啊');if(!cfg.sim){if(level===1)showDiscussion('一发过啊，NB');else if(level===4)showDiscussion('膜拜蓝勾爷');else if(level===7)showDiscussion('这就是传说中的神犇？！');}}
levelHistory.push({level,name:cfg.name,totalScore:ts,sim:cfg.sim,passed,multiplier:getScoreMultiplier(cfg.sim),easyMode:easyMode});
checkAchievements();
recordScore();
if(!passed){if(level===1)showFinal('❌竞赛结束','你的 OI 生涯还没开始就结束了');else if(level===4)showFinal('❌竞赛结束','CSP-S1 是多少人梦寐以求的呢');else if(level===7)showFinal('❌竞赛结束','NOIP 已经是普通人所能触碰到的最高的了');else showFinal('❌竞赛结束','未通过'+cfg.name);return}
if(level>=13){forceResetSettling();showFinal('🏆全部通关！','');}else{pendingNext=!0;if(level>=0)showShopOverlay(()=>{forceResetSettling();proceedNext()});else{forceResetSettling();proceedNext()}}}
function refreshUI(){const map=getActive();if(!map)return;const validStamina=isNaN(remStamina)?0:remStamina;const validTime=isNaN(remTime)?0:remTime;
if(!map.gameOver&&(validStamina<=0||validTime<=0)){maps.forEach(m=>{if(!m.gameOver){if(m.correctResult&&m.correctResult.state==='correct')endMapGame(m,'win');else endMapGame(m,'lose')}});checkAllComplete();}
const tnEl=document.getElementById('timeNumber'),srEl=document.getElementById('staminaRef'),sdEl=document.getElementById('staminaDisplay');const prevTime=parseInt(tnEl.textContent)||0;const prevStam=parseInt(sdEl.textContent)||0;if(prevTime!==validTime){tnEl.textContent=obf(validTime);tnEl.classList.add('tick');setTimeout(()=>tnEl.classList.remove('tick'),200)}else tnEl.textContent=obf(validTime);srEl.textContent=obf(maxStaminaActual);if(prevStam!==validStamina){sdEl.textContent=obf(validStamina);sdEl.classList.add('tick');setTimeout(()=>sdEl.classList.remove('tick'),200)}else sdEl.textContent=obf(validStamina);const timeCap=shop.timeMaster?Math.floor((maxStamina+timeBonus+activeFoodTimeBonus)*1.2):(maxStamina+timeBonus+activeFoodTimeBonus);const tR=validTime/Math.max(1,timeCap);let sR=validStamina/Math.max(1,maxStaminaActual);if(validStamina>timeCap)sR=1;document.getElementById('timeBarInner').style.width=(tR*100)+'%';document.getElementById('staminaBar').style.width=(sR*100)+'%';if(validStamina<validTime){document.getElementById('staminaBar').style.background='var(--tf)';document.getElementById('timeBarInner').style.background='var(--sf)';document.getElementById('staminaBar').classList.add('danger');document.getElementById('timeBarInner').classList.remove('danger')}else if(validTime<validStamina){document.getElementById('staminaBar').style.background='var(--sf)';document.getElementById('timeBarInner').style.background='var(--tf)';document.getElementById('staminaBar').classList.remove('danger');document.getElementById('timeBarInner').classList.add('danger')}else{document.getElementById('staminaBar').style.background='var(--sf)';document.getElementById('timeBarInner').style.background='var(--tf)';document.getElementById('staminaBar').classList.remove('danger');document.getElementById('timeBarInner').classList.remove('danger')}document.getElementById('timeNumber').classList.toggle('danger',validTime<=Math.max(2,Math.floor(timeCap*0.15))&&!map.gameOver);document.getElementById('unlockedCount').textContent=map.totalUnlocked;document.getElementById('mapIndexDisplay').textContent=activeMapIdx+1;document.getElementById('totalMapsDisplay').textContent=maps.length;document.getElementById('maxScoreDisplay').textContent=map.maxResultScore>0?map.maxResultScore:'-';document.getElementById('correctFoundHint').style.display=isCorrectFound(map)&&!map.gameOver?'inline-block':'none';updateScoreProg();updateMapBtns();updateMapSelectorBtns();updateCompBtn();drawTree(map);updateActBar();syncAllSp();updateSidePanel();updateFocusBtnDisplay();checkAchievements()}
function updateFocusBtnDisplay(){const btn=document.getElementById('btnFocusSide');const stText=document.getElementById('focusStatusText');const hasFocusAccess=shop.focus||(ch.assist_I&&level>=4);if(!btn)return;if(hasFocusAccess&&level>=4){btn.style.display='';btn.classList.remove('locked');btn.classList.add('has-cost');btn.dataset.cost='2';btn.title='聚焦 (消耗1时间2精力，思维临时+1)';btn.style.cursor='pointer';if(stText)stText.style.display='none'}else{btn.style.display='none';if(stText){stText.style.display='';stText.textContent= level<4 ? 'NOIP后解锁' : '未解锁(商店5sp)'}}}
function updateCompBtn(){const map=getActive(),btn=document.getElementById('btnCompleteMap');if(!btn)return;if(!map||map.gameOver){btn.disabled=!0;btn.textContent=map?.gameResult==='win'?'✅已完成':(map?.gameResult==='lose'?'❌已结束':'🔒完成探索')}else if(isCorrectFound(map)){btn.disabled=!1;btn.textContent='✅提交此题'}else{btn.disabled=!0;btn.textContent='🔍先找到正确结果'}}
function updateMapBtns(){document.querySelectorAll('.map-btn').forEach(b=>{const i=+b.dataset.index,m=maps[i];if(!m)return;b.classList.remove('active','win','lose','correct-found');if(i===activeMapIdx)b.classList.add('active');if(m.gameOver&&m.gameResult==='win')b.classList.add('win');else if(m.gameOver&&m.gameResult==='lose')b.classList.add('lose');else if(!m.gameOver&&isCorrectFound(m))b.classList.add('correct-found');let ic='⏳';if(m.gameOver)ic=m.gameResult==='win'?'✅':'❌';else if(isCorrectFound(m))ic='🔍';b.innerHTML=ic+' 第'+cnNum(i+1)+'题 <small>(解锁'+m.totalUnlocked+(m.gameOver?'·'+m.maxResultScore+'分':'')+')</small>'})}
function cnNum(n){const arr=['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六'];return arr[n-1]||n;}
function updateMapSelectorBtns(){const sel=document.getElementById('mapSelector');if(sel.children.length!==maps.length+1){sel.innerHTML='';for(let i=0;i<maps.length;i++){const b=document.createElement('button');b.className='map-btn';b.dataset.index=i;b.textContent='⏳第'+cnNum(i+1)+'题';sel.appendChild(b)}const cb=document.createElement('button');cb.className='btn-complete-map';cb.id='btnCompleteMap';cb.textContent='🔒完成探索';cb.disabled=!0;cb.addEventListener('click',()=>{const m=getActive();if(m&&!m.gameOver&&isCorrectFound(m))completeMapManually(m)});sel.appendChild(cb)}updateMapBtns();updateCompBtn()}
function drawTree(map){ctx.clearRect(0,0,LW,LH);ctx.fillStyle='#fcfcfc';ctx.fillRect(0,0,LW,LH);const vis=Object.values(map.nodeMap).filter(n=>{if(inferMode)return n.state==='unlocked'||n.state==='correct'||n.state==='incorrect'||n.state==='visible_locked';return n.state!=='hidden'});vis.forEach(n=>n.children.forEach(c=>{if(vis.includes(c))drawEdge(n,c)}));vis.forEach(n=>drawNode(n,map));if(map.gameOver&&map.gameResult==='lose'){Object.values(map.nodeMap).filter(n=>n.isCorrect&&n.state!=='hidden').forEach(n=>{ctx.save();ctx.strokeStyle='rgba(80,80,80,0.7)';ctx.lineWidth=3;ctx.setLineDash([5,3]);ctx.beginPath();ctx.arc(n.x,n.y,(n.type==='important'?22:20)+6,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore()})}}
function drawEdge(p,c){let col='#999';if(p.state==='correct'&&c.state==='correct')col='#555';else if(p.state==='incorrect'||c.state==='incorrect')col='#bbb';ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(c.x,c.y);ctx.stroke()}
function drawNode(node,map){let cx=node.x,cy=node.y;const baseR=node.type==='important'?22:20;let r=baseR;const anim=nodeAnimations[node.id];if(anim&&anim.type==='unlock'){const elapsed=performance.now()-anim.start;const p=Math.min(1,elapsed/anim.dur);if(p<1){const scale=1+0.35*Math.sin(p*Math.PI);r=baseR*scale}else{delete nodeAnimations[node.id]}}const effMind=getEffMind();const baseInferReq=getInferenceBaseReq(node,map);const infRequired=baseInferReq;let fill,stroke,tc,alpha=1;const isGrayInfer=inferMode&&node.state==='unlocked'&&effMind<infRequired;switch(node.state){case'visible_locked':fill=node.type==='process'?'#d5d5d5':(node.type==='important'?'#888':'#999');stroke='#b0b0b0';tc=node.type==='important'?'#fff':'#444';break;case'unlocked':if(isGrayInfer){fill='#c8c8c8';stroke='#a0a0a0';tc='#888';alpha=0.45}else{fill='#3a3a3a';stroke='#1a1a1a';tc='#fff'}break;case'correct':fill='#3a3a3a';stroke='#1a1a1a';tc='#fff';break;case'incorrect':fill='#fff';stroke='#999';tc='#555';break;default:return}if(node.upgradeType&&(node.state==='unlocked'||node.state==='correct'||node.state==='incorrect'||node.state==='visible_locked')){ctx.save();ctx.globalAlpha=alpha;let ugCol='#f90';if(node.upgradeType==='time')ugCol='#5b9bd5';else if(node.upgradeType==='mind')ugCol='#e8943a';else if(node.upgradeType==='boost')ugCol='#9b59b6';else if(node.upgradeType==='inspire')ugCol='#d4a017';ctx.strokeStyle=ugCol;ctx.lineWidth=3;ctx.setLineDash([3,2]);const ur=r+7;ctx.beginPath();ctx.arc(cx,cy,ur,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore()}const ir=map.inferResults.get(node.id);if(ir&&node.state==='unlocked'&&!isGrayInfer){if(ir.containsCorrect){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#f90';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();if(node.type==='result'){const hs=r*0.85;ctx.rect(cx-hs-4,cy-hs-4,(hs+4)*2,(hs+4)*2)}else if(node.type==='skill'){ctx.moveTo(cx,cy-r-4);ctx.lineTo(cx+r+4,cy);ctx.lineTo(cx,cy+r+4);ctx.lineTo(cx-r-4,cy);ctx.closePath()}else{ctx.arc(cx,cy,r+4,0,Math.PI*2)}ctx.stroke();ctx.setLineDash([]);ctx.restore()}if(ir.maxScoreZero){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#d00';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-r,cy-r);ctx.lineTo(cx+r,cy+r);ctx.moveTo(cx+r,cy-r);ctx.lineTo(cx-r,cy+r);ctx.stroke();ctx.restore()}if(ir.hasSkillNode){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#3399ff';ctx.strokeStyle='#1a5276';ctx.lineWidth=1.5;ctx.beginPath();const d=6;ctx.moveTo(cx+r+4,cy+r+4);ctx.lineTo(cx+r+4+d,cy+r+4);ctx.lineTo(cx+r+4,cy+r+4+d);ctx.lineTo(cx+r+4-d,cy+r+4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}if(ir.highReq&&!node._shake){node._shake=!0;startShake()}if(ir.upgradeStocks&&ir.upgradeStocks.length>0){ctx.save();ctx.globalAlpha=alpha;ctx.font='bold 11px sans-serif';ctx.textAlign='center';let ugy=cy+r+18;ir.upgradeStocks.forEach(ut=>{let uicon='';if(ut==='time')uicon='⏰';else if(ut==='mind')uicon='🧠';else if(ut==='boost')uicon='💠';else if(ut==='inspire')uicon='⚡';ctx.fillText(uicon,cx,ugy);ugy+=14});ctx.restore()}}ctx.save();ctx.globalAlpha=alpha;if(node.type==='skill'){stroke=node.state==='incorrect'?'#999':(node.state==='correct'?'#1a1a1a':(isGrayInfer?'#a0a0a0':'#aaa'));ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=2.5;if(node.state==='incorrect')ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r,cy);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);node._b={x:cx-r,y:cy-r,w:r*2,h:r*2}}else if(node.type==='result'){const hs=r*0.85;ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=2.5;if(node.state==='incorrect')ctx.setLineDash([5,3]);ctx.beginPath();ctx.rect(cx-hs,cy-hs,hs*2,hs*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);node._b={x:cx-hs,y:cy-hs,w:hs*2,h:hs*2}}else{ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=2.5;if(node.state==='incorrect')ctx.setLineDash([5,3]);ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);node._b=null}if(node.state==='incorrect'&&node._b){const rng=seedR(node.id.split('').reduce((h,c)=>h*31+c.charCodeAt(0),0));for(let i=0;i<3;i++){const ang=rng()*Math.PI*2,len=(node.type==='result'?r*0.85:r)*(0.65+rng()*0.5),sx=cx+Math.cos(ang)*len*0.3,sy=cy+Math.sin(ang)*len*0.3,ex=cx+Math.cos(ang)*len,ey=cy+Math.sin(ang)*len;ctx.strokeStyle='#aaa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();const pa=ang+Math.PI/2,bl=len*0.25,mx=(sx+ex)/2,my=(sy+ey)/2;ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+Math.cos(pa)*bl,my+Math.sin(pa)*bl);ctx.stroke()}}if(node.state==='correct'){const bs=(node.type==='result'?r*0.85:r)+7;ctx.strokeStyle='#bbb';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.rect(cx-bs,cy-bs,bs*2,bs*2);ctx.stroke();ctx.setLineDash([])}if(node.state==='unlocked'){const showRing=node.type==='important'||node.type==='result'||node.type==='skill';if(showRing&&!map.gameOver&&!isGrayInfer){const rr=(node.type==='result'?r*0.85:r)+5;ctx.strokeStyle='#333';ctx.lineWidth=2.8;ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);ctx.stroke();node._cb={x:cx-rr-3,y:cy-rr-3,w:(rr+3)*2,h:(rr+3)*2}}else node._cb=null}else node._cb=null;if(node.state==='visible_locked'&&!map.gameOver){const rr=(node.type==='result'?r*0.85:r)+5;node._cb={x:cx-rr-3,y:cy-rr-3,w:(rr+3)*2,h:(rr+3)*2}}if(inferMode&&node.state==='unlocked'&&!isGrayInfer&&shop.sharpIntuition){const maxSub=getMaxSub(node);if(maxSub>0){ctx.fillStyle='#f90';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('max:'+maxSub,cx,cy-r-15)}}if(inferMode&&node.state==='unlocked'){ctx.fillStyle=isGrayInfer?'#999':'#f90';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('🧠≥'+baseInferReq,cx,cy-r-20)}if(ir&&!inferMode&&node.state==='unlocked'){ctx.save();ctx.fillStyle='#f90';ctx.font='bold 8px sans-serif';ctx.textAlign='center';let tag='';if(ir.containsCorrect)tag+='✓';if(ir.maxScoreZero)tag+='✗';if(ir.highReq)tag+='⚠';if(tag)ctx.fillText(tag,cx,cy+r+24);ctx.restore()}if(node.state==='incorrect'){const sc=getMaxSub(node);ctx.fillStyle='#888';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(sc,cx,cy)}else{ctx.fillStyle=tc;ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(node.name,cx,cy);if((node.type==='result'||node.type==='skill')&&node.score!==null&&(node.state==='unlocked'||node.state==='correct')){ctx.font='bold 9px sans-serif';ctx.fillText(ch.fun_I?0:node.score,cx,cy+12)}}const stCost=staminaCost(node);ctx.fillStyle=stCost<=1?'#aaa':(stCost<=3?'#777':(stCost===4?'#444':'#222'));ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(stCost,cx,cy-r-3);ctx.fillStyle=(node.state==='correct'||node.state==='unlocked')?'#555':'#888';ctx.font='9px sans-serif';ctx.fillText('需≥'+node.req,cx,cy+r+12);ctx.restore()}
function hitTest(pos,map){const vis=Object.values(map.nodeMap).filter(n=>inferMode?(n.state==='unlocked'||n.state==='correct'||n.state==='incorrect'||n.state==='visible_locked'):n.state!=='hidden');if(inferMode){for(const n of vis){if(n.state==='visible_locked'){let inRange=!1;if(n._cb&&pos.x>=n._cb.x&&pos.x<=n._cb.x+n._cb.w&&pos.y>=n._cb.y&&pos.y<=n._cb.y+n._cb.h)inRange=!0;else if(n._b&&pos.x>=n._b.x&&pos.x<=n._b.x+n._b.w&&pos.y>=n._b.y&&pos.y<=n._b.y+n._b.h)inRange=!0;else{const r=(n.type==='important'?22:20)+3;inRange=Math.hypot(pos.x-n.x,pos.y-n.y)<=r}if(inRange&&canUnlock(n,map))return{node:n,target:'node'}}if(n.state==='unlocked'){const baseReq=getInferenceBaseReq(n,map);if(getEffMind()<baseReq)continue;let inRange=!1;if(n._cb&&pos.x>=n._cb.x&&pos.x<=n._cb.x+n._cb.w&&pos.y>=n._cb.y&&pos.y<=n._cb.y+n._cb.h)inRange=!0;else if(n._b&&pos.x>=n._b.x&&pos.x<=n._b.x+n._b.w&&pos.y>=n._b.y&&pos.y<=n._b.y+n._b.h)inRange=!0;else{const r=(n.type==='important'?22:20)+3;inRange=Math.hypot(pos.x-n.x,pos.y-n.y)<=r}if(inRange)return{node:n,target:'infer'}}}return null}for(const n of vis){if(n._cb&&pos.x>=n._cb.x&&pos.x<=n._cb.x+n._cb.w&&pos.y>=n._cb.y&&pos.y<=n._cb.y+n._cb.h){if(n.state==='unlocked'&&canCheck(n,map))return{node:n,target:'check'};if(n.state==='visible_locked'&&canUnlock(n,map))return{node:n,target:'node'};return null}}for(const n of vis){if(n._b){if(pos.x>=n._b.x&&pos.x<=n._b.x+n._b.w&&pos.y>=n._b.y&&pos.y<=n._b.y+n._b.h){if(n.state==='unlocked'&&canCheck(n,map))return{node:n,target:'check'};if(n.state==='visible_locked'&&canUnlock(n,map))return{node:n,target:'node'};return null}}else{const r=(n.type==='important'?22:20)+3;if(Math.hypot(pos.x-n.x,pos.y-n.y)<=r){if(n.state==='unlocked'&&canCheck(n,map))return{node:n,target:'check'};if(n.state==='visible_locked'&&canUnlock(n,map))return{node:n,target:'node'};return null}}}return null}
canvas.addEventListener('click',e=>{if(!gameStarted)return;const map=getActive();if(!map||map.gameOver)return;const rect=canvas.getBoundingClientRect();const pos={x:(e.clientX-rect.left)*(LW/canvas.clientWidth),y:(e.clientY-rect.top)*(LH/canvas.clientHeight)};const hit=hitTest(pos,map);if(!hit)return;if(inferMode){if(hit.target==='node'){unlockNode(hit.node,map)}else if(hit.target==='infer'){if(!shop.inference&&!(ch.assist_I&&level>=4)){setGM('🔒推理功能需在商店购买解锁(5技能点)','warning');return}performInference(hit.node,map)}}else{if(hit.target==='check')performCheck(hit.node,map);else if(hit.target==='node')unlockNode(hit.node,map)}});
canvas.addEventListener('mousemove',e=>{if(!gameStarted){canvas.style.cursor='default';return}const map=getActive();if(!map||map.gameOver){canvas.style.cursor='default';return}const rect=canvas.getBoundingClientRect();const hit=hitTest({x:(e.clientX-rect.left)*(LW/canvas.clientWidth),y:(e.clientY-rect.top)*(LH/canvas.clientHeight)},map);canvas.style.cursor=hit?'pointer':'default'});
function performInference(node,map){if(isNaN(remStamina)||isNaN(remTime)){remStamina=isNaN(remStamina)?0:remStamina;remTime=isNaN(remTime)?0:remTime;refreshUI();return}const effMind=getEffMind();const baseReq=getInferenceBaseReq(node,map);if(effMind<baseReq){setGM('思维不足，无法推理(需≥'+baseReq+')','warning');return}const k=getInferenceK(level);const cost=Math.max(1,baseReq+k-effMind);if(remStamina<cost){setGM('精力不足(需'+cost+')','warning');return}remStamina-=cost;if(remTime<=0||remStamina<=0){endAllMapsDueToResourceDepletion();return}const res={containsCorrect:!1,maxScoreZero:!1,highReq:!1,hasSkillNode:!1,upgradeStocks:[]};function hasCorrect(n){if(n===map.correctResult)return!0;for(const c of n.children)if(hasCorrect(c))return!0;return!1}res.containsCorrect=hasCorrect(node);const maxSub=getMaxSub(node);res.maxScoreZero=maxSub===0;function checkHighReq(n,depth){if(depth>3)return;if(n.req-effMind>=3){res.highReq=!0;return}for(const c of n.children)checkHighReq(c,depth+1)}checkHighReq(node,0);function hasSkill(n){if(n.type==='skill')return!0;for(const c of n.children)if(hasSkill(c))return!0;return!1}res.hasSkillNode=hasSkill(node);if(shop.convenience){const foundTypes=new Set();function findUpgrades(n,depth){if(depth>5)return;if(n.upgradeType)foundTypes.add(n.upgradeType);for(const c of n.children)findUpgrades(c,depth+1)}findUpgrades(node,0);res.upgradeStocks=[...foundTypes]}map.inferResults.set(node.id,res);refreshUI()}
document.getElementById('mapSelector').addEventListener('click',e=>{const btn=e.target.closest('.map-btn');if(!btn)return;const idx=+btn.dataset.index;if(!isNaN(idx)&&idx<maps.length){activeMapIdx=idx;if(focusStacks&&focusMapIdx!==activeMapIdx){focusStacks=0;focusMapIdx=-1}refreshUI()}});
document.getElementById('btnModalRestart').addEventListener('click',()=>{document.getElementById('gameOverOverlay').classList.add('hidden');easyMode=true;hasPlayedBefore=false;everGotNOIMedal=false;easyModeAutoSet=false;saveEasySettings();showStartScreen(()=>initGame())});
document.getElementById('btnTutorial').addEventListener('click',()=>{window.open('tutorial.html','_blank')});
function showStartScreen(cb){document.getElementById('nameInputOverlay').classList.remove('hidden');document.getElementById('challengeOverlay').classList.add('hidden');syncChUI();syncEasyUI();updateChallengeBtnHighlight();window._startGameCallback=cb;document.getElementById('btnConfirmName').onclick=()=>startNewRun();}
// A run gets its id from the server before the first map is drawn, so every
// score recorded later has somewhere to go.
function startNewRun(){
  const btn=document.getElementById('btnConfirmName');
  btn.disabled=!0;
  api('/run/start',{easyMode,challenges:ch}).then(r=>{
    currentRunId=r.runId;
    scoreRecordedForLevel=null;
    document.getElementById('nameInputOverlay').classList.add('hidden');
    if(window._startGameCallback)window._startGameCallback();
  }).catch(e=>{
    setGM('无法开始对局：'+e.message,'warning');
    if(e.message==='未登录')showAuthOverlay();
  }).then(()=>{btn.disabled=!1});
}
// --- login / register ---------------------------------------------------
let authMode='login';
function showAuthOverlay(){document.getElementById('nameInputOverlay').classList.add('hidden');document.getElementById('authOverlay').classList.remove('hidden');document.getElementById('authUsername').focus()}
function syncAuthUI(){
  document.getElementById('btnAuthSubmit').textContent=authMode==='login'?'登录':'注册并开始';
  document.getElementById('btnAuthToggle').textContent=authMode==='login'?'没有账号？注册一个':'已有账号？去登录';
  document.getElementById('authPassword').setAttribute('autocomplete',authMode==='login'?'current-password':'new-password');
  document.getElementById('authError').textContent='';
}
function onSignedIn(me){
  playerName=me.username;
  applySettings(me.settings);
  achievementData=me.achievements;
  document.getElementById('authUserName').textContent=me.username;
  document.getElementById('authOverlay').classList.add('hidden');
  updateAchievementDisplay();
  syncEasyUI();
  updateChallengeBtnHighlight();
  refreshLeaderboard();
  showStartScreen(()=>initGame());
}
document.getElementById('btnAuthToggle').addEventListener('click',()=>{authMode=authMode==='login'?'register':'login';syncAuthUI()});
document.getElementById('btnAuthSubmit').addEventListener('click',()=>{
  const btn=document.getElementById('btnAuthSubmit');
  const err=document.getElementById('authError');
  const username=document.getElementById('authUsername').value.trim();
  const password=document.getElementById('authPassword').value;
  if(!username){err.textContent='请输入用户名';return}
  if(!password){err.textContent='请输入密码';return}
  btn.disabled=!0;err.textContent='';
  api('/'+(authMode==='login'?'login':'register'),{username,password})
    .then(me=>{document.getElementById('authPassword').value='';onSignedIn(me)})
    .catch(e=>{err.textContent=e.message})
    .then(()=>{btn.disabled=!1});
});
document.getElementById('authPassword').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btnAuthSubmit').click()});
document.getElementById('authUsername').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('authPassword').focus()});
document.getElementById('btnLogout').addEventListener('click',()=>{
  api('/logout',{}).catch(()=>{}).then(()=>{location.reload()});
});
document.getElementById('btnOpenChallenge').addEventListener('click',()=>{syncChUI();document.getElementById('challengeOverlay').classList.remove('hidden')});
document.getElementById('btnConfirmChallenge').addEventListener('click',()=>{updateExp();syncChUI();document.getElementById('challengeOverlay').classList.add('hidden')});
initChClicks();
document.getElementById('tipIIexp').addEventListener('click',e=>{e.stopPropagation();window._showTip(e,'分数公式: max( maxS - (max(depthDiff,0)+LCADistance)*k ), k=15')});
document.getElementById('tipIIIexp').addEventListener('click',e=>{e.stopPropagation();window._showTip(e,'思维需求计算范围扩大，深度影响更大')});
document.addEventListener('click',e=>{const pop=document.getElementById('challengeTipPopup');if(pop&&pop.classList.contains('show')&&!e.target.closest('.challenge-info-tip')){pop.classList.remove('show')}});
function _nidGen(map){let maxN=0;Object.keys(map.nodeMap).forEach(k=>{const match=k.match(/^N(\d+)$/);if(match){const num=parseInt(match[1]);if(num>=maxN)maxN=num+1}});let c=maxN;return function(){while(map.nodeMap['N'+c])c++;return'N'+(c++)}}
function _addUpgradeNodeToMap(map,upgradeType){const nm=map.nodeMap;const nidGen=_nidGen(map);const procNodes=Object.values(nm).filter(n=>n.type==='process'&&n.children.length<3&&n!==map.correctResult&&!n.isCorrect);if(procNodes.length>0){const parent=procNodes[rI(0,procNodes.length-1)];const nodeId=nidGen();const newResult={id:nodeId,name:nodeId,type:'result',isCorrect:!1,children:[],parent:parent,depth:parent.depth+1,req:randomReq(parent.depth+1),score:rI(1,getMaxS(level)),state:'hidden',x:0,y:0,isFork:!1,_b:null,_cb:null,upgradeType:upgradeType};parent.children.push(newResult);nm[newResult.id]=newResult;return newResult}const root=map.root;const nodeId=nidGen();const newResult={id:nodeId,name:nodeId,type:'result',isCorrect:!1,children:[],parent:root,depth:1,req:randomReq(1),score:rI(1,getMaxS(level)),state:'hidden',x:0,y:0,isFork:!1,_b:null,_cb:null,upgradeType:upgradeType};root.children.push(newResult);nm[newResult.id]=newResult;return newResult}
function initGame(){settling=!1;gameStarted=!1;level=0;gm=4;totalHistScore=0;levelHistory=[];pendingNext=!1;sp=0;timeStock=0;mindStock=0;boostStock=0;inspireStock=0;timeBonus=0;mindBonus=0;boostLevel=0;inspireCount=0;moneyPowerUsed=!1;focusStacks=0;focusMapIdx=-1;inferMode=!1;nodeAnimations={};spEarnedPending=0;timeToSpBonusPending=0;initialTotalTime=0;pendingFoodEffects=[];activeFoodTimeBonus=0;activeFoodMindBonus=0;shop={timeToSp:!1,timeMaster:!1,sharpIntuition:!1,focus:!1,inference:!1,convenience:!1,moneyPower:!1};tipsAdded.clear();const tp=document.getElementById('shopTipsPanel');if(tp)tp.innerHTML='';stopChTimer();forceResetSettling();updateExp();if(ch.III_exp)gm=Math.max(1,gm-1);syncAllSp();updateActBar();updateFocusBtnDisplay();updateSidePanel();updateSideStocks();document.getElementById('levelName').textContent=LV[0].name;setGM('');document.getElementById('gameOverOverlay').classList.add('hidden');document.getElementById('shopOverlay').classList.add('hidden');syncChUI();sessionAchievements.clear();updateSessionAchievements();startGame(0)}
function startGame(lv){timeStock=0;mindStock=0;boostStock=0;inspireStock=0;gameStarted=!0;moneyPowerUsed=!1;gameStartTime=Date.now();mapNonCorrectUnlockedCount=0;totalReachPassTime=null;if(ch.assist_I&&lv>=4){shop.focus=!0;shop.inference=!0}const cfg=cfgL(lv);let cfgStam=cfg.stam;const simpleStam=getSimpleStamina(lv);if(simpleStam!==null)cfgStam=simpleStam;maxStamina=cfgStam;maps=[];for(let i=0;i<cfg.maps;i++){let params=getMapGenParams(lv,i);if(ch.X){params.minD++;if(params.maxD!==999)params.maxD++}const md=createMap(params.minD,params.maxD,params.minN);computeLayout(md);maps.push(md)}const totalMaps=maps.length;const allRes=[];maps.forEach((md,mi)=>{Object.values(md.nodeMap).filter(n=>n.type==='result').forEach(r=>allRes.push({node:r,mapIdx:mi}))});const sel=shuf([...Array(allRes.length).keys()]).slice(0,totalMaps);const cnt={};sel.forEach(i=>{const{node,mapIdx}=allRes[i];if(!cnt[mapIdx])cnt[mapIdx]=0;if(cnt[mapIdx]<1&&node.type==='result'){node.type='skill';node.name='💎'+node.name;maps[mapIdx].hasSkillNode=!0;maps[mapIdx].skillNodeId=node.id;cnt[mapIdx]++}});
const cl=level;
let timePerMap=0,mindTotal=0,boostTotal=0,inspireTotal=0;
let timeMaxDepth=(cl<=1)?3:999;if(cl===4)timeMaxDepth=4;
let mindMaxDepth=(cl>=1&&cl<=6)?4:999;if(cl===4)mindMaxDepth=3;
if(cl<=1){timePerMap=1}else{timePerMap=0}
if(ch.I_exp&&timePerMap>0){timePerMap=Math.max(1,timePerMap-1)}
if(cl<=0){mindTotal=4}else if(cl>=1&&cl<=6){mindTotal=4}else{mindTotal=4}
if(cl<=1){boostTotal=4}else if(cl===4){boostTotal=2}else if(cl>=5){boostTotal=4}else{boostTotal=0}
if(cl<=1){inspireTotal=2}else if(cl===4){inspireTotal=3}else if(cl>=5){inspireTotal=4}else{inspireTotal=0}
const alreadyUpgraded=new Set();
function _getCandNodes(md,maxDepth){return Object.values(md.nodeMap).filter(n=>(n.type==='result'||n.type==='skill')&&n.type!=='skill'&&!n.upgradeType&&!alreadyUpgraded.has(n.id)&&n!==md.correctResult&&n.depth<=maxDepth)}
function _getCandNodesAny(md,maxDepth){return Object.values(md.nodeMap).filter(n=>(n.type==='result'||n.type==='skill')&&n.type!=='skill'&&!n.upgradeType&&!alreadyUpgraded.has(n.id)&&n.depth<=maxDepth)}
if(timePerMap>0){maps.forEach(md=>{for(let i=0;i<timePerMap;i++){let cand=_getCandNodes(md,timeMaxDepth);if(cand.length===0)cand=_getCandNodesAny(md,timeMaxDepth);if(cand.length===0){const nn=_addUpgradeNodeToMap(md,'time');alreadyUpgraded.add(nn.id)}else{const n=cand[rI(0,cand.length-1)];n.upgradeType='time';n.name='⏰'+n.name;alreadyUpgraded.add(n.id)}}})}else{let timeTotal=3;if(ch.I_exp)timeTotal=Math.max(1,timeTotal-1);const availMaps=shuf([...Array(totalMaps).keys()]).slice(0,Math.min(timeTotal,totalMaps));availMaps.forEach(mi=>{const md=maps[mi];let cand=_getCandNodes(md,timeMaxDepth);if(cand.length===0)cand=_getCandNodesAny(md,timeMaxDepth);if(cand.length===0){const nn=_addUpgradeNodeToMap(md,'time');alreadyUpgraded.add(nn.id)}else{const n=cand[rI(0,cand.length-1)];n.upgradeType='time';n.name='⏰'+n.name;alreadyUpgraded.add(n.id)}})}
if(mindTotal>0){const mindMapCounts={};maps.forEach((md,mi)=>{mindMapCounts[mi]=0});let placed=0;const pool=shuf([...Array(totalMaps).keys()]);for(const mi of pool){if(placed>=mindTotal)break;let cand=_getCandNodes(maps[mi],mindMaxDepth);if(cand.length===0)cand=_getCandNodesAny(maps[mi],mindMaxDepth);if(cand.length===0){const nn=_addUpgradeNodeToMap(maps[mi],'mind');alreadyUpgraded.add(nn.id);placed++}else{const n=cand[rI(0,cand.length-1)];n.upgradeType='mind';n.name='🧠'+n.name;alreadyUpgraded.add(n.id);placed++;mindMapCounts[mi]++}}}
if(boostTotal>0){const boostMaps=shuf([...Array(totalMaps).keys()]).slice(0,Math.min(boostTotal,totalMaps));boostMaps.forEach(mi=>{const md=maps[mi];let cand=_getCandNodes(md,999);if(cand.length===0)cand=_getCandNodesAny(md,999);if(cand.length===0){const nn=_addUpgradeNodeToMap(md,'boost');alreadyUpgraded.add(nn.id)}else{const n=cand[rI(0,cand.length-1)];n.upgradeType='boost';n.name='💠'+n.name;alreadyUpgraded.add(n.id)}})}
if(inspireTotal>0){const inspMaps=shuf([...Array(totalMaps).keys()]).slice(0,Math.min(inspireTotal,totalMaps));inspMaps.forEach(mi=>{const md=maps[mi];let cand=_getCandNodes(md,999);if(cand.length===0)cand=_getCandNodesAny(md,999);if(cand.length===0){const nn=_addUpgradeNodeToMap(md,'inspire');alreadyUpgraded.add(nn.id)}else{const n=cand[rI(0,cand.length-1)];n.upgradeType='inspire';n.name='⚡'+n.name;alreadyUpgraded.add(n.id)}})}
maps.forEach(md=>computeLayout(md));
let foodStaminaBonus=0;activeFoodTimeBonus=0;activeFoodMindBonus=0;
pendingFoodEffects.forEach(fx=>{foodStaminaBonus+=fx.stamina;activeFoodTimeBonus+=(fx.timeBonus||0);activeFoodMindBonus+=(fx.mindBonus||0)});
pendingFoodEffects=[];
let totalTime=maxStamina+timeBonus+activeFoodTimeBonus;if(shop.timeMaster)totalTime=Math.floor(totalTime*1.2);remTime=totalTime;initialTotalTime=totalTime;let staminaMult = easyMode ? 1.5 : (ch.II ? 1 : 1.2);maxStaminaActual=Math.floor(totalTime*staminaMult)+foodStaminaBonus;if(ch.II&&!easyMode)maxStaminaActual=Math.floor(totalTime);remStamina=maxStaminaActual;activeMapIdx=0;levelMindOffset=applyMindOffset(lv);
updateUI();updateMapSelectorBtns();refreshUI();updateSideStocks();document.getElementById('gameOverOverlay').classList.add('hidden');document.getElementById('shopOverlay').classList.add('hidden');startChTimer();checkAchievements()}
function updateUI(){document.getElementById('levelName').textContent=cfgL(level).name;document.getElementById('staminaDisplay').textContent=obf(maxStaminaActual)}
function updateScoreProg(){const ts=maps.reduce((s,m)=>s+(m.maxResultScore||0),0),mp=maps.length*100;const snEl=document.getElementById('scoreNumber');const prevTs=snEl._prevTs;if(prevTs!==undefined&&ts!==prevTs&&ts>prevTs){snEl.classList.add('tick');setTimeout(()=>snEl.classList.remove('tick'),200)}snEl._prevTs=ts;snEl.textContent=ts+'/'+mp;const newW=mp?Math.min(1,ts/mp)*100:0;document.getElementById('scoreBarInner').style.width=newW+'%';if(gameStartTime&&ts>=cfgL(level).pass+(ch.V?30:0)&&totalReachPassTime==null)totalReachPassTime=Date.now();checkAchievements()}
function proceedNext(){if(!pendingNext)return;pendingNext=!1;level++;if(level>13){showFinal('🏆全部通关！','');return}focusStacks=0;focusMapIdx=-1;inferMode=!1;document.getElementById('canvasWrapper').classList.remove('inference');nodeAnimations={};updateUI();syncAllSp();startGame(level)}
function updateEasyModeAfterGame(){hasPlayedBefore=true;if(everGotNOIMedal){easyMode=false;easyModeAutoSet=false}else{easyMode=true;easyModeAutoSet=true}saveEasySettings()}
function showFinal(tit,txt){updateEasyModeAfterGame();if(currentRunId){api('/run/finish',{runId:currentRunId}).catch(()=>{});currentRunId=null}gameStarted=!1;stopChTimer();forceResetSettling();document.getElementById('modalTitle').textContent=tit;document.getElementById('modalText').innerHTML=txt;const totalDur=levelHistory.reduce((s,e)=>s+(e.durationMs||0),0);document.getElementById('modalScoreSummary').innerHTML='<strong>加权总分：'+totalHistScore+'</strong><span class="modal-total-time">总用时：'+fmtDur(totalDur)+'</span>';document.getElementById('modalHistory').innerHTML=buildHist();document.getElementById('gameOverOverlay').classList.remove('hidden')}
function buildHist(){if(!levelHistory.length)return'';let h='<table class="history-table"><tr><th>级别</th><th>比赛</th><th>分数</th><th>系数</th><th>贡献</th><th>用时</th><th>结果</th></tr>';levelHistory.forEach(e=>{const mult=e.multiplier||(e.sim?1:3);h+=`<tr><td>${e.level}</td><td>${e.name}</td><td>${e.totalScore}</td><td>×${mult}</td><td>${e.totalScore*mult}</td><td>${fmtDur(e.durationMs)}</td><td class="${e.passed?'pass':'fail'}">${e.passed?'✅通过':'❌未通过'}</td></tr>`});h+='</table>';return h}
function updateSidePanel(){const mindEl=document.getElementById('sideMindValue');if(mindEl){const em=getEffMind();mindEl.textContent=obf(em)}const fbEl=document.getElementById('sideFocusBonus');if(fbEl){if(focusStacks>0){fbEl.textContent='+'+focusStacks;fbEl.style.display='inline-block'}else{fbEl.style.display='none'}}updateFocusBtnDisplay()}
function updateSideStocks(){document.getElementById('sideTimeStock').textContent=timeStock;document.getElementById('sideMindStock').textContent=mindStock;document.getElementById('sideBoostStock').textContent=boostStock;document.getElementById('sideInspireStock').textContent=inspireStock;const maxStock=Math.max(timeStock,mindStock,boostStock,inspireStock,1);document.getElementById('sideTimeStockBar').style.width=(timeStock/maxStock*100)+'%';document.getElementById('sideMindStockBar').style.width=(mindStock/maxStock*100)+'%';document.getElementById('sideBoostStockBar').style.width=(boostStock/maxStock*100)+'%';document.getElementById('sideInspireStockBar').style.width=(inspireStock/maxStock*100)+'%'}
function updateActBar(){const b=document.getElementById('activeSkillsBar');let p=[];if(inferMode)p.push('<span class="active-skill-tag" style="color:#f90">按R退出推理</span>');if(timeBonus)p.push('<span class="active-skill-tag">⏰+'+timeBonus+'</span>');if(mindBonus)p.push('<span class="active-skill-tag">🧠+'+mindBonus+'</span>');if(boostLevel)p.push('<span class="active-skill-tag">💠×'+(1+boostLevel)+'</span>');if(inspireCount)p.push('<span class="active-skill-tag">⚡×'+inspireCount+'</span>');if(shop.moneyPower)p.push('<span class="active-skill-tag">💰就绪</span>');if(activeFoodTimeBonus)p.push('<span class="active-skill-tag">🍫时间+'+activeFoodTimeBonus+'</span>');if(activeFoodMindBonus)p.push('<span class="active-skill-tag">☕思维+'+activeFoodMindBonus+'</span>');if(ch.assist_I&&level>=4)p.push('<span class="active-skill-tag" style="background:#d6e8f7;color:#2b5f8a;">🛠️辅助I生效</span>');if(easyMode)p.push('<span class="active-skill-tag" style="background:#e8f5e9;color:#2e7d32;">🌱简单模式</span>');b.innerHTML=p.join(' ')}
function updateShopPreview(){const nextMatchEl=document.getElementById('shopPreviewNextMatch');const personalEl=document.getElementById('shopPreviewPersonal');if(!nextMatchEl||!personalEl)return;let nextLv=level+1;if(nextLv>13){nextMatchEl.innerHTML='<span style="color:#888;">已是最终关卡</span>';}else{const ncfg=cfgL(nextLv);let nextBaseStam=ncfg.stam;const simpleStam=getSimpleStamina(nextLv);if(simpleStam!==null)nextBaseStam=simpleStam;let nextTime=nextBaseStam+timeBonus+activeFoodTimeBonus;if(shop.timeMaster)nextTime=Math.floor(nextTime*1.2);let nextStamina= (easyMode? Math.floor(nextTime*1.5) : (ch.II? Math.floor(nextTime): Math.floor(nextTime*1.2)));let foodStaminaBonus=0;pendingFoodEffects.forEach(fx=>{foodStaminaBonus+=fx.stamina});nextStamina+=foodStaminaBonus;nextMatchEl.innerHTML=`<div class="shop-preview-row"><span class="shop-preview-label">比赛名称</span><span class="shop-preview-value">${ncfg.name}</span></div><div class="shop-preview-row"><span class="shop-preview-label">初始时间</span><span class="shop-preview-value">${nextTime}</span></div><div class="shop-preview-row"><span class="shop-preview-label">精力上限</span><span class="shop-preview-value">${nextStamina}</span></div><div class="shop-preview-row"><span class="shop-preview-label">题目数</span><span class="shop-preview-value">${ncfg.maps}</span></div><div class="shop-preview-row"><span class="shop-preview-label">分数线</span><span class="shop-preview-value">${ncfg.pass + (ch.V?30:0)}</span></div>`;}const effMind=getEffMind();const skillReward=0.5+boostLevel;const inspireMult=inspireCount>0?inspireCount:0;personalEl.innerHTML=`<div class="shop-preview-row"><span class="shop-preview-label">🧠 思维</span><span class="shop-preview-value">${effMind}</span></div><div class="shop-preview-row"><span class="shop-preview-label">💎 特殊节点奖励</span><span class="shop-preview-value">${fsp(skillReward)} sp/个</span></div><div class="shop-preview-row"><span class="shop-preview-label">⚡ 振奋效果乘数</span><span class="shop-preview-value">${inspireMult>0?'×'+inspireMult:'未激活'}</span></div><div class="shop-preview-row"><span class="shop-preview-label">💠 提升等级</span><span class="shop-preview-value">Lv.${boostLevel}</span></div><div class="shop-preview-row"><span class="shop-preview-label">💰 钞能力</span><span class="shop-preview-value">${shop.moneyPower?(moneyPowerUsed?'已用':'可用'):'未解锁'}</span></div>`}
// The board now ranks each player's best run ever, not their standing inside
// whatever run happens to be open, so it is comparable across devices and days.
const MINI_SCORE_COUNT=6;
let leaderboardCache=[],matchBoardCache=[];
function refreshLeaderboard(){return api('/leaderboard').then(d=>{leaderboardCache=d.players||[];matchBoardCache=d.matches||[];updateLeaderboardUI();renderBoardPage()}).catch(()=>{})}
function getLBColor(score){if(score<1500)return'#BFBFBF';if(score<2000)return'#0E90D2';if(score<4000)return'#5EB95E';if(score<8000)return'#E67E22';if(score<13000)return'#E74C3C';return'#8E44AD'}
// 0 is the "never timed" case that predates the timer, not a zero-second run.
function fmtDur(ms){if(!ms)return'—';const t=Math.round(ms/1000),s=t%60,m=Math.floor(t/60)%60,h=Math.floor(t/3600);const p=n=>String(n).padStart(2,'0');return h>0?`${h}:${p(m)}:${p(s)}`:`${m}:${p(s)}`}
function updateLeaderboardUI(){
  const listEl=document.getElementById('leaderboardList');
  if(!listEl)return;
  if(leaderboardCache.length===0){listEl.innerHTML='<div class="shop-right-empty">暂无记录</div>';return}
  listEl.innerHTML=leaderboardCache.map((p,i)=>{
    const color=getLBColor(p.score);
    const isMe=p.name===playerName;
    const mini=(p.levels||[]).slice(-MINI_SCORE_COUNT).map(ms=>`<span class="mini-score ${ms.passed?'pass':'fail'}">${ms.matchScore}</span>`).join('');
    return `<div class="leaderboard-item${isMe?' current':''}"><span class="leaderboard-rank">${i+1}</span><span class="leaderboard-name" style="color:${color}">${esc(p.name)}<span class="leaderboard-level">第${p.maxLevel+1}关</span>${p.easyMode?'<span class="leaderboard-easy">简单</span>':''}</span><span class="leaderboard-score">${p.score}</span><span class="leaderboard-time">${fmtDur(p.durationMs)}</span>${mini?`<div class="leaderboard-mini-scores">${mini}</div>`:''}</div>`;
  }).join('');
}
/**
 * The board the player opens from the start screen is a tab strip: 总榜 first,
 * then one tab per level's 单场榜.
 *
 * There is exactly one piece of state — which tab — and one render that draws
 * both the strip and the board under it.
 */
let boardPage=0;
function boardPageCount(){return 1+matchBoardCache.length}
function levelName(b){return (LV[b.level]&&LV[b.level].name)||b.matchName||('第'+(b.level+1)+'关')}
// 总榜: each player's best run ever, expandable into that run's own matches.
function totalBoardHtml(){
  if(leaderboardCache.length===0)return'<div class="lb-empty">暂无记录</div>';
  const head='<div class="lb-head"><span class="lb-rank">#</span><span class="lb-name">玩家</span><span class="lb-score">加权总分</span><span class="lb-time">总用时</span></div>';
  return head+leaderboardCache.map((p,i)=>{
    const color=getLBColor(p.score);
    const isMe=p.name===playerName;
    const rows=(p.levels||[]).map(l=>`<tr><td>${l.level+1}</td><td>${esc(l.matchName||'')}${l.sim?'<span class="lb-sim">模拟</span>':''}</td><td>${l.matchScore}</td><td>${fmtDur(l.durationMs)}</td><td class="${l.passed?'pass':'fail'}">${l.passed?'✅':'❌'}</td></tr>`).join('');
    const detail=rows
      ?`<table class="lb-detail"><tr><th>关卡</th><th>比赛</th><th>分数</th><th>用时</th><th>结果</th></tr>${rows}</table>`
      :'<div class="lb-empty">这局还没有比赛记录</div>';
    return `<details class="lb-entry${isMe?' current':''}"><summary class="lb-row"><span class="lb-rank">${i+1}</span><span class="lb-name" style="color:${color}">${esc(p.name)}<span class="leaderboard-level">第${p.maxLevel+1}关</span>${p.easyMode?'<span class="leaderboard-easy">简单</span>':''}</span><span class="lb-score">${p.score}</span><span class="lb-time">${fmtDur(p.durationMs)}</span></summary>${detail}</details>`;
  }).join('');
}
// 单场榜: one level, each player's best-ever attempt at it. Flat rows — there is
// nothing left to expand once a row is already a single match.
function matchBoardHtml(b){
  if(!b.rows.length)return'<div class="lb-empty">暂无记录</div>';
  const head='<div class="lb-head"><span class="lb-rank">#</span><span class="lb-name">玩家</span><span class="lb-score">分数</span><span class="lb-time">用时</span><span class="lb-flag">结果</span></div>';
  return head+b.rows.map((r,i)=>{
    const isMe=r.name===playerName;
    return `<div class="lb-entry lb-flat${isMe?' current':''}"><div class="lb-row"><span class="lb-rank">${i+1}</span><span class="lb-name">${esc(r.name)}</span><span class="lb-score">${r.matchScore}</span><span class="lb-time">${fmtDur(r.durationMs)}</span><span class="lb-flag ${r.passed?'pass':'fail'}">${r.passed?'✅':'❌'}</span></div></div>`;
  }).join('');
}
function renderBoardPage(){
  const listEl=document.getElementById('leaderboardBoard');
  if(!listEl)return;
  boardPage=Math.max(0,Math.min(boardPage,boardPageCount()-1));
  const onTotal=boardPage===0;
  const b=onTotal?null:matchBoardCache[boardPage-1];

  const tabs=['总榜'].concat(matchBoardCache.map(levelName));
  const tabsEl=document.getElementById('lbTabs');
  tabsEl.innerHTML=tabs.map((t,i)=>`<button class="lb-tab${i===boardPage?' active':''}" data-page="${i}">${esc(t)}</button>`).join('');
  // Keep the selected tab visible: with fourteen levels the strip scrolls, and a
  // tab selected by keyboard can otherwise sit off-screen.
  const active=tabsEl.querySelector('.lb-tab.active');
  if(active)active.scrollIntoView({block:'nearest',inline:'nearest'});

  document.getElementById('lbPageNote').textContent=onTotal
    ?'每位玩家的最佳一局，点击一行展开这局每场比赛的分数与用时。'
    :'本关的单场排名，取每位玩家在该关的历史最佳一场。';
  listEl.innerHTML=onTotal?totalBoardHtml():matchBoardHtml(b);
  listEl.scrollTop=0;
}
function goBoardPage(delta){boardPage+=delta;renderBoardPage()}
// Opening always lands on 总榜; the page you left on last time is not a place
// anyone wants to be put back into without asking.
function showLeaderboardModal(){boardPage=0;renderBoardPage();document.getElementById('leaderboardOverlay').classList.remove('hidden');refreshLeaderboard()}
function leaderboardIsOpen(){return !document.getElementById('leaderboardOverlay').classList.contains('hidden')}
document.getElementById('btnOpenLeaderboard').addEventListener('click',showLeaderboardModal);
document.getElementById('btnCloseLeaderboard').addEventListener('click',()=>document.getElementById('leaderboardOverlay').classList.add('hidden'));
// Delegated, because the strip is rebuilt on every render and per-button
// listeners would have to be rebuilt with it.
document.getElementById('lbTabs').addEventListener('click',e=>{
  const tab=e.target.closest('.lb-tab');
  if(!tab)return;
  boardPage=+tab.dataset.page;
  renderBoardPage();
});
// Arrow keys walk the tabs. Guarded on the overlay being open so they do not
// fight the game's own keys.
document.addEventListener('keydown',e=>{
  if(!leaderboardIsOpen())return;
  if(e.key==='ArrowLeft'){e.preventDefault();goBoardPage(-1)}
  else if(e.key==='ArrowRight'){e.preventDefault();goBoardPage(1)}
  else if(e.key==='Escape'){document.getElementById('leaderboardOverlay').classList.add('hidden')}
});
function initShopPanel(){const cont=document.getElementById('shopLeftContent');syncAllSp();let html='';
const isProvinceOrLater=level>=4;
const priceHike=(ch.VI&&hasPassedNOIP())?1:0;
let stockCosts=isProvinceOrLater?{time:5+priceHike,mind:5+priceHike,boost:7+priceHike,inspire:8+priceHike}:{time:3,mind:3,boost:4,inspire:4};
html+='<div class="stock-section"><div class="stock-section-title">📦 升级存量（检查地图中标记节点获得）</div>';
const stocks=[{name:'⏰ 时间存量',count:timeStock,cost:stockCosts.time,key:'time',desc:ch.I_exp?'初始时间+1.5':'初始时间+2'},{name:'🧠 思维存量',count:mindStock,cost:stockCosts.mind,key:'mind',desc:'思维永久+1'},{name:'💠 提升存量',count:boostStock,cost:stockCosts.boost,key:'boost',desc:'特殊节点技能点+1'},{name:'⚡ 振奋存量',count:inspireStock,cost:stockCosts.inspire,key:'inspire',desc:'正确时恢复更多精力'}];
stocks.forEach(s=>{const canBuy=s.count>0&&sp>=s.cost;html+=`<div class="stock-item"><span class="stock-item-name">${s.name}</span><span class="stock-item-count">×${s.count}</span><span class="stock-item-cost">${s.desc}</span><button class="btn-stock-buy" onclick="window._buyStock('${s.key}')" ${canBuy?'':'disabled'}>${s.cost}sp购买</button></div>`});
html+='</div>';
if(level>=4){
html+='<hr class="shop-separator"><div class="shop-section-title">🍕 食物（下一场比赛生效）</div>';
const foods=[{name:'🍬 尖啸',cost:getFoodCost('shriek'),desc:'下场比赛+3精力',key:'shriek',stamina:3,timeBonus:0,mindBonus:0},{name:'🍫 士力架',cost:getFoodCost('snickers'),desc:'下场比赛+7精力，时间+1',key:'snickers',stamina:7,timeBonus:1,mindBonus:0},{name:'☕ 咖啡',cost:getFoodCost('coffee'),desc:'下场比赛+15精力，思维+1',key:'coffee',stamina:15,timeBonus:0,mindBonus:1}];
foods.forEach(f=>{const canBuy=sp>=f.cost;html+=`<div class="stock-item"><span class="stock-item-name">${f.name}</span><span class="stock-item-cost">${f.desc}</span><button class="btn-stock-buy" onclick="window._buyFood('${f.key}')" ${canBuy?'':'disabled'}>${f.cost}sp购买</button></div>`});
const pendingCount=pendingFoodEffects.length;
if(pendingCount>0){html+=`<div style="font-size:.7rem;color:#f90;text-align:center;margin-top:4px;">📋 ${pendingCount}个食物将在下场比赛生效</div>`}
}
if(level>=4||(ch.assist_I&&level>=4)){
html+='<hr class="shop-separator"><div class="shop-section-title">🔧 核心能力</div>';
const hasAssist=ch.assist_I&&level>=4;
const canBuyInfer=hasPassedNOIP()||hasAssist;
const coreUpgs=[{name:'👁️ 聚焦',desc:'消耗1时间2精力，思维临时+1',cost:5+priceHike,key:'focus',owned:shop.focus},{name:'🔍 推理模式',desc:'按R切换推理模式',cost:5+priceHike,key:'inference',owned:shop.inference,locked:!canBuyInfer&&!hasAssist}];
coreUpgs.forEach(u=>{html+=`<div class="shop-item"><span><b>${u.name}</b><br><small>${u.desc}</small></span>`;if(u.owned)html+=`<span>✅已拥有</span>`;else if(u.locked&&!hasAssist)html+=`<span style="color:#999;">🔒需通过NOIP</span>`;else html+=`<button class="shop-btn" onclick="window._buyUpgrade('${u.key}')">购买(${u.cost}sp)</button>`;html+='</div>';
if(u.key==='inference'&&!u.owned){
html+=`<button class="shop-btn" onclick="window.open('tutorial2.html','_blank')" style="margin-top:4px;margin-bottom:8px;">📖 进入推理教程</button>`;
}});
if(hasAssist){html+='<div style="font-size:.65rem;color:#3a7ab5;text-align:center;margin-top:4px;font-style:italic;">🛠️ 辅助挑战I生效中：聚焦与推理已自动解锁</div>'}
}
html+='<hr class="shop-separator"><div class="shop-section-title">📦 通用升级</div>';
const upgs=[{name:'充分利用时间',desc:'剩余每2时间→1技能点',cost:15+priceHike,key:'timeToSp'},{name:'时间管理大师',desc:'初始时间×1.2',cost:25+priceHike,key:'timeMaster'},{name:'敏锐直觉',desc:'推理显示3层内最高分',cost:20+priceHike,key:'sharpIntuition'},{name:'顺手的事',desc:'推理时显示子节点升级存量',cost:12+priceHike,key:'convenience'},{name:'💰 钞能力',desc:'正式赛失败时满分通过(每场1次)',cost:20+priceHike,key:'moneyPower'}];
upgs.forEach(u=>{const owned=shop[u.key]===!0;html+=`<div class="shop-item"><span><b>${u.name}</b><br><small>${u.desc}</small></span>`;if(!owned)html+=`<button class="shop-btn" onclick="window._buyUpgrade('${u.key}')">购买(${u.cost}sp)</button>`;else html+=`<span>✅已拥有</span>`;html+='</div>'});
cont.innerHTML=html}
window._buyStock=function(key){const isProvinceOrLater=level>=4;const priceHike=(ch.VI&&hasPassedNOIP())?1:0;let costs=isProvinceOrLater?{time:5+priceHike,mind:5+priceHike,boost:7+priceHike,inspire:8+priceHike}:{time:3,mind:3,boost:4,inspire:4};const cost=costs[key];if(sp<cost){setGM('技能点不足','warning');return}if(key==='time'&&timeStock<1){setGM('时间存量不足','warning');return}if(key==='mind'&&mindStock<1){setGM('思维存量不足','warning');return}if(key==='boost'&&boostStock<1){setGM('提升存量不足','warning');return}if(key==='inspire'&&inspireStock<1){setGM('振奋存量不足','warning');return}sp-=cost;if(key==='time'){timeStock--;const bonus=ch.I_exp?1.5:2;timeBonus+=bonus;setGM('⏰时间升级！初始时间+'+bonus,'success')}else if(key==='mind'){mindStock--;mindBonus++;setGM('🧠思维升级！思维+1','success')}else if(key==='boost'){boostStock--;boostLevel++;setGM('💠提升升级！特殊节点奖励+1','success')}else if(key==='inspire'){inspireStock--;inspireCount++;setGM('⚡振奋升级！','success')}everBoughtStock=true;syncAllSp();updateSideStocks();updateActBar();initShopPanel();updateShopPreview();refreshUI();checkAchievements()}
window._buyFood=function(key){const cost=getFoodCost(key);if(sp<cost){setGM('技能点不足','warning');return}const foods={shriek:{cost:getFoodCost('shriek'),stamina:3,timeBonus:0,mindBonus:0},snickers:{cost:getFoodCost('snickers'),stamina:7,timeBonus:1,mindBonus:0},coffee:{cost:getFoodCost('coffee'),stamina:15,timeBonus:0,mindBonus:1}};const food=foods[key];if(!food)return;sp-=cost;pendingFoodEffects.push({...food});syncAllSp();initShopPanel();updateShopPreview();setGM('🍕已购买！效果将在下一场比赛开始时生效','success')}
window._buyUpgrade=function(key){if(isInActiveGame()){setGM('比赛进行中无法购买','warning');return}if(key==='inference'){const hasAssist=ch.assist_I&&level>=4;if(!hasPassedNOIP()&&!hasAssist){setGM('🔒需通过NOIP正式赛后解锁','warning');return}}const priceHike=(ch.VI&&hasPassedNOIP())?1:0;const costs={focus:5+priceHike,inference:5+priceHike,timeToSp:15+priceHike,timeMaster:25+priceHike,sharpIntuition:20+priceHike,convenience:12+priceHike,moneyPower:20+priceHike};if(sp<costs[key]){setGM('技能点不足','warning');return}sp-=costs[key];shop[key]=!0;syncAllSp();initShopPanel();updateFocusBtnDisplay();updateActBar();updateShopPreview();refreshUI()}
function showShopOverlay(cb){const oldSp=sp;syncAllSp();const totalTimeToSp=timeToSpBonusPending||0;const baseForAnim=oldSp-spEarnedPending-totalTimeToSp;const dsp=document.getElementById('shopSkillPoints');const earnedEl=document.getElementById('shopSpEarned');if(dsp)dsp.textContent=fsp(baseForAnim);if(spEarnedPending>0&&earnedEl){earnedEl.textContent='(+'+fsp(spEarnedPending)+')';earnedEl.style.display='inline-block';earnedEl.classList.remove('fading')}if(spEarnedPending>0||totalTimeToSp>0){setTimeout(()=>{animateSpDisplay(baseForAnim,baseForAnim+spEarnedPending,500);if(totalTimeToSp>0){setTimeout(()=>{if(earnedEl){earnedEl.textContent='(⏰+'+fsp(totalTimeToSp)+')';earnedEl.style.display='inline-block';earnedEl.classList.remove('fading');}animateSpDisplay(baseForAnim+spEarnedPending,oldSp,500);setTimeout(()=>{if(earnedEl){earnedEl.classList.add('fading');setTimeout(()=>{earnedEl.style.display='none';timeToSpBonusPending=0;},800)}},600)},600)}else{setTimeout(()=>{if(earnedEl){earnedEl.classList.add('fading');setTimeout(()=>{earnedEl.style.display='none';spEarnedPending=0;},800)}},600)}},100)}else{if(earnedEl)earnedEl.style.display='none';if(dsp)dsp.textContent=fsp(oldSp)}initShopPanel();updateShopPreview();updateSideStocks();updateLeaderboardUI();document.getElementById('shopOverlay').classList.remove('hidden');syncAllSp();document.getElementById('btnCloseShop').onclick=()=>{document.getElementById('shopOverlay').classList.add('hidden');spEarnedPending=0;timeToSpBonusPending=0;const earnedEl2=document.getElementById('shopSpEarned');if(earnedEl2)earnedEl2.style.display='none';if(cb)cb()}}
function clearAllShake(){const map=getActive();if(map)Object.values(map.nodeMap).forEach(n=>{delete n._shake});if(shakeRaf){cancelAnimationFrame(shakeRaf);shakeRaf=null}}
let shakeRaf=null;
function startShake(){if(shakeRaf)return;shakeRaf=requestAnimationFrame(function loop(){if(!inferMode&&!document.querySelector('.shake-node')){shakeRaf=null;return}drawTree(getActive());shakeRaf=requestAnimationFrame(loop)})}
window.addEventListener('keydown',e=>{
if(e.key==='F8'){e.preventDefault();if(gameStarted&&maps.some(m=>!m.gameOver)){maps.forEach(m=>{if(!m.gameOver){m.correctResult.state='correct';m.correctResult.score=100;let cur=m.correctResult.parent;while(cur){cur.state='correct';cur=cur.parent}endMapGame(m,'win')}});checkAllComplete()}return}
if(e.key==='F4'){e.preventDefault();alert('禁止作弊！你的总分已归零。');totalHistScore=0;recordScore();setGM('总分已归零','warning')}
});
document.addEventListener('keydown',e=>{
if(e.key==='r'||e.key==='R'){if(!gameStarted)return;if(document.getElementById('gameOverOverlay').classList.contains('hidden')&&document.getElementById('shopOverlay').classList.contains('hidden')){const hasInferAccess=shop.inference||(ch.assist_I&&level>=4);if(!hasInferAccess||level<4){setGM('🔒推理功能需通过NOIP后解锁','warning');return}inferMode=!inferMode;document.getElementById('canvasWrapper').classList.toggle('inference',inferMode);updateActBar();if(!inferMode){clearAllShake()}refreshUI()}}
});
document.getElementById('btnFocusSide').addEventListener('click',()=>{if(!gameStarted||!getActive()||getActive().gameOver)return;const hasFocusAccess=shop.focus||(ch.assist_I&&level>=4);if(!hasFocusAccess||level<4){setGM('🔒聚焦功能需通过NOIP后解锁','warning');return}if(remTime<1||remStamina<2){setGM('资源不足','warning');return}remTime--;remStamina-=2;focusStacks++;focusMapIdx=activeMapIdx;updateActBar();updateSidePanel();refreshUI()});
document.getElementById('btnExportLB').addEventListener('click',()=>{
  api('/export').then(data=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='oi_'+data.username+'.json';a.click();
    URL.revokeObjectURL(url);
  }).catch(e=>setGM('导出失败：'+e.message,'warning'));
});
function updateAchievementDisplay(){const list=document.getElementById('achievementList');if(!list)return;const mode=achievementMode==='simple'?'simple':'normal';const data=achievementData[mode];let html='';achievements.forEach(a=>{const done=data[a.id];html+=`<div class="achievement-item"><span class="ach-name">${a.name}</span><span class="ach-desc">${a.desc}</span>${done?`<span class="ach-done">已完成</span><span class="ach-player">首个达成：${esc(done.player)}</span>`:'<span class="ach-none">未完成</span>'}</div>`});list.innerHTML=html;}
function showAchievementModal(){updateAchievementDisplay();document.getElementById('achievementOverlay').classList.remove('hidden');}
document.getElementById('btnOpenAchievements').addEventListener('click',showAchievementModal);
document.getElementById('btnShowAchievements').addEventListener('click',showAchievementModal);
document.getElementById('btnCloseAchievements').addEventListener('click',()=>document.getElementById('achievementOverlay').classList.add('hidden'));
document.getElementById('achModeNormal').addEventListener('click',()=>{achievementMode='normal';document.getElementById('achModeNormal').classList.add('active');document.getElementById('achModeSimple').classList.remove('active');updateAchievementDisplay();});
document.getElementById('achModeSimple').addEventListener('click',()=>{achievementMode='simple';document.getElementById('achModeSimple').classList.add('active');document.getElementById('achModeNormal').classList.remove('active');updateAchievementDisplay();});
function syncEasyUI(){const btn=document.getElementById('btnEasyMode');const tip=document.getElementById('easyModeTip');if(!btn)return;btn.textContent=easyMode?'🌱 简单模式：开启':'🌱 简单模式：关闭';btn.classList.toggle('off',!easyMode);if(easyModeAutoSet){tip.textContent='看起来你运气不太好……先玩一局简单的了解一下机制吧。';easyModeAutoSet=false;saveEasySettings();}else{tip.textContent='';}}
document.getElementById('btnEasyMode').addEventListener('click',()=>{const wasOn=easyMode;easyMode=!easyMode;saveEasySettings();syncEasyUI();updateChallengeBtnHighlight();if(!easyMode&&!hasPlayedBefore){document.getElementById('easyModeTip').textContent='第一次游玩关闭简单模式会导致游戏十分困难，请在熟悉过后再关闭';}else if(easyMode&&!hasPlayedBefore){document.getElementById('easyModeTip').textContent='';}});
function animLoop(){let needsRedraw=!1;const now=performance.now();for(const k in nodeAnimations){const a=nodeAnimations[k];if(a.type==='unlock'&&now-a.start<a.dur){needsRedraw=!0}else if(now-a.start>=a.dur){delete nodeAnimations[k];needsRedraw=!0}}if(needsRedraw&&getActive())drawTree(getActive());if(Object.keys(nodeAnimations).length>0)requestAnimationFrame(animLoop)}setInterval(()=>{if(Object.keys(nodeAnimations).length>0){animLoop()}},50);
updateSidePanel();updateSideStocks();initShopPanel();updateActBar();updateFocusBtnDisplay();updateShopPreview();updateChallengeBtnHighlight();syncEasyUI();updateAchievementDisplay();
// Nothing is playable until the server says who this is. An expired or absent
// session lands on the login form instead of the start screen.
syncAuthUI();
refreshLeaderboard();
api('/me').then(onSignedIn).catch(()=>showAuthOverlay());
})();
