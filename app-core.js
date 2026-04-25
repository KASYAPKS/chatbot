// app-core.js - Core chat, nav, settings
const $=id=>document.getElementById(id);
const splash=$('splash-screen'),app=$('app'),sidebar=$('sidebar'),overlay=$('sidebar-overlay');
const chatMsgs=$('chat-messages'),msgInput=$('msg-input');
const notifPanel=$('notif-panel'),callPanel=$('call-panel');
const toast=$('toast'),modalOverlay=$('modal-overlay');
const pages=document.querySelectorAll('.page'),navItems=document.querySelectorAll('.nav-item');
let attachedImage=null, chatLog=loadChatHistory(), recognition=null, ttsEnabled=false;

// Splash & Onboarding
setTimeout(()=>{
  splash.classList.add('fade-out');
  setTimeout(()=>{
    splash.classList.add('hidden');
    app.classList.remove('hidden');
    if(typeof checkOnboarding === 'function') checkOnboarding();
    try {
        if(typeof renderHistory === 'function') renderHistory();
    } catch(e) { console.error(e); }
  },600);
},2400);

function checkOnboarding() {
  let profileStr = localStorage.getItem('medibot_profile');
  
  // Failsafe for older profiles from previous testing
  if (profileStr) {
      try {
          const parsed = JSON.parse(profileStr);
          if (typeof parsed.allergies === 'undefined') {
              localStorage.removeItem('medibot_profile');
              profileStr = null;
          }
      } catch(e) {}
  }

  if (!profileStr) {
    $('onboarding-modal').classList.remove('hidden');
  } else {
    updateProfileUI(JSON.parse(profileStr));
  }
}

function updateProfileUI(p) {
    if(p.isGuest) {
        if($('sidebar-name')) $('sidebar-name').textContent = 'Guest User';
        if($('sidebar-avatar')) $('sidebar-avatar').textContent = 'GU';
        if($('settings-name')) $('settings-name').textContent = 'Guest User';
        if($('settings-email')) $('settings-email').textContent = 'Not registered';
        if($('settings-avatar')) $('settings-avatar').textContent = 'GU';
        return;
    }
    
    const fullName = `${p.fname} ${p.mname ? p.mname + ' ' : ''}${p.lname}`.trim();
    const initials = (p.fname[0] + (p.lname ? p.lname[0] : '')).toUpperCase();
    if($('sidebar-name')) $('sidebar-name').textContent = fullName;
    if($('sidebar-avatar')) $('sidebar-avatar').textContent = initials;
    if($('settings-name')) $('settings-name').textContent = fullName;
    if($('settings-email')) $('settings-email').textContent = p.email || 'Premium Member';
    if($('settings-avatar')) $('settings-avatar').textContent = initials;
    
    // Update Health page specific info
    if($('health-blood')) $('health-blood').textContent = p.blood ? p.blood : '--';
    if($('health-allergies')) $('health-allergies').textContent = p.allergies ? p.allergies : 'None';
    if($('health-conditions')) $('health-conditions').textContent = p.conditions ? p.conditions : 'None';
    
    // Update new health stats
    if($('health-hr')) $('health-hr').textContent = p.hr ? p.hr : '--';
    if($('health-bp')) $('health-bp').textContent = p.bp ? p.bp : '--/--';
    if($('health-weight')) $('health-weight').textContent = p.weight ? p.weight + ' kg' : '-- kg';
    if($('health-height')) $('health-height').textContent = p.height ? p.height + ' cm' : '-- cm';
    
    if(typeof updateCurrentMedications === 'function') updateCurrentMedications();
}

if($('ob-save-btn')) {
    $('ob-save-btn').onclick = () => {
        const fname = $('ob-fname').value.trim();
        const lname = $('ob-lname').value.trim();
        if (!fname || !lname) {
            showToast('First and Last name are required!');
            return;
        }
        const profile = {
            fname, mname: '', lname, email: '',
            age: $('ob-age').value.trim(),
            gender: $('ob-gender').value,
            blood: $('ob-blood').value,
            weight: $('ob-weight').value.trim(),
            height: $('ob-height').value.trim(),
            hr: $('ob-hr').value.trim(),
            bp: $('ob-bp').value.trim(),
            allergies: $('ob-allergies').value.trim() || 'None',
            conditions: $('ob-conditions').value.trim() || 'None',
            isGuest: false
        };
        localStorage.setItem('medibot_profile', JSON.stringify(profile));
        updateProfileUI(profile);
        $('onboarding-modal').classList.add('hidden');
        showToast('Health Profile saved successfully!');
    };
}
if($('ob-skip-btn')) {
    $('ob-skip-btn').onclick = () => {
        const profile = { isGuest: true, allergies: 'None', conditions: 'None' };
        localStorage.setItem('medibot_profile', JSON.stringify(profile));
        updateProfileUI(profile);
        $('onboarding-modal').classList.add('hidden');
        showToast('Continuing as Guest. Data will not be personalized.');
    };
}

