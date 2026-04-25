# AuraMed AI: Detailed Technical Implementation and Architectural Specification

## Executive Overview
This document serves as the comprehensive engineering specification for **AuraMed AI (Version 3.0.0)**. It meticulously details the client-side architecture, algorithmic logic, database schemas, and Natural Language Processing (NLP) heuristics implemented across the platform. The objective of this report is to provide an in-depth, professional analysis of every distinct code segment and module that constitutes the decentralized healthcare assistant.

---

## 1. Core Application Architecture (`app-core.js` & `index.html`)

The foundation of AuraMed AI is built upon a vanilla JavaScript Single-Page Application (SPA) framework. This architecture was explicitly chosen to eliminate framework overhead (e.g., React or Angular) and maximize performance on low-end devices.

### 1.1 SPA Routing and State Management
The application manages state through DOM manipulation and asynchronous event listeners rather than a virtual DOM.
*   **Navigation Logic**: The `navItems` NodeList maps directly to distinct `<section class="page">` elements. When a user navigates, the core engine toggles the `.active` class, ensuring instantaneous view switching without network requests.
*   **Splash Screen Lifecycle**: A timeout-based promise chain manages the initial application load. It delays the unmounting of the splash screen (`#splash-screen`) for 2400ms to allow the background IndexedDB synchronization (`database.js`) to cache the 1,500-record pharmaceutical registry.
*   **Sidebar Orchestration**: The `#sidebar` element employs CSS transitions mapped to JavaScript `onclick` events. A global `#sidebar-overlay` captures off-click events to automatically dismiss the drawer on mobile viewports.

### 1.2 Chat Engine and Fallback Routing
The core messaging pipeline is handled by the `getResponse(msg)` and `sendMessage()` functions.
*   **Message Normalization**: Input is immediately scrubbed using regex (`/[^a-z0-9\s]/g`) to normalize alphanumeric characters and lowercase the string, reducing the required complexity of subsequent NLP matching.
*   **Routing Hierarchy**: 
    1. The engine first queries the `MedicineDatabase` for exact drug matches.
    2. It then invokes the `DiagnosisManager` if an active clinical session exists.
    3. It scans for multi-symptom combinations.
    4. It parses heuristic details (duration, severity).
    5. If an API key is present, it routes to `callGeminiAPI()`; otherwise, it executes the local rule-based fallback.
*   **UI Updates**: The `addMsg()` function dynamically creates DOM nodes, injects timestamp metadata, handles HTML sanitization, and automatically triggers the `SpeechSynthesisUtterance` if Text-to-Speech (TTS) is enabled.

---

## 2. Stateful Diagnostic Dialogue Engine (`features.js`)

A critical innovation over traditional "stateless" chatbots is the implementation of the `DiagnosisManager` class. This engine simulates a physician's triage interview.

### 2.1 The Finite State Machine
The `DiagnosisManager` operates as a finite state machine with predefined clinical "trees" (e.g., `fever`, `headache`, `stomach`, `cough`).
*   **Session Initialization (`start`)**: When a primary trigger keyword is detected, a `session` object is instantiated in memory. It tracks the `symptomKey`, the active `tree`, the current `step` index, and an array of user `responses`.
*   **Sequential Processing (`process`)**: Subsequent user messages bypass the standard NLP router and are fed directly into the active session. The engine progresses through an array of targeted questions (e.g., "Is the pain throbbing or sharp?", "Do you feel nauseous?").
*   **Conclusion Synthesis (`conclude`)**: Once the question array is exhausted, the engine concatenates all responses and passes the unified string to the analytical parsers (Duration, Severity, Details) to formulate a highly contextualized assessment.

### 2.2 Multi-Symptom Clustering (`checkMultiSymptom`)
To identify high-risk differential diagnoses, the system employs a combinatorial analysis array (`symptomCombos`).
*   **Heuristic Matching**: The engine maps the normalized input against an array of symptom clusters. For instance, if the input contains `['fever', 'rash', 'joint']`, the engine circumvents standard base logic and triggers a "Possible Dengue/Chikungunya" alert, complete with severe warning formatting and specific contraindications (e.g., "Avoid Ibuprofen/Aspirin").

---

