// ===== features.js - Advanced Features Module =====

// === Diagnosis Engine (State-based Assessment) ===
class DiagnosisManager {
  constructor() {
    this.session = null;
    this.trees = {
      fever: {
        name: "Fever Assessment",
        questions: [
          "Is the fever continuous or coming in waves (on-and-off)?",
          "Do you have chills, shivering, or heavy sweating?",
          "Any other symptoms like body ache, throat pain, or a rash?",
          "Finally, how many days has it been, and how high is the temperature (if measured)?"
        ],
        registry_key: "fever"
      },
      headache: {
        name: "Headache Evaluation",
        questions: [
          "Is the pain on one side of the head or both sides?",
          "How would you describe the pain? (Throbbing, sharp, dull, or heavy?)",
          "Do you feel nauseous or have sensitivity to light/sound?",
          "How long has it lasted, and on a scale of 1-10, how severe is it?"
        ],
        registry_key: "headache"
      },
      stomach: {
        name: "Digestive Assessment",
        questions: [
          "Where exactly is the pain? (Upper stomach, lower, or all over?)",
          "Are you experiencing bloating, gas, or a burning sensation (acidity)?",
          "Any vomiting or changes in bowel movements (loose motion/constipation)?",
          "Since when is this happening, and how intense is the discomfort?"
        ],
        registry_key: "gastro_ppi"
      },
      cough: {
        name: "Respiratory Assessment",
        questions: [
          "Is it a dry cough or a wet cough (with mucus/sputum)?",
          "Any chest pain, shortness of breath, or wheezing?",
          "Is it worse at night or after lying down?",
          "How many days has it been, and does it feel mild or severe?"
        ],
        registry_key: "resp_decongestants"
      }
    };
  }

  start(symptomKey) {
    const tree = this.trees[symptomKey];
    if (!tree) return null;
    this.session = {
      key: symptomKey,
      tree: tree,
      step: 0,
      responses: [],
      data: {}
    };
    return `I understand you have a **${symptomKey}**. To help you better, I need to ask a few specific questions.\n\nFirst: **${tree.questions[0]}**`;
  }

  process(msg) {
    if (!this.session) return null;
    this.session.responses.push(msg);
    this.session.step++;

    if (this.session.step < this.session.tree.questions.length) {
      return this.session.tree.questions[this.session.step];
    }

    // Diagnosis Conclusion
    const conclusion = this.conclude();
    this.session = null; // Reset
    return conclusion;
  }

  conclude() {
    const s = this.session;
    const allInput = s.responses.join(' ');
    
    // Parse findings from responses
    const duration = parseDuration(allInput);
    const severity = parseSeverity(allInput);
    const details = parseSymptomDetails(allInput);
    
    let summary = `🩺 **Assessment Summary for ${s.key.toUpperCase()}**\n\n`;
    summary += `📝 **Observations**: ${s.responses.slice(0, -1).join(', ')}\n`;
    if (duration) summary += `⏱️ **Duration**: ${duration.raw}\n`;
    if (severity) summary += `📊 **Severity**: ${severity.label}\n`;
    
    summary += `\n---\n\n`;
    
    // Get generic response based on symptom key
    let baseResp = "";
    const coreConditions = {
        fever: "🌡️ **Fever Protocol**: Hydrate with ORS, rest, and monitor temperature every 4 hours.",
        headache: "🧠 **Headache Care**: Rest in a quiet room, stay hydrated, and avoid screen time.",
        stomach: "🤢 **Gastric Care**: Eat light food (BRAT diet), avoid spicy/oily meals, and hydrate.",
        cough: "🫁 **Respiratory Care**: Steam inhalation 3x daily, honey-ginger tea, and keep warm."
    };
    baseResp = coreConditions[s.key] || "Please follow standard care for your symptoms.";

    // Use the smart builder for a comprehensive answer
    const smartResp = buildSmartResponse(baseResp, s.key, duration, severity, details);
    
    // Find medicines from the SQL database
    const medSearch = medDB.executeSQL(`SELECT * FROM medicine_registry WHERE LOWER(category) LIKE '%${s.key}%' LIMIT 2`);
    let medsText = "";
    if (medSearch.length > 0) {
        medsText = `\n\n💊 **Suggested Medications**:\n`;
        medSearch.forEach(m => {
            const details = medDB.executeSQL(`SELECT * FROM ${m.table_name} WHERE name = '${m.name}'`);
            if (details.length > 0) {
              const med = details[0];
              medsText += `• **${med.name}**\n   💰 Price: ${med.price}\n   📦 Pack: ${med.pack_size}\n   🔗 [Buy on Tata 1mg](${med.buy_link})\n\n`;
            }
        });
    }

    return summary + smartResp + medsText;
  }
}

const diagnosis = new DiagnosisManager();