// Sidebar
$('menu-btn').onclick=()=>{sidebar.classList.add('open');overlay.classList.add('show');};
const closeSidebar=()=>{sidebar.classList.remove('open');overlay.classList.remove('show');};
$('close-sidebar').onclick=closeSidebar;
overlay.onclick=closeSidebar;

// Nav
navItems.forEach(btn=>{btn.onclick=()=>{
  navItems.forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  pages.forEach(p=>p.classList.remove('active'));
  $('page-'+btn.dataset.page).classList.add('active');
  $('topbar-title').textContent=btn.textContent.trim();
  
  if(btn.dataset.page === 'health' && typeof updateCurrentMedications === 'function') {
      updateCurrentMedications();
  }
  
  closeSidebar();notifPanel.classList.add('hidden');
};});

// Toast
function showToast(msg){toast.textContent=msg;toast.classList.remove('hidden');clearTimeout(window._tt);window._tt=setTimeout(()=>toast.classList.add('hidden'),2500);}

// Conditions DB
const conditions=[
  {id:'headache',keys:['headache','head ache','head pain','migraine','head hurts'],resp:"Based on your **headache**:\n\n• **Causes**: Tension, dehydration, stress, eye strain\n• **Relief**: Dark room, cold compress, hydrate\n• **OTC**: Paracetamol (Dolo 650) or Ibuprofen 400mg\n\n⚠️ See doctor if: sudden severe onset, fever, vision changes."},
  {id:'fever',keys:['fever','temperature','feverish','chills','body hot'],resp:"Regarding **fever**:\n\n🌡️ Mild: 99-100.4°F | Moderate: 100.4-103°F | High: >103°F\n\n💊 Paracetamol 650mg every 6hrs, ORS, rest, cool compress\n\n🏥 See doctor if >3 days or >103°F."},
  {id:'cold',keys:['cold','runny nose','sneezing','stuffy nose','blocked nose'],resp:"For **cold/congestion**:\n\n• Steam inhalation 3x daily\n• Cetirizine 10mg for sneezing\n• Warm fluids, honey+ginger tea\n💊 Sinarest, Crocin Cold\n\n🏥 See doctor if >10 days."},
  {id:'cough',keys:['cough','coughing','dry cough','throat irritation'],resp:"For **cough**:\n\n💊 Dry: Dextromethorphan syrup\n💊 Wet: Ambroxol syrup\n🏠 Honey+turmeric milk, salt water gargle\n\n⚠️ See doctor if >2 weeks or blood in sputum."},
  {id:'stomach',keys:['stomach pain','stomach ache','abdominal pain','acidity','gas','bloating'],resp:"For **stomach issues**:\n\n💊 Pantoprazole before meals, Simeticone for gas\n🏠 Jeera water, light diet, avoid spicy\n\n🏥 See doctor if severe or blood in stool."},
  {id:'skin',keys:['rash','itching','skin allergy','hives','red spots'],resp:"For **skin issues**:\n\n💊 Cetirizine 10mg, Calamine lotion\n🏠 Keep dry, loose cotton clothes\n\n🏥 See doctor if spreading, pus, or fever."},
  {id:'backpain',keys:['back pain','lower back','backache','spine pain'],resp:"For **back pain**:\n\n💊 Diclofenac or Zerodol-P after food\n🏠 Hot/cold compress, stretching, good posture\n\n⚠️ See doctor if radiating to legs or numbness."},
  {id:'chest',keys:['chest pain','chest tightness','heart pain','palpitation'],resp:"⚠️ **Chest pain is serious!**\n\n🚨 Call 112 if: crushing pain, spreading to arm/jaw, breathlessness\n💊 Chew Aspirin 325mg if suspected heart attack\n\n**Seek immediate medical evaluation.**"},
  {id:'breathing',keys:['breathing difficulty','breathless','asthma','wheezing'],resp:"For **breathing difficulty**:\n\n🚨 Call 112 if severe/bluish lips\n💊 Asthma: Salbutamol inhaler 2 puffs\n🏠 Sit upright, loosen clothing, breathe slowly"},
  {id:'anxiety',keys:['anxiety','panic','stress','cant sleep','insomnia'],resp:"For **anxiety/stress**:\n\n🧘 Deep breathing 4-7-8 technique\n🏠 Exercise, meditation, limit caffeine\n\n📞 Crisis: iCall 9152987821"},
  {id:'drug',keys:['drug info','medicine info','side effect','dosage','interaction'],resp:"I can help with **drug info**!\n\n💊 Drug interactions, dosage, side effects, generics\n\nTell me the medication name."},
  {id:'firstaid',keys:['first aid','burn','wound','bleeding','fracture','choking'],resp:"**First Aid**:\n\n🩹 Burns: Cool water 10min\n🩸 Cuts: Firm pressure 10min\n🦴 Fracture: Immobilize, RICE\n💊 Choking: 5 back blows + 5 abdominal thrusts"},
  {id:'dental',keys:['tooth pain','toothache','gum pain','gum bleeding'],resp:"For **dental pain**:\n\n💊 Ibuprofen 400mg + Paracetamol\n🏠 Salt water rinse, clove oil\n\n⚠️ See dentist if severe or swelling."},
  {id:'prescription',keys:['prescription','upload','scan','report','lab report'],resp:"📋 Click the 📎 attach button to upload a prescription photo. I'll analyze it using OCR!"},
  {id:'diarrhea',keys:['diarrhea','loose motion','loose stool','dysentery'],resp:"For **diarrhea**:\n\n💊 ORS frequently, Loperamide if no blood/fever\n🍚 BRAT diet\n\n🏥 See doctor if blood in stool or >2 days."},
  {id:'eye',keys:['eye pain','red eye','eye infection','blurry vision'],resp:"For **eye issues**:\n\n💊 Artificial tears for dryness\n🏠 Cold compress, reduce screen time\n\n🏥 See doctor if vision changes or severe pain."},
  {id:'vomiting',keys:['vomiting','nausea','throwing up'],resp:"For **nausea/vomiting**:\n\n💊 Ondansetron 4mg, Domperidone 10mg\n🏠 Small sips ORS, ginger water, BRAT diet\n\n🏥 See doctor if blood or >24hrs."},
  {id:'bp',keys:['blood pressure','bp','hypertension'],resp:"**Blood Pressure**:\n\nNormal: 120/80mmHg\n💊 Amlodipine, Telmisartan, Losartan\n🏠 Reduce salt, exercise, manage stress\n\n⚠️ BP>180/120: seek immediate care."},
  {id:'diabetes',keys:['diabetes','blood sugar','diabetic','glucose'],resp:"**Diabetes**:\n\nFasting: 70-100mg/dL | Post-meal: <140mg/dL\n💊 Metformin, Glimepiride\n🥗 Exercise, low-sugar diet\n\n⚠️ Never adjust doses without doctor."}
];

