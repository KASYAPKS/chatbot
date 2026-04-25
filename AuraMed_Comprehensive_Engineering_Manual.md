# AuraMed AI: Comprehensive Engineering and Architecture Manual
**Version:** 3.0.0
**Domain:** Healthcare Informatics / Web Engineering / Artificial Intelligence

---

## Abstract
This document constitutes the definitive engineering manual for the AuraMed AI project. It provides an exhaustive, granular analysis of the system’s architecture, algorithms, and design paradigms. Engineered to operate entirely within the client-side browser environment, AuraMed AI circumvents traditional server-client bottlenecks, ensuring absolute data privacy, zero latency, and robust offline capabilities. This manual meticulously dissects the codebase—from the raw HTML DOM hierarchy to the complex finite state machines driving the Natural Language Processing (NLP) engine—serving as both a technical audit and a blueprint for future enterprise scalability.

---

## Chapter 1: Introduction and Architectural Philosophy

### 1.1 The "Zero-Egress" Paradigm
The primary architectural directive for AuraMed AI is "Zero-Egress." Traditional healthcare applications rely on RESTful APIs or GraphQL endpoints to process user data and retrieve medical intelligence. This poses significant risks regarding data sovereignty, latency, and operational cost. AuraMed AI inverts this model. By utilizing modern Web APIs (IndexedDB, Web Speech API, LocalStorage), the application pulls the "server" into the client. No Personal Health Information (PHI) ever leaves the user's local execution environment unless explicitly authorized via an external API call (e.g., Google Gemini).

### 1.2 Technology Stack
*   **Structure**: Semantic HTML5.
*   **Styling**: Vanilla CSS3 utilizing Custom Properties (Variables) for theming.
*   **Logic Engine**: JavaScript ES6+ (Modular architecture, Promises, Async/Await).
*   **Persistence Layer**: Dexie.js (IndexedDB wrapper) and LocalStorage.
*   **Auxiliary Libraries**: Chart.js (Data Visualization), Tesseract.js (Optical Character Recognition), jsPDF (Document Generation).
*   **External APIs (Optional)**: Google Gemini 2.0 Flash API for generative LLM fallbacks.

---

## Chapter 2: Interface Architecture (`index.html` & `style.css`)

The user interface is engineered to simulate a native application experience despite executing within a standard web browser.

### 2.1 DOM Hierarchy and Semantic Structure
The `index.html` file is strictly compartmentalized:
1.  **Splash Screen (`#splash-screen`)**: Acts as the initial loading state. It masks the asynchronous data ingestion processes occurring in `database.js`.
2.  **Global App Container (`#app`)**: The master wrapper that holds the sidebar and main content area.
3.  **Navigation Sidebar (`#sidebar`)**: Implements absolute positioning with a high z-index to overlay content on mobile viewports.
4.  **Main Content (`.main-content`)**: A flex-container housing the `topbar` and multiple `<section class="page">` elements.
5.  **Modal & Overlay Layer**: A separate DOM layer reserved for transient UI states (Toasts, Modals, Call Panels).

### 2.2 CSS Design Token System
The `style.css` file eschews static color declarations in favor of a robust Design Token system mapped to CSS variables on the `:root` pseudo-class.
```css
:root {
  --bg: #ffffff;
  --bg2: #f0f2f5;
  --text: #1d1d1f;
  --accent: #6C63FF;
}
[data-theme="dark"] {
  --bg: #0a0a0f;
  --bg2: #14141e;
  --text: #ffffff;
}
```
This architecture allows for O(1) performance when switching themes. Modifying the `data-theme` attribute on the `<html>` element instantly triggers a global repaint without requiring JavaScript to iterate through individual DOM nodes.

### 2.3 Glassmorphism and Z-Index Management
To achieve a premium aesthetic, the application extensively uses `backdrop-filter: blur()`. Z-index staging is strictly enforced:
*   `z-index: 10`: Standard page content.
*   `z-index: 100`: Topbar navigation.
*   `z-index: 1000`: Sidebar and Sidebar Overlay.
*   `z-index: 2000`: Modals, Toasts, and Voice Indicators.
This guarantees that critical interaction layers (like the Emergency Call Panel) supersede all other interface elements.

---

## Chapter 3: The Core Routing and State Engine (`app-core.js`)

The `app-core.js` module functions as the central nervous system of the application. It bypasses the need for heavy routing libraries (like React Router) by manipulating the DOM directly.

### 3.1 Single-Page Application (SPA) Mechanics
Page transitions are handled via the `navItems` NodeList.
```javascript
navItems.forEach(btn => {
  btn.onclick = () => {
    // 1. Remove active state from all nav buttons
    navItems.forEach(b => b.classList.remove('active'));
    // 2. Set new active nav button
    btn.classList.add('active');
    // 3. Hide all pages
    pages.forEach(p => p.classList.remove('active'));
    // 4. Reveal targeted page based on data attribute
    $('page-' + btn.dataset.page).classList.add('active');
  };
});
```
This logic ensures that only one `<section>` has `display: block` at any given time, preserving memory and preventing layout thrashing.