## 3. Natural Language Parsing Subsystems (`features.js`)

The local NLP capabilities are engineered through highly optimized regex and token-matching functions, categorized into three primary domains.

### 3.1 Duration Parser (`parseDuration`)
Extracts temporal context from free-text.
*   **Regex Matching**: Identifies explicitly stated timeframes using capture groups (e.g., `/(\d+)\s*(day|days)/i`).
*   **Natural Language Mapping**: Maps colloquial phrases ("since yesterday", "always", "comes and goes") to standardized clinical chronologies (Acute, Recent, Persistent, Prolonged, Chronic).

### 3.2 Severity Classifier (`parseSeverity`)
Categorizes pain/discomfort intensity.
*   **Token Arrays**: Utilizes distinct vocabulary arrays for `severe` (e.g., "excruciating", "stabbing"), `moderate` (e.g., "throbbing", "persistent"), and `mild` (e.g., "dull", "manageable").
*   **Color-Coded Escalation**: Appends visual metadata (🔴 Severe, 🟠 Moderate, 🟢 Mild) which the UI engine uses to format the resulting chat bubble.

### 3.3 Anatomical and Detail Parser (`parseSymptomDetails`)
Extracts granular clinical modifiers.
*   For headaches, it distinguishes between `frontal` (temple/behind eye), `occipital` (back of head), `unilateral` (one-sided), and `bilateral` (both sides).
*   Identifies triggers (`post-meal`, `exertional`, `stress-related`).

### 3.4 The Smart Response Builder (`buildSmartResponse`)
This function acts as the final synthesis layer. It accepts the base condition, parsed duration, severity, and details, and dynamically constructs a markdown-formatted response.
*   **Differential Logic**: If `one-sided` and `throbbing` are detected in a headache query, it injects Migraine-specific protocols. If `bilateral` and `stress-related` are detected, it outputs Tension Headache protocols.
*   **Urgency Escalation**: If duration is calculated as `prolonged` (>1 week) or severity is `severe`, the engine automatically prepends high-urgency warnings advising immediate professional medical intervention (112 escalation).

---

## 4. Database and Persistence Architecture (`database.js` & `med-data.js`)

The pharmaceutical intelligence layer relies on a dual-stage execution model to ensure immediate UI responsiveness while maintaining robust data persistence.

### 4.1 The `MedicineDatabase` Class
*   **Synchronous Initialization**: The `med-data.js` script defines a global `window.MEDICATIONS_DATA` array containing 1,500+ records. The `_initFromArray()` method ingests this synchronously upon DOM load, guaranteeing that the search engine is immediately functional, bypassing the asynchronous delays typical of file reads.
*   **Background IndexedDB Synchronization (`_syncToIndexedDB`)**: Utilizing the `Dexie.js` wrapper, the system establishes `AuraMedDB_v3`. It asynchronously checks the record count. If a discrepancy exists, it executes `bulkPut()` to cache the entire dataset into the browser's persistent storage. This ensures the application remains fully functional even if cache is cleared, provided the local files remain.

### 4.2 High-Performance Search Implementation
*   **Fuzzy Querying (`search` & `getSuggestions`)**: Implements an optimized `Array.prototype.filter` operation. It converts queries to lowercase and matches against `name`, `brands`, `category`, and `uses`.
*   **Pagination Cap**: Results are sliced (`.slice(0, 500)`) to prevent DOM rendering bottlenecks, maintaining 60 FPS even when querying broad terms like "antibiotic".

---

## 5. Secondary Clinical Modules (`app-pages.js` & `features.js`)

### 5.1 Drug Interaction Checker
*   **Combinatorial Logic**: The `checkDrugInteractions()` function normalizes an array of user-inputted medications. It iterates through a predefined `drugInteractions` matrix (containing known dangerous pairs like Aspirin + Warfarin, or Metformin + Contrast Dye).
*   **Permutation Checking**: If no known dangerous combinations are found, the algorithm executes a nested loop to check all permutations ($n(n-1)/2$) of the inputted drugs, marking them as "safe" based on the localized database limits.