async function getResponse(msg){
  const m=msg.toLowerCase().replace(/[^a-z0-9\s]/g,'');
  // Check medicine name first
  const medInfo=await lookupMedicine(msg);
  if(medInfo) return medInfo;
  // Check multi-symptom combinations and active diagnosis
  const multi=checkMultiSymptom(msg);
  if(multi) {
    if (multi.diag) return multi.diag; // Return diagnostic question/result
    const dur=parseDuration(msg), sev=parseSeverity(msg);
    if(dur||sev) return buildSmartResponse(multi, 'combo', dur, sev, []);
    return multi;
  }
  // Parse context from user message
  const duration=parseDuration(msg);
  const severity=parseSeverity(msg);
  const details=parseSymptomDetails(msg);
  // Score conditions
  let best=null,bestScore=0;
  for(const c of conditions){let s=0;for(const k of c.keys){if(m.includes(k))s+=k.split(' ').length*3;}if(s>bestScore){bestScore=s;best=c;}}
  if(best&&bestScore>=3) {
    // If we detected duration, severity, or details, build a smart response
    if(duration||severity||details.length>0) return buildSmartResponse(best.resp, best.id, duration, severity, details);
    return best.resp;
  }
  return "Thank you for your query. I recommend:\n\n1. **Monitor** symptoms 24-48hrs\n2. **Stay hydrated** and rest\n3. **Track** changes\n\n💡 **Tip**: Try describing your symptoms with more detail, for example:\n• \"I have a **severe throbbing headache** on the **left side** for **3 days**\"\n• \"**Mild fever** since **yesterday** with **body pain**\"\n\nThe more detail you provide, the better I can help!";
}

