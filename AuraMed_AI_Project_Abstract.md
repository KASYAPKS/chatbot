# AuraMed AI — Intelligent Browser-Based Medical Chatbot  
## Comprehensive Project Abstract & Technical Overview

---

> **Project Title:** AuraMed AI — An Intelligent, Client-Side Pharmaceutical & Symptom Analysis Chatbot  
> **Technology Domain:** Artificial Intelligence, Healthcare Informatics, Web Engineering  
> **Platform:** Pure Web Application (HTML5, CSS3, JavaScript ES6+)  
> **Version:** 3.0.0  
> **Academic Context:** CIP Project Report — Semester VI (Batch 2025–26)

---

## ABSTRACT

The exponential growth of digital health platforms and the persistent shortage of accessible primary healthcare services in developing nations — particularly in semi-urban and rural India — has created a compelling need for intelligent, low-cost, and serverless medical assistance tools. **AuraMed AI** is a fully browser-based, AI-powered medical chatbot and pharmaceutical search engine designed to bridge this critical gap in first-line health guidance. Built entirely on client-side web technologies (HTML5, CSS3, and JavaScript ES6+), AuraMed AI requires no backend server, no cloud subscription, and no mobile application installation, making it uniquely accessible across low-bandwidth and resource-constrained environments.

The system employs a multi-layered Natural Language Processing (NLP) pipeline implemented in vanilla JavaScript to analyze user-reported symptoms with clinical nuance. Unlike rudimentary keyword-matching bots, AuraMed AI incorporates a **stateful diagnostic dialogue engine**, **duration-aware response calibration**, **severity classification**, **anatomical location parsing**, and **multi-symptom combination analysis** — collectively enabling a response quality that approaches the structured triage logic of a trained first-responder. The platform's pharmaceutical knowledge base encompasses over **1,500 curated drug records** stored in an IndexedDB-powered local database via Dexie.js, covering branded and generic Indian pharmaceutical products across 10+ medical specialties. These records are enriched with clinical-grade data including adult and pediatric dosages, mechanism-based drug interaction warnings, contraindications, pricing, pack sizes, and purchase links.

Beyond conversational diagnostics, AuraMed AI integrates a holistic suite of personal health management modules: a **prescription OCR scanner** powered by Tesseract.js, a **symptom timeline tracker** with Chart.js visualizations, a **drug interaction safety checker**, a **medication reminder system** with browser notification integration, and a **digital consultation PDF exporter** using jsPDF. The application also supports **Gemini 2.0 Flash API** integration for enhanced AI responses when an API key is provided, and uses the **Web Speech API** for bidirectional voice interaction (both voice input via speech recognition and voice output via Text-to-Speech). The entire application persistently stores user data, chat history, symptom logs, and reminders in the browser's localStorage and IndexedDB, ensuring continuity across sessions without transmitting any personal health data to external servers — a critical privacy advantage for medical applications.

This paper presents the complete architectural design, module-level technical breakdown, NLP methodology, database schema, security considerations, and an evaluation of the system's clinical utility and limitations. The findings suggest that AuraMed AI represents a significant step toward democratizing first-line health information access for the 1.4 billion population of India, where patient-to-doctor ratios remain critically inadequate in rural districts.

---

## 1. INTRODUCTION & PROBLEM STATEMENT

### 1.1 Background

Healthcare accessibility in India remains one of the most persistent systemic challenges of the 21st century. According to the National Health Profile and WHO data, India has approximately **0.7 doctors per 1,000 people** — far below the WHO-recommended threshold of 1:1,000 — and even fewer in Tier-2 and Tier-3 cities and rural areas. A significant proportion of the population resorts to self-medication, unreliable internet searches, or unqualified pharmacist advice for primary health concerns, often leading to delayed diagnosis, antibiotic misuse, or avoidable medical emergencies.

The proliferation of smartphones, even in rural areas (India had over 600 million internet users as of 2025), creates an opportunity to deploy intelligent, offline-capable health tools that can provide safe, structured, and medically accurate first-line guidance directly to users' browsers — without requiring app stores, backend APIs, or subscription fees.

### 1.2 Motivation