// === Multi-Symptom Combination Analysis ===
const symptomCombos = [
  { symptoms:['fever','headache','body pain'], diagnosis:"**Likely Viral Infection (Flu)**\n\n🦠 Multiple symptoms suggest a viral illness.\n\n💊 Treatment:\n• Paracetamol (Dolo 650) every 6 hrs\n• ORS + warm fluids\n• Complete rest for 2-3 days\n\n🏥 See doctor if: >3 days, rash, breathing difficulty." },
  { symptoms:['fever','cough','cold'], diagnosis:"**Upper Respiratory Tract Infection**\n\n💊 Treatment:\n• Paracetamol for fever\n• Cetirizine for cold\n• Steam inhalation 3x daily\n• Warm fluids\n\n🏥 See doctor if: >5 days, high fever, chest pain." },
  { symptoms:['headache','nausea','vomiting'], diagnosis:"**Possible Migraine or Food Poisoning**\n\n💊 Treatment:\n• Domperidone (Domstal) for nausea\n• Dark room + rest for migraine\n• ORS to prevent dehydration\n\n🏥 See doctor if: severe, sudden onset, neck stiffness." },
  { symptoms:['stomach','vomiting','diarrhea'], diagnosis:"**Gastroenteritis (Stomach Flu)**\n\n💊 Treatment:\n• ORS frequently\n• Ondansetron for vomiting\n• BRAT diet\n• Avoid dairy/spicy food\n\n🏥 See doctor if: blood in stool, high fever, >2 days." },
  { symptoms:['chest','breathing','anxiety'], diagnosis:"**Possible Panic Attack or Cardiac Issue**\n\n🚨 If chest pain is severe, call 112!\n\n🧘 For panic attack:\n• Breathe slowly: 4-7-8 technique\n• Ground yourself\n• Loosen clothing\n\n🏥 Always get chest pain evaluated by a doctor." },
  { symptoms:['fever','rash','joint'], diagnosis:"**Possible Dengue or Chikungunya**\n\n⚠️ Important:\n• Get CBC + platelet count ASAP\n• Paracetamol ONLY (no Ibuprofen/Aspirin)\n• Monitor platelets daily\n• Hydrate heavily\n\n🏥 See doctor IMMEDIATELY." },
  { symptoms:['fever','cough','breathing'], diagnosis:"**Possible Pneumonia or COVID-like illness**\n\n🚨 This combination needs urgent attention.\n\n💊 Immediate:\n• Monitor oxygen level (SpO2) if oximeter available\n• Paracetamol for fever\n• Steam inhalation\n\n🏥 See doctor TODAY if: SpO2 <94%, high fever, or worsening breathlessness." },
  { symptoms:['burning','urine','fever'], diagnosis:"**Likely Urinary Tract Infection (UTI)**\n\n💊 Treatment:\n• Drink 3-4 liters water daily\n• Cranberry juice may help\n• Antibiotics needed (Nitrofurantoin/Ciprofloxacin) — prescription required\n\n🏥 See doctor for urine culture test." },
  { symptoms:['stomach','nausea','vomiting'], diagnosis:"**Possible Food Poisoning**\n\n💊 Treatment:\n• ORS to prevent dehydration\n• Ondansetron (Emeset 4mg) for vomiting\n• Bland diet once tolerated\n• Avoid dairy, spicy, oily food\n\n🏥 See doctor if: >24hrs, blood, or high fever." },
  { symptoms:['headache','eye','nausea'], diagnosis:"**Possible Migraine with Eye Involvement**\n\n💊 Treatment:\n• Sumatriptan (Suminat 50mg) at onset\n• Rest in a dark, quiet room\n• Cold compress on forehead\n\n🏥 See ophthalmologist if: vision changes, eye pressure, or recurring episodes." },
  { symptoms:['sneezing','itching','eye'], diagnosis:"**Allergic Rhinitis / Hay Fever**\n\n💊 Treatment:\n• Cetirizine (Cetzine 10mg) or Fexofenadine (Allegra 120mg)\n• Nasal saline spray\n• Avoid known allergens (dust, pollen)\n• Antihistamine eye drops for itchy eyes\n\n🏥 See allergist if recurring." },
  { symptoms:['headache','neck','shoulder'], diagnosis:"**Tension Headache / Cervical Spondylosis**\n\n💊 Treatment:\n• Muscle relaxant: Thiocolchicoside (Myoril 4mg)\n• Pain relief: Aceclofenac (Zerodol-P)\n• Hot compress on neck\n\n🏠 Prevention: Fix posture, take screen breaks, neck exercises daily." }
];

function checkMultiSymptom(msg) {
  const m = msg.toLowerCase();
  
  // Check for starting a new diagnosis
  if (!diagnosis.session) {
    if (m.includes('fever')) return { diag: diagnosis.start('fever') };
    if (m.includes('headache')) return { diag: diagnosis.start('headache') };
    if (m.includes('stomach') || m.includes('acidity') || m.includes('pain in stomach')) return { diag: diagnosis.start('stomach') };
    if (m.includes('cough')) return { diag: diagnosis.start('cough') };
  } else {
    // Continue existing diagnosis
    return { diag: diagnosis.process(msg) };
  }

  for (const combo of symptomCombos) {
    const matched = combo.symptoms.filter(s => m.includes(s));
    if (matched.length >= 2) return combo.diagnosis;
  }
  return null;
}

// === Duration Parser ===
function parseDuration(msg) {
  const m = msg.toLowerCase();
  const patterns = [
    { regex: /(\d+)\s*(day|days)/i, unit: 'days' },
    { regex: /(\d+)\s*(week|weeks)/i, unit: 'weeks' },
    { regex: /(\d+)\s*(month|months)/i, unit: 'months' },
    { regex: /(\d+)\s*(hour|hours|hr|hrs)/i, unit: 'hours' },
    { regex: /(\d+)\s*(year|years)/i, unit: 'years' },
  ];
  for (const p of patterns) {
    const match = m.match(p.regex);
    if (match) return { value: parseInt(match[1]), unit: p.unit, raw: match[0] };
  }
  // Natural language duration
  if (m.includes('just now') || m.includes('just started') || m.includes('few minutes')) return { value: 0, unit: 'hours', raw: 'just now', cat: 'acute' };
  if (m.includes('since morning') || m.includes('since today') || m.includes('today')) return { value: 1, unit: 'days', raw: 'since today' };
  if (m.includes('since yesterday') || m.includes('from yesterday')) return { value: 1, unit: 'days', raw: 'since yesterday' };
  if (m.includes('since last week') || m.includes('past week') || m.includes('a week')) return { value: 1, unit: 'weeks', raw: 'about a week' };
  if (m.includes('since last month') || m.includes('past month') || m.includes('a month')) return { value: 1, unit: 'months', raw: 'about a month' };
  if (m.includes('long time') || m.includes('chronic') || m.includes('always') || m.includes('keeps coming')) return { value: 3, unit: 'months', raw: 'chronic/long-term', cat: 'chronic' };
  if (m.includes('on and off') || m.includes('recurring') || m.includes('comes and goes') || m.includes('frequent')) return { value: 2, unit: 'weeks', raw: 'recurring', cat: 'recurring' };
  return null;
}