function addMsg(text,type,imageData){
  const wc=chatMsgs.querySelector('.welcome-card');if(wc)wc.style.display='none';
  const time=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const div=document.createElement('div');div.className='msg '+type;
  const av=type==='bot'?'<div class="msg-avatar"><i class="fas fa-robot"></i></div>':'';
  const fmt=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  const img=imageData?`<img src="${imageData}" style="max-width:200px;border-radius:8px;margin-bottom:8px;display:block;">`:'';
  div.innerHTML=`${av}<div><div class="msg-bubble">${img}${fmt}</div><div class="msg-time">${time}</div></div>`;
  chatMsgs.appendChild(div);chatMsgs.scrollTop=chatMsgs.scrollHeight;
  chatLog.push({text,type,time:Date.now()});saveChatHistory(chatLog);
  if(type==='bot'&&ttsEnabled)speakText(text);
  return div;
}
function showTyping(){const d=document.createElement('div');d.className='msg bot';d.id='typing-indicator';d.innerHTML='<div class="msg-avatar"><i class="fas fa-robot"></i></div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';chatMsgs.appendChild(d);chatMsgs.scrollTop=chatMsgs.scrollHeight;}

function sendMessage(){
  const text=msgInput.value.trim(),img=attachedImage;
  if(!text&&!img)return;
  addMsg(text||'📎 Image attached','user',img);
  msgInput.value='';clearAttachment();showTyping();
  if(img){
    if(!window.Tesseract){const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>processImage(img,text);document.head.appendChild(s);}
    else processImage(img,text);
  } else {
    // Check if Gemini API key is set
    const apiKey=localStorage.getItem('gemini_api_key');
    if(apiKey){
      callGeminiAPI(apiKey,text);
    } else {
      setTimeout(async ()=>{const t=$('typing-indicator');if(t)t.remove();addMsg(await getResponse(text),'bot');},1200+Math.random()*800);
    }
  }
}

function callGeminiAPI(key,text){
  fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+key,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({contents:[{parts:[{text:'You are MediBot AI, a medical assistant chatbot. Give helpful, concise medical guidance. Include medication suggestions with Indian brand names. Always add disclaimer. Query: '+text}]}]})
  }).then(r=>r.json()).then(async data=>{
    const t=$('typing-indicator');if(t)t.remove();
    const resp=data?.candidates?.[0]?.content?.parts?.[0]?.text|| await getResponse(text);
    addMsg(resp,'bot');
  }).catch(async ()=>{const t=$('typing-indicator');if(t)t.remove();addMsg(await getResponse(text),'bot');});
}

function processImage(imgData,userText){
  Tesseract.recognize(imgData,'eng').then(({data:{text:ocr}})=>{
    const t=$('typing-indicator');if(t)t.remove();
    const clean=ocr.trim();
    if(clean.length<5){addMsg("Couldn't read text. Try a clearer photo.",'bot');return;}
    let a=`📋 **Prescription Analysis**\n\n📝 **Text:**\n${clean.substring(0,400)}\n\n`;
    const meds=['paracetamol','dolo','crocin','azithromycin','amoxicillin','ibuprofen','cetirizine','pantoprazole','metformin','amlodipine','aspirin'];
    const found=meds.filter(m=>clean.toLowerCase().includes(m));
    if(found.length)a+=`💊 **Detected**: ${found.join(', ')}\n\n`;
    a+='⚠️ Always verify with your pharmacist.';
    addMsg(a,'bot');
  }).catch(()=>{const t=$('typing-indicator');if(t)t.remove();addMsg("Couldn't process image. Try again.",'bot');});
}

function clearAttachment(){attachedImage=null;const p=document.querySelector('.attach-preview');if(p)p.remove();}

$('send-btn').onclick=sendMessage;
msgInput.onkeydown=e=>{if(e.key==='Enter')sendMessage();};

// Attach
document.querySelector('.attach-btn').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{attachedImage=ev.target.result;clearAttachment();const p=document.createElement('div');p.className='attach-preview';p.innerHTML=`<img src="${attachedImage}" style="max-height:60px;border-radius:6px;border:2px solid var(--accent)"><button class="remove-attach" style="background:var(--bg2);border:none;color:var(--text2);border-radius:50%;width:20px;height:20px;cursor:pointer;margin-left:4px;">✕</button>`;p.style.cssText='display:flex;align-items:center;gap:6px;padding:6px 12px;';document.querySelector('.input-wrapper').before(p);p.querySelector('.remove-attach').onclick=clearAttachment;};r.readAsDataURL(f);};i.click();};