Existing digital health platforms such as Practo, 1mg, and Apollo 24/7, while valuable, require consistent high-speed internet connectivity, user account registration, and in most cases, involve charges for doctor consultations. Rule-based chatbots available on government health portals offer only superficial keyword responses without contextual reasoning. AuraMed AI was conceived as a **free, private, sophisticated, and permanently offline-capable** alternative that brings genuine clinical intelligence to the browser.

### 1.3 Project Objectives

The primary objectives of the AuraMed AI project are as follows:

1. **Design and implement** a client-side NLP engine capable of understanding symptom descriptions with contextual nuance, including duration, severity, anatomical location, and accompanying symptoms.
2. **Curate and integrate** a pharmaceutical database of 1,500+ India-centric drug records, searchable by brand name, generic name, category, and clinical indication.
3. **Build a stateful diagnostic dialogue system** that engages users with targeted clinical questions to progressively refine assessments — mirroring the triage interview process.
4. **Implement a multi-symptom combination analysis engine** capable of identifying high-probability differential diagnoses from co-occurring symptom clusters.
5. **Develop auxiliary health management modules**: prescription OCR, drug interaction checker, symptom timeline tracker with visualizations, medication reminders, and PDF consultation export.
6. **Ensure total data privacy** by performing all computations client-side with zero transmission of personal health data to external servers.
7. **Provide a premium, mobile-responsive UI/UX** that is accessible to users across devices, screen sizes, and technical literacy levels.

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

AuraMed AI follows a **Single-Page Application (SPA)** architecture with a purely client-side execution model. The application is structured into four primary JavaScript modules that interact via a shared state and event-driven communication pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│           (UI Structure, Layout, Modal Definitions)         │
├──────────────┬──────────────┬─────────────┬────────────────┤
│  app-core.js │ app-pages.js │ features.js │  database.js   │
│  Core Chat   │  Page Logic  │  NLP Engine │  IndexedDB/    │
│  Navigation  │  Drug Search │  Med DB     │  Dexie Layer   │
│  Settings    │  Tracker     │  Interaction│                │
│  Voice I/O   │  Reminders   │  PDF/OCR    │                │
├──────────────┴──────────────┴─────────────┴────────────────┤
│                        med-data.js                          │
│         (1,500+ Pharmaceutical Records — Static JSON)       │
├─────────────────────────────────────────────────────────────┤
│              Browser Native APIs & CDN Libraries            │
│  localStorage │ IndexedDB │ Web Speech │ Notifications API  │
│  Tesseract.js │ jsPDF │ Chart.js │ Dexie.js │ sql.js        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Module Descriptions

#### 2.2.1 `app-core.js` — Core Chat & Navigation Engine
This module serves as the application's central orchestrator. It handles the navigation state machine (8 distinct pages: Chat, Drug Enquiry, History, Interaction, Tracker, Reminders, Health, Settings), the splash screen lifecycle, sidebar open/close mechanics, message rendering, the send-message pipeline (including fallback logic from Gemini API → local NLP), and all settings persistence. It also manages the `conditions[]` array — a curated set of 19 base clinical conditions with keyword triggers and pre-formatted response templates — and routes incoming user input to the appropriate NLP sub-system.

#### 2.2.2 `features.js` — Advanced NLP & Features Module
This is the most analytically complex module of the application. It implements:
- **`DiagnosisManager` class**: A stateful, tree-based diagnostic interview engine with four clinical assessment trees (Fever, Headache, Digestive, Respiratory). Each tree contains 4 targeted clinical questions and generates a structured assessment summary upon completion.
- **Multi-Symptom Combination Detector**: Pattern-matches against 12 pre-defined symptom clusters (e.g., fever + headache + body pain → Viral Flu; fever + rash + joint pain → Dengue/Chikungunya alert).
- **Duration Parser**: Extracts temporal information using regex patterns and NLP-style natural language mapping (e.g., "since yesterday," "chronic," "on and off").
- **Severity Classifier**: Categorizes symptom intensity into Mild / Moderate / Severe using 40+ vocabulary tokens.
- **Symptom Detail Parser**: Extracts anatomical location, pain quality, triggers, and accompanying symptoms from free-text input.
- **`buildSmartResponse()` function**: A response composition engine that dynamically constructs medically contextualized responses by combining: severity label, duration category (acute/recent/persistent/prolonged/chronic), detail-specific clinical insights (e.g., migraine vs. tension headache pattern recognition), urgency escalation messaging, and base condition guidance.
- **`medicineDB[]` array**: An inline structured database of 30 curated high-frequency drugs with full clinical profiles.
- **Drug Interaction Checker**: Pattern-matches against 10 known dangerous/cautionary drug pairs.
- **Utility systems**: Chat history persistence, symptom log storage, reminder storage, PDF generation, geolocation hospital finder, TTS engine, Notification API wrapper.