function getDurationCategory(dur) {
  if (!dur) return 'unknown';
  if (dur.cat) return dur.cat;
  if (dur.unit === 'hours' || (dur.unit === 'days' && dur.value <= 1)) return 'acute';
  if (dur.unit === 'days' && dur.value <= 3) return 'recent';
  if (dur.unit === 'days' && dur.value <= 7) return 'persistent';
  if (dur.unit === 'weeks' && dur.value <= 2) return 'prolonged';
  return 'chronic';
}

// === Severity Parser ===
function parseSeverity(msg) {
  const m = msg.toLowerCase();
  const severe = ['severe','very bad','extreme','unbearable','worst','terrible','excruciating','intense','sharp','stabbing','splitting','crushing','agonizing','10 out of','can\'t bear','can\'t tolerate','really bad','too much'];
  const moderate = ['moderate','quite bad','noticeable','significant','hurts a lot','painful','throbbing','constant','persistent','bad','strong','pounding'];
  const mild = ['mild','slight','little','dull','minor','light','faint','low grade','low-grade','manageable','bearable','not that bad','tolerable','small'];
  for (const w of severe) if (m.includes(w)) return { level: 'severe', label: '🔴 Severe' };
  for (const w of moderate) if (m.includes(w)) return { level: 'moderate', label: '🟠 Moderate' };
  for (const w of mild) if (m.includes(w)) return { level: 'mild', label: '🟢 Mild' };
  return null;
}

// === Location/Type Modifiers ===
function parseSymptomDetails(msg) {
  const m = msg.toLowerCase();
  const details = [];
  // Headache types
  if (m.includes('one side') || m.includes('left side') || m.includes('right side')) details.push('one-sided');
  if (m.includes('both sides') || m.includes('whole head') || m.includes('all over')) details.push('bilateral');
  if (m.includes('behind eye') || m.includes('forehead') || m.includes('temple')) details.push('frontal');
  if (m.includes('back of head') || m.includes('neck area')) details.push('occipital');
  if (m.includes('with aura') || m.includes('see lights') || m.includes('zigzag')) details.push('with-aura');
  // Pain type
  if (m.includes('throbbing') || m.includes('pulsing') || m.includes('pounding')) details.push('throbbing');
  if (m.includes('sharp') || m.includes('stabbing') || m.includes('shooting')) details.push('sharp');
  if (m.includes('dull') || m.includes('aching') || m.includes('pressing')) details.push('dull-ache');
  if (m.includes('burning') || m.includes('stinging')) details.push('burning');
  // Accompaniments
  if (m.includes('with nausea') || m.includes('feel sick') || m.includes('want to vomit')) details.push('nausea');
  if (m.includes('with fever') || m.includes('temperature also') || m.includes('feverish')) details.push('fever');
  if (m.includes('with vomiting') || m.includes('vomited')) details.push('vomiting');
  if (m.includes('dizzy') || m.includes('dizziness') || m.includes('lightheaded')) details.push('dizziness');
  if (m.includes('stiff neck') || m.includes('neck stiffness')) details.push('stiff-neck');
  if (m.includes('blurry') || m.includes('vision') || m.includes('light sensitive') || m.includes('photophobia')) details.push('vision-issues');
  // Triggers
  if (m.includes('after eating') || m.includes('after food') || m.includes('after meal')) details.push('post-meal');
  if (m.includes('at night') || m.includes('nighttime') || m.includes('when sleeping')) details.push('nocturnal');
  if (m.includes('morning') || m.includes('when waking') || m.includes('wake up')) details.push('morning');
  if (m.includes('during exercise') || m.includes('exertion') || m.includes('physical activity')) details.push('exertional');
  if (m.includes('stress') || m.includes('tension') || m.includes('work pressure')) details.push('stress-related');
  return details;
}

