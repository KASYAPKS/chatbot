/**
 * database.js - AuraMed AI Clinical Database
 * Uses pre-loaded MEDICATIONS_DATA array for instant results.
 * Syncs to IndexedDB in the background for persistence.
 */

class MedicineDatabase {
    constructor() {
        this.ready = false;
        this._data = []; // In-memory store — always available instantly

        // Setup IndexedDB in background (non-blocking)
        try {
            this.db = new Dexie("AuraMedDB_v3");
            this.db.version(1).stores({
                medicines: "++id, name, brands, category, uses"
            });
        } catch(e) {
            console.warn("Dexie init failed:", e);
            this.db = null;
        }

        this._initFromArray(); // Fast synchronous init
        this._syncToIndexedDB(); // Background async sync
    }

    /**
     * Instantly loads data from the pre-bundled MEDICATIONS_DATA JS array.
     * This is synchronous and works on file:// with no server needed.
     */
    _initFromArray() {
        if (!window.MEDICATIONS_DATA || !Array.isArray(window.MEDICATIONS_DATA)) {
            console.error("AuraMed: MEDICATIONS_DATA not found! Check med-data.js is loaded before database.js");
            return;
        }

        // The new med-data.js has lowercase property names matching the schema directly
        this._data = window.MEDICATIONS_DATA;

        this.ready = true;
        console.log(`AuraMed: ${this._data.length} records loaded instantly.`);
        window.dispatchEvent(new CustomEvent('db-ready'));
    }

    /**
     * Runs in the background — syncs data to IndexedDB for future persistence.
     * Does NOT block the UI or search in any way.
     */
    async _syncToIndexedDB() {
        if (!this.db || this._data.length === 0) return;
        try {
            await this.db.open();
            const count = await this.db.medicines.count();
            if (count < this._data.length) {
                await this.db.medicines.clear();
                await this.db.medicines.bulkPut(this._data);
                console.log(`AuraMed: Background sync complete — ${this._data.length} records in IndexedDB.`);
            }
        } catch (err) {
            console.warn("AuraMed: Background IndexedDB sync failed (non-critical):", err);
        }
    }

    /**
     * Instant in-memory search — no async, no IndexedDB needed.
     */
    search(query) {
        if (this._data.length === 0) return Promise.resolve([]);

        const q = (query || "").toLowerCase().trim();

        if (!q) {
            return Promise.resolve(this._data.slice(0, 500));
        }

        const results = this._data.filter(med =>
            med.name.toLowerCase().includes(q) ||
            med.brands.toLowerCase().includes(q) ||
            med.category.toLowerCase().includes(q) ||
            med.uses.toLowerCase().includes(q)
        ).slice(0, 500);

        return Promise.resolve(results);
    }

    /**
     * Auto-suggestions for the search bar.
     */
    getSuggestions(query) {
        if (!query || query.length < 2) return Promise.resolve([]);
        const q = query.toLowerCase();
        const results = this._data
            .filter(med =>
                med.name.toLowerCase().startsWith(q) ||
                med.brands.toLowerCase().includes(q)
            )
            .slice(0, 8);
        return Promise.resolve(results);
    }

    getTables() { return ['medicines']; }
    executeSQL(sql) { console.log("Mock SQL:", sql); return []; }
}

const medDB = new MedicineDatabase();
window.medDB = medDB;
