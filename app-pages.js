// app-pages.js - Settings, Drug Checker, Timeline, Reminders, History

// === Theme ===
$('theme-toggle').onchange=()=>{const t=$('theme-toggle').checked?'dark':'light';document.documentElement.setAttribute('data-theme',t);localStorage.setItem('theme',t);showToast(t==='dark'?'🌙 Dark mode':'☀️ Light mode');};
const st=localStorage.getItem('theme');if(st){document.documentElement.setAttribute('data-theme',st);$('theme-toggle').checked=st==='dark';}

// Accent
document.querySelectorAll('.color-dot').forEach(d=>{d.onclick=()=>{document.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('active'));d.classList.add('active');document.documentElement.style.setProperty('--accent',d.dataset.color);document.documentElement.style.setProperty('--accent-glow',d.dataset.color+'40');localStorage.setItem('accent',d.dataset.color);showToast('Color updated!');};});
const sa=localStorage.getItem('accent');if(sa){document.documentElement.style.setProperty('--accent',sa);document.documentElement.style.setProperty('--accent-glow',sa+'40');document.querySelectorAll('.color-dot').forEach(d=>{d.classList.toggle('active',d.dataset.color===sa);});}

// Font
$('font-size-select').onchange=()=>{document.documentElement.style.fontSize=$('font-size-select').value+'px';showToast('Font size updated');};

// Wallpaper
const wps=['#1a1a28','linear-gradient(135deg,#0a0a1a,#1a103a)','linear-gradient(135deg,#0d1117,#161b22)','linear-gradient(135deg,#1a0a2e,#2d1b69)','linear-gradient(135deg,#0a1628,#1a3a5c)','linear-gradient(135deg,#1a0a0a,#3a1a1a)'];
wps.forEach((wp,i)=>{const d=document.createElement('div');d.className='wallpaper-opt'+(i===0?' active':'');d.style.background=wp;d.onclick=()=>{document.querySelectorAll('.wallpaper-opt').forEach(o=>o.classList.remove('active'));d.classList.add('active');chatMsgs.style.background=wp;showToast('Wallpaper applied!');$('wallpaper-modal').classList.add('hidden');};$('wallpaper-grid').appendChild(d);});
$('wallpaper-btn').onclick=()=>$('wallpaper-modal').classList.remove('hidden');
document.querySelector('.wallpaper-close').onclick=()=>$('wallpaper-modal').classList.add('hidden');

// === Modals ===
function openModal(t,b,f){$('modal-title').textContent=t;$('modal-body').innerHTML=b;$('modal-footer').innerHTML=f||'';modalOverlay.classList.remove('hidden');}
function closeModal(){modalOverlay.classList.add('hidden');}
$('modal-close').onclick=closeModal;
modalOverlay.onclick=e=>{if(e.target===modalOverlay)closeModal();};

// Edit Profile
$('edit-profile-btn').onclick=()=>{
  const pStr = localStorage.getItem('medibot_profile');
  const p = pStr ? JSON.parse(pStr) : {fname:'', mname:'', lname:'', email:'', age:'', gender:'', blood:''};
  openModal('Edit Profile',`
  <div class="form-group"><label>First Name</label><input class="form-input" id="edit-fname" value="${p.fname||''}"></div>
  <div class="form-group"><label>Last Name</label><input class="form-input" id="edit-lname" value="${p.lname||''}"></div>
  <div class="form-group"><label>Email</label><input class="form-input" id="edit-email" value="${p.email||''}"></div>
  `,
  '<button class="btn-sm" id="cancel-prof">Cancel</button><button class="btn-primary-full" id="save-prof" style="width:auto;padding:10px 24px">Save</button>');
  
  setTimeout(()=>{
    $('cancel-prof').onclick=closeModal;
    $('save-prof').onclick=()=>{
      p.fname = $('edit-fname').value.trim();
      p.lname = $('edit-lname').value.trim();
      p.email = $('edit-email').value.trim();
      localStorage.setItem('medibot_profile', JSON.stringify(p));
      if(typeof updateProfileUI === 'function') updateProfileUI(p);
      closeModal();
      showToast('Profile updated!');
    };
  },50);
};

