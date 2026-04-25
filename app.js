// ===== MediBot AI - App Logic =====
document.addEventListener('DOMContentLoaded', () => {
  // === DOM refs ===
  const $ = id => document.getElementById(id);
  const splash = $('splash-screen'), app = $('app');
  const sidebar = $('sidebar'), overlay = $('sidebar-overlay');
  const chatMsgs = $('chat-messages'), msgInput = $('msg-input');
  const notifPanel = $('notif-panel'), callPanel = $('call-panel');
  const toast = $('toast'), modalOverlay = $('modal-overlay');
  const pages = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.nav-item');
  let attachedImage = null;

  // === Splash ===
  setTimeout(() => { splash.classList.add('fade-out'); setTimeout(() => { splash.classList.add('hidden'); app.classList.remove('hidden'); }, 600); }, 2400);

  // === Sidebar ===
  $('menu-btn').onclick = () => { sidebar.classList.add('open'); overlay.classList.add('show'); };
  const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
  $('close-sidebar').onclick = closeSidebar;
  overlay.onclick = closeSidebar;

  // === Navigation ===
  navItems.forEach(btn => {
    btn.onclick = () => {
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const pg = btn.dataset.page;
      pages.forEach(p => p.classList.remove('active'));
      $('page-' + pg).classList.add('active');
      $('topbar-title').textContent = btn.textContent.trim();
      closeSidebar();
      notifPanel.classList.add('hidden');
    };
  });

  // === Chat - Advanced NLP Medical Engine ===
  const conditions = [
    { id:'headache', keys:['headache','head ache','head pain','migraine','head is paining','head hurts'], score:0, resp:"Based on your description of a **headache**, here are my observations:\n\n🧠 **Common Causes**: Tension, dehydration, stress, lack of sleep, eye strain\n• **Immediate Relief**: Rest in a dark room, stay hydrated, cold compress on forehead\n• **OTC Options**: Paracetamol (Dolo 650) or Ibuprofen (Brufen 400mg)\n\n⚠️ **Seek medical attention if**: Sudden severe onset, accompanied by fever, vision changes, stiff neck, or confusion.\n\nWould you like more specific info?" },
    { id:'headswelling', keys:['head swell','head swelling','swollen head','swelling on head','bump on head','lump on head','head bump','head lump','head swollen'], score:0, resp:"You mentioned **swelling on the head**. This is different from a headache and needs attention:\n\n🩺 **Possible Causes**:\n• Trauma/injury — bump or fall\n• Insect bite or allergic reaction\n• Abscess or infection\n• Lymph node swelling\n• Cyst (sebaceous/dermoid)\n\n🚨 **Immediate Steps**:\n• Apply a **cold compress** for 15-20 minutes\n• Do NOT press or squeeze the swelling\n• Check for signs of concussion (dizziness, nausea, confusion)\n\n🏥 **See a doctor immediately if**: Swelling after head injury, increasing in size, painful, warm to touch, or accompanied by fever/confusion." },
    { id:'fever', keys:['fever','temperature','feverish','chills','high temp','body hot','burning up'], score:0, resp:"Regarding your **fever** symptoms:\n\n🌡️ **Severity Guide**:\n• Mild: 99-100.4°F (37.2-38°C)\n• Moderate: 100.4-103°F (38-39.4°C)\n• High: Above 103°F (39.4°C)\n\n💊 **Management**:\n• Paracetamol (Dolo 650) every 4-6 hrs\n• Stay hydrated — ORS, water, coconut water\n• Light clothing, cool compress on forehead\n• Rest adequately\n\n🏥 See a doctor if fever persists >3 days or exceeds 103°F." },
    { id:'cold', keys:['cold','runny nose','sneezing','nasal congestion','stuffy nose','blocked nose','common cold','cough and cold'], score:0, resp:"For your **cold/congestion** symptoms:\n\n🤧 **Management**:\n• Steam inhalation 2-3 times daily\n• Warm salt water gargle\n• Cetirizine (Cetzine 10mg) for sneezing\n• Stay hydrated with warm fluids\n• Honey + ginger tea for soothing relief\n\n💊 **OTC Options**: Sinarest, Crocin Cold, Vicks Action 500\n\n🏥 See a doctor if: symptoms last >10 days, high fever, or difficulty breathing." },
    { id:'cough', keys:['cough','coughing','dry cough','wet cough','throat irritation','persistent cough'], score:0, resp:"For your **cough** symptoms:\n\n💊 **Dry Cough**: Dextromethorphan syrup, honey + warm water\n💊 **Wet/Productive Cough**: Ambroxol syrup (Mucolite), steam inhalation\n\n🏠 **Home Remedies**:\n• Honey + turmeric milk at bedtime\n• Salt water gargle 3x daily\n• Avoid cold drinks and fried foods\n\n⚠️ See a doctor if: cough lasts >2 weeks, blood in sputum, chest pain, or breathing difficulty." },
    { id:'stomach', keys:['stomach pain','stomach ache','abdominal pain','belly pain','tummy pain','gastric','acidity','gas','bloating','indigestion'], score:0, resp:"For your **stomach/abdominal** issue:\n\n🩺 **Common Causes**: Acidity, gas, indigestion, food poisoning, gastritis\n\n💊 **Relief Options**:\n• Antacid: Pantoprazole (Pan 40) before meals\n• Gas: Simeticone (Gas-O-Fast)\n• Cramps: Mefenamic acid + Dicyclomine (Meftal Spas)\n\n🏠 **Home Care**: Jeera water, ajwain + black salt, light diet, avoid spicy food\n\n🏥 See a doctor if: severe pain, blood in stool, persistent vomiting, or fever." },
    { id:'diarrhea', keys:['diarrhea','loose motion','loose stool','watery stool','dysentery','frequent stool'], score:0, resp:"For **diarrhea/loose motions**:\n\n💊 **Immediate Treatment**:\n• ORS (Electral) — dissolve in 1L water, sip frequently\n• Loperamide (Eldoper 2mg) if no blood/fever\n• Zinc tablets for 14 days\n\n🍚 **Diet**: BRAT diet (Banana, Rice, Applesauce, Toast), curd rice, khichdi\n\n🏥 **See a doctor if**: Blood in stool, high fever, signs of dehydration, or lasts >2 days." },
    { id:'skin', keys:['rash','skin rash','itching','skin itching','hives','eczema','skin allergy','red spots','skin irritation'], score:0, resp:"For your **skin issue**:\n\n🩺 **Common Causes**: Allergy, eczema, fungal infection, heat rash, contact dermatitis\n\n💊 **Treatment Options**:\n• Antihistamine: Cetirizine 10mg (Cetzine) or Fexofenadine (Allegra)\n• Calamine lotion for soothing\n• Antifungal: Clotrimazole cream if fungal\n\n🏠 **Care**: Keep area dry, wear loose cotton clothes, avoid scratching\n\n🏥 See a doctor if: spreading rapidly, pus/oozing, fever, or severe swelling." },
    { id:'backpain', keys:['back pain','lower back','backache','spine pain','back hurts','lumbar pain'], score:0, resp:"For your **back pain**:\n\n💊 **Pain Relief**: Diclofenac (Voveran 50mg) or Aceclofenac+Paracetamol (Zerodol-P) after food\n\n🏠 **Self-Care**:\n• Hot/cold compress alternating\n• Gentle stretching exercises\n• Maintain good posture\n• Sleep on a firm mattress\n\n⚠️ See a doctor if: Pain radiates to legs, numbness/tingling, bladder issues, or after injury." },
    { id:'diabetes', keys:['diabetes','blood sugar','sugar level','diabetic','glucose','insulin','hba1c'], score:0, resp:"Regarding **diabetes**:\n\n📊 **Normal Ranges**:\n• Fasting: 70-100 mg/dL\n• Post-meal (2hr): <140 mg/dL\n• HbA1c: <5.7%\n\n💊 **Common Medications**: Metformin (Glycomet), Glimepiride (Amaryl), Sitagliptin (Januvia)\n\n🥗 **Lifestyle**: Regular exercise, low-sugar diet, monitor regularly, avoid refined carbs\n\n⚠️ Always take medications as prescribed. Never adjust doses without consulting your doctor." },
    { id:'bp', keys:['blood pressure','bp','hypertension','high bp','low bp','bp high','bp low'], score:0, resp:"Regarding **blood pressure**:\n\n📊 **Normal Range**: 120/80 mmHg\n• Stage 1 Hypertension: 130-139/80-89\n• Stage 2: ≥140/90\n\n💊 **Common Medications**: Amlodipine (Amlong 5), Telmisartan (Telma 40), Losartan (Losar 50)\n\n🏠 **Lifestyle**: Reduce salt, exercise 30 min daily, manage stress, limit alcohol\n\n⚠️ If BP >180/120, seek immediate medical attention." },
    { id:'anxiety', keys:['anxiety','anxious','panic','panic attack','nervous','stress','worried','restless','cant sleep','insomnia'], score:0, resp:"For **anxiety/stress** symptoms:\n\n🧘 **Immediate Relief**:\n• Deep breathing: 4-7-8 technique\n• Grounding: Name 5 things you can see, 4 you can touch...\n• Progressive muscle relaxation\n\n💊 **If prescribed**: Follow your doctor's dosage strictly\n\n🏠 **Long-term**: Regular exercise, meditation, limit caffeine, maintain sleep schedule\n\n🏥 **Important**: If you have thoughts of self-harm, call **iCall: 9152987821** or **Vandrevala Foundation: 1860-2662-345** immediately." },
    { id:'drug', keys:['drug info','medicine info','side effect','dosage','interaction','tablet','capsule','syrup'], score:0, resp:"I can help with **drug information**! \n\n💊 **I can assist with**:\n• Drug interaction checks\n• Dosage guidelines\n• Side effect information\n• Generic alternatives\n\nPlease tell me the specific medication name and I'll provide detailed information." },
    { id:'firstaid', keys:['first aid','burn','wound','cut','bleeding','fracture','choking','cpr','sprain','snake bite','dog bite'], score:0, resp:"Here are essential **first aid** tips:\n\n🩹 **Burns**: Cool under running water 10+ min, don't apply ice/toothpaste\n🩸 **Cuts/Bleeding**: Apply firm pressure with clean cloth for 10 min\n🦴 **Fracture/Sprain**: Immobilize, RICE method (Rest, Ice, Compress, Elevate)\n💊 **Choking**: 5 back blows + 5 abdominal thrusts (Heimlich)\n🐍 **Snake Bite**: Keep still, don't suck venom, rush to hospital\n🐕 **Dog Bite**: Wash with soap 10 min, get anti-rabies vaccine ASAP\n\nNeed specific guidance?" },
    { id:'chest', keys:['chest pain','chest tightness','heart pain','heart attack','palpitation','chest pressure'], score:0, resp:"⚠️ **Chest pain can be serious!**\n\n🚨 **Call emergency (112) immediately if**:\n• Crushing/squeezing chest pain\n• Pain spreading to arm, jaw, or back\n• Shortness of breath, sweating, nausea\n\n🩺 **Other causes**: Acidity, muscle strain, anxiety, costochondritis\n\n💊 If suspected heart attack: Chew 1 Aspirin (Ecosprin 325mg) while waiting for help.\n\n**Do not ignore chest pain. Seek immediate medical evaluation.**" },
    { id:'breathing', keys:['breathing difficulty','breathless','shortness of breath','cant breathe','asthma','wheezing'], score:0, resp:"For **breathing difficulty**:\n\n🚨 **Emergency — Call 112 if**: Severe breathlessness, bluish lips/face, unable to speak\n\n💊 **For Asthma**: Use Salbutamol inhaler (Asthalin) — 2 puffs, sit upright\n\n🏠 **Immediate Care**: Sit upright, loosen clothing, stay calm, breathe slowly through pursed lips\n\n🏥 See a doctor if: New-onset breathlessness, worsening despite inhaler, chest pain." },
    { id:'vomiting', keys:['vomiting','nausea','feeling sick','throwing up','morning sickness','vomit'], score:0, resp:"For **nausea/vomiting**:\n\n💊 **Medications**:\n• Ondansetron (Emeset 4mg) — dissolve under tongue\n• Domperidone (Domstal 10mg) before meals\n\n🏠 **Home Care**:\n• Small sips of ORS or ginger water\n• BRAT diet once tolerated\n• Avoid strong smells and greasy food\n\n🏥 See a doctor if: Blood in vomit, severe dehydration, persistent >24 hrs, or after head injury." },
    { id:'eye', keys:['eye pain','eye redness','red eye','eye infection','conjunctivitis','blurry vision','eye irritation','watery eyes'], score:0, resp:"For your **eye symptoms**:\n\n🩺 **Common Causes**: Conjunctivitis, dry eyes, eye strain, allergy, stye\n\n💊 **Relief**:\n• Artificial tears (Refresh Tears) for dryness\n• Cold compress for swelling\n• Antibiotic drops (Moxifloxacin) if infection — prescription needed\n\n🏠 **Care**: Wash hands frequently, don't rub eyes, reduce screen time\n\n🏥 See a doctor if: Vision changes, severe pain, discharge, or injury." },
    { id:'dental', keys:['tooth pain','toothache','dental pain','gum pain','gum bleeding','wisdom tooth','tooth decay','cavity'], score:0, resp:"For **dental/tooth pain**:\n\n💊 **Pain Relief**: Ibuprofen 400mg (Brufen) + Paracetamol 500mg\n\n🏠 **Home Care**:\n• Warm salt water rinse every 2-3 hours\n• Clove oil on cotton ball applied to affected area\n• Cold compress on cheek for swelling\n\n⚠️ See a dentist if: Severe pain, swelling, fever, or pus discharge. Dental issues need professional treatment." },
    { id:'prescription', keys:['prescription','report','medical report','lab report','test result','blood test','x-ray','scan','mri','ct scan'], score:0, resp:"I can help you **understand your medical report/prescription**!\n\n📋 **How to share**:\n• Click the 📎 **attach button** below to upload a photo\n• Take a clear, well-lit photo of your prescription or report\n• I'll analyze the text and explain the medications, dosages, and findings\n\n🔍 **I can help interpret**:\n• Doctor prescriptions & medicine names\n• Blood test reports (CBC, lipid profile, thyroid, etc.)\n• Lab reports and diagnostic findings\n\nPlease attach an image to get started!" }
  ];

  function getResponse(msg) {
    const m = msg.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = m.split(/\s+/);

    // Score each condition by keyword matches
    let best = null, bestScore = 0;
    for (const c of conditions) {
      let score = 0;
      for (const key of c.keys) {
        // Exact phrase match scores higher
        if (m.includes(key)) score += key.split(' ').length * 3;
      }
      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (best && bestScore >= 3) return best.resp;

    return "Thank you for your query. Based on what you've described, I recommend:\n\n1. **Monitor** your symptoms for the next 24-48 hours\n2. **Stay hydrated** and get adequate rest\n3. **Track** any changes or new symptoms\n\nIf symptoms persist or worsen, please consult a healthcare professional.\n\nYou can also:\n• 📎 **Attach a prescription** for me to analyze\n• Ask about specific **medications or symptoms**\n• Check **drug interactions**\n\nCan I help with anything else?";
  }

  function addMsg(text, type, imageData) {
    const wc = chatMsgs.querySelector('.welcome-card');
    if (wc) wc.style.display = 'none';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = 'msg ' + type;
    const avatarHTML = type === 'bot' ? '<div class="msg-avatar"><i class="fas fa-robot"></i></div>' : '';
    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    const imgHTML = imageData ? `<img src="${imageData}" style="max-width:200px;border-radius:8px;margin-bottom:8px;display:block;">` : '';
    div.innerHTML = `${avatarHTML}<div><div class="msg-bubble">${imgHTML}${formatted}</div><div class="msg-time">${time}</div></div>`;
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.id = 'typing-indicator';
    div.innerHTML = '<div class="msg-avatar"><i class="fas fa-robot"></i></div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function sendMessage() {
    const text = msgInput.value.trim();
    const img = attachedImage;
    if (!text && !img) return;
    addMsg(text || '📎 Image attached', 'user', img);
    msgInput.value = '';
    clearAttachment();
    showTyping();

    if (img) {
      // OCR analysis of uploaded image
      const ocrScript = document.createElement('script');
      if (!window.Tesseract) {
        ocrScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        ocrScript.onload = () => processImage(img, text);
        document.head.appendChild(ocrScript);
      } else { processImage(img, text); }
    } else {
      setTimeout(() => {
        const typing = $('typing-indicator');
        if (typing) typing.remove();
        addMsg(getResponse(text), 'bot');
      }, 1200 + Math.random() * 800);
    }
  }

  function processImage(imgData, userText) {
    Tesseract.recognize(imgData, 'eng').then(({ data: { text: ocrText } }) => {
      const typing = $('typing-indicator');
      if (typing) typing.remove();
      const cleanOCR = ocrText.trim();
      if (cleanOCR.length < 5) {
        addMsg("I couldn't read the text clearly from this image. Please try:\n• A clearer, well-lit photo\n• Avoid shadows and glare\n• Ensure text is in focus\n\nOr you can type out the prescription details manually.", 'bot');
      } else {
        let analysis = `📋 **Prescription/Report Analysis**\n\n📝 **Extracted Text:**\n${cleanOCR.substring(0, 500)}\n\n`;
        // Detect medicine names from OCR
        const commonMeds = ['paracetamol','dolo','crocin','azithromycin','amoxicillin','ibuprofen','brufen','cetirizine','pantoprazole','omeprazole','metformin','amlodipine','atorvastatin','aspirin','ciprofloxacin','cefixime','diclofenac','levothyroxine','montelukast','ranitidine','domperidone','vitamin d','calcium','iron','multivitamin','metoprolol','losartan','prednisolone','albendazole','gabapentin'];
        const found = commonMeds.filter(med => cleanOCR.toLowerCase().includes(med));
        if (found.length > 0) {
          analysis += `💊 **Medications Detected**: ${found.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}\n\n`;
          analysis += `✅ **Recommendations**:\n• Take medicines as per the prescribed dosage and timing\n• Complete the full course of antibiotics if prescribed\n• Take pain relievers after food to avoid stomach issues\n• Store medicines in a cool, dry place\n\n`;
        }
        if (userText) analysis += `Regarding your note "${userText}": ${getResponse(userText)}\n\n`;
        analysis += `⚠️ **Disclaimer**: This is an AI-assisted reading. Always verify with your pharmacist or doctor.`;
        addMsg(analysis, 'bot');
      }
    }).catch(() => {
      const typing = $('typing-indicator');
      if (typing) typing.remove();
      addMsg("Sorry, I couldn't process this image. Please try a clearer photo or type the details manually.", 'bot');
    });
  }

  function clearAttachment() {
    attachedImage = null;
    const preview = document.querySelector('.attach-preview');
    if (preview) preview.remove();
  }

  $('send-btn').onclick = sendMessage;
  msgInput.onkeydown = e => { if (e.key === 'Enter') sendMessage(); };

  // Attach button - image upload
  document.querySelector('.attach-btn').onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        attachedImage = ev.target.result;
        // Show preview
        clearAttachment();
        const prev = document.createElement('div');
        prev.className = 'attach-preview';
        prev.innerHTML = `<img src="${attachedImage}" style="max-height:60px;border-radius:6px;border:2px solid var(--accent);"><button class="remove-attach" style="background:var(--bg2);border:none;color:var(--text2);border-radius:50%;width:20px;height:20px;cursor:pointer;margin-left:4px;font-size:12px;">✕</button>`;
        prev.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 12px;';
        document.querySelector('.input-wrapper').before(prev);
        prev.querySelector('.remove-attach').onclick = clearAttachment;
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  };

  // Quick action chips
  document.querySelectorAll('.chip').forEach(c => {
    c.onclick = () => { msgInput.value = c.dataset.q; sendMessage(); };
  });

  // New chat
  $('new-chat-btn').onclick = () => {
    chatMsgs.innerHTML = `<div class="welcome-card"><div class="welcome-icon"><i class="fas fa-robot"></i></div><h2>Hello! I'm MediBot AI</h2><p>I can help with symptom analysis, drug info, and health guidance.</p><div class="quick-actions"><button class="chip" data-q="I have a headache"><i class="fas fa-head-side-virus"></i>Headache</button><button class="chip" data-q="Check drug interactions"><i class="fas fa-pills"></i>Drug Info</button><button class="chip" data-q="I have a fever"><i class="fas fa-thermometer-half"></i>Fever</button><button class="chip" data-q="First aid tips"><i class="fas fa-kit-medical"></i>First Aid</button></div></div>`;
    document.querySelectorAll('.chip').forEach(c => { c.onclick = () => { msgInput.value = c.dataset.q; sendMessage(); }; });
    navItems.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-page="chat"]').classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    $('page-chat').classList.add('active');
    $('topbar-title').textContent = 'Chat';
    closeSidebar();
    showToast('New chat started');
  };

  // === Mic (simulated) ===
  $('mic-btn').onclick = () => {
    $('mic-btn').classList.toggle('active');
    if ($('mic-btn').classList.contains('active')) {
      $('mic-btn').innerHTML = '<i class="fas fa-stop" style="color:var(--accent)"></i>';
      showToast('Listening...');
      setTimeout(() => { $('mic-btn').classList.remove('active'); $('mic-btn').innerHTML = '<i class="fas fa-microphone"></i>'; msgInput.value = 'I have a headache'; showToast('Voice captured!'); }, 2500);
    } else {
      $('mic-btn').innerHTML = '<i class="fas fa-microphone"></i>';
    }
  };

  // === Notifications ===
  $('notif-btn').onclick = () => notifPanel.classList.toggle('hidden');
  $('notif-clear').onclick = () => { document.querySelector('.notif-list').innerHTML = '<p style="text-align:center;color:var(--text2);padding:40px">No notifications</p>'; $('notif-btn').querySelector('.badge').style.display = 'none'; };

  // === Call Panel ===
  $('call-btn').onclick = () => { callPanel.classList.remove('hidden'); let t = 0; const iv = setInterval(() => { t++; $('call-status').textContent = `Connected 00:${String(t).padStart(2,'0')}`; }, 1000); $('end-call').onclick = () => { clearInterval(iv); callPanel.classList.add('hidden'); }; };

  // === Theme Toggle ===
  $('theme-toggle').onchange = () => {
    const theme = $('theme-toggle').checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    showToast(theme === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
  };
  const saved = localStorage.getItem('theme');
  if (saved) { document.documentElement.setAttribute('data-theme', saved); $('theme-toggle').checked = saved === 'dark'; }

  // === Accent Colors ===
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.onclick = () => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      document.documentElement.style.setProperty('--accent', dot.dataset.color);
      document.documentElement.style.setProperty('--accent-glow', dot.dataset.color + '40');
      localStorage.setItem('accent', dot.dataset.color);
      showToast('Accent color updated!');
    };
  });
  const savedAccent = localStorage.getItem('accent');
  if (savedAccent) { document.documentElement.style.setProperty('--accent', savedAccent); document.documentElement.style.setProperty('--accent-glow', savedAccent + '40'); document.querySelectorAll('.color-dot').forEach(d => { d.classList.toggle('active', d.dataset.color === savedAccent); }); }

  // === Font Size ===
  $('font-size-select').onchange = () => { document.documentElement.style.fontSize = $('font-size-select').value + 'px'; showToast('Font size updated'); };

  // === Wallpaper ===
  const wallpapers = ['#1a1a28','linear-gradient(135deg,#0a0a1a,#1a103a)','linear-gradient(135deg,#0d1117,#161b22)','linear-gradient(135deg,#1a0a2e,#2d1b69)','linear-gradient(135deg,#0a1628,#1a3a5c)','linear-gradient(135deg,#1a0a0a,#3a1a1a)'];
  const wpModal = $('wallpaper-modal');
  const wpGrid = $('wallpaper-grid');
  wallpapers.forEach((wp, i) => {
    const d = document.createElement('div');
    d.className = 'wallpaper-opt' + (i === 0 ? ' active' : '');
    d.style.background = wp;
    d.onclick = () => {
      document.querySelectorAll('.wallpaper-opt').forEach(o => o.classList.remove('active'));
      d.classList.add('active');
      chatMsgs.style.background = wp;
      showToast('Wallpaper applied!');
      wpModal.classList.add('hidden');
    };
    wpGrid.appendChild(d);
  });
  $('wallpaper-btn').onclick = () => wpModal.classList.remove('hidden');
  document.querySelector('.wallpaper-close').onclick = () => wpModal.classList.add('hidden');

  // === Modals ===
  function openModal(title, bodyHTML, footerHTML) { $('modal-title').textContent = title; $('modal-body').innerHTML = bodyHTML; $('modal-footer').innerHTML = footerHTML || ''; modalOverlay.classList.remove('hidden'); }
  function closeModal() { modalOverlay.classList.add('hidden'); }
  $('modal-close').onclick = closeModal;
  modalOverlay.onclick = e => { if (e.target === modalOverlay) closeModal(); };

  // Edit Profile
  $('edit-profile-btn').onclick = () => {
    openModal('Edit Profile',
      `<div class="form-group"><label>Full Name</label><input class="form-input" id="edit-name" value="KS Kasyap"></div><div class="form-group"><label>Email</label><input class="form-input" id="edit-email" value="kskasyap@email.com"></div><div class="form-group"><label>Phone</label><input class="form-input" id="edit-phone" value="+91 98765 43210"></div>`,
      `<button class="btn-sm" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button><button class="btn-primary-full" id="save-profile" style="width:auto;padding:10px 24px">Save</button>`
    );
    setTimeout(() => {
      $('save-profile').onclick = () => {
        const name = $('edit-name').value;
        $('sidebar-name').textContent = name; $('settings-name').textContent = name;
        $('settings-email').textContent = $('edit-email').value;
        const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        $('sidebar-avatar').textContent = initials; $('settings-avatar').textContent = initials;
        closeModal(); showToast('Profile updated!');
      };
    }, 100);
  };

  // Edit emergency / doctor
  $('edit-emergency-btn').onclick = () => {
    openModal('Emergency Contact', '<div class="form-group"><label>Phone Number</label><input class="form-input" id="edit-emer-num" value="+91 112"></div>',
      `<button class="btn-sm" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button><button class="btn-primary-full" id="save-emer" style="width:auto;padding:10px 24px">Save</button>`);
    setTimeout(() => { $('save-emer').onclick = () => { $('emergency-num').textContent = $('edit-emer-num').value; closeModal(); showToast('Emergency contact updated!'); }; }, 100);
  };
  $('edit-doctor-btn').onclick = () => {
    openModal('My Doctor', '<div class="form-group"><label>Doctor Phone</label><input class="form-input" id="edit-doc-num" value="+91 98765 43210"></div>',
      `<button class="btn-sm" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button><button class="btn-primary-full" id="save-doc" style="width:auto;padding:10px 24px">Save</button>`);
    setTimeout(() => { $('save-doc').onclick = () => { $('doctor-num').textContent = $('edit-doc-num').value; closeModal(); showToast('Doctor contact updated!'); }; }, 100);
  };

  // Find hospital
  $('find-hospital-btn').onclick = () => {
    showToast('📍 Locating nearest hospital...');
    setTimeout(() => openModal('Nearest Hospitals', `<div class="history-item" style="margin-bottom:8px"><div class="history-icon"><i class="fas fa-hospital"></i></div><div class="history-info"><div class="history-title">AIIMS Hospital</div><div class="history-time">2.3 km away</div></div></div><div class="history-item" style="margin-bottom:8px"><div class="history-icon"><i class="fas fa-hospital"></i></div><div class="history-info"><div class="history-title">Apollo Hospital</div><div class="history-time">4.1 km away</div></div></div><div class="history-item"><div class="history-icon"><i class="fas fa-hospital"></i></div><div class="history-info"><div class="history-title">Max Hospital</div><div class="history-time">5.7 km away</div></div></div>`, ''), 1200);
  };

  // Ambulance
  $('call-ambulance-btn').onclick = () => { $('call-number').textContent = '+91 108'; callPanel.classList.remove('hidden'); let t = 0; const iv = setInterval(() => { t++; $('call-status').textContent = `Connected 00:${String(t).padStart(2,'0')}`; }, 1000); $('end-call').onclick = () => { clearInterval(iv); callPanel.classList.add('hidden'); }; };

  // Change PIN
  $('change-pin-btn').onclick = () => {
    openModal('Change PIN', '<div class="form-group"><label>Current PIN</label><input class="form-input" type="password" maxlength="4" placeholder="••••"></div><div class="form-group"><label>New PIN</label><input class="form-input" type="password" maxlength="4" placeholder="••••"></div><div class="form-group"><label>Confirm PIN</label><input class="form-input" type="password" maxlength="4" placeholder="••••"></div>',
      `<button class="btn-sm" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button><button class="btn-primary-full" style="width:auto;padding:10px 24px" onclick="document.getElementById('modal-overlay').classList.add('hidden');document.getElementById('toast').textContent='PIN updated!';document.getElementById('toast').classList.remove('hidden');setTimeout(()=>document.getElementById('toast').classList.add('hidden'),2500)">Update</button>`);
  };

  // Clear history
  $('clear-history-btn').onclick = () => { $('history-list').innerHTML = '<p style="text-align:center;color:var(--text2);padding:40px">No chat history</p>'; showToast('History cleared'); };

  // Clear cache
  $('clear-cache-btn').onclick = () => showToast('Cache cleared! Freed 12.3 MB');

  // Logout
  $('logout-btn').onclick = () => {
    openModal('Log Out', '<p style="text-align:center;padding:12px">Are you sure you want to log out?</p>',
      `<button class="btn-sm" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button><button class="btn-sm danger" onclick="document.getElementById('modal-overlay').classList.add('hidden');document.getElementById('toast').textContent='Logged out successfully';document.getElementById('toast').classList.remove('hidden');setTimeout(()=>document.getElementById('toast').classList.add('hidden'),2500)">Log Out</button>`);
  };

  // === Toast ===
  function showToast(msg) { toast.textContent = msg; toast.classList.remove('hidden'); clearTimeout(window._toastT); window._toastT = setTimeout(() => toast.classList.add('hidden'), 2500); }

  // Close notif panel on outside click
  document.addEventListener('click', e => { if (!notifPanel.classList.contains('hidden') && !notifPanel.contains(e.target) && e.target !== $('notif-btn') && !$('notif-btn').contains(e.target)) notifPanel.classList.add('hidden'); });
});