### 3.2 The Chat Input Pipeline
When a user submits a message via `sendMessage()`, the following pipeline executes:
1.  **Sanitization**: Input is trimmed of whitespace.
2.  **DOM Injection**: The user's message is immediately appended to `#chat-messages`.
3.  **Image Processing Check**: If `attachedImage` exists, the flow redirects to `processImage()`.
4.  **API Check**: The system queries LocalStorage for `gemini_api_key`.
    *   *If present*: Routes to `callGeminiAPI()`.
    *   *If absent*: Routes to the localized `getResponse()` NLP engine.
5.  **Typing Indicator**: A mock typing indicator is instantiated to simulate processing latency, enhancing the conversational UX.

---

## Chapter 4: Natural Language Processing & Diagnostic Heuristics (`features.js`)

The `features.js` file contains the most complex logic in the system. It implements a multi-tiered heuristic engine capable of parsing context without relying on cloud-based machine learning.

### 4.1 The Finite State Machine (`DiagnosisManager`)
To prevent the chatbot from suffering "amnesia" between messages, the `DiagnosisManager` maintains state across a conversational session.
*   **Initialization**: Triggered by high-confidence keywords (e.g., 'fever', 'headache'). The engine creates a `session` object storing the current array of `questions`.
*   **State Traversal**: The `process(msg)` function intercepts input, pushes it to an internal array, and increments the `step` counter.
*   **Synthesis**: Upon reaching the end of the question array, `conclude()` is invoked. This method concatenates all responses and passes them to the parsing functions (Duration, Severity, Details).

### 4.2 Text Normalization and Token Matching
The `getResponse()` function utilizes strict string normalization:
```javascript
const m = msg.toLowerCase().replace(/[^a-z0-9\s]/g, '');
```
This strips punctuation, standardizing input for the scoring loop. The base `conditions` array is iterated, and a scoring algorithm (`s += k.split(' ').length * 3`) awards points based on the complexity of the matched keyword (e.g., "stomach pain" scores higher than just "stomach").

### 4.3 Combinatorial Differential Diagnosis (`checkMultiSymptom`)
Medical diagnostics often rely on the intersection of multiple symptoms. The system defines `symptomCombos`.
If a user inputs: *"I have a fever, a rash, and my joints hurt"*, the engine detects the `['fever', 'rash', 'joint']` cluster. It bypasses standard symptom logic and triggers the "Dengue/Chikungunya" alert protocol, demonstrating higher-order heuristic reasoning.

### 4.4 Granular Parsers
1.  **`parseDuration(msg)`**: Employs Regex `/(\d+)\s*(day|days)/i` to extract numerical timeframes, while also mapping natural language ("since yesterday") to clinical categories (Acute vs. Chronic).
2.  **`parseSeverity(msg)`**: Scans for exact vocabulary tokens. "Unbearable" triggers `level: 'severe'`, whereas "dull" triggers `level: 'mild'`.
3.  **`parseSymptomDetails(msg)`**: Extracts pathological modifiers (e.g., "one side" -> `unilateral`; "with aura" -> `migraine indicator`).

### 4.5 The Smart Response Builder (`buildSmartResponse`)
This function acts as the final orchestrator. It takes the parsed metadata and dynamically constructs the markdown response. If severity is marked as `severe`, it automatically prepends emergency escalation protocols (112 dispatch advisory).

---

## Chapter 5: Data Persistence and Pharmaceutical Intelligence (`database.js`)

The pharmaceutical registry represents the core value proposition of AuraMed AI, featuring over 1,500 highly detailed records.

### 5.1 The Dual-Stage Initialization Strategy
Handling a massive dataset locally presents a challenge: asynchronous loading can delay Time To Interactive (TTI). AuraMed AI solves this via a dual-stage approach in the `MedicineDatabase` class.
1.  **Synchronous Ingestion**: The `med-data.js` file assigns the dataset directly to the `window.MEDICATIONS_DATA` object. `database.js` instantly copies this array into memory (`this._data = window.MEDICATIONS_DATA`). This ensures that the search engine is operable at precisely `t=0`.
2.  **Asynchronous Synchronization (`_syncToIndexedDB`)**: In a non-blocking background thread, the system initializes `Dexie.js`. It compares the record count in IndexedDB against the array length. If a discrepancy is found, it executes `bulkPut()`. This guarantees that future sessions have persistent cache access even if the array fails to load.

### 5.2 Search Algorithms
The `search(query)` method implements a highly efficient `Array.prototype.filter`. To prevent UI lockups during rendering, it implements an artificial slice: `.slice(0, 500)`. This guarantees that rendering the DOM nodes for the search results does not violate the browser's 16ms frame budget, maintaining 60 FPS scrolling.

---

## Chapter 6: Auxiliary Clinical Modules (`app-pages.js` & `features.js`)

AuraMed AI extends beyond a chatbot by providing a holistic suite of clinical tools.