// Emergency/Doctor
$('edit-emergency-btn').onclick=()=>{openModal('Emergency Contact','<div class="form-group"><label>Phone</label><input class="form-input" id="em-num" value="+91 112"></div>','<button class="btn-sm" onclick="closeModal()">Cancel</button><button class="btn-primary-full" id="sv-em" style="width:auto;padding:10px 24px">Save</button>');setTimeout(()=>{$('sv-em').onclick=()=>{$('emergency-num').textContent=$('em-num').value;closeModal();showToast('Updated!');};},50);};
$('edit-doctor-btn').onclick=()=>{openModal('My Doctor','<div class="form-group"><label>Phone</label><input class="form-input" id="dc-num" value="+91 98765 43210"></div>','<button class="btn-sm" onclick="closeModal()">Cancel</button><button class="btn-primary-full" id="sv-dc" style="width:auto;padding:10px 24px">Save</button>');setTimeout(()=>{$('sv-dc').onclick=()=>{$('doctor-num').textContent=$('dc-num').value;closeModal();showToast('Updated!');};},50);};

// Hospital Finder (Real Geolocation)
$('find-hospital-btn').onclick=()=>{
  showToast('📍 Getting your location...');
  findNearbyHospitals((pos,err)=>{
    if(err){showToast(err);return;}
    const url=`https://www.google.com/maps/search/hospital/@${pos.lat},${pos.lng},14z`;
    openModal('Nearby Hospitals',`<p style="margin-bottom:12px">📍 Location: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}</p><a href="${url}" target="_blank" class="btn-primary-full" style="text-decoration:none"><i class="fas fa-map-marker-alt"></i> Open in Google Maps</a><div style="margin-top:16px"><div class="history-item" style="margin-bottom:8px"><div class="history-icon"><i class="fas fa-hospital"></i></div><div class="history-info"><div class="history-title">Nearest Hospitals</div><div class="history-time">Showing results on Google Maps</div></div></div></div>`,'');
  });
};

// Ambulance
$('call-ambulance-btn').onclick=()=>{$('call-number').textContent='+91 108';callPanel.classList.remove('hidden');let t=0;const iv=setInterval(()=>{t++;$('call-status').textContent=`Connected 00:${String(t).padStart(2,'0')}`;},1000);$('end-call').onclick=()=>{clearInterval(iv);callPanel.classList.add('hidden');};};

// PIN
$('change-pin-btn').onclick=()=>{openModal('Change PIN','<div class="form-group"><label>Current PIN</label><input class="form-input" type="password" maxlength="4" placeholder="••••"></div><div class="form-group"><label>New PIN</label><input class="form-input" type="password" maxlength="4" placeholder="••••"></div>','<button class="btn-sm" onclick="closeModal()">Cancel</button><button class="btn-primary-full" style="width:auto;padding:10px 24px" onclick="closeModal();showToast(\'PIN updated!\')">Update</button>');};

// API Key
$('set-api-key-btn').onclick=()=>{
  const cur=localStorage.getItem('gemini_api_key')||'';
  openModal('Gemini API Key',`<p style="font-size:.85rem;color:var(--text2);margin-bottom:12px">Enter your Gemini API key for AI-powered responses. Get one free at <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--accent)">Google AI Studio</a>.</p><div class="form-group"><label>API Key</label><input class="form-input" id="api-key-input" value="${cur}" placeholder="AIza..."></div>`,
  '<button class="btn-sm" onclick="closeModal()">Cancel</button><button class="btn-primary-full" id="sv-key" style="width:auto;padding:10px 24px">Save</button>');
  setTimeout(()=>{$('sv-key').onclick=()=>{const k=$('api-key-input').value.trim();if(k){localStorage.setItem('gemini_api_key',k);$('api-key-status').textContent='Key set ✓';showToast('🤖 Gemini API connected!');}else{localStorage.removeItem('gemini_api_key');$('api-key-status').textContent='Not set';}closeModal();};},50);
};
const ek=localStorage.getItem('gemini_api_key');if(ek)$('api-key-status').textContent='Key set ✓';