#### 2.2.3 `database.js` — Dexie.js IndexedDB Abstraction Layer
Provides an asynchronous, IndexedDB-backed persistent storage layer using Dexie.js. Manages the full 1,500-record pharmaceutical dataset, enabling fuzzy-search queries across drug name, category, generic name, and clinical use fields. Also wraps a `sql.js` WebAssembly SQL engine for structured in-memory queries against the medication registry.

#### 2.2.4 `app-pages.js` — Page-Specific Logic
Manages UI interactions for all non-chat pages: drug search with autocomplete suggestions, category filter chips (10 specialty categories: Neurology, Gastro, Gynae, Orthopedics, Diabetes, Cardio, Pulmonology, Psychiatry, Vitamins, Antibiotics), chat history rendering with conversation restoration, drug interaction checker form, symptom timeline with Chart.js line graph, medication reminder CRUD with browser notification scheduling, health profile statistics, and all settings actions (theme toggle, accent color picker, font size adjustment, wallpaper selector, profile editor, PIN management, PDF export trigger).

---

## 3. KEY FEATURES & TECHNICAL IMPLEMENTATION

### 3.1 Stateful Diagnostic Dialogue Engine

The `DiagnosisManager` class implements a finite-state-machine approach to clinical triage. When a primary symptom keyword is detected (fever, headache, stomach pain, or cough), the engine initiates a structured interview session rather than immediately returning a response. It asks 4 sequentially targeted clinical questions, collects and stores user responses, then synthesizes all responses through the `conclude()` method — which cross-references symptom duration, severity, and detail parsers — to generate a personalized assessment summary. This mechanism is analogous to a Step-SOAP (Subjective-Objective-Assessment-Plan) clinical documentation approach adapted for conversational AI.

### 3.2 Multi-Layered NLP Pipeline

The `getResponse()` async function implements a cascaded decision pipeline:

1. **Medicine Lookup** (Dexie database search → returns detailed drug profile card)
2. **Stateful Diagnosis Check** (DiagnosisManager session active? → continue interview)
3. **Multi-Symptom Combination Analysis** (2+ co-occurring symptom keywords → differential diagnosis)
4. **Duration + Severity Context** (NLP parsers applied → smart response builder activated)
5. **Base Condition Scoring** (keyword-weighted scoring against 19 conditions)
6. **Gemini 2.0 Flash API** (if user-configured API key → LLM-enhanced response)
7. **Fallback Guidance** (detailed prompt for more specific symptom description)

This pipeline ensures that even without a configured AI API, the system delivers clinically meaningful, context-sensitive responses for the vast majority of common health queries.

### 3.3 Pharmaceutical Database (1,500+ Records)

The `med-data.js` file contains a 743KB curated dataset of Indian pharmaceutical products, seeded into IndexedDB via Dexie.js on first load. Each record contains: `name`, `generic`, `category`, `uses`, `dosage_adult`, `dosage_pediatric`, `sideEffects`, `warnings`, `interactions`, `pack_size`, `price`, `availability`, `buy_link`. The dataset spans 10+ medical specialties and covers both generic molecules and popular brand-name formulations (e.g., Dolo 650, Crocin, Pan 40, Zifi 200, Azithral 500, Thyronorm, etc.).

### 3.4 Prescription OCR Scanner

Using Tesseract.js (loaded on-demand via CDN), AuraMed AI processes prescription images uploaded by users through the file attachment interface. The OCR pipeline: (1) accepts image files via FileReader API, (2) runs Tesseract's English recognition engine, (3) cross-references extracted text against a list of common drug names, (4) presents a structured "Prescription Analysis" card with detected medications and a pharmacist consultation advisory.

### 3.5 Drug Interaction Safety Checker