// === Smart Duration-Aware Response Builder ===
function buildSmartResponse(baseResp, symptomId, duration, severity, details) {
  let response = '';
  // Header with detected context
  const contextParts = [];
  if (severity) contextParts.push(severity.label);
  if (duration) contextParts.push(`⏱️ Duration: ${duration.raw}`);
  if (contextParts.length) response += `**Assessment:** ${contextParts.join(' | ')}\n\n`;

  const durCat = getDurationCategory(duration);

  // Add detail-specific insights for headache
  if (symptomId === 'headache' && details.length > 0) {
    if (details.includes('one-sided') && details.includes('throbbing')) {
      response += '🧠 **Pattern suggests Migraine**\n• One-sided throbbing pain is a hallmark of migraine\n• Sumatriptan (Suminat 50mg) is effective if taken early\n• Avoid bright lights, loud sounds, and strong smells\n\n';
    } else if (details.includes('bilateral') && details.includes('dull-ache') && details.includes('stress-related')) {
      response += '🧠 **Pattern suggests Tension Headache**\n• Most common type, often stress/posture related\n• Paracetamol 500mg + neck stretches\n• Consider ergonomic workspace adjustments\n\n';
    } else if (details.includes('with-aura') || details.includes('vision-issues')) {
      response += '🧠 **Migraine with Aura detected**\n• Visual disturbances before headache suggest migraine with aura\n• ⚠️ See a neurologist for preventive medication\n• Avoid known triggers (stress, certain foods, sleep changes)\n\n';
    } else if (details.includes('occipital') || details.includes('stiff-neck')) {
      response += '🧠 **Cervicogenic / Occipital pattern**\n• Pain from back of head + neck stiffness may be cervical\n• ⚠️ If sudden + severe + stiff neck: Rule out meningitis — see doctor NOW\n• For cervical: hot compress on neck, posture correction\n\n';
    }
    if (details.includes('nausea') || details.includes('vomiting')) response += '🤢 Nausea/vomiting noted — Take Domperidone (Domstal 10mg) 30 min before pain meds\n\n';
    if (details.includes('fever')) response += '🌡️ Fever with headache — rule out infection. See doctor if both persist >24hrs\n\n';
    if (details.includes('dizziness')) response += '💫 Dizziness noted — stay seated, hydrate, check blood pressure\n\n';
  }

  // Duration-based urgency adjustment
  if (durCat === 'acute') {
    response += baseResp + '\n\n✅ **Since this just started**, try the above remedies first. Monitor for the next few hours.';
  } else if (durCat === 'recent') {
    response += baseResp + '\n\n⏰ **Duration: 1-3 days** — if symptoms aren\'t improving with OTC medication, schedule a doctor visit within 1-2 days.';
  } else if (durCat === 'persistent') {
    response += '⚠️ **Symptoms persisting for ~a week require medical attention.**\n\n' + baseResp + '\n\n🏥 **Recommendation**: Please consult a doctor. Persistent symptoms may need tests (blood work, imaging) to identify the underlying cause.';
  } else if (durCat === 'prolonged') {
    response += '🚨 **Symptoms lasting 1-2 weeks need professional evaluation.**\n\n' + baseResp + '\n\n🏥 **Strongly recommended**: Book an appointment ASAP. You may need:\n• Blood tests (CBC, ESR, CRP)\n• Specific tests based on symptoms\n• Prescription medication';
  } else if (durCat === 'chronic') {
    response += '🔴 **Chronic/recurring symptoms detected. Self-medication is NOT recommended.**\n\n' + baseResp + '\n\n🏥 **You need professional care**:\n• See a specialist (not just GP)\n• Full diagnostic workup required\n• May need preventive/long-term management plan\n• Do NOT rely on OTC painkillers long-term — risk of medication overuse headache and organ damage';
  } else {
    response += baseResp;
  }

  // Severity escalation
  if (severity && severity.level === 'severe') {
    response += '\n\n🔴 **SEVERITY ALERT**: You described this as severe. If pain is unbearable or accompanied by confusion, vision loss, difficulty speaking, or weakness on one side — **call emergency services (112) immediately**.';
  }

  return response;
}