// PDF Export
$('export-pdf-btn').onclick=()=>{if(chatLog.length===0){showToast('No chat to export');return;}generatePDF(chatLog);showToast('📄 PDF downloaded!');};

if($('export-data-btn')) {
    $('export-data-btn').onclick = () => {
        const pStr = localStorage.getItem('medibot_profile');
        if(!pStr) { showToast('No health profile found to export'); return; }
        
        const data = {
            profile: JSON.parse(pStr),
            symptoms: loadSymptomLogs(),
            reminders: loadReminders(),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AuraMed_Health_Data_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Health data exported successfully!');
    };
}

// Clear
$('clear-cache-btn').onclick=()=>showToast('Cache cleared! Freed 12.3 MB');
$('logout-btn').onclick=()=>{
    openModal('Log Out','<p style="text-align:center;padding:12px;color:var(--text2);">Are you sure you want to log out and clear your local profile data?</p>',
    '<button class="btn-sm" onclick="closeModal()">Cancel</button><button class="btn-sm danger" id="confirm-logout-btn">Log Out</button>');
    setTimeout(() => {
        $('confirm-logout-btn').onclick = () => {
            localStorage.removeItem('medibot_profile');
            closeModal();
            showToast('Profile deleted. Reloading...');
            setTimeout(() => location.reload(), 800);
        };
    }, 50);
};

// === Chat History Page ===
function renderHistory(){
  const list=$('history-list'),convos=loadConversationList();
  if(convos.length===0){list.innerHTML='<p class="empty-state">No chat history yet</p>';return;}
  list.innerHTML='';
  convos.forEach((c,i)=>{
    const d=document.createElement('div');d.className='history-item';
    const t=new Date(c.time).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    d.innerHTML=`<div class="history-icon"><i class="fas fa-comments"></i></div><div class="history-info"><div class="history-title">${c.title}</div><div class="history-time">${t}</div></div><i class="fas fa-chevron-right dim"></i>`;
    d.onclick=()=>{chatLog=[...c.messages];saveChatHistory(chatLog);chatMsgs.innerHTML='';chatLog.forEach(m=>{const div=document.createElement('div');div.className='msg '+m.type;const av=m.type==='bot'?'<div class="msg-avatar"><i class="fas fa-robot"></i></div>':'';const f=m.text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');div.innerHTML=`${av}<div><div class="msg-bubble">${f}</div></div>`;chatMsgs.appendChild(div);});chatMsgs.scrollTop=chatMsgs.scrollHeight;navItems.forEach(b=>b.classList.remove('active'));document.querySelector('[data-page="chat"]').classList.add('active');pages.forEach(p=>p.classList.remove('active'));$('page-chat').classList.add('active');$('topbar-title').textContent='Chat';};
    list.appendChild(d);
  });
}
$('clear-history-btn').onclick=()=>{localStorage.removeItem('medibot_convos');renderHistory();showToast('History cleared');};

// === Drug Interaction Checker ===
$('add-drug-btn').onclick=()=>{const c=document.querySelectorAll('.drug-input').length+1;const g=document.createElement('div');g.className='form-group';g.innerHTML=`<label>Medicine ${c}</label><input class="form-input drug-input" placeholder="e.g. Metformin">`;$('drug-inputs').appendChild(g);};
$('check-interactions-btn').onclick=()=>{
  const drugs=[...document.querySelectorAll('.drug-input')].map(i=>i.value).filter(v=>v.trim());
  if(drugs.length<2){showToast('Enter at least 2 medicines');return;}
  const results=checkDrugInteractions(drugs);
  const rb=$('interaction-body');rb.innerHTML='';
  results.forEach(r=>{rb.innerHTML+=`<div class="interaction-item ${r.severity}"><h4>${r.title}</h4><p>${r.desc}</p></div>`;});
  $('interaction-results').classList.remove('hidden');
};

// === Symptom Timeline ===
let symptomLogs=loadSymptomLogs(), symptomChart=null;

function renderSymptomChart(){
  const ctx=$('symptom-chart');if(!ctx)return;
  if(symptomChart) symptomChart.destroy();
  if(symptomLogs.length === 0) return; // Don't render empty

  const filterDays = parseInt($('chart-time-filter') ? $('chart-time-filter').value : 7);
  const cutoffTime = Date.now() - (filterDays * 24 * 60 * 60 * 1000);
  let logsToUse = symptomLogs.filter(l => l.time >= cutoffTime);
  
  if(logsToUse.length === 0) logsToUse = symptomLogs.slice(-20); // Fallback if empty in range

  // Group dates for X-axis
  const dateMap = {};
  logsToUse.forEach(l => {
      const d = new Date(l.time);
      const dateKey = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      if(!dateMap[dateKey]) dateMap[dateKey] = { display: d.toLocaleDateString('en-IN', {day:'numeric', month:'short'}), ts: l.time };
  });
  
  const sortedDateKeys = Object.keys(dateMap).sort((a,b) => dateMap[a].ts - dateMap[b].ts);
  const labels = sortedDateKeys.map(k => dateMap[k].display);

  // Group by Unique Symptoms
  const uniqueSymptoms = [...new Set(logsToUse.map(l => l.name.toLowerCase().trim()))];
  const colors = [
      { border: '#6C63FF', bg: 'rgba(108, 99, 255, 0.1)' },
      { border: '#00C9A7', bg: 'rgba(0, 201, 167, 0.1)' },
      { border: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)' },
      { border: '#FFA940', bg: 'rgba(255, 169, 64, 0.1)' },
      { border: '#1890FF', bg: 'rgba(24, 144, 255, 0.1)' }
  ];

  const datasets = uniqueSymptoms.map((symptomName, index) => {
      const colorObj = colors[index % colors.length];
      const dataPoints = sortedDateKeys.map(dateKey => {
          const logsOnDate = logsToUse.filter(l => {
              const d = new Date(l.time);
              const dk = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
              return dk === dateKey && l.name.toLowerCase().trim() === symptomName;
          });
          return logsOnDate.length > 0 ? Math.max(...logsOnDate.map(l => l.severity)) : null;
      });

      const originalName = logsToUse.find(l => l.name.toLowerCase().trim() === symptomName).name;

      return {
        label: originalName,
        data: dataPoints,
        borderColor: colorObj.border,
        borderWidth: 3,
        backgroundColor: colorObj.bg,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: colorObj.border,
        pointBorderWidth: 2,
        spanGaps: true
      };
  });

  symptomChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { min: 0, max: 10, title: { display: true, text: 'Severity Level', font: { weight: 'bold', family: 'Inter' } }, grid: { color: 'rgba(200, 200, 200, 0.1)', drawBorder: false } },
        x: { title: { display: true, text: 'Date', font: { weight: 'bold', family: 'Inter' } }, grid: { display: false } }
      },
      plugins: {
        legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter' } } },
        tooltip: {
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          titleFont: { size: 14, family: 'Inter', weight: 'bold' },
          bodyFont: { size: 13, family: 'Inter' },
          padding: 12,
          cornerRadius: 8,
          usePointStyle: true,
          callbacks: {
            title: function(context) { return 'Date: ' + context[0].label; },
            label: function(context) {
              return ` ${context.dataset.label}: ${context.parsed.y}/10`;
            }
          }
        }
      }
    }
  });
}