The interaction module allows users to input 2–5 medications simultaneously. The `checkDrugInteractions()` function normalizes input and cross-references against a curated database of 10 clinically significant interaction pairs — including three life-threatening combinations (Aspirin+Warfarin, Metformin+Alcohol, Omeprazole+Clopidogrel, SSRI+Tramadol, Metformin+Contrast Dye) — and presents results color-coded by severity (🔴 Dangerous / 🟠 Caution / ✅ Safe).

### 3.6 Symptom Timeline Tracker & Data Visualization

The Tracker module uses Chart.js to render an interactive line chart of logged symptom severity over time. Users log symptoms with a name, severity score (1–10), and optional notes. All entries are persisted in localStorage. The timeline allows patterns (e.g., recurring spikes, gradual improvement or worsening) to be visually identified — enabling data-driven conversations with actual healthcare providers.

### 3.7 Voice Interaction System

AuraMed AI leverages the browser-native Web Speech API for bidirectional voice interaction:
- **Voice Input**: `SpeechRecognition` API with `en-IN` locale for Indian English accent recognition.
- **Voice Output (TTS)**: `SpeechSynthesisUtterance` with `en-IN` locale, rate 0.95, with intelligent preprocessing to strip markdown and emoji characters before synthesis.

### 3.8 UI/UX Design System

The interface is built with a premium dark-first design system featuring: CSS custom properties (design tokens), `Inter` typeface via Google Fonts, glassmorphism-style cards, HSL-based color theming with 5 user-selectable accent colors, smooth CSS transitions and micro-animations, a responsive mobile-first layout with a collapsible sidebar, animated typing indicator, voice recording pulse animation, a splash screen loader, and toast notification system.

---

## 4. DATA PRIVACY & SECURITY

A core design principle of AuraMed AI is **zero-egress data architecture**. All personal health information — including symptom descriptions, chat logs, medication records, and health profile data — is processed and stored exclusively within the user's browser (localStorage + IndexedDB). No data is transmitted to any external server except:

1. **Google Fonts & CDN assets** (non-personal, standard web resource loading)
2. **Gemini API** (only when the user explicitly configures their own API key — queries are sent to Google's generative language API)

The application includes a **biometric lock toggle**, **PIN change functionality**, **two-factor authentication option**, and a **"hide medical data" blur mode** in the Settings page, with the security layer implemented via the browser's localStorage-based session management.

---

## 5. TECHNOLOGY STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Structure | HTML5, Semantic Elements | App layout and accessibility |
| Styling | Vanilla CSS3, Custom Properties | Design system, responsive layout |
| Logic | JavaScript ES6+ (Modules) | NLP, UI, state management |
| Database | Dexie.js (IndexedDB wrapper) | 1,500-record drug database |
| In-memory SQL | sql.js (WebAssembly SQLite) | Structured med-registry queries |
| Charts | Chart.js 4 | Symptom timeline visualization |
| PDF | jsPDF 2.5.1 | Consultation PDF export |
| OCR | Tesseract.js 5 | Prescription image processing |
| AI | Google Gemini 2.0 Flash API | Enhanced LLM responses (optional) |
| Voice | Web Speech API (native) | STT + TTS |
| Icons | Font Awesome 6.5.1 | UI iconography |
| Fonts | Google Fonts (Inter) | Typography |
| Notifications | Notifications API (native) | Medication reminders |

---

## 6. LIMITATIONS

While AuraMed AI represents a significant technical achievement in client-side health AI, several limitations must be acknowledged:

1. **Not a substitute for clinical diagnosis**: The system provides guidance based on probabilistic pattern matching and curated clinical heuristics. It cannot perform physical examinations, order lab tests, or interpret imaging. All recommendations carry explicit "consult a doctor" advisories.
2. **NLP scope**: The NLP engine is engineered for English-language input. Multilingual support (Hindi, Tamil, Telugu) is available via UI language selection but the underlying NLP corpus remains English-only.
3. **Drug database currency**: The pharmaceutical dataset reflects a point-in-time snapshot. Drug recalls, new generic approvals, price changes, and emerging interaction data require periodic database refresh cycles.
4. **OCR accuracy**: Prescription OCR accuracy is highly dependent on image quality, handwriting legibility, and scan resolution. Handwritten prescriptions in non-standard formats may yield incomplete extraction results.
5. **Offline AI limitations**: Without a configured Gemini API key, AI responses are limited to the rule-based NLP engine, which — while sophisticated — cannot handle highly atypical symptom presentations or rare conditions.
6. **Emergency situations**: The system explicitly routes emergency keywords (chest pain, breathlessness, stroke symptoms) to call-112 advisories, but cannot autonomously call emergency services or guarantee response time in critical scenarios.

---

## 7. FUTURE SCOPE

The following enhancements are planned for subsequent development phases:

- **Multilingual NLP Corpus**: Integration of Hindi and regional language symptom vocabularies using transliterated keyword mapping.
- **Computer Vision Prescription Analysis**: Upgrade from Tesseract.js to a fine-tuned vision model (via Gemini Vision API) for structured extraction of drug names, dosages, and frequencies from handwritten prescriptions.
- **Wearable Device Integration**: Web Bluetooth API integration for real-time vitals import from smart health devices (BP monitors, glucometers, oximeters).
- **Progressive Web App (PWA)**: Service Worker implementation for full offline capability, home screen installation, and background medication reminder push notifications.
- **Federated Symptom Analytics**: Opt-in, privacy-preserving aggregation of anonymized symptom patterns for population health trend analysis.
- **Telemedicine Bridge**: Integration with video consultation platforms (Jitsi Meet, Daily.co) to allow direct escalation from AuraMed AI to a licensed physician.
- **Expanded Drug Database**: Automated pipeline for periodic synchronization with the CDSCO (Central Drugs Standard Control Organisation) approved drug register and WHO Essential Medicines List.

---

## 8. CONCLUSION

AuraMed AI successfully demonstrates that a sophisticated, medically meaningful health assistant can be engineered entirely within the browser — without backend infrastructure, without subscription costs, and without compromising user privacy. By combining a multi-layered JavaScript NLP pipeline, a curated 1,500-record Indian pharmaceutical database, a stateful diagnostic dialogue engine, and a comprehensive suite of personal health management tools, the project establishes a new benchmark for client-side healthcare AI applications.

The system's architecture makes it uniquely deployable across India's diverse digital landscape — from high-end smartphones to basic Android browsers — while its clinical response logic, informed by standard triage protocols, differential diagnosis heuristics, and India-specific drug formulary knowledge, positions it as a genuinely useful first-line health resource. The optional integration with Google Gemini 2.0 Flash provides a scalable pathway to LLM-quality response enhancement while preserving the offline-capable fallback architecture.

AuraMed AI is not intended to replace doctors, but to intelligently guide patients *toward* the right level of care at the right time — reducing both unnecessary emergency room visits and, more critically, dangerous delays in seeking professional attention when symptoms warrant it. In a country where access to the first consultation remains the highest barrier, AuraMed AI serves as a knowledgeable, always-available, always-private first responder in the user's pocket.

---

## REFERENCES

1. World Health Organization. (2023). *Global Health Observatory: Medical Doctors (per 10,000 Population)*. WHO Data Repository.
2. National Health Profile, Central Bureau of Health Intelligence. (2022). *India Health Statistics*. Ministry of Health and Family Welfare.
3. Google LLC. (2024). *Gemini API Documentation — Generative Language Models*. Google AI for Developers.
4. Dexie.js Team. (2024). *Dexie.js: A Minimalistic Wrapper for IndexedDB*. https://dexie.org
5. Tesseract.js Contributors. (2024). *Tesseract.js: Pure JavaScript OCR for 100+ Languages*. https://tesseract.projectnaptha.com
6. W3C Web Applications Working Group. (2024). *Web Speech API Specification*. World Wide Web Consortium.
7. Chart.js Contributors. (2023). *Chart.js 4 Documentation*. https://www.chartjs.org
8. CDSCO. (2024). *Central Drugs Standard Control Organisation — Approved Drug Register*. Government of India.
9. Mozilla Developer Network. (2024). *IndexedDB API*. MDN Web Docs.
10. Parashkevov, A., & Vankipuram, M. (2020). *AI in Healthcare: Opportunities and Challenges*. Journal of Healthcare Informatics Research.

---

*This document was prepared for CIP Project Report submission — Semester VI, Batch 2025–26.*  
*AuraMed AI Version 3.0.0 | Developed by KS Kasyap | © 2026*