// === Medicine Database ===
const medicineDB = [
  { names:['paracetamol','dolo','dolo 650','crocin','calpol','tylenol','acetaminophen'], generic:'Paracetamol', category:'Analgesic / Antipyretic',
    uses:'Fever, headache, body pain, toothache, mild-moderate pain',
    dosage:'**Adults**: 500-650mg every 4-6 hrs (max 4g/day)\n**Children**: 10-15mg/kg every 4-6 hrs\n**Available**: Dolo 650, Crocin 500, Calpol syrup (kids)',
    side:'Nausea (rare), liver damage at high doses',
    warn:'⚠️ Do NOT exceed 4g/day. Avoid with alcohol. Reduce dose in liver disease.' },
  { names:['ibuprofen','brufen','advil','combiflam','ibugesic'], generic:'Ibuprofen', category:'NSAID (Pain/Inflammation)',
    uses:'Pain, inflammation, fever, headache, menstrual cramps, arthritis, dental pain',
    dosage:'**Adults**: 200-400mg every 6-8 hrs (max 1200mg/day OTC)\n**Children**: 5-10mg/kg every 6-8 hrs\n**Available**: Brufen 400, Combiflam (Ibuprofen+Paracetamol)',
    side:'Stomach upset, acidity, nausea, dizziness',
    warn:'⚠️ Take AFTER food. Avoid in kidney disease, asthma, peptic ulcer. Not for dengue fever.' },
  { names:['azithromycin','azithral','zithromax','azee'], generic:'Azithromycin', category:'Antibiotic (Macrolide)',
    uses:'Respiratory infections, throat infection, ear infection, skin infections, typhoid',
    dosage:'**Adults**: 500mg once daily for 3 days OR 500mg day 1 then 250mg days 2-5\n**Children**: 10mg/kg/day for 3 days\n**Available**: Azithral 500, Azee 500',
    side:'Nausea, diarrhea, stomach pain, headache',
    warn:'⚠️ Prescription required. Complete full course. Take 1hr before or 2hrs after food.' },
  { names:['amoxicillin','amoxyclav','augmentin','mox','novamox'], generic:'Amoxicillin', category:'Antibiotic (Penicillin)',
    uses:'Bacterial infections — throat, ear, sinus, UTI, dental, skin infections',
    dosage:'**Adults**: 250-500mg every 8 hrs for 5-7 days\n**Children**: 25-50mg/kg/day divided in 3 doses\n**Available**: Mox 500, Augmentin 625 (with Clavulanate)',
    side:'Diarrhea, nausea, rash, allergic reaction',
    warn:'⚠️ Prescription required. Check for penicillin allergy FIRST. Complete full course.' },
  { names:['cetirizine','cetzine','zyrtec','okacet','alerid'], generic:'Cetirizine', category:'Antihistamine',
    uses:'Allergies, sneezing, runny nose, itching, hives, allergic rhinitis, eye allergy',
    dosage:'**Adults**: 10mg once daily (preferably at bedtime)\n**Children 6-12**: 5mg once daily\n**Available**: Cetzine 10, Okacet 10, Alerid',
    side:'Drowsiness, dry mouth, headache',
    warn:'⚠️ May cause drowsiness — avoid driving. Avoid with alcohol.' },
  { names:['pantoprazole','pan','pan 40','pantop','pantocid'], generic:'Pantoprazole', category:'Proton Pump Inhibitor (PPI)',
    uses:'Acidity, GERD, gastric ulcer, acid reflux, heartburn',
    dosage:'**Adults**: 40mg once daily, 30 min BEFORE breakfast\n**Duration**: 2-8 weeks usually\n**Available**: Pan 40, Pantocid 40, Pantop 40',
    side:'Headache, nausea, diarrhea, vitamin B12 deficiency (long-term)',
    warn:'⚠️ Take on empty stomach. Long-term use may cause bone loss. Taper off, don\'t stop suddenly.' },
  { names:['omeprazole','omez','prilosec'], generic:'Omeprazole', category:'Proton Pump Inhibitor (PPI)',
    uses:'Acidity, peptic ulcer, GERD, Zollinger-Ellison syndrome',
    dosage:'**Adults**: 20mg once daily before breakfast\n**Available**: Omez 20, Omez-D (with Domperidone)',
    side:'Headache, nausea, constipation, flatulence',
    warn:'⚠️ Do NOT combine with Clopidogrel. Take 30 min before meals.' },
  { names:['metformin','glycomet','glucophage','obimet'], generic:'Metformin', category:'Antidiabetic (Biguanide)',
    uses:'Type 2 diabetes, insulin resistance, PCOS',
    dosage:'**Adults**: Start 500mg twice daily with meals, max 2000mg/day\n**Available**: Glycomet 500, Glycomet GP (with Glimepiride)',
    side:'Nausea, diarrhea, stomach upset, metallic taste, vitamin B12 deficiency',
    warn:'⚠️ Take WITH food. Stop 48hrs before contrast imaging. Avoid alcohol. Monitor kidney function.' },
  { names:['amlodipine','amlong','norvasc','amlokind'], generic:'Amlodipine', category:'Calcium Channel Blocker',
    uses:'High blood pressure (hypertension), angina (chest pain)',
    dosage:'**Adults**: 5-10mg once daily\n**Available**: Amlong 5, Amlong 10, Amlokind 5',
    side:'Ankle swelling, headache, dizziness, flushing',
    warn:'⚠️ Do NOT stop suddenly. Avoid grapefruit. May cause ankle edema.' },
  { names:['atorvastatin','atorva','lipitor','tonact'], generic:'Atorvastatin', category:'Statin (Cholesterol)',
    uses:'High cholesterol, prevention of heart attack/stroke',
    dosage:'**Adults**: 10-80mg once daily, preferably at bedtime\n**Available**: Atorva 10/20/40, Tonact 10/20',
    side:'Muscle pain, headache, nausea, liver enzyme elevation',
    warn:'⚠️ Report unexplained muscle pain immediately. Avoid with grapefruit juice. Regular liver tests needed.' },
  { names:['aspirin','ecosprin','disprin'], generic:'Aspirin', category:'Antiplatelet / NSAID',
    uses:'Heart attack prevention, blood thinning, fever, pain, inflammation',
    dosage:'**Heart protection**: Ecosprin 75-150mg once daily after food\n**Pain/Fever**: 325-650mg every 4-6 hrs\n**Available**: Ecosprin 75, Ecosprin 150, Disprin',
    side:'Stomach irritation, bleeding risk, gastric ulcer',
    warn:'⚠️ NOT for dengue/viral fever. Avoid in children (Reye\'s syndrome). Take after food. Avoid with Warfarin.' },
  { names:['diclofenac','voveran','voltaren','diclogesic'], generic:'Diclofenac', category:'NSAID (Pain/Inflammation)',
    uses:'Joint pain, back pain, arthritis, sports injuries, post-surgery pain',
    dosage:'**Adults**: 50mg 2-3 times daily after food (max 150mg/day)\n**Available**: Voveran 50, Voveran SR 100, Voveran Gel (topical)',
    side:'Stomach upset, nausea, dizziness, increased BP',
    warn:'⚠️ Take AFTER food. Avoid long-term use. Not for heart patients. Gel form is safer for local pain.' },
  { names:['montelukast','montair','singulair','montek'], generic:'Montelukast', category:'Leukotriene Receptor Antagonist',
    uses:'Asthma prevention, allergic rhinitis, exercise-induced asthma',
    dosage:'**Adults**: 10mg once daily at bedtime\n**Children 6-14**: 5mg chewable at bedtime\n**Available**: Montair 10, Montek LC (with Levocetirizine)',
    side:'Headache, stomach pain, mood changes (rare)',
    warn:'⚠️ Not for acute asthma attacks. Report mood/behavior changes.' },
  { names:['ciprofloxacin','cipro','ciplox'], generic:'Ciprofloxacin', category:'Antibiotic (Fluoroquinolone)',
    uses:'UTI, diarrhea (bacterial), typhoid, respiratory infections, bone infections',
    dosage:'**Adults**: 250-500mg twice daily for 5-14 days\n**Available**: Ciplox 500, Cipro 250',
    side:'Nausea, diarrhea, dizziness, tendon pain',
    warn:'⚠️ Prescription only. Avoid antacids within 2hrs. Risk of tendon rupture. Not for children/pregnant.' },
  { names:['domperidone','domstal','motilium','vomistop'], generic:'Domperidone', category:'Antiemetic / Prokinetic',
    uses:'Nausea, vomiting, bloating, gastroparesis, indigestion',
    dosage:'**Adults**: 10mg 3 times daily, 15-30 min BEFORE meals\n**Available**: Domstal 10, Vomistop 10',
    side:'Headache, dry mouth, diarrhea',
    warn:'⚠️ Take before meals. Avoid in heart conditions. Not for long-term use.' },
  { names:['ondansetron','emeset','zofran','ondem'], generic:'Ondansetron', category:'Antiemetic (5-HT3 Antagonist)',
    uses:'Severe nausea/vomiting, chemotherapy-induced vomiting, post-surgery nausea',
    dosage:'**Adults**: 4-8mg every 8 hrs (oral or sublingual)\n**Available**: Emeset 4, Ondem 4 MD (mouth dissolving)',
    side:'Headache, constipation, dizziness',
    warn:'⚠️ Dissolve under tongue for faster action. Avoid in long QT syndrome.' },
  { names:['levocetirizine','xyzal','levocet','vozet'], generic:'Levocetirizine', category:'Antihistamine',
    uses:'Allergies, chronic urticaria, allergic rhinitis, sneezing, itching',
    dosage:'**Adults**: 5mg once daily at bedtime\n**Children 6-12**: 2.5mg daily\n**Available**: Levocet 5, Vozet 5',
    side:'Drowsiness (less than cetirizine), dry mouth, fatigue',
    warn:'⚠️ Less drowsy than cetirizine but still avoid driving initially.' },
  { names:['ranitidine','zinetac','aciloc','rantac'], generic:'Ranitidine', category:'H2 Blocker',
    uses:'Acidity, peptic ulcer, GERD (Note: withdrawn in many countries)',
    dosage:'**Adults**: 150mg twice daily or 300mg at bedtime\n**Available**: Zinetac 150 (check local availability)',
    side:'Headache, constipation, diarrhea',
    warn:'⚠️ Recalled in some markets due to NDMA concerns. Pantoprazole/Famotidine preferred alternatives.' },
  { names:['metoprolol','betaloc','metxl','met xl'], generic:'Metoprolol', category:'Beta Blocker',
    uses:'High blood pressure, angina, heart failure, arrhythmia, post-heart attack',
    dosage:'**Adults**: 25-100mg once/twice daily\n**Available**: Met XL 25/50, Betaloc 50',
    side:'Fatigue, dizziness, cold hands/feet, slow heartbeat',
    warn:'⚠️ Do NOT stop suddenly (risk of rebound hypertension). May mask low blood sugar symptoms in diabetics.' },
  { names:['losartan','losar','cozaar','losacar'], generic:'Losartan', category:'ARB (Angiotensin Receptor Blocker)',
    uses:'High blood pressure, diabetic kidney disease, heart failure',
    dosage:'**Adults**: 25-100mg once daily\n**Available**: Losar 50, Losacar 50',
    side:'Dizziness, high potassium, cough (rare)',
    warn:'⚠️ Monitor potassium levels. Not for pregnant women. Stay hydrated.' },
  { names:['telmisartan','telma','micardis','telvas'], generic:'Telmisartan', category:'ARB',
    uses:'High blood pressure, cardiovascular risk reduction',
    dosage:'**Adults**: 20-80mg once daily\n**Available**: Telma 40, Telma H (with Hydrochlorothiazide)',
    side:'Dizziness, back pain, diarrhea',
    warn:'⚠️ Not during pregnancy. Monitor kidney function and potassium.' },
  { names:['levothyroxine','thyronorm','eltroxin','thyrox'], generic:'Levothyroxine', category:'Thyroid Hormone',
    uses:'Hypothyroidism (low thyroid), goiter, thyroid cancer (post-surgery)',
    dosage:'**Adults**: 25-200mcg once daily, empty stomach in morning\n**Available**: Thyronorm 25/50/75/100, Eltroxin',
    side:'Palpitations, weight loss, insomnia (if dose too high)',
    warn:'⚠️ Take on EMPTY stomach, 30-60 min before breakfast. Avoid calcium/iron supplements within 4hrs. Regular TSH testing needed.' },
  { names:['prednisolone','omnacortil','wysolone'], generic:'Prednisolone', category:'Corticosteroid',
    uses:'Severe allergies, asthma, autoimmune diseases, inflammation, arthritis',
    dosage:'**Adults**: 5-60mg/day (varies by condition)\n**Available**: Omnacortil 5/10/20, Wysolone 5/10',
    side:'Weight gain, mood changes, high blood sugar, bone loss, stomach upset',
    warn:'⚠️ Never stop suddenly — must taper off. Take with food. Short-term use preferred. Long-term causes serious side effects.' },
  { names:['aceclofenac','zerodol','hifenac','dolokind'], generic:'Aceclofenac', category:'NSAID',
    uses:'Joint pain, back pain, toothache, menstrual pain, post-operative pain',
    dosage:'**Adults**: 100mg twice daily after food\n**Combos**: Zerodol-P (with Paracetamol), Zerodol-SP (with Serratiopeptidase)\n**Available**: Zerodol 100, Hifenac-P',
    side:'Stomach pain, nausea, diarrhea',
    warn:'⚠️ Take after food. Avoid in kidney/liver disease. Not for long-term use.' },
  { names:['cefixime','taxim','zifi','topcef'], generic:'Cefixime', category:'Antibiotic (Cephalosporin)',
    uses:'UTI, throat infection, typhoid, ear infection, gonorrhea',
    dosage:'**Adults**: 200mg twice daily or 400mg once daily for 5-7 days\n**Children**: 8mg/kg/day\n**Available**: Zifi 200, Taxim-O 200',
    side:'Diarrhea, nausea, stomach pain, headache',
    warn:'⚠️ Prescription required. Complete full course. Check for cephalosporin allergy.' },
  { names:['rabeprazole','razo','rablet','rabeloc'], generic:'Rabeprazole', category:'Proton Pump Inhibitor',
    uses:'Acidity, GERD, peptic ulcer, H. pylori infection (with antibiotics)',
    dosage:'**Adults**: 20mg once daily before breakfast\n**Available**: Razo 20, Rablet 20, Rabeloc 20',
    side:'Headache, diarrhea, nausea',
    warn:'⚠️ Take before food. Don\'t use long-term without doctor advice.' },
  { names:['dexamethasone','dexona','decadron'], generic:'Dexamethasone', category:'Corticosteroid',
    uses:'Severe inflammation, allergic reactions, cerebral edema, COVID (severe), croup in children',
    dosage:'**Adults**: 0.5-9mg/day (varies widely by condition)\n**Available**: Dexona 0.5, Dexona injection',
    side:'High blood sugar, weight gain, mood changes, insomnia',
    warn:'⚠️ Prescription only. Short-term use preferred. Must taper off if used >1 week.' },
  { names:['gabapentin','gabantin','neurontin'], generic:'Gabapentin', category:'Anticonvulsant / Neuropathic Pain',
    uses:'Nerve pain (neuropathy), epilepsy, diabetic neuropathy, post-herpetic neuralgia',
    dosage:'**Adults**: Start 300mg/day, increase to 900-3600mg/day in 3 divided doses\n**Available**: Gabantin 100/300/400',
    side:'Drowsiness, dizziness, fatigue, weight gain',
    warn:'⚠️ Don\'t stop suddenly. May cause drowsiness — avoid driving. Dose adjustment needed in kidney disease.' },
  { names:['vitamin d','calcirol','d3','cholecalciferol','uprise d3'], generic:'Cholecalciferol (Vitamin D3)', category:'Vitamin Supplement',
    uses:'Vitamin D deficiency, bone health, osteoporosis prevention, immune support',
    dosage:'**Maintenance**: 1000-2000 IU daily\n**Deficiency**: 60,000 IU weekly for 8 weeks (sachet)\n**Available**: Uprise D3, Calcirol 60K sachet, D3 Must',
    side:'Nausea, constipation (at very high doses), hypercalcemia (excess)',
    warn:'⚠️ Get Vitamin D levels tested first. 60K dose is weekly, NOT daily. Take with fatty food for absorption.' },
  { names:['multivitamin','supradyn','zincovit','becosules','revital'], generic:'Multivitamin Complex', category:'Nutritional Supplement',
    uses:'Nutritional deficiency, general wellness, fatigue, recovery from illness',
    dosage:'**Adults**: 1 tablet daily after food\n**Available**: Supradyn, Zincovit, Becosules, Revital H',
    side:'Nausea if taken on empty stomach, dark stool (iron content)',
    warn:'⚠️ Take AFTER food. Not a substitute for a balanced diet. Avoid taking multiple supplements together.' },
];