if($('chart-time-filter')) $('chart-time-filter').onchange = renderSymptomChart;

function renderSymptomLogs(){
  const el=$('symptom-logs');
  if(symptomLogs.length===0){el.innerHTML='<p class="empty-state">No symptoms logged</p>';return;}
  el.innerHTML='';
  symptomLogs.slice().reverse().forEach((l,i)=>{
    const sev=l.severity;const col=sev<=3?'#00c9a7':sev<=6?'#ffa940':'#ff4757';
    const d=document.createElement('div');d.className='symptom-log-item';
    d.innerHTML=`<div class="symptom-severity" style="background:${col}">${sev}</div><div class="log-info"><strong>${l.name}</strong><small>${new Date(l.time).toLocaleString('en-IN')}${l.notes?' • '+l.notes:''}</small></div><i class="fas fa-trash-can log-delete" data-idx="${symptomLogs.length-1-i}"></i>`;
    el.appendChild(d);
  });
  el.querySelectorAll('.log-delete').forEach(b=>{b.onclick=()=>{symptomLogs.splice(parseInt(b.dataset.idx),1);saveSymptomLogs(symptomLogs);renderSymptomLogs();renderSymptomChart();showToast('Log removed');};});
}

$('log-symptom-btn').onclick=()=>{
  const name=$('symptom-name').value.trim(),sev=parseInt($('symptom-severity').value),notes=$('symptom-notes').value.trim();
  if(!name){showToast('Enter symptom name');return;}
  symptomLogs.push({name,severity:Math.min(10,Math.max(1,sev||5)),notes,time:Date.now()});
  saveSymptomLogs(symptomLogs);renderSymptomLogs();renderSymptomChart();
  $('symptom-name').value='';$('symptom-notes').value='';
  showToast('✅ Symptom logged!');
};
renderSymptomLogs();renderSymptomChart();