// Chips
document.querySelectorAll('.chip').forEach(c=>{c.onclick=()=>{msgInput.value=c.dataset.q;sendMessage();};});

// === Voice Input (Web Speech API) ===
$('mic-btn').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){showToast('Speech recognition not supported');return;}
  if(recognition){recognition.stop();recognition=null;$('mic-btn').classList.remove('recording');$('voice-indicator').classList.add('hidden');return;}
  recognition=new SR();recognition.lang='en-IN';recognition.continuous=false;recognition.interimResults=true;
  recognition.onstart=()=>{$('mic-btn').classList.add('recording');$('voice-indicator').classList.remove('hidden');};
  recognition.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;msgInput.value=t;};
  recognition.onend=()=>{$('mic-btn').classList.remove('recording');$('voice-indicator').classList.add('hidden');recognition=null;if(msgInput.value.trim())sendMessage();};
  recognition.onerror=()=>{$('mic-btn').classList.remove('recording');$('voice-indicator').classList.add('hidden');recognition=null;showToast('Voice error. Try again.');};
  recognition.start();
};
$('stop-voice').onclick=()=>{if(recognition)recognition.stop();};

// TTS toggle
ttsEnabled=localStorage.getItem('tts')==='true';
if($('tts-toggle'))$('tts-toggle').checked=ttsEnabled;
if($('tts-toggle'))$('tts-toggle').onchange=()=>{ttsEnabled=$('tts-toggle').checked;localStorage.setItem('tts',ttsEnabled);showToast(ttsEnabled?'🔊 Read aloud enabled':'🔇 Read aloud disabled');};

// New Chat
$('new-chat-btn').onclick=()=>{
  if(chatLog.length>0){const cl=loadConversationList();cl.unshift({title:chatLog[0]?.text?.substring(0,40)||'Chat',time:Date.now(),messages:[...chatLog]});saveConversationList(cl);}
  chatLog=[];saveChatHistory(chatLog);
  chatMsgs.innerHTML='<div class="welcome-card"><div class="welcome-icon"><i class="fas fa-robot"></i></div><h2>Hello! I\'m MediBot AI</h2><p>How can I assist you today?</p><div class="quick-actions"><button class="chip" data-q="I have a headache"><i class="fas fa-head-side-virus"></i>Headache</button><button class="chip" data-q="I have a fever"><i class="fas fa-thermometer-half"></i>Fever</button><button class="chip" data-q="First aid tips"><i class="fas fa-kit-medical"></i>First Aid</button></div></div>';
  document.querySelectorAll('.chip').forEach(c=>{c.onclick=()=>{msgInput.value=c.dataset.q;sendMessage();};});
  navItems.forEach(b=>b.classList.remove('active'));document.querySelector('[data-page="chat"]').classList.add('active');
  pages.forEach(p=>p.classList.remove('active'));$('page-chat').classList.add('active');
  $('topbar-title').textContent='Chat';closeSidebar();showToast('New chat started');renderHistory();
};

// Restore chat on load
if(chatLog.length>0){
  chatMsgs.querySelector('.welcome-card').style.display='none';
  chatLog.forEach(m=>{const d=document.createElement('div');d.className='msg '+m.type;const av=m.type==='bot'?'<div class="msg-avatar"><i class="fas fa-robot"></i></div>':'';const f=m.text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');d.innerHTML=`${av}<div><div class="msg-bubble">${f}</div></div>`;chatMsgs.appendChild(d);});
  chatMsgs.scrollTop=chatMsgs.scrollHeight;
}

// Notifs
$('notif-btn').onclick=()=>notifPanel.classList.toggle('hidden');
$('notif-clear').onclick=()=>{document.querySelector('.notif-list').innerHTML='<p class="empty-state">No notifications</p>';$('notif-btn').querySelector('.badge').style.display='none';};

// Call
$('call-btn').onclick=()=>{callPanel.classList.remove('hidden');let t=0;const iv=setInterval(()=>{t++;$('call-status').textContent=`Connected 00:${String(t).padStart(2,'0')}`;},1000);$('end-call').onclick=()=>{clearInterval(iv);callPanel.classList.add('hidden');};};

// Close notif on outside click
document.addEventListener('click',e=>{if(!notifPanel.classList.contains('hidden')&&!notifPanel.contains(e.target)&&e.target!==$('notif-btn')&&!$('notif-btn').contains(e.target))notifPanel.classList.add('hidden');});

requestNotifPermission();