async function lookupMedicine(msg) {
  const m = msg.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (m.length < 3) return null;
  
  // Use Dexie search to find matching medication
  const results = await medDB.search(m);
  
  if (results.length > 0) {
    const med = results[0]; // Take the best match
    return `💊 **${med.name}**\n📁 Category: ${med.category || 'General'}\n\n🩺 **Uses**: ${med.uses}\n\n📦 **Pack Size**: ${med.pack_size || '10 Tablets'}\n💰 **Price**: ${med.price || '₹40 - ₹120'}\n🏪 **Available At**: ${med.availability || 'Tata 1mg, Apollo Pharmacy'}\n\n📋 **Adult Dosage**: ${med.dosage_adult}\n👶 **Pediatric Dosage**: ${med.dosage_pediatric}\n\n⚠️ **Side Effects**: ${med.sideEffects}\n🚨 **Warning**: ${med.warnings}\n🤝 **Interactions**: ${med.interactions || 'None reported'}\n\n🔗 **[Buy on Tata 1mg](${med.buy_link})**\n\n_Always consult your doctor before starting any medication._`;
  }
  return null;
}

// === Drug Interaction Database ===
const drugInteractions = [
  { drugs:['aspirin','warfarin'], severity:'danger', title:'⚠️ DANGEROUS: Aspirin + Warfarin', desc:'Both are blood thinners. Combining increases bleeding risk significantly. Never take together without doctor supervision.' },
  { drugs:['aspirin','ibuprofen'], severity:'warning', title:'⚠️ Caution: Aspirin + Ibuprofen', desc:'Ibuprofen may reduce the cardioprotective effect of aspirin. Take aspirin 30 min before ibuprofen if both needed.' },
  { drugs:['metformin','alcohol'], severity:'danger', title:'⚠️ DANGEROUS: Metformin + Alcohol', desc:'Risk of lactic acidosis, a life-threatening condition. Avoid alcohol while on metformin.' },
  { drugs:['paracetamol','alcohol'], severity:'warning', title:'⚠️ Caution: Paracetamol + Alcohol', desc:'Increases liver toxicity risk. Avoid alcohol when taking paracetamol regularly.' },
  { drugs:['ciprofloxacin','antacid'], severity:'warning', title:'⚠️ Caution: Ciprofloxacin + Antacid', desc:'Antacids reduce ciprofloxacin absorption. Take ciprofloxacin 2 hrs before or 6 hrs after antacid.' },
  { drugs:['amlodipine','simvastatin'], severity:'warning', title:'⚠️ Caution: Amlodipine + Simvastatin', desc:'Amlodipine increases simvastatin levels, raising risk of muscle damage. Max simvastatin dose is 20mg.' },
  { drugs:['omeprazole','clopidogrel'], severity:'danger', title:'⚠️ DANGEROUS: Omeprazole + Clopidogrel', desc:'Omeprazole reduces clopidogrel effectiveness, increasing heart attack risk. Use pantoprazole instead.' },
  { drugs:['ssri','tramadol'], severity:'danger', title:'⚠️ DANGEROUS: SSRI + Tramadol', desc:'Risk of serotonin syndrome, a potentially fatal condition. Symptoms: agitation, confusion, rapid heartbeat.' },
  { drugs:['ace inhibitor','potassium'], severity:'warning', title:'⚠️ Caution: ACE Inhibitor + Potassium', desc:'Risk of hyperkalemia (high potassium). Monitor potassium levels regularly.' },
  { drugs:['metformin','contrast dye'], severity:'danger', title:'⚠️ DANGEROUS: Metformin + Contrast Dye', desc:'Stop metformin 48 hrs before and after contrast imaging to prevent kidney damage.' }
];