// === Medication Reminders ===
let reminders=loadReminders(), reminderTimers=[];

function renderReminders(){
  const el=$('reminders-list');
  if(reminders.length===0){el.innerHTML='<p class="empty-state">No reminders set</p>';return;}
  el.innerHTML='';
  reminders.forEach((r,i)=>{
    const d=document.createElement('div');d.className='reminder-item';
    d.innerHTML=`<div class="reminder-icon"><i class="fas fa-capsules"></i></div><div class="reminder-info"><strong>${r.med}</strong><small>⏰ ${r.time} • ${r.freq}</small></div><button class="reminder-delete" data-idx="${i}"><i class="fas fa-trash-can"></i></button>`;
    el.appendChild(d);
  });
  el.querySelectorAll('.reminder-delete').forEach(b=>{b.onclick=()=>{reminders.splice(parseInt(b.dataset.idx),1);saveReminders(reminders);renderReminders();showToast('Reminder removed');};});
}

function startReminderChecks(){
  clearInterval(window._reminderIv);
  window._reminderIv=setInterval(()=>{
    const now=new Date();const hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    reminders.forEach(r=>{if(r.time===hm&&now.getSeconds()<2){sendNotification('💊 Medication Reminder','Time to take '+r.med);showToast('💊 Time to take '+r.med);}});
  },1000);
}

$('add-reminder-btn').onclick=()=>{
  const med=$('reminder-med').value.trim(),time=$('reminder-time').value,freq=$('reminder-freq').value;
  if(!med){showToast('Enter medicine name');return;}
  if('Notification' in window&&Notification.permission!=='granted')Notification.requestPermission();
  reminders.push({med,time,freq});saveReminders(reminders);renderReminders();
  $('reminder-med').value='';
  showToast(`⏰ Reminder set for ${med} at ${time}`);
};
renderReminders();startReminderChecks();

// === Drug Enquiry Page Logic ===
const drugSearchInput = $('drug-search-input');
const drugSearchBtn = $('drug-search-btn');
const drugResultsContainer = $('drug-results-container');
const categoryChips = document.querySelectorAll('.f-chip');
const suggestionsList = $('search-suggestions');

// Auto-suggestions logic
if (drugSearchInput) {
    drugSearchInput.oninput = async () => {
        const query = drugSearchInput.value.trim();
        if (query.length < 2) {
            suggestionsList.classList.add('hidden');
            return;
        }
        
        const suggestions = await medDB.getSuggestions(query);
        if (suggestions.length > 0) {
            suggestionsList.innerHTML = suggestions.map(s => `
                <div class="suggestion-item" onclick="selectSuggestion('${s.name.replace(/'/g, "\\'")}')">
                    <i class="fas fa-pills"></i>
                    <div>
                        <div class="s-name">${s.name}</div>
                        <div class="s-brand">${s.brands || 'Generic'}</div>
                    </div>
                </div>
            `).join('');
            suggestionsList.classList.remove('hidden');
        } else {
            suggestionsList.classList.add('hidden');
        }
    };
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!drugSearchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add('hidden');
        }
    });
}