### 5.2 Symptom Timeline Tracker
*   **Data Structure**: Logs are stored as an array of JSON objects containing `name`, `severity` (1-10 integer), `notes`, and `timestamp` in `localStorage`.
*   **Visualization**: Integrates `Chart.js`. The `renderSymptomChart()` function extracts the last 20 entries, maps timestamps to the X-axis and severity to the Y-axis, rendering an interactive Bezier curve (tension: 0.4) to visually track pathological progression.

### 5.3 Medication Reminders & Notifications
*   **Cron-style Polling**: The `startReminderChecks()` function initializes a `setInterval` that polls the system clock every 1000ms.
*   **Web Notifications API**: When the current `HH:MM` matches a stored reminder, the system triggers the native OS `Notification` interface, displaying the medication name alongside a visual pill icon.

### 5.4 Prescription OCR Pipeline
*   **Image Ingestion**: Utilizes the `FileReader` API (`readAsDataURL`) to encode user-uploaded images in Base64 format.
*   **Optical Character Recognition**: Dynamically injects the `Tesseract.js` CDN payload to avoid initial bundle bloat. It processes the English dictionary and extracts the raw string.
*   **Cross-Referencing**: The extracted string is mapped against an array of high-frequency pharmaceutical names to structure a "Detected Medications" summary.

### 5.5 Digital Consultation Export
*   **jsPDF Integration**: The `generatePDF()` function iterates through the `chatLog` array. It applies distinct RGB color codes to differentiate "User" from "MediBot".
*   **Pagination Logic**: Calculates Y-axis offsets based on string length (`doc.splitTextToSize`). If `y > 270`, it triggers `doc.addPage()`, ensuring seamless multi-page document generation for clinical submission.

---

## 6. External API Integration (`app-core.js`)

### 6.1 Google Gemini 2.0 Flash Architecture
*   **Configuration**: The API key is securely stored in `localStorage` under `gemini_api_key`.
*   **Prompt Engineering**: The payload sent to `generativelanguage.googleapis.com` includes a highly specific system prompt: *"You are MediBot AI, a medical assistant chatbot. Give helpful, concise medical guidance. Include medication suggestions with Indian brand names. Always add disclaimer."*
*   **Graceful Degradation**: The `fetch` call is wrapped in a `.catch()` block. If the network is unavailable, CORS fails, or the API key is invalid, the system seamlessly falls back to the `getResponse()` local NLP engine, ensuring zero downtime.

---

## 7. User Interface and Theme Orchestration

### 7.1 Design Token System
*   **CSS Custom Properties**: Global styles are driven by CSS variables (e.g., `--bg`, `--text`, `--accent`).
*   **Theme Switching**: The `data-theme="dark"` attribute is manipulated on the root `<html>` element. This instantly swaps all color definitions without requiring JavaScript recalibration.
*   **Dynamic Accent Colors**: The UI allows users to inject hex codes directly into the `--accent` property at runtime, providing deep personalization (e.g., shifting from `#6C63FF` to `#00C9A7`).

### 7.2 Glassmorphism and Micro-Animations
*   **Visual Depth**: Implementation of `backdrop-filter: blur(10px)` provides a frosted-glass aesthetic on modals and the sidebar, aligning with modern premium design languages.
*   **Interaction Feedback**: The `fade-in` and `pulse` animations provide immediate visual feedback during async operations (e.g., the typing indicator or the Web Speech API listening state).

---

## 8. Security and Privacy Protocols

The paramount directive of AuraMed AI is the protection of Personal Health Information (PHI).

*   **Zero-Egress Execution**: By design, no telemetry, analytical data, or health logs are transmitted via HTTP/HTTPS protocols (unless the user explicitly utilizes the optional Gemini API).
*   **Client-Side Sandboxing**: All persistent data (`medibot_chat`, `medibot_symptoms`, `AuraMedDB_v3`) is confined within the browser's isolated storage sandbox.
*   **Biometric/PIN Simulation**: The Settings module implements localized access controls, allowing users to mask their data or require a 4-digit PIN upon application launch, mitigating risks associated with shared device usage.
*   **CORS Warning Mitigation**: The system intelligently detects if it is running over the `file://` protocol and adjusts its data ingestion strategy (array mapping vs. fetch) to prevent Cross-Origin Resource Sharing security blocks.

---
*End of Technical Specification Document.*