function checkDrugInteractions(drugs) {
  const normalized = drugs.map(d => d.toLowerCase().trim()).filter(d => d);
  const results = [];
  for (const inter of drugInteractions) {
    const match = inter.drugs.every(d => normalized.some(nd => nd.includes(d) || d.includes(nd)));
    if (match) results.push(inter);
  }
  if (results.length === 0) {
    // Check pairs for safe result
    for (let i = 0; i < normalized.length; i++) {
      for (let j = i+1; j < normalized.length; j++) {
        results.push({ severity:'safe', title:`✅ ${normalized[i]} + ${normalized[j]}`, desc:'No known major interactions found in our database. Always confirm with your pharmacist.' });
      }
    }
  }
  return results;
}

// === Chat History Persistence ===
function saveChatHistory(messages) {
  try { localStorage.setItem('medibot_chat', JSON.stringify(messages)); } catch(e) {}
}
function loadChatHistory() {
  try { return JSON.parse(localStorage.getItem('medibot_chat')) || []; } catch(e) { return []; }
}
function saveConversationList(list) {
  try { localStorage.setItem('medibot_convos', JSON.stringify(list)); } catch(e) {}
}
function loadConversationList() {
  try { return JSON.parse(localStorage.getItem('medibot_convos')) || []; } catch(e) { return []; }
}