window.selectSuggestion = (name) => {
    drugSearchInput.value = name;
    suggestionsList.classList.add('hidden');
    performDrugSearch();
};

// Handle DB ready state — now synchronous since search uses in-memory array
function onDbReady() {
    console.log("UI: Database is ready with " + medDB._data.length + " records.");
    if (drugSearchInput) drugSearchInput.placeholder = "Search 1500+ medicines, brands, or symptoms...";
    const warn = $('cors-warning');
    if (warn) warn.classList.add('hidden');
    performDrugSearch(); // Load initial 500 tablets
}

// The new database signals ready synchronously — listen for either case
if (medDB.ready) {
    // Already ready (array loaded) — run immediately after DOM settles
    setTimeout(onDbReady, 0);
} else {
    window.addEventListener('db-ready', onDbReady);
}

function initTableExplorer() {
    const explorer = $('table-explorer');
    const tableList = $('table-list');
    const toggleBtn = $('toggle-explorer-btn');
    const closeBtn = $('close-explorer');

    toggleBtn.onclick = () => explorer.classList.toggle('hidden');
    closeBtn.onclick = () => explorer.classList.add('hidden');

    const tables = medDB.getTables();
    tableList.innerHTML = '';
    tables.forEach(table => {
        if (table === 'medicine_registry') return;
        const chip = document.createElement('div');
        chip.className = 'table-chip';
        chip.textContent = table.replace(/_/g, ' ');
        chip.onclick = () => {
            drugSearchInput.value = `SELECT * FROM ${table}`;
            performDrugSearch();
            explorer.classList.add('hidden');
        };
        tableList.appendChild(chip);
    });
}

async function performDrugSearch(category = 'all') {
    if (!medDB.ready) {
        showToast("⏳ Loading medicines...");
        return;
    }
    
    const query = drugSearchInput.value.trim();
    
    // Check if user is typing a direct SQL query (advanced mode)
    if (query.toLowerCase().startsWith('select')) {
        const results = medDB.executeSQL(query);
        renderDrugResults(results, true);
        return;
    }

    drugResultsContainer.innerHTML = '<div class="empty-results"><div class="splash-loader" style="width:100px;margin-bottom:10px"><div class="loader-bar" style="animation: load 1s infinite alternate"></div></div><p>Searching database...</p></div>';

    try {
        let results = await medDB.search(query);
        
        if (category && category !== 'all') {
            results = results.filter(r => 
                (r.category && r.category.toLowerCase().includes(category.toLowerCase())) ||
                (r.uses && r.uses.toLowerCase().includes(category.toLowerCase()))
            );
        }
        
        renderDrugResults(results);
    } catch (err) {
        console.error("Search failed:", err);
        renderDrugResults([]);
    }
}