### 6.1 Drug Interaction Checker
The `checkDrugInteractions(drugs)` function evaluates polypharmacy risks.
*   **Algorithm**: It normalizes user inputs and cross-references them against a strict `drugInteractions` matrix.
*   **Clinical Depth**: It correctly flags life-threatening combinations such as *Aspirin + Warfarin* (hemorrhage risk) and *Metformin + Contrast Dye* (renal failure risk).
*   **Permutation Fallback**: If no explicit danger is found, it evaluates all $n(n-1)/2$ pairs and outputs a "Safe" provisional status.

### 6.2 Longitudinal Symptom Tracking (Chart.js)
*   **Data Serialization**: Symptom logs (Name, Severity 1-10, Timestamp) are serialized via `JSON.stringify` and stored in LocalStorage (`medibot_symptoms`).
*   **Visualization (`renderSymptomChart`)**: Upon navigating to the Tracker page, `Chart.js` is instantiated. It maps the array timestamps to the X-axis and severity to the Y-axis. The line chart uses `tension: 0.4` to generate a smooth Bezier curve, visually highlighting pathological trends.

### 6.3 Medication Reminders (Web Notifications API)
*   **Cron Polling**: The `startReminderChecks()` function establishes a `setInterval` loop polling every 1000ms.
*   **Trigger Logic**: It compares the system clock (`HH:MM`) against the stored reminder array.
*   **OS Integration**: If a match occurs, it invokes `new Notification()`, pushing an alert to the user's operating system (Windows/Android/macOS), ensuring compliance even when the browser tab is unfocused.

### 6.4 Optical Character Recognition (Tesseract.js)
*   **Lazy Loading**: The heavy `tesseract.min.js` payload is not loaded on initial page request. It is dynamically injected into the `<head>` only when the user clicks the "Attach" button, preserving bandwidth.
*   **Pipeline**: The image is converted to Base64 (`readAsDataURL`), processed by the Tesseract English engine, and the resulting string is scanned for matches against a high-frequency drug vocabulary array.

### 6.5 Digital Consultation Export (jsPDF)
*   **Canvas Translation**: The `generatePDF(chatMessages)` function iterates through the `chatLog`.
*   **Formatting**: It establishes an A4 coordinate system. It uses `doc.splitTextToSize` to handle line wrapping and dynamically increments the Y-axis counter. If the Y-axis exceeds the page height, `doc.addPage()` is invoked.

---

## Chapter 7: External API Integrations (`app-core.js`)

### 7.1 Google Gemini 2.0 Flash Integration
While AuraMed AI is fully autonomous, it provides an escalation path via the `callGeminiAPI()` function.
*   **Payload Structuring**: It constructs a rigorous JSON payload targeting `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`.
*   **System Prompting**: The engine prepends strict behavioral guardrails: *"You are MediBot AI... Include medication suggestions with Indian brand names. Always add disclaimer."*
*   **Error Handling**: A crucial engineering decision was wrapping the fetch request in a `catch()` block. If the network drops or the API rate-limits the user, the `.catch()` block silently reroutes the query to the local `getResponse()` function, guaranteeing zero service interruption.

---

## Chapter 8: Security, Privacy, and Ethical Compliance

### 8.1 Data Sovereignty
AuraMed AI adheres strictly to a "Private-by-Design" architecture.
*   **Zero Telemetry**: No user queries, symptoms, or search histories are transmitted to centralized servers. 
*   **Sandbox Isolation**: All data is confined to the browser's origin-specific IndexedDB and LocalStorage sandboxes, making it immune to cross-origin data scraping.

### 8.2 Client-Side Security Measures
*   **XSS Prevention**: When rendering chat messages, `app-core.js` sanitizes HTML output by strictly controlling how text is injected (e.g., using predefined layout templates and replacing markdown syntax carefully).
*   **Access Controls**: The UI simulates biometric and PIN locks. When enabled, a modal overlays the entire DOM upon application launch, obscuring the UI until the correct validation token is provided.
*   **CORS Mitigation**: The system is designed to operate over the `file://` protocol. By embedding the 1,500 record database as a JavaScript array (`med-data.js`) rather than fetching a standalone `.json` or `.csv` file, the application circumvents strict Cross-Origin Resource Sharing (CORS) policies that browsers enforce on local file execution.

---

## Chapter 9: Conclusion and Future Roadmap

AuraMed AI represents a monolithic achievement in client-side engineering. By successfully decentralizing natural language processing, complex database queries, and clinical heuristics into the browser engine, it establishes a new paradigm for mHealth applications. It proves that high-fidelity medical guidance does not require expensive cloud infrastructure.

### Future Scalability Roadmap
1.  **PWA Service Workers**: Upgrading the SPA to a Progressive Web Application. Implementing `ServiceWorker` caching would allow the application to be "installed" on mobile devices, providing native icon access and background task execution.
2.  **WebAssembly (Wasm) NLP Engine**: Migrating the Regex-based `DiagnosisManager` to a compiled WebAssembly module (e.g., Rust-based NLP) to allow for deeper semantic understanding and higher execution speeds.
3.  **Federated Learning**: Implementing local differential privacy algorithms to aggregate anonymous symptom trends without violating individual user privacy.

---
*End of Comprehensive Engineering and Architecture Manual.*
*Prepared for final project validation.*