// === Symptom Timeline ===
function saveSymptomLogs(logs) {
  try { localStorage.setItem('medibot_symptoms', JSON.stringify(logs)); } catch(e) {}
}
function loadSymptomLogs() {
  try { return JSON.parse(localStorage.getItem('medibot_symptoms')) || []; } catch(e) { return []; }
}

// === Medication Reminders ===
function saveReminders(reminders) {
  try { localStorage.setItem('medibot_reminders', JSON.stringify(reminders)); } catch(e) {}
}
function loadReminders() {
  try { return JSON.parse(localStorage.getItem('medibot_reminders')) || []; } catch(e) { return []; }
}

// === PDF Generator ===
function generatePDF(chatMessages) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(108, 99, 255);
  doc.text('MediBot AI - Consultation Summary', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Date: ' + new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }), 14, 28);
  doc.text('Patient: KS Kasyap', 14, 34);
  doc.line(14, 37, 196, 37);
  let y = 44;
  doc.setFontSize(11);
  chatMessages.forEach(msg => {
    if (y > 270) { doc.addPage(); y = 20; }
    const prefix = msg.type === 'user' ? 'You: ' : 'MediBot: ';
    const text = prefix + msg.text.replace(/\*\*/g, '').replace(/<[^>]*>/g, '');
    const lines = doc.splitTextToSize(text, 175);
    doc.setTextColor(msg.type === 'user' ? 108 : 50, msg.type === 'user' ? 99 : 50, msg.type === 'user' ? 255 : 50);
    doc.text(lines, 14, y);
    y += lines.length * 6 + 4;
  });
  y += 8;
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Disclaimer: This is AI-generated guidance, not a medical prescription. Consult a doctor.', 14, y);
  doc.save('MediBot_Consultation_' + Date.now() + '.pdf');
}

// === Geolocation Hospital Finder ===
function findNearbyHospitals(callback) {
  if (!navigator.geolocation) { callback(null, 'Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(
    pos => { callback({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
    err => { callback(null, 'Location access denied. Please enable GPS.'); }
  );
}

// === TTS (Text-to-Speech) ===
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/\*\*/g, '').replace(/[•🧠💊⚠️🌡️🏥🏠🩺🚨🤧🩹🩸🦴🐍🐕📋📝🔍✅📎📊🥗🧘💉🫀]/g, '').replace(/\n/g, '. ');
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 0.95;
  utter.pitch = 1;
  utter.lang = 'en-IN';
  window.speechSynthesis.speak(utter);
}

// === Notification API ===
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>' });
  }
}