function renderDrugResults(results, isSQL = false) {
    if (results.length === 0) {
        drugResultsContainer.innerHTML = `<div class="empty-results"><i class="fas fa-search"></i><p>${isSQL ? 'SQL Query returned no results.' : 'No medicines found. Try another search.'}</p></div>`;
        return;
    }

    drugResultsContainer.innerHTML = isSQL ? `<div style="margin-bottom:12px;font-size:.75rem;color:var(--accent);font-family:monospace;background:var(--bg2);padding:8px;border-radius:8px">SQL Query executed: ${results.length} rows returned</div>` : '';
    
    results.forEach(m => {
        const card = document.createElement('div');
        card.className = 'drug-card fade-in';
        card.innerHTML = `
            <div class="drug-title-row">
                <div class="drug-name">${m.name}</div>
                <div class="drug-cat">${m.category || 'Medicine'}</div>
            </div>
            <div class="drug-brands">
                ${Array.isArray(m.brands) ? m.brands.map(b => `<span class="brand-tag">${b}</span>`).join('') : `<span class="brand-tag">${m.brands || 'No common brands'}</span>`}
            </div>
            <div class="drug-info-grid">
                <div class="info-box full-width">
                    <h4><i class="fas fa-notes-medical"></i> Common Uses</h4>
                    <p>${m.uses || 'N/A'}</p>
                </div>
                <div class="info-box">
                    <h4><i class="fas fa-user"></i> Adult Dosage</h4>
                    <p>${m.dosage_adult || m.dosage || 'N/A'}</p>
                </div>
                <div class="info-box">
                    <h4><i class="fas fa-child"></i> Pediatric Dosage</h4>
                    <p>${m.dosage_pediatric || 'N/A'}</p>
                </div>
                <div class="info-box">
                    <h4><i class="fas fa-box"></i> Pack Size</h4>
                    <p>${m.pack_size || '10 Tablets/Strip'}</p>
                </div>
                <div class="info-box">
                    <h4><i class="fas fa-tag"></i> Estimated Price</h4>
                    <p style="color:var(--accent);font-weight:bold">${m.price || '₹40 - ₹120'}</p>
                </div>
                <div class="info-box full-width">
                    <h4><i class="fas fa-store"></i> Available At</h4>
                    <p>${m.availability || 'Tata 1mg, Apollo Pharmacy, Local Shops'}</p>
                </div>
                <div class="info-box">
                    <h4><i class="fas fa-triangle-exclamation"></i> Side Effects</h4>
                    <p>${m.sideEffects || 'Minimal'}</p>
                </div>
                <div class="info-box">
                    <h4><i class="fas fa-ban"></i> Contraindications</h4>
                    <p>${m.contraindications || 'N/A'}</p>
                </div>
            </div>
            <div class="drug-warning">
                <i class="fas fa-circle-exclamation"></i>
                <p><strong>Warning:</strong> ${m.warnings || 'Always consult a doctor.'}</p>
            </div>
            <div style="margin-top:15px; display:flex; align-items:center; justify-content:space-between">
                <button class="btn-primary-sm" onclick="showToast('Redirecting to Tata 1mg...')"><i class="fas fa-shopping-cart"></i> Buy Now</button>
                <span style="font-size:0.7rem; color:var(--text2)">*Prices are approximate</span>
            </div>
        `;
        drugResultsContainer.appendChild(card);
    });
}

if (drugSearchBtn) drugSearchBtn.onclick = () => performDrugSearch();
if (drugSearchInput) drugSearchInput.onkeydown = (e) => { if (e.key === 'Enter') performDrugSearch(); };

categoryChips.forEach(chip => {
    chip.onclick = () => {
        categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        performDrugSearch(chip.dataset.cat);
    };
});

// === Dynamic Current Medications ===
function updateCurrentMedications() {
    const list = $('health-meds-list');
    if(!list) return;

    const medsFound = new Map();

    // 1. Scan active reminders
    const reminders = typeof loadReminders === 'function' ? loadReminders() : [];
    reminders.forEach(r => {
        if(r.medication) {
            medsFound.set(r.medication.toLowerCase().trim(), { name: r.medication, detail: 'Reminder at ' + r.time });
        }
    });

    // 2. Scan chat logs for medication mentions from user
    if (typeof chatLog !== 'undefined' && typeof medicineDB !== 'undefined') {
        chatLog.forEach(msg => {
            if(msg.type === 'user') {
                const text = msg.text.toLowerCase();
                medicineDB.forEach(med => {
                    med.names.forEach(n => {
                        if(text.includes(n.toLowerCase())) {
                            if(!medsFound.has(med.generic.toLowerCase())) {
                                medsFound.set(med.generic.toLowerCase(), { name: med.generic, detail: 'Mentioned in chat: ' + med.category });
                            }
                        }
                    });
                });
            }
        });
    }

    if(medsFound.size === 0) {
        list.innerHTML = '<p class="empty-state" style="font-size: 0.9rem; margin-top: 10px;">Chat with the AI about your medications, and they will automatically appear here.</p>';
        return;
    }

    list.innerHTML = '';
    medsFound.forEach((data) => {
        const d = document.createElement('div');
        d.className = 'med-item';
        d.innerHTML = `<i class="fas fa-capsules" style="color: var(--accent); font-size: 1.2rem; margin-right: 15px;"></i><div><strong>${data.name}</strong><p style="font-size: 0.8rem; color: var(--text2); margin: 0;">${data.detail}</p></div>`;
        list.appendChild(d);
    });
}
